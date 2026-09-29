import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/finora/protected-route";
import { AdminSecurityGate } from "@/components/finora/admin-security-gate";

export const Route = createFileRoute("/_authenticated/admin")({
  component: () => (
    <ProtectedRoute requiredRole="admin" fallbackToAdmin={true}>
      <AdminSecurityGate>
        <Outlet />
      </AdminSecurityGate>
    </ProtectedRoute>
  ),
});
