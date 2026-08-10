import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { LayoutDashboard, Palette, Tag, FolderOpen, Users, ShoppingBag, FileText, MessageCircle, CreditCard, Upload, TicketPercent, BarChart3, Settings, Home, Image as ImageIcon, Mail, Star, Search } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const user = (context as any).user;
    if (!user) throw redirect({ to: "/auth" });
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
    if (!data || data.length === 0) throw redirect({ to: "/minha-conta", search: { tab: "profile" } });
  },
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/home", label: "Home", icon: Home },
  { to: "/admin/banners", label: "Banners", icon: ImageIcon },

  { to: "/admin/artes", label: "Artes", icon: Palette },
  { to: "/admin/importar", label: "Importar CSV", icon: Upload },
  { to: "/admin/categorias", label: "Categorias", icon: FolderOpen },
  { to: "/admin/tags", label: "Tags", icon: Tag },
  { to: "/admin/cupons", label: "Cupons", icon: TicketPercent },
  { to: "/admin/usuarios", label: "Usuários", icon: Users },
  { to: "/admin/vendas", label: "Vendas", icon: ShoppingBag },
  { to: "/admin/planos", label: "Planos", icon: CreditCard },
  { to: "/admin/blog", label: "Blog", icon: FileText },
  { to: "/admin/avaliacoes", label: "Avaliações", icon: Star },
  { to: "/admin/suporte", label: "Suporte", icon: MessageCircle },
  { to: "/admin/emails", label: "E-mails", icon: Mail },
  { to: "/admin/conteudos", label: "Conteúdos", icon: FileText },
  { to: "/admin/seo-check", label: "SEO Check", icon: Search },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="mx-auto w-full max-w-7xl flex-1 px-3 py-4 sm:px-4 sm:py-6 lg:py-8">
        <main className="min-w-0 flex-1"><Outlet /></main>
      </div>
    </div>
  );
}
