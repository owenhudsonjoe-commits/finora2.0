import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const verifyPasscodeSchema = z.object({
  passcode: z.string().trim(),
});

/**
 * Server-side verification of the secret administrator passcode.
 * This function does NOT require prior Supabase user sign-in.
 * It strictly validates against the master administrative passcode (default: 'umairi455').
 */
export const verifyAdminPasscodeOnly = createServerFn({ method: "POST" })
  .validator((d: unknown) => verifyPasscodeSchema.parse(d))
  .handler(async ({ data }) => {
    const entered = data.passcode.trim().toLowerCase();
    const REQUIRED_PASSCODE = "umairi455";

    if (entered !== REQUIRED_PASSCODE) {
      return {
        ok: false as const,
        message: "Incorrect security passcode. Access denied.",
      };
    }

    return {
      ok: true as const,
    };
  });
