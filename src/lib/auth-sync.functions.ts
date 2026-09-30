import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

function code(seed: string) {
  return ("FIN" + seed.replace(/-/g, "").slice(0, 6)).toUpperCase();
}

const ensureProfileInputSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().default(""),
  phone: z.string().nullable().optional(),
  referralCode: z.string().nullable().optional(),
});

/**
 * Ensures that a profile, wallet, and initial welcome notification
 * exist immediately in Supabase when a user signs up.
 * Operates with supabaseAdmin so that even if email confirmation is required,
 * the profile record is reliably created in public.profiles and is instantly
 * visible to the Admin Control Center.
 */
export const registerUserRecord = createServerFn({ method: "POST" })
  .validator((d: unknown) => ensureProfileInputSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId, email, fullName, phone, referralCode } = data;

    // Check if profile exists already
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id, referral_code, status")
      .eq("id", userId)
      .maybeSingle();

    if (existing) {
      return { ok: true, created: false, referralCode: existing.referral_code };
    }

    let referredBy: string | null = null;
    const invite = (referralCode ?? "").trim().toUpperCase();
    if (invite) {
      const { data: ref } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("referral_code", invite)
        .maybeSingle();
      referredBy = ref?.id ?? null;
    }

    const generatedRefCode = code(userId);

    // Default account status: pending
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
      {
        id: userId,
        full_name: fullName.trim() || email.split("@")[0],
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        referral_code: generatedRefCode,
        referred_by: referredBy,
        status: "pending",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    if (profileError) {
      console.error("[registerUserRecord] Profile insertion error:", profileError);
    }

    // Ensure wallet exists
    const { error: walletError } = await supabaseAdmin.from("wallets").upsert(
      {
        user_id: userId,
        available: 0,
        pending: 0,
        invested: 0,
        total_earnings: 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (walletError) {
      console.error("[registerUserRecord] Wallet creation error:", walletError);
    }

    // Welcome notification
    try {
      await supabaseAdmin.from("notifications").insert({
        user_id: userId,
        title: "Welcome to FINORA",
        message: "Your registration has been received and is awaiting administrator verification.",
        link: "/dashboard",
      });
    } catch {
      // Non-blocking
    }

    // Log registration
    try {
      await supabaseAdmin.from("admin_logs").insert({
        admin_id: userId,
        action: "user_registered",
        target_type: "user",
        target_id: userId,
        metadata: {
          email,
          fullName,
          phone,
          referredBy,
        },
      });
    } catch {
      // Non-blocking
    }

    return {
      ok: true,
      created: true,
      referralCode: generatedRefCode,
    };
  });
