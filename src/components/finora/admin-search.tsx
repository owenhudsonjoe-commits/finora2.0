import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Search,
  Users,
  ArrowDownToLine,
  Receipt,
  ArrowUpFromLine,
  X,
  Loader2,
  ExternalLink,
  ChevronRight,
  Shield,
  Clock,
} from "lucide-react";
import { adminGlobalSearch } from "@/lib/admin.functions";
import { money, dateTime } from "@/lib/format";
import { StatusBadge } from "@/components/finora/primitives";
import { cn } from "@/lib/utils";

export function AdminGlobalSearch({ className }: { className?: string }) {
  const navigate = useNavigate();
  const searchFn = useServerFn(adminGlobalSearch);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce user input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Global hotkey: Cmd+K / Ctrl+K to focus search input
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin-global-search", debouncedQuery],
    queryFn: () => searchFn({ data: { q: debouncedQuery } }),
    enabled: debouncedQuery.length >= 2,
    staleTime: 10_000,
  });

  const users = data?.users ?? [];
  const deposits = data?.deposits ?? [];
  const transactions = data?.transactions ?? [];
  const withdrawals = data?.withdrawals ?? [];

  const totalResults = users.length + deposits.length + transactions.length + withdrawals.length;

  const handleSelect = (url: string) => {
    setIsOpen(false);
    navigate({ to: url });
  };

  return (
    <div ref={containerRef} className={cn("relative w-full max-w-md", className)}>
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search users, txns, or deposits by ID or name…"
          className="h-9 w-full rounded-lg border border-border/80 bg-background/80 pl-9 pr-14 text-xs text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus:bg-background focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all sm:text-sm"
          aria-label="Global administrator search"
        />

        <div className="absolute right-2.5 flex items-center gap-1.5">
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setDebouncedQuery("");
                inputRef.current?.focus();
              }}
              className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear search query"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd className="hidden rounded border border-border/80 bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
              ⌘K
            </kbd>
          )}

          {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />}
        </div>
      </div>

      {/* SEARCH RESULTS DROPDOWN */}
      {isOpen && debouncedQuery.length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-[460px] overflow-y-auto rounded-xl border border-border/80 bg-popover p-2 text-popover-foreground shadow-2xl backdrop-blur">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 p-6 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
              <span>Searching platform database…</span>
            </div>
          ) : totalResults === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              <p className="font-medium text-foreground">
                No matches found for &ldquo;{debouncedQuery}&rdquo;
              </p>
              <p className="mt-1 text-[11px]">
                Search by member name, email, phone, deposit Txn ID, or ledger reference (e.g.
                FIN-XXXX).
              </p>
            </div>
          ) : (
            <div className="space-y-3 p-1">
              {/* USERS RESULTS */}
              {users.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-emerald-500" />
                      Users & Members ({users.length})
                    </span>
                    <Link
                      to="/admin/users"
                      onClick={() => setIsOpen(false)}
                      className="text-[10px] font-normal lowercase text-emerald-500 hover:underline"
                    >
                      view all
                    </Link>
                  </div>
                  <div className="space-y-1">
                    {users.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleSelect("/admin/users")}
                        className="flex w-full items-center justify-between rounded-lg p-2 text-left text-xs transition-colors hover:bg-muted/80"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground truncate">
                            {u.full_name || "Unnamed member"}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {u.email} {u.phone ? `· ${u.phone}` : ""} · Ref: {u.referral_code}
                          </p>
                        </div>
                        <div className="ml-2 flex items-center gap-1.5 shrink-0">
                          <StatusBadge status={u.status} />
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-60" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* DEPOSITS RESULTS */}
              {deposits.length > 0 && (
                <div className="border-t border-border/60 pt-2">
                  <div className="flex items-center justify-between px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <ArrowDownToLine className="h-3.5 w-3.5 text-blue-500" />
                      Deposits ({deposits.length})
                    </span>
                    <Link
                      to="/admin/deposits"
                      onClick={() => setIsOpen(false)}
                      className="text-[10px] font-normal lowercase text-emerald-500 hover:underline"
                    >
                      view all
                    </Link>
                  </div>
                  <div className="space-y-1">
                    {deposits.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => handleSelect("/admin/deposits")}
                        className="flex w-full items-center justify-between rounded-lg p-2 text-left text-xs transition-colors hover:bg-muted/80"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground">
                            {money(d.amount)}
                            <span className="ml-2 font-normal text-muted-foreground">
                              via {d.payment_method || "Payment"}
                            </span>
                          </p>
                          <p className="font-mono text-[10px] text-muted-foreground truncate">
                            Txn ID: {d.external_txn_id || d.id.slice(0, 8)} ·{" "}
                            {dateTime(d.created_at)}
                          </p>
                        </div>
                        <div className="ml-2 flex items-center gap-1.5 shrink-0">
                          <StatusBadge status={d.status} />
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-60" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TRANSACTIONS / LEDGER RESULTS */}
              {transactions.length > 0 && (
                <div className="border-t border-border/60 pt-2">
                  <div className="flex items-center justify-between px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Receipt className="h-3.5 w-3.5 text-purple-500" />
                      Transactions ({transactions.length})
                    </span>
                    <Link
                      to="/admin/transactions"
                      onClick={() => setIsOpen(false)}
                      className="text-[10px] font-normal lowercase text-emerald-500 hover:underline"
                    >
                      view all
                    </Link>
                  </div>
                  <div className="space-y-1">
                    {transactions.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleSelect("/admin/transactions")}
                        className="flex w-full items-center justify-between rounded-lg p-2 text-left text-xs transition-colors hover:bg-muted/80"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground">
                            <span className="font-mono text-emerald-400 font-semibold mr-1.5">
                              {t.reference}
                            </span>
                            {money(t.amount)} ({t.type})
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {t.description || "Ledger entry"} · {dateTime(t.created_at)}
                          </p>
                        </div>
                        <div className="ml-2 flex items-center gap-1.5 shrink-0">
                          <StatusBadge status={t.status} />
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-60" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* WITHDRAWALS RESULTS */}
              {withdrawals.length > 0 && (
                <div className="border-t border-border/60 pt-2">
                  <div className="flex items-center justify-between px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <ArrowUpFromLine className="h-3.5 w-3.5 text-amber-500" />
                      Withdrawals ({withdrawals.length})
                    </span>
                    <Link
                      to="/admin/withdrawals"
                      onClick={() => setIsOpen(false)}
                      className="text-[10px] font-normal lowercase text-emerald-500 hover:underline"
                    >
                      view all
                    </Link>
                  </div>
                  <div className="space-y-1">
                    {withdrawals.map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => handleSelect("/admin/withdrawals")}
                        className="flex w-full items-center justify-between rounded-lg p-2 text-left text-xs transition-colors hover:bg-muted/80"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground">
                            {money(w.net_amount || w.amount)}
                            <span className="ml-2 font-normal text-muted-foreground">
                              via {w.method}
                            </span>
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {w.account_title} · {w.account_number}{" "}
                            {w.bank_name ? `(${w.bank_name})` : ""}
                          </p>
                        </div>
                        <div className="ml-2 flex items-center gap-1.5 shrink-0">
                          <StatusBadge status={w.status} />
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-60" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
