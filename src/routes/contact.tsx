import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Mail, Clock, MessageSquare } from "lucide-react";
import { PublicLayout } from "@/components/finora/public-layout";
import { siteContentQuery } from "@/components/finora/legal-page";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact FINORA" },
      {
        name: "description",
        content: "Reach the FINORA support team by email or through an in-app support ticket.",
      },
      { property: "og:title", content: "Contact FINORA" },
      {
        property: "og:description",
        content: "Email us or open a support ticket from your dashboard.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { data } = useQuery(siteContentQuery);
  const contact = data?.config["contact"] ?? {};
  const email = String(contact["email"] ?? "support@finora.app");
  const hours = String(contact["hours"] ?? "Monday to Saturday, 9:00 – 18:00 PKT");

  return (
    <PublicLayout>
      <section className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6">
        <p className="text-accent text-xs font-semibold tracking-[0.2em] uppercase">Contact</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Talk to the FINORA team</h1>
        <p className="text-muted-foreground mt-3 max-w-xl text-sm leading-relaxed">
          Account holders get the fastest response through a support ticket — it arrives with your
          account context attached and every reply is recorded on your account.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          <div className="surface-card p-6">
            <Mail className="text-accent h-5 w-5" />
            <h2 className="mt-4 text-sm font-semibold">Email</h2>
            <a
              href={`mailto:${email}`}
              className="text-muted-foreground mt-1 block text-sm hover:underline"
            >
              {email}
            </a>
          </div>
          <div className="surface-card p-6">
            <Clock className="text-accent h-5 w-5" />
            <h2 className="mt-4 text-sm font-semibold">Support hours</h2>
            <p className="text-muted-foreground mt-1 text-sm">{hours}</p>
          </div>
          <div className="surface-card p-6">
            <MessageSquare className="text-accent h-5 w-5" />
            <h2 className="mt-4 text-sm font-semibold">Support tickets</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Tracked end to end inside your account.
            </p>
          </div>
        </div>

        <div className="surface-card mt-8 flex flex-wrap items-center justify-between gap-4 p-7">
          <div>
            <p className="font-semibold">Already have an account?</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Open a ticket and track the response in your dashboard.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Create account</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
