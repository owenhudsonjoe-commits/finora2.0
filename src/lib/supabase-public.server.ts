import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** Publishable-key client for public, read-only server-side reads. */
export function getPublicClient() {
  const DEFAULT_URL = "https://vtkgickgpqvugzolkwdk.supabase.co";
  const DEFAULT_KEY = "sb_publishable_VqWwr7tRQ5dLzF2CZYiVmg_ZyWlYOcO";

  const url =
    process.env["SUPABASE_URL"] ||
    process.env["VITE_SUPABASE_URL"] ||
    import.meta.env?.["VITE_SUPABASE_URL"] ||
    DEFAULT_URL;
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ||
    process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
    import.meta.env?.["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
    DEFAULT_KEY;

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
          h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}
