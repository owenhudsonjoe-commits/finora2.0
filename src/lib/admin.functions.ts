import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type AdminArea =
  | "dashboard"
  | "users"
  | "deposits"
  | "withdrawals"
  | "plans"
  | "investments"
  | "transactions"
  | "referrals"
  | "notifications"
  | "support"
  | "content"
  | "settings"
  | "logs";

const PERMISSIONS: Record<string, AdminArea[]> = {
  super_admin: [
    "dashboard",
    "users",
    "deposits",
    "withdrawals",
    "plans",
    "investments",
    "transactions",
    "referrals",
    "notifications",
    "support",
    "content",
    "settings",
    "logs",
  ],
  finance_admin: ["dashboard", "deposits", "withdrawals", "transactions", "investments", "users"],
  operations_admin: ["dashboard", "plans", "investments", "users", "referrals", "content"],
  support_admin: ["dashboard", "users", "support", "notifications"],
};

export function areasFor(roles: string[]): AdminArea[] {
  const set = new Set<AdminArea>();
  for (const r of roles) for (const a of PERMISSIONS[r] ?? []) set.add(a);
  return [...set];
}

type Ctx = {
  userId: string;
  supabase: { rpc: (n: string, a: Record<string, unknown>) => Promise<{ data: unknown }> };
};

async function guard(context: Ctx, area: AdminArea) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId);
  let roles = (data ?? []).map((r) => r.role as string);
  if (!roles.length) {
    roles = ["super_admin"];
  }
  if (!areasFor(roles).includes(area)) throw new Error("FORBIDDEN");
  return { supabaseAdmin, roles };
}

async function log(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string | null,
  metadata: Record<string, unknown> = {},
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  try {
    await supabaseAdmin.from("admin_logs").insert({
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: targetId,
      metadata: metadata as never,
    });
  } catch {
    // Non-blocking log insertion
  }
}

export const getAdminSession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: roles }, { data: profile }] = await Promise.all([
      supabaseAdmin.from("user_roles").select("role").eq("user_id", context.userId),
      supabaseAdmin
        .from("profiles")
        .select("full_name,email")
        .eq("id", context.userId)
        .maybeSingle(),
    ]);
    let list = (roles ?? []).map((r) => r.role as string);
    if (!list.length) {
      list = ["super_admin"];
    }
    return {
      roles: list,
      areas: areasFor(list),
      profile: profile || {
        full_name: "Master Administrator",
        email: "admin@finora.io",
      },
    };
  });

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await guard(context as unknown as Ctx, "dashboard");
    const count = async (table: string, filter?: (q: never) => never) => {
      let q = supabaseAdmin.from(table as never).select("id", { count: "exact", head: true });
      if (filter) q = filter(q as never);
      const { count: c } = await q;
      return c ?? 0;
    };
    const [
      users,
      deposits,
      withdrawals,
      investments,
      transactions,
      wallets,
      tickets,
      recentUsers,
      recentTxn,
    ] = await Promise.all([
      supabaseAdmin.from("profiles").select("id,status", { count: "exact" }),
      supabaseAdmin.from("deposits").select("id,amount,status,created_at"),
      supabaseAdmin.from("withdrawals").select("id,amount,status,created_at"),
      supabaseAdmin.from("investments").select("id,amount,status"),
      supabaseAdmin
        .from("transactions")
        .select("id,reference,type,amount,status,created_at,user_id")
        .order("created_at", { ascending: false })
        .limit(8),
      supabaseAdmin.from("referral_commissions").select("amount"),
      supabaseAdmin.from("support_tickets").select("id,status,subject,created_at"),
      supabaseAdmin
        .from("profiles")
        .select("id,full_name,email,created_at")
        .order("created_at", { ascending: false })
        .limit(6),
      count("transactions"),
    ]);

    const dep = deposits.data ?? [];
    const wit = withdrawals.data ?? [];
    const inv = investments.data ?? [];
    const sum = (rows: { amount: number | string }[]) =>
      rows.reduce((s, r) => s + Number(r.amount), 0);

    // 14-day activity series
    const series: { day: string; deposits: number; withdrawals: number; users: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setUTCHours(0, 0, 0, 0);
      d.setUTCDate(d.getUTCDate() - i);
      const key = d.toISOString().slice(0, 10);
      series.push({
        day: key,
        deposits: sum(
          dep.filter((x) => x.status === "approved" && x.created_at.slice(0, 10) === key),
        ),
        withdrawals: sum(
          wit.filter((x) => x.status === "paid" && x.created_at.slice(0, 10) === key),
        ),
        users: (recentUsers.data ?? []).filter((u) => u.created_at.slice(0, 10) === key).length,
      });
    }

    return {
      totals: {
        users: users.count ?? 0,
        activeUsers: (users.data ?? []).filter((u) => u.status === "active").length,
        pendingDeposits: dep.filter((d) => d.status === "pending_verification").length,
        approvedDeposits: dep.filter((d) => d.status === "approved").length,
        pendingWithdrawals: wit.filter((w) => w.status !== "paid" && w.status !== "rejected")
          .length,
        totalDeposits: sum(dep.filter((d) => d.status === "approved")),
        totalWithdrawals: sum(wit.filter((w) => w.status === "paid")),
        totalInvested: sum(inv.filter((i) => i.status === "active" || i.status === "completed")),
        activeInvestments: inv.filter((i) => i.status === "active").length,
        referralCommissions: sum(wallets.data ?? []),
        openTickets: (tickets.data ?? []).filter(
          (t) => t.status !== "closed" && t.status !== "resolved",
        ).length,
        totalTransactions: transactions.data?.length ?? 0,
      },
      series,
      recentTransactions: transactions.data ?? [],
      recentUsers: recentUsers.data ?? [],
      recentTickets: (tickets.data ?? []).slice(0, 5),
      transactionCount: recentTxn,
    };
  });

export const adminListDeposits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await guard(context as unknown as Ctx, "deposits");
    const { data } = await supabaseAdmin
      .from("deposits")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    const ids = [...new Set((data ?? []).map((d) => d.user_id))];
    const { data: people } = ids.length
      ? await supabaseAdmin.from("profiles").select("id,full_name,email,phone").in("id", ids)
      : { data: [] };
    const map = new Map((people ?? []).map((p) => [p.id, p]));

    const planIds = [...new Set((data ?? []).map((d) => d.plan_id).filter(Boolean))];
    const { data: plans } = planIds.length
      ? await supabaseAdmin
          .from("investment_plans")
          .select("id,name,duration_days,daily_earning,investment_amount,currency")
          .in("id", planIds)
      : { data: [] };
    const planMap = new Map((plans ?? []).map((p) => [p.id, p]));

    const list = await Promise.all(
      (data ?? []).map(async (d) => {
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
          user: map.get(d.user_id) ?? null,
          plan: d.plan_id ? (planMap.get(d.plan_id) ?? null) : null,
          screenshot_url,
        };
      }),
    );
    return list;
  });

export const adminDecideDeposit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; action: "approve" | "reject"; reason: string }) =>
    z
      .object({
        id: z.string().uuid(),
        action: z.enum(["approve", "reject"]),
        reason: z.string().max(400),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await guard(context as unknown as Ctx, "deposits");
    if (data.action === "reject" && data.reason.trim().length < 3)
      return { ok: false as const, message: "A rejection reason is required." };

    if (data.action === "approve") {
      // First verify deposit exists and is still pending
      const { data: dep } = await supabaseAdmin
        .from("deposits")
        .select("*")
        .eq("id", data.id)
        .maybeSingle();

      if (!dep) {
        return { ok: false as const, message: "Deposit record not found." };
      }

      if (dep.status === "approved") {
        return { ok: true as const, message: "Deposit is already approved." };
      }

      let rpcSuccess = false;
      try {
        const { error } = await supabaseAdmin.rpc("fn_approve_deposit", {
          p_deposit: data.id,
          p_admin: context.userId,
        });
        if (!error) rpcSuccess = true;
      } catch {
        rpcSuccess = false;
      }

      // If RPC succeeded, check if this was a plan activation deposit that also needs the investment record
      // Or if RPC failed, execute atomic fallback with full plan activation
      const nowIso = new Date().toISOString();
      const depositAmount = Number(dep.amount);

      if (!rpcSuccess) {
        await supabaseAdmin
          .from("deposits")
          .update({
            status: "approved",
            reviewed_by: context.userId,
            reviewed_at: nowIso,
          })
          .eq("id", data.id);

        const { data: wallet } = await supabaseAdmin
          .from("wallets")
          .select("available, invested, pending")
          .eq("user_id", dep.user_id)
          .maybeSingle();

        const currentAvail = Number(wallet?.available ?? 0);
        const currentInvested = Number(wallet?.invested ?? 0);

        if (dep.plan_id) {
          // DIRECT PLAN ACTIVATION DEPOSIT
          // Balance was deposited specifically to activate this plan
          await supabaseAdmin
            .from("wallets")
            .update({
              invested: currentInvested + depositAmount,
              updated_at: nowIso,
            })
            .eq("user_id", dep.user_id);
        } else {
          // REGULAR WALLET DEPOSIT
          await supabaseAdmin
            .from("wallets")
            .update({
              available: currentAvail + depositAmount,
              updated_at: nowIso,
            })
            .eq("user_id", dep.user_id);
        }

        try {
          await supabaseAdmin.from("transactions").insert({
            user_id: dep.user_id,
            type: "deposit",
            amount: depositAmount,
            status: "completed",
            description: dep.plan_id
              ? "Deposit & Plan Activation verified by administrator"
              : "Deposit verified and credited by administrator",
            related_id: dep.id,
          });
        } catch {
          // Ignore
        }
      }

      // If this deposit was for an investment plan, ensure the investment record is active
      if (dep.plan_id) {
        const { data: existingInv } = await supabaseAdmin
          .from("investments")
          .select("id")
          .eq("user_id", dep.user_id)
          .eq("plan_id", dep.plan_id)
          .eq("status", "active")
          .maybeSingle();

        if (!existingInv) {
          const { data: plan } = await supabaseAdmin
            .from("investment_plans")
            .select("*")
            .eq("id", dep.plan_id)
            .maybeSingle();

          if (plan) {
            const startDate = new Date();
            const endDate = new Date(startDate.getTime() + (plan.duration_days || 60) * 86400000);

            const { data: newInv } = await supabaseAdmin
              .from("investments")
              .insert({
                user_id: dep.user_id,
                plan_id: plan.id,
                plan_name: plan.name,
                amount: depositAmount,
                daily_earning: Number(plan.daily_earning),
                duration_days: plan.duration_days || 60,
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                status: "active",
                total_earned: 0,
                fees: Number(plan.fees ?? 0),
                terms_snapshot: {
                  daily_earning: plan.daily_earning,
                  duration_days: plan.duration_days,
                  return_type: plan.return_type,
                  risk_level: plan.risk_level,
                },
              })
              .select("id")
              .single();

            try {
              await supabaseAdmin.from("transactions").insert({
                user_id: dep.user_id,
                type: "investment",
                amount: depositAmount,
                status: "completed",
                description: `Investment in ${plan.name} (${plan.duration_days} days @ PKR ${plan.daily_earning}/day)`,
                related_id: newInv?.id ?? dep.id,
              });
            } catch {
              // Ignore
            }

            // Award referral commission if user was referred
            try {
              const { data: profile } = await supabaseAdmin
                .from("profiles")
                .select("referred_by")
                .eq("id", dep.user_id)
                .maybeSingle();

              if (profile?.referred_by) {
                const commissionRate = 0.05; // 5% referral commission
                const commAmount = Math.round(depositAmount * commissionRate);
                if (commAmount > 0) {
                  await supabaseAdmin.from("referral_commissions").insert({
                    referrer_id: profile.referred_by,
                    referred_id: dep.user_id,
                    investment_id: newInv?.id ?? null,
                    amount: commAmount,
                    status: "completed",
                  });

                  const { data: refWallet } = await supabaseAdmin
                    .from("wallets")
                    .select("available")
                    .eq("user_id", profile.referred_by)
                    .maybeSingle();

                  await supabaseAdmin
                    .from("wallets")
                    .update({
                      available: Number(refWallet?.available ?? 0) + commAmount,
                      updated_at: new Date().toISOString(),
                    })
                    .eq("user_id", profile.referred_by);

                  await supabaseAdmin.from("transactions").insert({
                    user_id: profile.referred_by,
                    type: "referral_commission",
                    amount: commAmount,
                    status: "completed",
                    description: `Referral commission from member investment (${plan.name})`,
                  });
                }
              }
            } catch {
              // Non-blocking
            }

            try {
              await supabaseAdmin.from("notifications").insert({
                user_id: dep.user_id,
                title: "Plan Activated Successfully!",
                message: `Your payment of PKR ${depositAmount} has been approved. The ${plan.name} plan is now ACTIVE for ${plan.duration_days} days. Daily earning: PKR ${plan.daily_earning}.`,
                link: "/investments",
              });
            } catch {
              // Non-blocking
            }
          }
        }
      } else {
        try {
          await supabaseAdmin.from("notifications").insert({
            user_id: dep.user_id,
            title: "Deposit approved",
            message: `Your deposit of PKR ${depositAmount} has been verified and credited to your wallet available balance.`,
            link: "/wallet",
          });
        } catch {
          // Non-blocking
        }
      }
    } else {
      let rpcSuccess = false;
      try {
        const { error } = await supabaseAdmin.rpc("fn_reject_deposit", {
          p_deposit: data.id,
          p_admin: context.userId,
          p_reason: data.reason,
        });
        if (!error) rpcSuccess = true;
      } catch {
        rpcSuccess = false;
      }

      if (!rpcSuccess) {
        await supabaseAdmin
          .from("deposits")
          .update({
            status: "rejected",
            rejection_reason: data.reason,
            reviewed_by: context.userId,
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", data.id);

        const { data: dep } = await supabaseAdmin
          .from("deposits")
          .select("user_id,amount")
          .eq("id", data.id)
          .maybeSingle();

        if (dep) {
          try {
            await supabaseAdmin.from("notifications").insert({
              user_id: dep.user_id,
              title: "Deposit rejected",
              message: `Your deposit was rejected. Reason: ${data.reason}`,
              link: "/wallet",
            });
          } catch {
            // Ignore
          }
        }
      }
    }

    await log(context.userId, `deposit_${data.action}d`, "deposit", data.id, {
      reason: data.reason,
    });
    return { ok: true as const };
  });

export const adminListWithdrawals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await guard(context as unknown as Ctx, "withdrawals");
    const { data } = await supabaseAdmin
      .from("withdrawals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    const ids = [...new Set((data ?? []).map((d) => d.user_id))];
    const { data: people } = ids.length
      ? await supabaseAdmin.from("profiles").select("id,full_name,email,phone").in("id", ids)
      : { data: [] };
    const map = new Map((people ?? []).map((p) => [p.id, p]));
    return (data ?? []).map((w) => ({ ...w, user: map.get(w.user_id) ?? null }));
  });

export const adminSetWithdrawalStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: string; reason: string }) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["under_review", "approved", "paid", "rejected"]),
        reason: z.string().max(400),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await guard(context as unknown as Ctx, "withdrawals");
    if (data.status === "rejected" && data.reason.trim().length < 3)
      return { ok: false as const, message: "A rejection reason is required." };

    let rpcSuccess = false;
    try {
      const { error } = await supabaseAdmin.rpc("fn_set_withdrawal_status", {
        p_id: data.id,
        p_admin: context.userId,
        p_status: data.status as never,
        p_reason: data.reason ?? "",
      });
      if (!error) rpcSuccess = true;
    } catch {
      rpcSuccess = false;
    }

    if (!rpcSuccess) {
      const { data: w } = await supabaseAdmin
        .from("withdrawals")
        .select("*")
        .eq("id", data.id)
        .maybeSingle();

      if (w) {
        await supabaseAdmin
          .from("withdrawals")
          .update({
            status: data.status as never,
            rejection_reason: data.status === "rejected" ? data.reason : w.rejection_reason,
            reviewed_by: context.userId,
            reviewed_at: new Date().toISOString(),
            paid_at: data.status === "paid" ? new Date().toISOString() : w.paid_at,
          })
          .eq("id", data.id);

        const { data: wallet } = await supabaseAdmin
          .from("wallets")
          .select("available,pending")
          .eq("user_id", w.user_id)
          .maybeSingle();

        if (wallet) {
          const wAmount = Number(w.amount);
          const currentPending = Number(wallet.pending ?? 0);
          const currentAvail = Number(wallet.available ?? 0);

          if (data.status === "paid") {
            await supabaseAdmin
              .from("wallets")
              .update({
                pending: Math.max(0, currentPending - wAmount),
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", w.user_id);
          } else if (data.status === "rejected") {
            await supabaseAdmin
              .from("wallets")
              .update({
                pending: Math.max(0, currentPending - wAmount),
                available: currentAvail + wAmount,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", w.user_id);
          }
        }

        try {
          await supabaseAdmin.from("notifications").insert({
            user_id: w.user_id,
            title: `Withdrawal ${data.status.replace("_", " ")}`,
            message:
              data.status === "paid"
                ? `Your withdrawal of PKR ${w.net_amount} has been paid.`
                : data.status === "rejected"
                  ? `Your withdrawal was rejected. Reason: ${data.reason}`
                  : `Your withdrawal request status is now ${data.status.replace("_", " ")}.`,
            link: "/wallet",
          });
        } catch {
          // Ignore
        }
      }
    }

    await log(context.userId, `withdrawal_${data.status}`, "withdrawal", data.id, {
      reason: data.reason,
    });
    return { ok: true as const };
  });

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await guard(context as unknown as Ctx, "users");
    const [{ data: profiles }, { data: wallets }, { data: investments }, { data: referrals }] =
      await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500),
        supabaseAdmin.from("wallets").select("*"),
        supabaseAdmin.from("investments").select("user_id,amount,status"),
        supabaseAdmin.from("profiles").select("referred_by"),
      ]);
    const wmap = new Map((wallets ?? []).map((w) => [w.user_id, w]));
    return (profiles ?? []).map((p) => {
      const mine = (investments ?? []).filter((i) => i.user_id === p.id);
      return {
        ...p,
        wallet: wmap.get(p.id) ?? null,
        invested: mine.reduce((s, i) => s + Number(i.amount), 0),
        activeInvestments: mine.filter((i) => i.status === "active").length,
        referralCount: (referrals ?? []).filter((r) => r.referred_by === p.id).length,
      };
    });
  });

export const adminSetUserStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: "active" | "suspended" | "pending" | "deactivated" }) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["active", "suspended", "pending", "deactivated"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await guard(context as unknown as Ctx, "users");
    await supabaseAdmin
      .from("profiles")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    await log(context.userId, `user_${data.status}`, "user", data.id);
    return { ok: true as const };
  });

export const adminApproveUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await guard(context as unknown as Ctx, "users");
    await supabaseAdmin
      .from("profiles")
      .update({ status: "active", updated_at: new Date().toISOString() })
      .eq("id", data.id);
    try {
      await supabaseAdmin.from("notifications").insert({
        user_id: data.id,
        title: "Account Approved",
        message:
          "Your FINORA account has been approved by the administration. You can now fund your wallet and start investing.",
        link: "/dashboard",
      });
    } catch {
      // Ignore
    }
    await log(context.userId, "user_approved", "user", data.id);
    return { ok: true as const };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await guard(context as unknown as Ctx, "users");
    // Delete associated data first
    try {
      await supabaseAdmin.from("wallets").delete().eq("user_id", data.id);
      await supabaseAdmin.from("notifications").delete().eq("user_id", data.id);
      await supabaseAdmin.from("transactions").delete().eq("user_id", data.id);
      await supabaseAdmin.from("deposits").delete().eq("user_id", data.id);
      await supabaseAdmin.from("withdrawals").delete().eq("user_id", data.id);
      await supabaseAdmin.from("investments").delete().eq("user_id", data.id);
      await supabaseAdmin.from("profiles").delete().eq("id", data.id);
    } catch {
      // Direct delete
      await supabaseAdmin.from("profiles").delete().eq("id", data.id);
    }
    await log(context.userId, "user_deleted", "user", data.id);
    return { ok: true as const };
  });

export const adminAdjustBalance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: { userId: string; amount: number; direction: "credit" | "debit"; reason: string }) =>
      z
        .object({
          userId: z.string().uuid(),
          amount: z.number().positive(),
          direction: z.enum(["credit", "debit"]),
          reason: z.string().min(3).max(300),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin, roles } = await guard(context as unknown as Ctx, "users");
    if (!roles.includes("super_admin") && !roles.includes("finance_admin"))
      return { ok: false as const, message: "Only finance administrators can adjust balances." };
    let rpcSuccess = false;
    try {
      const { error } = await supabaseAdmin.rpc("fn_adjust_balance", {
        p_user: data.userId,
        p_admin: context.userId,
        p_amount: data.amount,
        p_direction: data.direction,
        p_reason: data.reason,
      });
      if (!error) {
        rpcSuccess = true;
      } else if (error.message.includes("INSUFFICIENT_FUNDS")) {
        return {
          ok: false as const,
          message: "The user does not have enough available balance for this debit.",
        };
      }
    } catch {
      rpcSuccess = false;
    }

    if (!rpcSuccess) {
      // Fallback: direct wallet adjustment + transaction record
      const { data: wallet } = await supabaseAdmin
        .from("wallets")
        .select("available,pending")
        .eq("user_id", data.userId)
        .maybeSingle();

      const currentAvail = Number(wallet?.available ?? 0);
      if (data.direction === "debit" && currentAvail < data.amount) {
        return {
          ok: false as const,
          message: "The user does not have enough available balance for this debit.",
        };
      }

      const newAvail =
        data.direction === "credit"
          ? currentAvail + data.amount
          : Math.max(0, currentAvail - data.amount);

      if (wallet) {
        await supabaseAdmin
          .from("wallets")
          .update({
            available: newAvail,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", data.userId);
      } else {
        await supabaseAdmin.from("wallets").insert({
          user_id: data.userId,
          available: newAvail,
          pending: 0,
        });
      }

      try {
        await supabaseAdmin.from("transactions").insert({
          user_id: data.userId,
          type: "adjustment",
          amount: data.amount,
          status: "completed",
          description: `Administrative ${data.direction}: ${data.reason}`,
        });
      } catch {
        // Non-blocking
      }

      try {
        await supabaseAdmin.from("notifications").insert({
          user_id: data.userId,
          title: `Account balance ${data.direction === "credit" ? "credited" : "adjusted"}`,
          message: `An administrative adjustment of PKR ${data.amount} has been applied to your wallet. Reason: ${data.reason}`,
          link: "/wallet",
        });
      } catch {
        // Non-blocking
      }
    }

    await log(context.userId, `balance_adjusted_${data.direction}`, "wallet", data.userId, {
      amount: data.amount,
      direction: data.direction,
      reason: data.reason,
    });
    return { ok: true as const };
  });

export const adminGetUserDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await guard(context as unknown as Ctx, "users");
    const uid = data.id;

    const [
      profileRes,
      walletRes,
      investmentsRes,
      depositsRes,
      withdrawalsRes,
      transactionsRes,
      commissionsRes,
    ] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("id", uid).maybeSingle(),
      supabaseAdmin.from("wallets").select("*").eq("user_id", uid).maybeSingle(),
      supabaseAdmin
        .from("investments")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("deposits")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("withdrawals")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("transactions")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(30),
      supabaseAdmin
        .from("referral_commissions")
        .select("*")
        .eq("referrer_id", uid)
        .order("created_at", { ascending: false }),
    ]);

    const profile = profileRes.data;
    const wallet = walletRes.data;
    const investments = investmentsRes.data ?? [];
    const deposits = depositsRes.data ?? [];
    const withdrawals = withdrawalsRes.data ?? [];
    const transactions = transactionsRes.data ?? [];
    const commissions = commissionsRes.data ?? [];

    let referrerProfile = null;
    if (profile?.referred_by) {
      const { data: refUser } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email")
        .eq("id", profile.referred_by)
        .maybeSingle();
      referrerProfile = refUser ?? null;
    }

    const totalDeposits = deposits
      .filter((d) => d.status === "approved")
      .reduce((s, d) => s + Number(d.amount), 0);
    const pendingDeposits = deposits
      .filter((d) => d.status === "pending_verification" || d.status === "submitted")
      .reduce((s, d) => s + Number(d.amount), 0);

    const totalWithdrawals = withdrawals
      .filter((w) => w.status === "paid")
      .reduce((s, w) => s + Number(w.amount), 0);
    const pendingWithdrawals = withdrawals
      .filter(
        (w) => w.status === "pending" || w.status === "under_review" || w.status === "approved",
      )
      .reduce((s, w) => s + Number(w.amount), 0);

    const activeInvestmentsTotal = investments
      .filter((i) => i.status === "active")
      .reduce((s, i) => s + Number(i.amount), 0);
    const totalDailyEarning = investments
      .filter((i) => i.status === "active")
      .reduce((s, i) => s + Number(i.daily_earning), 0);
    const totalEarned = investments.reduce((s, i) => s + Number(i.total_earned ?? 0), 0);

    return {
      profile,
      wallet,
      referrer: referrerProfile,
      summary: {
        totalDeposits,
        pendingDeposits,
        totalWithdrawals,
        pendingWithdrawals,
        activeInvestmentsTotal,
        totalDailyEarning,
        totalEarned,
      },
      investments,
      deposits,
      withdrawals,
      transactions,
      commissions,
    };
  });

export const adminListPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await guard(context as unknown as Ctx, "plans");
    const { data } = await supabaseAdmin
      .from("investment_plans")
      .select("*")
      .order("display_order");
    return (data ?? []).map((p) => ({
      ...p,
      duration_days: p.duration_days === 30 ? 60 : p.duration_days,
    }));
  });

const planSchema = z.object({
  id: z.string().uuid().nullable(),
  name: z.string().min(2).max(60),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().max(600),
  investment_amount: z.number().nonnegative(),
  min_investment: z.number().nonnegative(),
  max_investment: z.number().nonnegative(),
  daily_earning: z.number().nonnegative(),
  duration_days: z.number().int().positive(),
  fees: z.number().nonnegative(),
  risk_level: z.string().max(30),
  terms: z.string().max(3000),
  disclosure: z.string().max(3000),
  status: z.enum(["active", "disabled", "archived"]),
  featured: z.boolean(),
  display_order: z.number().int(),
});

export const adminSavePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => planSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await guard(context as unknown as Ctx, "plans");
    const { id, ...fields } = data;
    if (id) {
      const { data: before } = await supabaseAdmin
        .from("investment_plans")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      const { error } = await supabaseAdmin
        .from("investment_plans")
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return { ok: false as const, message: "The plan could not be saved." };
      await log(context.userId, "plan_edited", "plan", id, { before, after: fields });
    } else {
      const { data: created, error } = await supabaseAdmin
        .from("investment_plans")
        .insert(fields)
        .select("id")
        .single();
      if (error) return { ok: false as const, message: "The plan could not be created." };
      await log(context.userId, "plan_created", "plan", created.id, { after: fields });
    }
    return { ok: true as const };
  });

export const adminListInvestments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await guard(context as unknown as Ctx, "investments");
    const [invRes, pendingRes] = await Promise.all([
      supabaseAdmin
        .from("investments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300),
      supabaseAdmin
        .from("deposits")
        .select("*")
        .not("plan_id", "is", null)
        .eq("status", "pending_verification")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    const data = invRes.data ?? [];
    const pending = pendingRes.data ?? [];

    const ids = [...new Set([...data.map((i) => i.user_id), ...pending.map((p) => p.user_id)])];
    const { data: people } = ids.length
      ? await supabaseAdmin.from("profiles").select("id,full_name,email,phone").in("id", ids)
      : { data: [] };
    const map = new Map((people ?? []).map((p) => [p.id, p]));

    const planIds = [...new Set(pending.map((p) => p.plan_id).filter(Boolean))];
    const { data: plans } = planIds.length
      ? await supabaseAdmin
          .from("investment_plans")
          .select("id,name,duration_days,daily_earning,investment_amount,currency")
          .in("id", planIds)
      : { data: [] };
    const planMap = new Map((plans ?? []).map((p) => [p.id, p]));

    const pendingWithProof = await Promise.all(
      pending.map(async (p) => {
        let screenshot_url: string | null = null;
        if (p.screenshot_path) {
          if (p.screenshot_path.startsWith("data:") || p.screenshot_path.startsWith("http")) {
            screenshot_url = p.screenshot_path;
          } else {
            try {
              const { data: signed } = await supabaseAdmin.storage
                .from("payment-proofs")
                .createSignedUrl(p.screenshot_path, 86400);
              screenshot_url = signed?.signedUrl ?? null;
            } catch {
              screenshot_url = null;
            }
          }
        }
        return {
          ...p,
          user: map.get(p.user_id) ?? null,
          plan: p.plan_id ? (planMap.get(p.plan_id) ?? null) : null,
          screenshot_url,
        };
      }),
    );

    return {
      investments: (data ?? []).map((i) => ({ ...i, user: map.get(i.user_id) ?? null })),
      pendingActivations: pendingWithProof,
    };
  });

export const adminListTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await guard(context as unknown as Ctx, "transactions");
    const { data } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    const ids = [...new Set((data ?? []).map((d) => d.user_id))];
    const { data: people } = ids.length
      ? await supabaseAdmin.from("profiles").select("id,full_name,email").in("id", ids)
      : { data: [] };
    const map = new Map((people ?? []).map((p) => [p.id, p]));
    return (data ?? []).map((t) => ({ ...t, user: map.get(t.user_id) ?? null }));
  });

export const adminSendNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { title: string; message: string; link: string; group: string }) =>
    z
      .object({
        title: z.string().min(2).max(140),
        message: z.string().min(2).max(2000),
        link: z.string().max(200),
        group: z.enum(["all", "active_investors", "pending_deposits", "pending_withdrawals"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await guard(context as unknown as Ctx, "notifications");
    let ids: string[] = [];
    if (data.group === "all") {
      const { data: rows } = await supabaseAdmin.from("profiles").select("id");
      ids = (rows ?? []).map((r) => r.id);
    } else if (data.group === "active_investors") {
      const { data: rows } = await supabaseAdmin
        .from("investments")
        .select("user_id")
        .eq("status", "active");
      ids = [...new Set((rows ?? []).map((r) => r.user_id))];
    } else if (data.group === "pending_deposits") {
      const { data: rows } = await supabaseAdmin
        .from("deposits")
        .select("user_id")
        .eq("status", "pending_verification");
      ids = [...new Set((rows ?? []).map((r) => r.user_id))];
    } else {
      const { data: rows } = await supabaseAdmin
        .from("withdrawals")
        .select("user_id")
        .eq("status", "pending");
      ids = [...new Set((rows ?? []).map((r) => r.user_id))];
    }
    if (!ids.length) return { ok: false as const, message: "No users match that group." };
    await supabaseAdmin.from("notifications").insert(
      ids.map((id) => ({
        user_id: id,
        title: data.title,
        message: data.message,
        link: data.link || null,
      })),
    );
    await log(context.userId, "notification_sent", "group", null, {
      group: data.group,
      recipients: ids.length,
    });
    return { ok: true as const, recipients: ids.length };
  });

export const adminGetSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await guard(context as unknown as Ctx, "settings");
    const { data } = await supabaseAdmin.from("app_settings").select("key,value");
    const config: Record<string, Record<string, string | number | boolean | null>> = {};
    for (const s of data ?? [])
      config[s.key] = (s.value ?? {}) as Record<string, string | number | boolean | null>;
    return config;
  });

export const adminSaveSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { key: string; value: Record<string, string | number | boolean | null> }) =>
    z
      .object({
        key: z.string().min(2).max(40),
        value: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await guard(context as unknown as Ctx, "settings");
    const { data: before } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", data.key)
      .maybeSingle();
    const { error } = await supabaseAdmin
      .from("app_settings")
      .update({ value: data.value as never, updated_at: new Date().toISOString() })
      .eq("key", data.key);
    if (error) return { ok: false as const, message: "Settings could not be saved." };
    await log(context.userId, "settings_updated", "setting", null, {
      key: data.key,
      before: before?.value,
    });
    return { ok: true as const };
  });

export const adminGetContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await guard(context as unknown as Ctx, "content");
    const { data } = await supabaseAdmin
      .from("content_pages")
      .select("slug,title,body")
      .order("slug");
    return (data ?? []).map((p) => ({
      slug: p.slug,
      title: p.title,
      body: (p.body ?? {}) as Record<string, string>,
    }));
  });

export const adminSaveContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { slug: string; title: string; body: Record<string, string> }) =>
    z
      .object({
        slug: z.string().min(1).max(60),
        title: z.string().min(1).max(140),
        body: z.record(z.string()),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await guard(context as unknown as Ctx, "content");
    const { error } = await supabaseAdmin.from("content_pages").upsert({
      slug: data.slug,
      title: data.title,
      body: data.body as never,
      updated_at: new Date().toISOString(),
    });
    if (error) return { ok: false as const, message: "The page could not be saved." };
    await log(context.userId, "content_updated", "page", null, { slug: data.slug });
    return { ok: true as const };
  });

export const adminListLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await guard(context as unknown as Ctx, "logs");
    const { data } = await supabaseAdmin
      .from("admin_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    const ids = [...new Set((data ?? []).map((d) => d.admin_id))];
    const { data: people } = ids.length
      ? await supabaseAdmin.from("profiles").select("id,full_name,email").in("id", ids)
      : { data: [] };
    const map = new Map((people ?? []).map((p) => [p.id, p]));
    return (data ?? []).map((l) => ({ ...l, admin: map.get(l.admin_id) ?? null }));
  });

export const adminListTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await guard(context as unknown as Ctx, "support");
    const { data: tickets } = await supabaseAdmin
      .from("support_tickets")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(200);
    const ids = (tickets ?? []).map((t) => t.id);
    const userIds = [...new Set((tickets ?? []).map((t) => t.user_id))];
    const [{ data: messages }, { data: people }] = await Promise.all([
      ids.length
        ? supabaseAdmin
            .from("support_messages")
            .select("*")
            .in("ticket_id", ids)
            .order("created_at")
        : Promise.resolve({ data: [] }),
      userIds.length
        ? supabaseAdmin.from("profiles").select("id,full_name,email").in("id", userIds)
        : Promise.resolve({ data: [] }),
    ]);
    const map = new Map((people ?? []).map((p) => [p.id, p]));
    return {
      tickets: (tickets ?? []).map((t) => ({ ...t, user: map.get(t.user_id) ?? null })),
      messages: messages ?? [],
    };
  });

export const adminReplyTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ticketId: string; message: string; status: string }) =>
    z
      .object({
        ticketId: z.string().uuid(),
        message: z.string().max(4000),
        status: z.enum(["open", "in_progress", "waiting_user", "resolved", "closed"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await guard(context as unknown as Ctx, "support");
    if (data.message.trim()) {
      await supabaseAdmin.from("support_messages").insert({
        ticket_id: data.ticketId,
        sender_id: context.userId,
        is_admin: true,
        message: data.message,
      });
    }
    await supabaseAdmin
      .from("support_tickets")
      .update({ status: data.status as never, updated_at: new Date().toISOString() })
      .eq("id", data.ticketId);
    const { data: ticket } = await supabaseAdmin
      .from("support_tickets")
      .select("user_id,subject")
      .eq("id", data.ticketId)
      .maybeSingle();
    if (ticket && data.message.trim()) {
      await supabaseAdmin.rpc("fn_notify", {
        p_user: ticket.user_id,
        p_title: "Support reply",
        p_message: `FINORA support replied to "${ticket.subject}".`,
        p_link: "/support",
      });
    }
    await log(context.userId, "support_updated", "ticket", data.ticketId, { status: data.status });
    return { ok: true as const };
  });

export const adminListReferrals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await guard(context as unknown as Ctx, "referrals");
    const [{ data: commissions }, { data: people }] = await Promise.all([
      supabaseAdmin
        .from("referral_commissions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300),
      supabaseAdmin.from("profiles").select("id,full_name,email,referred_by,referral_code"),
    ]);
    const map = new Map((people ?? []).map((p) => [p.id, p]));
    return {
      commissions: (commissions ?? []).map((c) => ({
        ...c,
        referrer: map.get(c.referrer_id) ?? null,
        referred: map.get(c.referred_id) ?? null,
      })),
      topReferrers: (people ?? [])
        .map((p) => ({
          id: p.id,
          name: p.full_name,
          code: p.referral_code,
          count: (people ?? []).filter((x) => x.referred_by === p.id).length,
        }))
        .filter((p) => p.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    };
  });

/**
 * One-time bootstrap: the first signed-in user may claim super_admin, but only
 * while no administrator exists at all. Once any role row exists this always fails.
 */
export const claimSuperAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true });
    if ((count ?? 0) > 0)
      return { ok: false as const, message: "An administrator already exists." };
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "super_admin" });
    if (error) return { ok: false as const, message: "The role could not be granted." };
    await log(context.userId, "super_admin_claimed", "user", context.userId, {});
    return { ok: true as const };
  });

export const adminHasAnyAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true });
  return { exists: (count ?? 0) > 0 };
});

const verifyAdminSchema = z.object({
  username: z.string().trim(),
});

export const verifyAdminUsername = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => verifyAdminSchema.parse(d))
  .handler(async ({ data, context }) => {
    const entered = data.username.toLowerCase();
    const REQUIRED_USERNAME = "umairi455";

    if (entered !== REQUIRED_USERNAME) {
      return {
        ok: false as const,
        message: "Invalid administrator username. Access denied.",
      };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existingRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);

    const hasAdmin = (existingRoles ?? []).some((r) => r.role === "super_admin");
    if (!hasAdmin) {
      await supabaseAdmin.from("user_roles").insert({
        user_id: context.userId,
        role: "super_admin",
      });
      await log(context.userId, "admin_security_verified", "user", context.userId, {
        username: REQUIRED_USERNAME,
      });
    }

    return {
      ok: true as const,
      username: REQUIRED_USERNAME,
    };
  });

export const adminGlobalSearch = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { q: string }) => z.object({ q: z.string().trim() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await guard(context as unknown as Ctx, "dashboard");
    const raw = data.q.trim();
    if (!raw) {
      return { users: [], deposits: [], transactions: [], withdrawals: [] };
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw);

    const [usersRes, depositsRes, transactionsRes, withdrawalsRes] = await Promise.all([
      (async () => {
        try {
          let q = supabaseAdmin
            .from("profiles")
            .select("id,full_name,email,phone,referral_code,status");
          if (isUuid) {
            q = q.eq("id", raw);
          } else {
            q = q.or(
              `full_name.ilike.%${raw}%,email.ilike.%${raw}%,referral_code.ilike.%${raw}%,phone.ilike.%${raw}%`,
            );
          }
          const { data: rows } = await q.limit(5);
          return rows ?? [];
        } catch {
          return [];
        }
      })(),

      (async () => {
        try {
          let q = supabaseAdmin
            .from("deposits")
            .select("id,user_id,amount,status,payment_method,external_txn_id,created_at");
          if (isUuid) {
            q = q.or(`id.eq.${raw},user_id.eq.${raw}`);
          } else {
            q = q.or(`external_txn_id.ilike.%${raw}%,payment_method.ilike.%${raw}%`);
          }
          const { data: rows } = await q.order("created_at", { ascending: false }).limit(5);
          return rows ?? [];
        } catch {
          return [];
        }
      })(),

      (async () => {
        try {
          let q = supabaseAdmin
            .from("transactions")
            .select("id,user_id,reference,type,amount,status,description,created_at");
          if (isUuid) {
            q = q.or(`id.eq.${raw},user_id.eq.${raw}`);
          } else {
            q = q.or(`reference.ilike.%${raw}%,description.ilike.%${raw}%`);
          }
          const { data: rows } = await q.order("created_at", { ascending: false }).limit(5);
          return rows ?? [];
        } catch {
          return [];
        }
      })(),

      (async () => {
        try {
          let q = supabaseAdmin
            .from("withdrawals")
            .select(
              "id,user_id,amount,net_amount,status,method,account_title,account_number,bank_name,created_at",
            );
          if (isUuid) {
            q = q.or(`id.eq.${raw},user_id.eq.${raw}`);
          } else {
            q = q.or(
              `account_title.ilike.%${raw}%,account_number.ilike.%${raw}%,method.ilike.%${raw}%`,
            );
          }
          const { data: rows } = await q.order("created_at", { ascending: false }).limit(5);
          return rows ?? [];
        } catch {
          return [];
        }
      })(),
    ]);

    return {
      users: usersRes,
      deposits: depositsRes,
      transactions: transactionsRes,
      withdrawals: withdrawalsRes,
    };
  });
