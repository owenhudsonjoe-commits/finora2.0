import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { adminHasAnyAdmin, claimSuperAdmin } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { FinoraLogo } from "@/components/finora/logo";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/admin/setup")({
  head: () => ({
    meta: [
      { title: "Administrator setup — FINORA" },
      {
        name: "description",
        content: "One-time setup of the first FINORA platform administrator.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SetupPage,
});

function SetupPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const check = useServerFn(adminHasAnyAdmin);
  const claim = useServerFn(claimSuperAdmin);

  const { data, isLoading } = useQuery({ queryKey: ["admin-exists"], queryFn: () => check() });

  const mutation = useMutation({
    mutationFn: () => claim(),
    onSuccess: async (res) => {
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success("You are now the super administrator.");
      await queryClient.invalidateQueries();
      navigate({ to: "/admin" });
    },
    onError: () => toast.error("The role could not be granted."),
  });

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="surface-card w-full max-w-md p-8">
        <FinoraLogo className="mb-6" />
        <h1 className="text-lg font-semibold">Administrator setup</h1>
        {isLoading ? (
          <Skeleton className="mt-4 h-20 w-full" />
        ) : data?.exists ? (
          <>
            <p className="text-muted-foreground mt-2 text-sm">
              An administrator already exists for this platform. Ask an existing super administrator
              to grant you a role.
            </p>
            <Button asChild variant="outline" className="mt-6 w-full">
              <Link to="/dashboard">Back to dashboard</Link>
            </Button>
          </>
        ) : (
          <>
            <p className="text-muted-foreground mt-2 text-sm">
              No administrator exists yet. As the signed-in account, you can claim the super
              administrator role once. This action is recorded in the audit log and cannot be
              repeated.
            </p>
            <Button
              className="mt-6 w-full"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? "Granting…" : "Claim super administrator"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
