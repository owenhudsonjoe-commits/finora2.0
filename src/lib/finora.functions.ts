import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

function code(seed: string) {
  return ("FIN" + seed.replace(/-/g, "").slice(0, 6)).toUpperCase();
}

function friendly(message: string) {
  const map: Record<string, string> = {
    INSUFFICIENT_FUNDS: "Your available balance is not enough for this action.",
    PLAN_UNAVAILABLE: "This plan is no longer available.",
    WALLET_MISSING: "Your wallet is not ready yet. Please refresh and try again.",
    BELOW_MINIMUM: "The amount is below the minimum allowed.",
    INVALID_AMOUNT: "Enter a valid amount.",
    INVALID_STATUS: "This request has already been processed.",
    INVALID_TRANSITION: "That status change is not allowed.",
  };
  for (const key of Object.keys(map)) if (message.includes(key)) return map[key]!;
  return "We couldn't complete that request. Please try again.";
}

/** Creates the profile + wallet on first sign-in and applies a referral code. */
export const ensureAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id,referral_code")
      .eq("id", userId)
      .maybeSingle();
    if (existing) return { created: false, referral_code: existing.referral_code };

    const claims = context.claims as Record<string, unknown>;
    const meta = (claims["user_metadata"] ?? {}) as Record<string, string>;
    let referredBy: string | null = null;
    const invite = (meta["referral_code"] ?? "").trim().toUpperCase();
    if (invite) {
      const { data: ref } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("referral_code", invite)
        .maybeSingle();
      referredBy = ref?.id ?? null;
    }

    await supabaseAdmin.from("profiles").insert({
      id: userId,
      full_name: meta["full_name"] ?? "",
      email: (claims["email"] as string) ?? "",
      phone: meta["phone"] ?? null,
      referral_code: code(userId),
      referred_by: referredBy,
    });
    await supabaseAdmin.from("wallets").insert({ user_id: userId });
    await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      title: "Welcome to FINORA",
      message: "Your account is ready. Fund your wallet to activate your first investment plan.",
      link: "/wallet/deposit",
    });
    return { created: true, referral_code: code(userId) };
  });

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const uid = context.userId;
    const [profile, wallet, investments, transactions, unread, commissions] = await Promise.all([
      sb
        .from("profiles")
        .select("full_name,email,referral_code,created_at,status")
        .eq("id", uid)
        .maybeSingle(),
      sb.from("wallets").select("*").eq("user_id", uid).maybeSingle(),
      sb
        .from("investments")
        .select("id,plan_name,amount,daily_earning,status,start_date,end_date,total_earned")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(5),
      sb
        .from("transactions")
        .select("id,reference,type,amount,status,description,created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(8),
      sb
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", uid)
        .eq("read", false),
      sb.from("referral_commissions").select("amount").eq("referrer_id", uid),
    ]);
    const referralEarnings = (commissions.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
    return {
      profile: profile.data,
      wallet: wallet.data,
      investments: investments.data ?? [],
      transactions: transactions.data ?? [],
      unread: unread.count ?? 0,
      referralEarnings,
    };
  });

export const getWalletData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const uid = context.userId;
    const [wallet, transactions, deposits, withdrawals, settings] = await Promise.all([
      sb.from("wallets").select("*").eq("user_id", uid).maybeSingle(),
      sb
        .from("transactions")
        .select("id,reference,type,amount,status,description,created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(100),
      sb
        .from("deposits")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(20),
      sb
        .from("withdrawals")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(20),
      sb.from("app_settings").select("key,value").in("key", ["deposit", "withdrawal"]),
    ]);
    const config: Record<string, Record<string, string | number | boolean | null>> = {};
    for (const s of settings.data ?? [])
      config[s.key] = (s.value ?? {}) as Record<string, string | number | boolean | null>;
    return {
      wallet: wallet.data,
      transactions: transactions.data ?? [],
      deposits: deposits.data ?? [],
      withdrawals: withdrawals.data ?? [],
      config,
    };
  });

export const getInvestments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const uid = context.userId;

    const [invRes, pendingRes] = await Promise.all([
      context.supabase
        .from("investments")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("deposits")
        .select(
          "id, amount, payment_method, external_txn_id, screenshot_path, status, plan_id, created_at, rejection_reason",
        )
        .eq("user_id", uid)
        .not("plan_id", "is", null)
        .order("created_at", { ascending: false }),
    ]);

    const pendingDeposits = pendingRes.data ?? [];
    const planIds = [...new Set(pendingDeposits.map((d) => d.plan_id).filter(Boolean))];
    const { data: plans } = planIds.length
      ? await supabaseAdmin
          .from("investment_plans")
          .select("id, name, duration_days, daily_earning, currency")
          .in("id", planIds)
      : { data: [] };
    const planMap = new Map((plans ?? []).map((p) => [p.id, p]));

    const pendingActivations = await Promise.all(
      pendingDeposits.map(async (d) => {
        let screenshot_url: string | null = null;
        if (d.screenshot_path) {
          if (d.screenshot_path.startsWith("data:") || d.screenshot_path.startsWith("http")) {
            screenshot_url = d.screenshot_path;
          } else {
            try {
              const { data: signed } = await supabaseAdmin.storage
                .from("payment-proofs")
                .createSignedUrl(d.screenshot_path, 86400);
              screenshot_url = signed?.signedUrl ?? null;
            } catch {
              screenshot_url = null;
            }
          }
        }
        return {
          ...d,
          plan: d.plan_id ? (planMap.get(d.plan_id) ?? null) : null,
          screenshot_url,
        };
      }),
    );

    return {
      investments: invRes.data ?? [],
      pendingActivations,
    };
  });

export const investInPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { planId: string; agreed: boolean }) =>
    z.object({ planId: z.string().uuid(), agreed: z.literal(true) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("fn_create_investment", {
      p_user: context.userId,
      p_plan_id: data.planId,
    });
    if (error) return { ok: false as const, message: friendly(error.message) };
    return { ok: true as const };
  });

export const submitDeposit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      amount: number;
      externalTxnId: string;
      screenshotPath: string | null;
      planId: string | null;
    }) =>
      z
        .object({
          amount: z.number().positive(),
          externalTxnId: z.string().max(250),
          screenshotPath: z.string().nullable(),
          planId: z.string().uuid().nullable(),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: setting } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", "deposit")
      .maybeSingle();
    const cfg = (setting?.value ?? {}) as Record<string, string | number | boolean>;
    const min = Number(cfg["min"] ?? 0);
    const max = Number(cfg["max"] ?? Number.MAX_SAFE_INTEGER);

    // If it's a direct plan activation, we permit the plan's exact price
    if (!data.planId && (data.amount < min || data.amount > max))
      return { ok: false as const, message: `Amount must be between PKR ${min} and PKR ${max}.` };

    if (cfg["require_txn_id"] && !data.externalTxnId.trim())
      return { ok: false as const, message: "Transaction ID / Reference is required." };
    if (cfg["require_screenshot"] && !data.screenshotPath)
      return { ok: false as const, message: "A payment screenshot is required." };

    let planName: string | null = null;
    if (data.planId) {
      const { data: plan } = await supabaseAdmin
        .from("investment_plans")
        .select("name")
        .eq("id", data.planId)
        .maybeSingle();
      planName = plan?.name ?? null;
    }

    const { error } = await supabaseAdmin.from("deposits").insert({
      user_id: context.userId,
      amount: data.amount,
      payment_method: String(cfg["method"] ?? "QR Code / Bank Transfer"),
      external_txn_id: data.externalTxnId,
      screenshot_path: data.screenshotPath,
      plan_id: data.planId,
      status: "pending_verification",
    });
    if (error) return { ok: false as const, message: friendly(error.message) };

    if (data.planId) {
      await supabaseAdmin.rpc("fn_notify", {
        p_user: context.userId,
        p_title: "Plan activation submitted",
        p_message: `Your payment proof for ${planName ? `${planName} plan` : "plan"} activation has been submitted and is awaiting administrator verification.`,
        p_link: "/investments",
      });
    } else {
      await supabaseAdmin.rpc("fn_notify", {
        p_user: context.userId,
        p_title: "Deposit submitted",
        p_message: "Your deposit has been submitted and is awaiting verification.",
        p_link: "/wallet",
      });
    }
    return { ok: true as const };
  });

export const submitWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      amount: number;
      method: string;
      accountTitle: string;
      accountNumber: string;
      bankName: string | null;
      iban: string | null;
    }) =>
      z
        .object({
          amount: z.number().positive(),
          method: z.enum(["Easypaisa", "JazzCash", "UPaisa", "Bank Account"]),
          accountTitle: z.string().min(2).max(120),
          accountNumber: z.string().min(5).max(60),
          bankName: z.string().max(120).nullable(),
          iban: z.string().max(60).nullable(),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: setting } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", "withdrawal")
      .maybeSingle();
    const cfg = (setting?.value ?? {}) as Record<string, string | number | boolean>;
    const enabledKey: Record<string, string> = {
      Easypaisa: "easypaisa",
      JazzCash: "jazzcash",
      UPaisa: "upaisa",
      "Bank Account": "bank",
    };
    if (!cfg[enabledKey[data.method]!])
      return { ok: false as const, message: "That method is currently unavailable." };

    const { error } = await supabaseAdmin.rpc("fn_submit_withdrawal", {
      p_user: context.userId,
      p_amount: data.amount,
      p_method: data.method,
      p_title: data.accountTitle,
      p_number: data.accountNumber,
      p_bank: data.bankName ?? "",
      p_iban: data.iban ?? "",
    });
    if (error) return { ok: false as const, message: friendly(error.message) };
    return { ok: true as const };
  });

export const getReferralData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const uid = context.userId;
    const [profile, referred, commissions, setting] = await Promise.all([
      supabaseAdmin.from("profiles").select("referral_code").eq("id", uid).maybeSingle(),
      supabaseAdmin.from("profiles").select("id,full_name,created_at").eq("referred_by", uid),
      supabaseAdmin
        .from("referral_commissions")
        .select("id,amount,status,created_at,referred_id")
        .eq("referrer_id", uid)
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("app_settings").select("value").eq("key", "referral").maybeSingle(),
    ]);
    const names = new Map((referred.data ?? []).map((r) => [r.id, r.full_name]));
    const history = (commissions.data ?? []).map((c) => ({
      id: c.id,
      amount: Number(c.amount),
      status: c.status,
      created_at: c.created_at,
      name: names.get(c.referred_id) ?? "FINORA member",
    }));
    const activeIds = new Set((commissions.data ?? []).map((c) => c.referred_id));
    return {
      referralCode: profile.data?.referral_code ?? "",
      totalReferrals: referred.data?.length ?? 0,
      activeReferrals: activeIds.size,
      earnings: history.reduce((s, h) => s + h.amount, 0),
      history,
      settings: (setting.data?.value ?? {}) as Record<string, string | number | boolean | null>,
    };
  });

export const getNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("notifications")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  });

export const markNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", context.userId)
      .eq("read", false);
    return { ok: true };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { fullName: string; phone: string }) =>
    z.object({ fullName: z.string().min(2).max(120), phone: z.string().max(40) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ full_name: data.fullName, phone: data.phone, updated_at: new Date().toISOString() })
      .eq("id", context.userId);
    if (error) return { ok: false as const, message: friendly(error.message) };
    return { ok: true as const };
  });

export const getTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: tickets } = await context.supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    const ids = (tickets ?? []).map((t) => t.id);
    const { data: messages } = ids.length
      ? await context.supabase
          .from("support_messages")
          .select("*")
          .in("ticket_id", ids)
          .order("created_at")
      : { data: [] };
    return { tickets: tickets ?? [], messages: messages ?? [] };
  });

export const createTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { subject: string; category: string; message: string }) =>
    z
      .object({
        subject: z.string().min(3).max(140),
        category: z.string().min(2).max(40),
        message: z.string().min(5).max(4000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ticket, error } = await supabaseAdmin
      .from("support_tickets")
      .insert({ user_id: context.userId, subject: data.subject, category: data.category })
      .select("id")
      .single();
    if (error || !ticket) return { ok: false as const, message: friendly(error?.message ?? "") };
    await supabaseAdmin.from("support_messages").insert({
      ticket_id: ticket.id,
      sender_id: context.userId,
      is_admin: false,
      message: data.message,
    });
    return { ok: true as const };
  });

export const replyToTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ticketId: string; message: string }) =>
    z.object({ ticketId: z.string().uuid(), message: z.string().min(1).max(4000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: ticket } = await context.supabase
      .from("support_tickets")
      .select("id")
      .eq("id", data.ticketId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!ticket) return { ok: false as const, message: "Ticket not found." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("support_messages").insert({
      ticket_id: data.ticketId,
      sender_id: context.userId,
      is_admin: false,
      message: data.message,
    });
    await supabaseAdmin
      .from("support_tickets")
      .update({ status: "open", updated_at: new Date().toISOString() })
      .eq("id", data.ticketId);
    return { ok: true as const };
  });

export const createSignedProofUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { path: string }) => z.object({ path: z.string().min(3).max(400) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: isAdmin } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
    if (!isAdmin && !data.path.startsWith(`${context.userId}/`))
      return { url: null as string | null };
    const { data: signed } = await supabaseAdmin.storage
      .from("payment-proofs")
      .createSignedUrl(data.path, 300);
    return { url: signed?.signedUrl ?? null };
  });
