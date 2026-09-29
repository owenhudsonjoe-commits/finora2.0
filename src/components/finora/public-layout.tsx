import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { FinoraLogo } from "./logo";
import { ScrollToTop } from "./scroll-to-top";
import { Button } from "@/components/ui/button";
import { getSiteContent } from "@/lib/public.functions";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/plans", label: "Plans" },
  { to: "/about", label: "About" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
] as const;

const LEGAL = [
  { to: "/terms", label: "Terms & Conditions" },
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/risk-disclosure", label: "Risk Disclosure" },
] as const;

export function PublicLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { data } = useQuery({ queryKey: ["site-content"], queryFn: () => getSiteContent() });
  const branding = data?.config["branding"] ?? {};
  const contact = data?.config["contact"] ?? {};
  const footerName = String(branding["footer_name"] ?? "FINORA Financial Technologies");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-background/85 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="FINORA home">
            <FinoraLogo />
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
                activeProps={{ className: "text-foreground" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/signup">Create account</Link>
            </Button>
          </div>
          <button
            className="md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {open ? (
          <div className="border-t md:hidden">
            <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="py-2 text-sm"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/signup">Create account</Link>
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-primary text-primary-foreground mt-20">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
          <div className="md:col-span-2">
            <FinoraLogo
              markClassName="text-primary-foreground/10"
              wordClassName="text-primary-foreground"
            />
            <p className="text-primary-foreground/70 mt-4 max-w-sm text-sm leading-relaxed">
              FINORA is a technology-first investment platform built on transparent plan terms,
              verified deposit operations and a fully auditable financial ledger.
            </p>
            {contact["email"] ? (
              <p className="text-primary-foreground/70 mt-4 text-sm">{String(contact["email"])}</p>
            ) : null}
            {contact["hours"] ? (
              <p className="text-primary-foreground/50 mt-1 text-xs">{String(contact["hours"])}</p>
            ) : null}
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold tracking-[0.18em] uppercase">Platform</p>
            <ul className="space-y-2 text-sm">
              {NAV.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-primary-foreground/70 hover:text-primary-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold tracking-[0.18em] uppercase">Legal</p>
            <ul className="space-y-2 text-sm">
              {LEGAL.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-primary-foreground/70 hover:text-primary-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-primary-foreground/10 border-t">
          <div className="text-primary-foreground/50 mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-xs sm:px-6">
            <p>
              © {new Date().getFullYear()} {footerName}
            </p>
            <p>
              Investments carry risk. Returns reflect configured plan terms and are not guaranteed.
            </p>
          </div>
        </div>
      </footer>
      <ScrollToTop />
    </div>
  );
}
