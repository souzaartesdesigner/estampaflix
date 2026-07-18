import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { LayoutDashboard, Palette, Tag, FolderOpen, Users, ShoppingBag, FileText, MessageCircle, CreditCard, Upload, TicketPercent, BarChart3 } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const user = (context as any).user;
    if (!user) throw redirect({ to: "/auth" });
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
    if (!data || data.length === 0) throw redirect({ to: "/minha-conta" });
  },
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },

  { to: "/admin/artes", label: "Artes", icon: Palette },
  { to: "/admin/importar", label: "Importar CSV", icon: Upload },
  { to: "/admin/categorias", label: "Categorias", icon: FolderOpen },
  { to: "/admin/tags", label: "Tags", icon: Tag },
  { to: "/admin/cupons", label: "Cupons", icon: TicketPercent },
  { to: "/admin/usuarios", label: "Usuários", icon: Users },
  { to: "/admin/vendas", label: "Vendas", icon: ShoppingBag },
  { to: "/admin/planos", label: "Planos", icon: CreditCard },
  { to: "/admin/blog", label: "Blog", icon: FileText },
  { to: "/admin/suporte", label: "Suporte", icon: MessageCircle },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-8">
        <aside className="w-56 shrink-0">
          <div className="sticky top-24 rounded-xl border border-border/60 bg-card p-2">
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Painel Admin</div>
            <nav className="mt-1 flex flex-col gap-0.5">
              {NAV.map((item) => {
                const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
                const Icon = item.icon;
                return (
                  <Link key={item.to} to={item.to} className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                    <Icon className="h-4 w-4" /> {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>
        <main className="min-w-0 flex-1"><Outlet /></main>
      </div>
    </div>
  );
}
