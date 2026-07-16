import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { formatBRL, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createBillingPortalSession } from "@/lib/stripe.functions";
import { toast } from "sonner";
import { Download, CreditCard, Package, Sparkles, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/minha-conta")({
  head: () => ({ meta: [{ title: "Minha conta — EstampaHub" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext() as { user: any };
  const portalFn = useServerFn(createBillingPortalSession);
  const [portalLoading, setPortalLoading] = useState(false);

  async function openPortal() {
    setPortalLoading(true);
    try {
      const { url } = await portalFn();
      if (url) window.location.href = url;
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao abrir portal");
      setPortalLoading(false);
    }
  }


  const { data: sub } = useQuery({
    queryKey: ["my-subscription", user.id],
    queryFn: async () => (await supabase.from("subscriptions").select("*, plans(*)").eq("user_id", user.id).eq("status", "active").maybeSingle()).data,
  });

  const { data: downloads = [] } = useQuery({
    queryKey: ["my-downloads", user.id],
    queryFn: async () => (await supabase.from("downloads").select("*, artworks(id,slug,title,preview_url,file_path)").order("last_downloaded_at", { ascending: false })).data ?? [],
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["my-orders", user.id],
    queryFn: async () => (await supabase.from("orders").select("*, artworks(title,slug)").order("created_at", { ascending: false })).data ?? [],
  });

  async function redownload(filePath: string) {
    const { data } = await supabase.storage.from("artwork-files").createSignedUrl(filePath, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <header className="mb-8">
          <h1 className="font-display text-3xl font-bold">Minha conta</h1>
          <p className="mt-1 text-sm text-muted-foreground">Olá, {user.email}</p>
        </header>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <StatCard icon={<CreditCard className="h-5 w-5" />} label="Plano atual" value={sub?.plans?.name ?? "Nenhum"} />
          <StatCard icon={<Sparkles className="h-5 w-5" />} label="Créditos restantes" value={sub ? String(sub.credits_remaining) : "0"} accent />
          <StatCard icon={<Download className="h-5 w-5" />} label="Artes baixadas" value={String(downloads.length)} />
        </div>

        <Tabs defaultValue="downloads">
          <TabsList>
            <TabsTrigger value="downloads">Downloads</TabsTrigger>
            <TabsTrigger value="subscription">Minha assinatura</TabsTrigger>
            <TabsTrigger value="orders">Compras avulsas</TabsTrigger>
          </TabsList>

          <TabsContent value="downloads" className="mt-6">
            {downloads.length === 0 ? (
              <Empty msg="Você ainda não baixou nenhuma arte." cta={{ label: "Explorar catálogo", to: "/catalogo" }} />
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {downloads.map((d: any) => (
                  <div key={d.id} className="overflow-hidden rounded-xl border border-border/60 bg-card">
                    <Link to="/artes/$slug" params={{ slug: d.artworks.slug }} className="block aspect-square overflow-hidden bg-surface-2">
                      <img src={d.artworks.preview_url} alt={d.artworks.title} className="h-full w-full object-cover" />
                    </Link>
                    <div className="p-3">
                      <h3 className="line-clamp-1 text-sm font-medium">{d.artworks.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">Baixado em {formatDate(d.last_downloaded_at)}</p>
                      <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => redownload(d.artworks.file_path)}>
                        <Download className="mr-1 h-3 w-3" /> Baixar novamente
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="subscription" className="mt-6">
            {sub ? (
              <div className="rounded-2xl border border-border/60 bg-card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Badge className="mb-2 bg-gradient-brand text-brand-foreground border-0">{sub.plans.name}</Badge>
                    <p className="text-2xl font-bold">{formatBRL(sub.plans.price_cents)}<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                    <p className="mt-1 text-sm text-muted-foreground">Renovação em {formatDate(sub.current_period_end)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Créditos restantes</p>
                    <p className="text-3xl font-black text-primary">{sub.credits_remaining}<span className="text-sm text-muted-foreground">/{sub.plans.monthly_credits}</span></p>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Button onClick={openPortal} disabled={portalLoading} className="bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-90">
                    {portalLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Abrindo…</> : "Gerenciar assinatura"}
                  </Button>
                  <Button asChild variant="outline"><Link to="/planos">Trocar de plano</Link></Button>
                </div>
              </div>
            ) : (
              <Empty msg="Você ainda não tem assinatura ativa." cta={{ label: "Ver planos", to: "/planos" }} />
            )}
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            {orders.length === 0 ? (
              <Empty msg="Nenhuma compra avulsa ainda." cta={{ label: "Explorar catálogo", to: "/catalogo" }} />
            ) : (
              <div className="overflow-hidden rounded-xl border border-border/60">
                <table className="w-full text-sm">
                  <thead className="bg-surface-2 text-xs uppercase text-muted-foreground">
                    <tr><th className="px-4 py-3 text-left">Arte</th><th className="px-4 py-3 text-left">Data</th><th className="px-4 py-3 text-left">Valor</th><th className="px-4 py-3 text-left">Status</th></tr>
                  </thead>
                  <tbody>
                    {orders.map((o: any) => (
                      <tr key={o.id} className="border-t border-border/40">
                        <td className="px-4 py-3"><Link to="/artes/$slug" params={{ slug: o.artworks.slug }} className="hover:text-primary">{o.artworks.title}</Link></td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(o.created_at)}</td>
                        <td className="px-4 py-3">{formatBRL(o.amount_cents)}</td>
                        <td className="px-4 py-3"><Badge variant={o.status === "paid" ? "default" : "secondary"}>{translateOrderStatus(o.status)}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </SiteLayout>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 ${accent ? "border-primary/40 bg-card shadow-brand" : "border-border/60 bg-card"}`}>
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">{icon} <span className="text-xs uppercase tracking-wide">{label}</span></div>
      <p className="font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

function Empty({ msg, cta }: { msg: string; cta: { label: string; to: string } }) {
  return (
    <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
      <Package className="mx-auto h-10 w-10 text-muted-foreground" />
      <p className="mt-3 text-muted-foreground">{msg}</p>
      <Button asChild className="mt-4"><Link to={cta.to}>{cta.label}</Link></Button>
    </div>
  );
}
