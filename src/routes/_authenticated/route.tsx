import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "@/components/finora/protected-route";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // If accessing admin routes, let ProtectedRoute and AdminSecurityGate handle it directly
    // so administrators are never bounced to the customer login screen.
    if (location.pathname === "/admin" || location.pathname.startsWith("/admin/")) {
      return { user: null };
    }

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }
    return { user: data.user };
  },
  component: () => (
    <ProtectedRoute>
      <Outlet />
    </ProtectedRoute>
  ),
});
