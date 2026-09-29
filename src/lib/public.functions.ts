import { createServerFn } from "@tanstack/react-start";

export type PublicPlan = {
  id: string;
  name: string;
  slug: string;
  description: string;
  investment_amount: number;
  daily_earning: number;
  duration_days: number;
  currency: string;
  fees: number;
  risk_level: string;
  terms: string;
  disclosure: string;
  featured: boolean;
  display_order: number;
};

export const DEFAULT_PLANS: PublicPlan[] = [
  {
    id: "a2800c8e-1047-4f26-b695-7341bafe6098",
    name: "Starter",
    slug: "starter",
    description: "Entry-level allocation for first-time investors.",
    investment_amount: 2700,
    daily_earning: 300,
    duration_days: 60,
    currency: "PKR",
    fees: 0,
    risk_level: "Low",
    terms: "Daily returns are credited according to configured plan terms.",
    disclosure: "Returns reflect configured plan terms and are not guaranteed.",
    featured: false,
    display_order: 1,
  },
  {
    id: "c8d58ca8-83c7-498d-abd9-3ca4be93e42a",
    name: "Basic",
    slug: "basic",
    description: "A balanced allocation for steady portfolio growth.",
    investment_amount: 5400,
    daily_earning: 600,
    duration_days: 60,
    currency: "PKR",
    fees: 0,
    risk_level: "Low",
    terms: "Daily returns are credited according to configured plan terms.",
    disclosure: "Returns reflect configured plan terms and are not guaranteed.",
    featured: false,
    display_order: 2,
  },
  {
    id: "a2067d60-d799-4ab6-adf9-815209d3b976",
    name: "Growth",
    slug: "growth",
    description: "Scaled allocation designed for compounding growth.",
    investment_amount: 10800,
    daily_earning: 1200,
    duration_days: 60,
    currency: "PKR",
    fees: 0,
    risk_level: "Medium",
    terms: "Daily returns are credited according to configured plan terms.",
    disclosure: "Returns reflect configured plan terms and are not guaranteed.",
    featured: true,
    display_order: 3,
  },
  {
    id: "21265523-f81f-4e37-bcaa-da1aaaab6721",
    name: "Premium",
    slug: "premium",
    description: "Higher allocation tier with priority processing.",
    investment_amount: 21600,
    daily_earning: 2400,
    duration_days: 60,
    currency: "PKR",
    fees: 0,
    risk_level: "Medium",
    terms: "Daily returns are credited according to configured plan terms.",
    disclosure: "Returns reflect configured plan terms and are not guaranteed.",
    featured: false,
    display_order: 4,
  },
  {
    id: "b8fe2c40-462c-4b5c-807e-0ec9cdd11296",
    name: "Pro",
    slug: "pro",
    description: "Professional tier for experienced investors.",
    investment_amount: 43200,
    daily_earning: 4800,
    duration_days: 60,
    currency: "PKR",
    fees: 0,
    risk_level: "High",
    terms: "Daily returns are credited according to configured plan terms.",
    disclosure: "Returns reflect configured plan terms and are not guaranteed.",
    featured: false,
    display_order: 5,
  },
  {
    id: "8a462ffa-6c80-4966-ad86-b9622e0fc32b",
    name: "Elite",
    slug: "elite",
    description: "Maximum allocation tier with dedicated support.",
    investment_amount: 86400,
    daily_earning: 9600,
    duration_days: 60,
    currency: "PKR",
    fees: 0,
    risk_level: "High",
    terms: "Daily returns are credited according to configured plan terms.",
    disclosure: "Returns reflect configured plan terms and are not guaranteed.",
    featured: false,
    display_order: 6,
  },
];

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      console.warn(`[Timeout] Operation exceeded ${timeoutMs}ms, returning fallback.`);
      resolve(fallback);
    }, timeoutMs);
  });
  return Promise.race([
    promise.then((val) => {
      clearTimeout(timer);
      return val;
    }),
    timeoutPromise,
  ]);
}

export const getPublicPlans = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicPlan[]> => {
    try {
      const fetchPlans = async (): Promise<PublicPlan[]> => {
        const { getPublicClient } = await import("./supabase-public.server");
        const { data, error } = await getPublicClient()
          .from("investment_plans")
          .select(
            "id,name,slug,description,investment_amount,daily_earning,duration_days,currency,fees,risk_level,terms,disclosure,featured,display_order",
          )
          .eq("status", "active")
          .order("display_order");

        if (error || !data || data.length === 0) {
          return DEFAULT_PLANS;
        }

        return ((data ?? []) as unknown as PublicPlan[]).map((plan) => ({
          ...plan,
          duration_days: 60,
        }));
      };

      // Ensure response resolves well within serverless function execution budget (4s)
      return await withTimeout(fetchPlans(), 4000, DEFAULT_PLANS);
    } catch (err) {
      console.warn("Failed to fetch public plans, returning defaults:", err);
      return DEFAULT_PLANS;
    }
  },
);

export const getSiteContent = createServerFn({ method: "GET" }).handler(async () => {
  const fallback = {
    content: {} as Record<string, { title: string; body: Record<string, string> }>,
    config: {} as Record<string, Record<string, string | number | boolean | null>>,
  };
  try {
    const fetchContent = async () => {
      const { getPublicClient } = await import("./supabase-public.server");
      const client = getPublicClient();
      const [pages, settings] = await Promise.all([
        client.from("content_pages").select("slug,title,body"),
        client.from("app_settings").select("key,value").eq("is_public", true),
      ]);
      const content: Record<string, { title: string; body: Record<string, string> }> = {};
      for (const p of pages?.data ?? [])
        content[p.slug] = { title: p.title, body: (p.body ?? {}) as Record<string, string> };
      const config: Record<string, Record<string, string | number | boolean | null>> = {};
      for (const s of settings?.data ?? [])
        config[s.key] = (s.value ?? {}) as Record<string, string | number | boolean | null>;
      return { content, config };
    };

    return await withTimeout(fetchContent(), 4000, fallback);
  } catch (err) {
    console.warn("Failed to fetch site content, returning empty config:", err);
    return fallback;
  }
});
