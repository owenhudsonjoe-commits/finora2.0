-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('super_admin','finance_admin','operations_admin','support_admin');
CREATE TYPE public.deposit_status AS ENUM ('submitted','pending_verification','approved','rejected');
CREATE TYPE public.withdrawal_status AS ENUM ('pending','under_review','approved','paid','rejected');
CREATE TYPE public.investment_status AS ENUM ('pending','active','completed','cancelled');
CREATE TYPE public.txn_type AS ENUM ('deposit','withdrawal','investment','return','referral_commission','fee','adjustment');
CREATE TYPE public.txn_status AS ENUM ('pending','processing','completed','rejected','cancelled');
CREATE TYPE public.ticket_status AS ENUM ('open','in_progress','waiting_user','resolved','closed');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text,
  avatar_url text,
  referral_code text NOT NULL UNIQUE,
  referred_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_profiles_referred_by ON public.profiles(referred_by);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ ROLES ============
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id);
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_admin(auth.uid()));
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- ============ WALLETS ============
CREATE TABLE public.wallets (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  available numeric(18,2) NOT NULL DEFAULT 0,
  invested numeric(18,2) NOT NULL DEFAULT 0,
  pending numeric(18,2) NOT NULL DEFAULT 0,
  total_earnings numeric(18,2) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wallet read" ON public.wallets FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- ============ PLANS ============
CREATE TABLE public.investment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  investment_amount numeric(18,2) NOT NULL,
  min_investment numeric(18,2) NOT NULL,
  max_investment numeric(18,2) NOT NULL,
  daily_earning numeric(18,2) NOT NULL,
  return_type text NOT NULL DEFAULT 'daily_fixed',
  duration_days integer NOT NULL DEFAULT 60,
  currency text NOT NULL DEFAULT 'PKR',
  fees numeric(18,2) NOT NULL DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'Medium',
  terms text NOT NULL DEFAULT '',
  disclosure text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  featured boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_plans_status_order ON public.investment_plans(status, display_order);
GRANT SELECT ON public.investment_plans TO anon, authenticated;
GRANT ALL ON public.investment_plans TO service_role;
ALTER TABLE public.investment_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public active plans" ON public.investment_plans FOR SELECT TO anon, authenticated USING (status = 'active' OR public.is_admin(auth.uid()));

-- ============ INVESTMENTS ============
CREATE TABLE public.investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.investment_plans(id),
  plan_name text NOT NULL,
  amount numeric(18,2) NOT NULL,
  daily_earning numeric(18,2) NOT NULL,
  duration_days integer NOT NULL,
  fees numeric(18,2) NOT NULL DEFAULT 0,
  terms_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  status public.investment_status NOT NULL DEFAULT 'pending',
  total_earned numeric(18,2) NOT NULL DEFAULT 0,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_investments_user ON public.investments(user_id, status);
GRANT SELECT ON public.investments TO authenticated;
GRANT ALL ON public.investments TO service_role;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own investments read" ON public.investments FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- ============ TRANSACTIONS (LEDGER) ============
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE DEFAULT ('FIN-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type public.txn_type NOT NULL,
  amount numeric(18,2) NOT NULL,
  currency text NOT NULL DEFAULT 'PKR',
  status public.txn_status NOT NULL DEFAULT 'completed',
  description text NOT NULL DEFAULT '',
  related_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_txn_user_created ON public.transactions(user_id, created_at DESC);
GRANT SELECT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own txn read" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- ============ DEPOSITS ============
CREATE TABLE public.deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric(18,2) NOT NULL CHECK (amount > 0),
  payment_method text NOT NULL DEFAULT '',
  external_txn_id text,
  screenshot_path text,
  status public.deposit_status NOT NULL DEFAULT 'pending_verification',
  plan_id uuid REFERENCES public.investment_plans(id),
  rejection_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_deposits_status ON public.deposits(status, created_at DESC);
CREATE INDEX idx_deposits_user ON public.deposits(user_id, created_at DESC);
GRANT SELECT ON public.deposits TO authenticated;
GRANT ALL ON public.deposits TO service_role;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own deposits read" ON public.deposits FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- ============ WITHDRAWALS ============
CREATE TABLE public.withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric(18,2) NOT NULL CHECK (amount > 0),
  fee numeric(18,2) NOT NULL DEFAULT 0,
  net_amount numeric(18,2) NOT NULL,
  method text NOT NULL,
  account_title text NOT NULL,
  account_number text NOT NULL,
  bank_name text,
  iban text,
  status public.withdrawal_status NOT NULL DEFAULT 'pending',
  rejection_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_withdrawals_status ON public.withdrawals(status, created_at DESC);
CREATE INDEX idx_withdrawals_user ON public.withdrawals(user_id, created_at DESC);
GRANT SELECT ON public.withdrawals TO authenticated;
GRANT ALL ON public.withdrawals TO service_role;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own withdrawals read" ON public.withdrawals FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- ============ REFERRAL COMMISSIONS ============
CREATE TABLE public.referral_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  investment_id uuid REFERENCES public.investments(id) ON DELETE SET NULL,
  amount numeric(18,2) NOT NULL,
  status text NOT NULL DEFAULT 'paid',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_refcomm_referrer ON public.referral_commissions(referrer_id, created_at DESC);
GRANT SELECT ON public.referral_commissions TO authenticated;
GRANT ALL ON public.referral_commissions TO service_role;
ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own commissions read" ON public.referral_commissions FOR SELECT TO authenticated USING (auth.uid() = referrer_id OR public.is_admin(auth.uid()));

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_user ON public.notifications(user_id, read, created_at DESC);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications read" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own notifications update" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ============ SUPPORT ============
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  status public.ticket_status NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tickets_user ON public.support_tickets(user_id, created_at DESC);
GRANT SELECT ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tickets read" ON public.support_tickets FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  is_admin boolean NOT NULL DEFAULT false,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ticket_messages ON public.support_messages(ticket_id, created_at);
GRANT SELECT ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ticket messages read" ON public.support_messages FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid()));

-- ============ SETTINGS & CONTENT ============
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_public boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public settings read" ON public.app_settings FOR SELECT TO anon, authenticated USING (is_public = true OR public.is_admin(auth.uid()));

CREATE TABLE public.content_pages (
  slug text PRIMARY KEY,
  title text NOT NULL,
  body jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.content_pages TO anon, authenticated;
GRANT ALL ON public.content_pages TO service_role;
ALTER TABLE public.content_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public content read" ON public.content_pages FOR SELECT TO anon, authenticated USING (true);

-- ============ ADMIN LOGS ============
CREATE TABLE public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_admin_logs_created ON public.admin_logs(created_at DESC);
GRANT SELECT ON public.admin_logs TO authenticated;
GRANT ALL ON public.admin_logs TO service_role;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin logs read" ON public.admin_logs FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- ============ SEED PLANS ============
INSERT INTO public.investment_plans
 (name, slug, description, investment_amount, min_investment, max_investment, daily_earning, duration_days, fees, risk_level, terms, disclosure, featured, display_order)
VALUES
 ('Starter','starter','Entry-level allocation for first-time investors.',2700,2700,2700,300,60,0,'Low','Daily returns are credited according to the configured plan terms while the plan remains active.','Investment values may change. Returns are defined by the plan terms configured by FINORA and are not guaranteed by any third party.',false,1),
 ('Basic','basic','A balanced allocation for steady portfolio growth.',5400,5400,5400,600,60,0,'Low','Daily returns are credited according to the configured plan terms while the plan remains active.','Investment values may change. Returns are defined by the plan terms configured by FINORA and are not guaranteed by any third party.',false,2),
 ('Growth','growth','Scaled allocation designed for compounding growth.',10800,10800,10800,1200,60,0,'Medium','Daily returns are credited according to the configured plan terms while the plan remains active.','Investment values may change. Returns are defined by the plan terms configured by FINORA and are not guaranteed by any third party.',true,3),
 ('Premium','premium','Higher allocation tier with priority processing.',21600,21600,21600,2400,60,0,'Medium','Daily returns are credited according to the configured plan terms while the plan remains active.','Investment values may change. Returns are defined by the plan terms configured by FINORA and are not guaranteed by any third party.',true,4),
 ('Pro','pro','Professional tier for experienced investors.',43200,43200,43200,4800,60,0,'High','Daily returns are credited according to the configured plan terms while the plan remains active.','Investment values may change. Returns are defined by the plan terms configured by FINORA and are not guaranteed by any third party.',false,5),
 ('Elite','elite','Maximum allocation tier with dedicated support.',86400,86400,86400,9600,60,0,'High','Daily returns are credited according to the configured plan terms while the plan remains active.','Investment values may change. Returns are defined by the plan terms configured by FINORA and are not guaranteed by any third party.',false,6);

-- ============ SEED SETTINGS ============
INSERT INTO public.app_settings (key, value, is_public) VALUES
 ('branding','{"site_name":"FINORA","browser_title":"FINORA — Structured Investment Platform","footer_name":"FINORA Financial Technologies"}'::jsonb,true),
 ('contact','{"support_name":"FINORA Support","whatsapp":"","phone":"","email":"support@finora.app","hours":"Mon–Sat, 09:00–18:00 PKT","facebook":"","instagram":"","telegram":"","youtube":""}'::jsonb,true),
 ('deposit','{"method":"Easypaisa","account_name":"","account_number":"","instructions":"Transfer the exact amount to the account shown, then submit your transaction ID and payment screenshot for verification.","qr_url":"","min":1000,"max":500000,"require_txn_id":true,"require_screenshot":true}'::jsonb,true),
 ('withdrawal','{"easypaisa":true,"jazzcash":true,"upaisa":true,"bank":true,"fee_percent":0,"min":1000}'::jsonb,true),
 ('referral','{"enabled":true,"commission_type":"percentage","commission_percent":5,"min_qualifying_investment":2700,"rules":"Commission is credited when a referred user makes a qualifying investment."}'::jsonb,true),
 ('maintenance','{"enabled":false,"message":"FINORA is undergoing scheduled maintenance.","eta":""}'::jsonb,true);

INSERT INTO public.content_pages (slug, title, body) VALUES
 ('home','Home','{"hero_title":"Structured investing, engineered for clarity.","hero_subtitle":"FINORA gives you transparent plans, a verified deposit workflow and a real-time view of every rupee in your portfolio."}'::jsonb),
 ('about','About FINORA','{"body":"FINORA is a technology-first investment platform built around transparency, verified operations and disciplined financial controls. Every balance you see is derived from an auditable ledger."}'::jsonb),
 ('terms','Terms & Conditions','{"body":"By using FINORA you agree to the platform terms, the investment terms attached to each plan, and the withdrawal rules published on this site."}'::jsonb),
 ('privacy','Privacy Policy','{"body":"FINORA collects only the information required to operate your account and verify financial transactions. Payment proofs are stored in private storage and are never publicly accessible."}'::jsonb),
 ('risk-disclosure','Risk Disclosure','{"body":"All investments carry risk. Returns described on this platform reflect the configured terms of each plan and are not a guarantee of profit. Do not invest funds you cannot afford to lose."}'::jsonb);
