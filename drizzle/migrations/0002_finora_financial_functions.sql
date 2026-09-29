-- All financial mutations run inside these SECURITY DEFINER functions so that
-- balance math is decimal, atomic and impossible to drive from the client.
-- Execute is granted to service_role only; server code calls them.

CREATE OR REPLACE FUNCTION public.fn_notify(p_user uuid, p_title text, p_message text, p_link text DEFAULT NULL)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.notifications (user_id, title, message, link) VALUES (p_user, p_title, p_message, p_link);
$$;

CREATE OR REPLACE FUNCTION public.fn_create_investment(p_user uuid, p_plan_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_plan public.investment_plans%ROWTYPE;
  v_avail numeric(18,2);
  v_inv uuid;
  v_ref uuid;
  v_settings jsonb;
  v_commission numeric(18,2);
BEGIN
  SELECT * INTO v_plan FROM public.investment_plans WHERE id = p_plan_id AND status = 'active';
  IF NOT FOUND THEN RAISE EXCEPTION 'PLAN_UNAVAILABLE'; END IF;

  SELECT available INTO v_avail FROM public.wallets WHERE user_id = p_user FOR UPDATE;
  IF v_avail IS NULL THEN RAISE EXCEPTION 'WALLET_MISSING'; END IF;
  IF v_avail < v_plan.investment_amount THEN RAISE EXCEPTION 'INSUFFICIENT_FUNDS'; END IF;

  UPDATE public.wallets
     SET available = available - v_plan.investment_amount,
         invested  = invested + v_plan.investment_amount,
         updated_at = now()
   WHERE user_id = p_user;

  INSERT INTO public.investments (user_id, plan_id, plan_name, amount, daily_earning, duration_days, fees,
                                  terms_snapshot, status, start_date, end_date)
  VALUES (p_user, v_plan.id, v_plan.name, v_plan.investment_amount, v_plan.daily_earning, v_plan.duration_days, v_plan.fees,
          jsonb_build_object('terms', v_plan.terms, 'disclosure', v_plan.disclosure, 'risk_level', v_plan.risk_level,
                             'return_type', v_plan.return_type, 'currency', v_plan.currency),
          'active', now(), now() + (v_plan.duration_days || ' days')::interval)
  RETURNING id INTO v_inv;

  INSERT INTO public.transactions (user_id, type, amount, status, description, related_id)
  VALUES (p_user, 'investment', v_plan.investment_amount, 'completed', v_plan.name || ' plan activated', v_inv);

  PERFORM public.fn_notify(p_user, 'Investment activated',
    v_plan.name || ' plan activated for ' || v_plan.currency || ' ' || v_plan.investment_amount::text || '.', '/investments');

  -- referral commission
  SELECT referred_by INTO v_ref FROM public.profiles WHERE id = p_user;
  SELECT value INTO v_settings FROM public.app_settings WHERE key = 'referral';
  IF v_ref IS NOT NULL AND COALESCE((v_settings->>'enabled')::boolean, false)
     AND v_plan.investment_amount >= COALESCE((v_settings->>'min_qualifying_investment')::numeric, 0)
     AND NOT EXISTS (SELECT 1 FROM public.referral_commissions WHERE investment_id = v_inv) THEN
    v_commission := round(v_plan.investment_amount * COALESCE((v_settings->>'commission_percent')::numeric, 0) / 100, 2);
    IF v_commission > 0 THEN
      INSERT INTO public.referral_commissions (referrer_id, referred_id, investment_id, amount)
      VALUES (v_ref, p_user, v_inv, v_commission);
      UPDATE public.wallets SET available = available + v_commission,
                                total_earnings = total_earnings + v_commission,
                                updated_at = now()
       WHERE user_id = v_ref;
      INSERT INTO public.transactions (user_id, type, amount, status, description, related_id)
      VALUES (v_ref, 'referral_commission', v_commission, 'completed', 'Referral commission', v_inv);
      PERFORM public.fn_notify(v_ref, 'Referral commission credited',
        'You earned a referral commission of PKR ' || v_commission::text || '.', '/referrals');
    END IF;
  END IF;

  RETURN v_inv;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_approve_deposit(p_deposit uuid, p_admin uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.deposits%ROWTYPE;
BEGIN
  SELECT * INTO d FROM public.deposits WHERE id = p_deposit FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'DEPOSIT_NOT_FOUND'; END IF;
  IF d.status <> 'pending_verification' THEN RAISE EXCEPTION 'INVALID_STATUS'; END IF;

  UPDATE public.deposits SET status = 'approved', reviewed_by = p_admin, reviewed_at = now() WHERE id = p_deposit;
  UPDATE public.wallets SET available = available + d.amount, updated_at = now() WHERE user_id = d.user_id;
  INSERT INTO public.transactions (user_id, type, amount, status, description, related_id)
  VALUES (d.user_id, 'deposit', d.amount, 'completed', 'Deposit verified and credited', d.id);
  PERFORM public.fn_notify(d.user_id, 'Deposit approved',
    'Your deposit of PKR ' || d.amount::text || ' has been verified and credited to your wallet.', '/wallet');

  IF d.plan_id IS NOT NULL THEN
    PERFORM public.fn_create_investment(d.user_id, d.plan_id);
  END IF;

  INSERT INTO public.admin_logs (admin_id, action, target_type, target_id, metadata)
  VALUES (p_admin, 'deposit_approved', 'deposit', d.id, jsonb_build_object('amount', d.amount, 'user_id', d.user_id));
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_reject_deposit(p_deposit uuid, p_admin uuid, p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.deposits%ROWTYPE;
BEGIN
  SELECT * INTO d FROM public.deposits WHERE id = p_deposit FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'DEPOSIT_NOT_FOUND'; END IF;
  IF d.status <> 'pending_verification' THEN RAISE EXCEPTION 'INVALID_STATUS'; END IF;
  UPDATE public.deposits SET status = 'rejected', rejection_reason = p_reason, reviewed_by = p_admin, reviewed_at = now()
   WHERE id = p_deposit;
  PERFORM public.fn_notify(d.user_id, 'Deposit rejected', 'Your deposit was rejected. Reason: ' || p_reason, '/wallet');
  INSERT INTO public.admin_logs (admin_id, action, target_type, target_id, metadata)
  VALUES (p_admin, 'deposit_rejected', 'deposit', d.id, jsonb_build_object('reason', p_reason));
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_submit_withdrawal(
  p_user uuid, p_amount numeric, p_method text, p_title text, p_number text, p_bank text, p_iban text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_avail numeric(18,2); v_id uuid; v_settings jsonb; v_fee numeric(18,2);
BEGIN
  IF p_amount <= 0 THEN RAISE EXCEPTION 'INVALID_AMOUNT'; END IF;
  SELECT value INTO v_settings FROM public.app_settings WHERE key = 'withdrawal';
  IF p_amount < COALESCE((v_settings->>'min')::numeric, 0) THEN RAISE EXCEPTION 'BELOW_MINIMUM'; END IF;
  v_fee := round(p_amount * COALESCE((v_settings->>'fee_percent')::numeric, 0) / 100, 2);

  SELECT available INTO v_avail FROM public.wallets WHERE user_id = p_user FOR UPDATE;
  IF v_avail IS NULL OR v_avail < p_amount THEN RAISE EXCEPTION 'INSUFFICIENT_FUNDS'; END IF;

  UPDATE public.wallets SET available = available - p_amount, pending = pending + p_amount, updated_at = now()
   WHERE user_id = p_user;

  INSERT INTO public.withdrawals (user_id, amount, fee, net_amount, method, account_title, account_number, bank_name, iban)
  VALUES (p_user, p_amount, v_fee, p_amount - v_fee, p_method, p_title, p_number, p_bank, p_iban)
  RETURNING id INTO v_id;

  INSERT INTO public.transactions (user_id, type, amount, status, description, related_id)
  VALUES (p_user, 'withdrawal', p_amount, 'pending', 'Withdrawal requested via ' || p_method, v_id);
  PERFORM public.fn_notify(p_user, 'Withdrawal submitted',
    'Your withdrawal request of PKR ' || p_amount::text || ' is pending review.', '/wallet');
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_set_withdrawal_status(
  p_id uuid, p_admin uuid, p_status public.withdrawal_status, p_reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE w public.withdrawals%ROWTYPE;
BEGIN
  SELECT * INTO w FROM public.withdrawals WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'WITHDRAWAL_NOT_FOUND'; END IF;

  IF NOT (
    (w.status = 'pending'      AND p_status IN ('under_review','approved','rejected')) OR
    (w.status = 'under_review' AND p_status IN ('approved','rejected')) OR
    (w.status = 'approved'     AND p_status IN ('paid','rejected'))
  ) THEN RAISE EXCEPTION 'INVALID_TRANSITION'; END IF;

  UPDATE public.withdrawals
     SET status = p_status,
         rejection_reason = CASE WHEN p_status = 'rejected' THEN p_reason ELSE rejection_reason END,
         reviewed_by = p_admin, reviewed_at = now(),
         paid_at = CASE WHEN p_status = 'paid' THEN now() ELSE paid_at END
   WHERE id = p_id;

  IF p_status = 'paid' THEN
    UPDATE public.wallets SET pending = pending - w.amount, updated_at = now() WHERE user_id = w.user_id;
    UPDATE public.transactions SET status = 'completed', updated_at = now() WHERE related_id = w.id AND type = 'withdrawal';
    PERFORM public.fn_notify(w.user_id, 'Withdrawal paid',
      'Your withdrawal of PKR ' || w.net_amount::text || ' has been paid.', '/wallet');
  ELSIF p_status = 'rejected' THEN
    UPDATE public.wallets SET pending = pending - w.amount, available = available + w.amount, updated_at = now()
     WHERE user_id = w.user_id;
    UPDATE public.transactions SET status = 'cancelled', updated_at = now() WHERE related_id = w.id AND type = 'withdrawal';
    PERFORM public.fn_notify(w.user_id, 'Withdrawal rejected',
      'Your withdrawal was rejected and the amount returned to your available balance. Reason: ' || COALESCE(p_reason,'—'), '/wallet');
  ELSE
    PERFORM public.fn_notify(w.user_id, 'Withdrawal ' || replace(p_status::text,'_',' '),
      'Your withdrawal request status is now ' || replace(p_status::text,'_',' ') || '.', '/wallet');
  END IF;

  INSERT INTO public.admin_logs (admin_id, action, target_type, target_id, metadata)
  VALUES (p_admin, 'withdrawal_' || p_status::text, 'withdrawal', w.id, jsonb_build_object('amount', w.amount, 'reason', p_reason));
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_adjust_balance(
  p_user uuid, p_admin uuid, p_amount numeric, p_direction text, p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_delta numeric(18,2); v_avail numeric(18,2);
BEGIN
  IF p_amount <= 0 THEN RAISE EXCEPTION 'INVALID_AMOUNT'; END IF;
  v_delta := CASE WHEN p_direction = 'credit' THEN p_amount ELSE -p_amount END;
  SELECT available INTO v_avail FROM public.wallets WHERE user_id = p_user FOR UPDATE;
  IF v_avail IS NULL THEN RAISE EXCEPTION 'WALLET_MISSING'; END IF;
  IF v_avail + v_delta < 0 THEN RAISE EXCEPTION 'INSUFFICIENT_FUNDS'; END IF;

  UPDATE public.wallets SET available = available + v_delta, updated_at = now() WHERE user_id = p_user;
  INSERT INTO public.transactions (user_id, type, amount, status, description)
  VALUES (p_user, 'adjustment', v_delta, 'completed', 'Administrative adjustment: ' || p_reason);
  PERFORM public.fn_notify(p_user, 'Balance adjustment',
    'An administrative ' || p_direction || ' of PKR ' || p_amount::text || ' was applied. Reason: ' || p_reason, '/wallet');
  INSERT INTO public.admin_logs (admin_id, action, target_type, target_id, metadata)
  VALUES (p_admin, 'balance_adjustment', 'user', p_user, jsonb_build_object('amount', p_amount, 'direction', p_direction, 'reason', p_reason));
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fn_notify(uuid,text,text,text) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_create_investment(uuid,uuid) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_approve_deposit(uuid,uuid) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_reject_deposit(uuid,uuid,text) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_submit_withdrawal(uuid,numeric,text,text,text,text,text) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_set_withdrawal_status(uuid,uuid,public.withdrawal_status,text) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_adjust_balance(uuid,uuid,numeric,text,text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_notify(uuid,text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_create_investment(uuid,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_approve_deposit(uuid,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_reject_deposit(uuid,uuid,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_submit_withdrawal(uuid,numeric,text,text,text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_set_withdrawal_status(uuid,uuid,public.withdrawal_status,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_adjust_balance(uuid,uuid,numeric,text,text) TO service_role;
