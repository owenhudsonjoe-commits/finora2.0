import { useState, useEffect, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export type ProtectedRouteProps = {
  children: ReactNode;
  /** Role required to access this route, e.g. "admin", "super_admin", or "user" */
  requiredRole?: "admin" | "super_admin" | "user" | string;
  /** Array of permitted roles */
  allowRoles?: string[];
  /** Custom destination when unauthorized */
  redirectTo?: string;
  /** If true, unauthenticated or admin-targeted requests redirect to /admin instead of /login */
  fallbackToAdmin?: boolean;
};

function checkIsAdminGateUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const val =
      sessionStorage.getItem("finora_admin_gate_unlocked") ||
      localStorage.getItem("finora_admin_gate_unlocked");
    return !!val && val.toLowerCase() === "umairi455";
  } catch {
    return false;
  }
}

export function useAuthRole() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function evaluateRoles() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (!isMounted) return;

        const currentUser = authData?.user ?? null;
        setUser(currentUser);

        if (!currentUser) {
          const isPasscodeUnlocked = checkIsAdminGateUnlocked();
          if (isPasscodeUnlocked) {
            setRoles(["admin", "super_admin"]);
            setIsAdmin(true);
          } else {
            setRoles([]);
            setIsAdmin(false);
          }
          setLoading(false);
          return;
        }

        const roleSet = new Set<string>();

        // 1. Read app_metadata & user_metadata from session
        const appRole = currentUser.app_metadata?.role;
        const appRoles = currentUser.app_metadata?.roles;
        const userRole = currentUser.user_metadata?.role;
        const isMetadataAdmin = currentUser.user_metadata?.is_admin === true;

        if (typeof appRole === "string") roleSet.add(appRole.toLowerCase());
        if (Array.isArray(appRoles)) {
          appRoles.forEach((r) => typeof r === "string" && roleSet.add(r.toLowerCase()));
        }
        if (typeof userRole === "string") roleSet.add(userRole.toLowerCase());
        if (isMetadataAdmin) roleSet.add("admin");

        // 2. Read admin passcode verification from session/local storage
        if (checkIsAdminGateUnlocked()) {
          roleSet.add("admin");
          roleSet.add("super_admin");
        }

        // 3. Known platform administrator email check
        if (currentUser.email?.toLowerCase() === "umairhayat881@gmail.com") {
          roleSet.add("admin");
          roleSet.add("super_admin");
        }

        // 4. Query user_roles table in Supabase
        try {
          const { data: dbRoleRows } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", currentUser.id);

          if (dbRoleRows && Array.isArray(dbRoleRows)) {
            dbRoleRows.forEach((r: { role: string }) => {
              if (r?.role) roleSet.add(r.role.toLowerCase());
            });
          }
        } catch {
          // Database query fallback
        }

        const resolvedRoles = Array.from(roleSet);
        const hasAdminRole = resolvedRoles.some((r) =>
          ["admin", "super_admin", "finance_admin", "operations_admin", "support_admin"].includes(
            r,
          ),
        );

        if (hasAdminRole && !resolvedRoles.includes("admin")) {
          resolvedRoles.push("admin");
        }

        if (isMounted) {
          setRoles(resolvedRoles);
          setIsAdmin(hasAdminRole);
        }
      } catch (err) {
        console.error("[ProtectedRoute] Error checking session roles:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    evaluateRoles();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      evaluateRoles();
    });

    return () => {
      isMounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  return { user, roles, isAdmin, loading };
}

/**
 * ProtectedRoute: Inspects user authentication and roles from the active auth session.
 * Specifically checks for the 'admin' role to redirect requests to /admin correctly
 * instead of defaulting to the consumer /login page.
 */
export function ProtectedRoute({
  children,
  requiredRole,
  allowRoles,
  redirectTo,
  fallbackToAdmin,
}: ProtectedRouteProps) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, roles, isAdmin, loading } = useAuthRole();

  const isAdminRoute =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    requiredRole === "admin" ||
    requiredRole === "super_admin" ||
    fallbackToAdmin === true;

  useEffect(() => {
    if (loading) return;

    // CASE 1: Unauthenticated user
    if (!user) {
      if (isAdminRoute) {
        // If gate is already unlocked via passcode, allow access to all admin subpaths
        const isGateUnlocked = checkIsAdminGateUnlocked();

        if (!isGateUnlocked && pathname !== "/admin") {
          navigate({ to: "/admin" });
        }
        return;
      }

      // Default consumer protected route goes to /login with redirect
      navigate({
        to: redirectTo || "/login",
        search: { redirect: pathname },
      });
      return;
    }

    // CASE 2: Authenticated user accessing an admin-protected route
    if (requiredRole === "admin" || requiredRole === "super_admin") {
      if (!isAdmin) {
        const isGateUnlocked = checkIsAdminGateUnlocked();

        if (!isGateUnlocked && pathname !== "/admin") {
          navigate({ to: "/admin" });
        }
      }
      return;
    }

    // CASE 3: Authenticated user checking a specific role list
    if (allowRoles && allowRoles.length > 0) {
      const hasAllowedRole = allowRoles.some((r) => roles.includes(r.toLowerCase()));
      if (!hasAllowedRole) {
        if (allowRoles.includes("admin") || allowRoles.includes("super_admin")) {
          navigate({ to: "/admin" });
        } else {
          navigate({ to: redirectTo || "/dashboard" });
        }
      }
    }
  }, [
    loading,
    user,
    isAdmin,
    roles,
    isAdminRoute,
    requiredRole,
    allowRoles,
    redirectTo,
    pathname,
    navigate,
  ]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Verifying Authentication & Role Permissions…
          </span>
        </div>
      </div>
    );
  }

  // If unauthenticated on non-admin route, don't render children while redirecting
  if (!user && !isAdminRoute) {
    return null;
  }

  // If required role is admin and user is not admin, check if passcode gate is unlocked
  if ((requiredRole === "admin" || requiredRole === "super_admin") && !isAdmin) {
    const isGateUnlocked = checkIsAdminGateUnlocked();

    if (!isGateUnlocked && pathname !== "/admin") {
      return null;
    }
  }

  return <>{children}</>;
}
