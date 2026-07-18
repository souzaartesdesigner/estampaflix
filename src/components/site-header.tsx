import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, Search, ShieldCheck, ShoppingCart, Sparkles, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/hooks/use-cart";
import { useI18n } from "@/lib/i18n";
import { LangSwitcher } from "./lang-switcher";
import { NotificationsBell } from "./notifications-bell";


export function SiteHeader() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const NAV = [
    { to: "/", label: t("nav.home") },
    { to: "/catalogo", label: t("nav.catalog") },
    { to: "/planos", label: t("nav.plans") },
    { to: "/blog", label: t("nav.blog") },
    { to: "/suporte", label: t("nav.support") },
  ];
  const [user, setUser] = useState<{ email?: string | null } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [q, setQ] = useState("");

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const cart = useCart();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from("user_roles").select("role").eq("user_id", session.user.id).then(({ data }) => {
          setIsAdmin(!!data?.some((r) => r.role === "admin"));
        });
      } else {
        setIsAdmin(false);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        supabase.from("user_roles").select("role").eq("user_id", data.session.user.id).then(({ data }) => {
          setIsAdmin(!!data?.some((r) => r.role === "admin"));
        });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate({ to: "/catalogo", search: { q: q || undefined } as any });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-2 px-3 sm:h-16 sm:gap-4 sm:px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2 font-display text-base font-bold tracking-tight sm:gap-2.5 sm:text-lg">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-brand shadow-brand ring-1 ring-primary/30 sm:h-9 sm:w-9">
            <Sparkles className="h-4 w-4 text-brand-foreground" />
          </span>
          <span className="text-gradient-brand">EstampaHub</span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <form onSubmit={submitSearch} className="hidden flex-1 items-center md:flex">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("search.placeholder")}
              className="w-full rounded-full border border-border/60 bg-surface/50 py-2.5 pl-10 pr-4 text-sm outline-none ring-0 transition-all placeholder:text-muted-foreground/70 focus:border-primary/60 focus:bg-surface focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </form>


        <div className="ml-auto flex items-center gap-1">
          <LangSwitcher />
          {user && <NotificationsBell />}
          {user && (
            <Button asChild variant="ghost" size="icon" className="relative" aria-label={t("nav.cart")}>
              <Link to="/carrinho">
                <ShoppingCart className="h-5 w-5" />
                {cart.count > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {cart.count}
                  </span>
                )}
              </Link>
            </Button>
          )}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" /> <span className="hidden sm:inline">{user.email?.split("@")[0]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/minha-conta">{t("nav.myAccount")}</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/carrinho">{t("nav.cart")}</Link></DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin"><ShieldCheck className="mr-2 h-4 w-4" /> {t("nav.admin")}</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}><LogOut className="mr-2 h-4 w-4" /> {t("nav.signOut")}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/auth">{t("nav.signIn")}</Link>
              </Button>
              <Button asChild size="sm" className="bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-90">
                <Link to="/planos">{t("nav.subscribe")}</Link>
              </Button>
            </>
          )}


          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="mt-8 flex flex-col gap-1">
                {NAV.map((item) => (
                  <Link key={item.to} to={item.to} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
                    {item.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
