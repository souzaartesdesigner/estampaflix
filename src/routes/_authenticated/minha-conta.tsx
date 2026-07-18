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
import { ArtworkCard } from "@/components/artwork-card";
import { useI18n, tField } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/minha-conta")({
  head: () => ({ meta: [{ title: "Minha conta — EstampaHub" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext() as { user: any };
  const portalFn = useServerFn(createBillingPortalSession);
  const [portalLoading, setPortalLoading] = useState(false);
  const { t, lang } = useI18n();

  async function openPortal() {
    setPortalLoading(true);
    try {
      const { url } = await portalFn();
      if (url) window.location.href = url;
    } catch (err: any) {
      toast.error(err?.message ?? t("account.errPortal"));
      setPortalLoading(false);
    }
  }

  const { data: sub } = useQuery({
    queryKey: ["my-subscription", user.id],
    queryFn: async () => (await supabase.from("subscriptions").select("*, plans(*)").eq("user_id", user.id).eq("status", "active").maybeSingle()).data,
  });

  const { data: downloads = [] } = useQuery({
    queryKey: ["my-downloads", user.id],
    queryFn: async () => (await supabase.from("downloads").select("*, artworks(id,slug,title,preview_url,file_path,external_url,translations)").order("last_downloaded_at", { ascending: false })).data ?? [],
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["my-orders", user.id],
    queryFn: async () => (await supabase.from("orders").select("*, artworks(title,slug,translations)").order("created_at", { ascending: false })).data ?? [],
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ["favorites", user.id],
    queryFn: async () => (await supabase.from("favorites").select("artwork_id, artworks(id,slug,title,preview_url,price_cents,is_featured,is_trending,download_count,translations)").order("created_at", { ascending: false })).data ?? [],
  });

  function translateOrderStatus(s: string) {
    const map: Record<string, string> = {
      paid: t("account.status.paid"),
      pending: t("account.status.pending"),
      failed: t("account.status.failed"),
      refunded: t("account.status.refunded"),
      canceled: t("account.status.canceled"),
      cancelled: t("account.status.canceled"),
      processing: t("account.status.processing"),
    };
    return map[s] ?? s;
  }

  async function redownload(art: { file_path: string | null; external_url: string | null; title: string }) {
    try {
      if (art.external_url) {
        window.open(art.external_url, "_blank", "noopener,noreferrer");
        return;
      }
      if (!art.file_path) {
        toast.error(t("account.errFileUnavailable"));
        return;
      }
      const { data, error } = await supabase.storage
        .from("artwork-files")
        .createSignedUrl(art.file_path, 60, { download: art.title });
      if (error || !data?.signedUrl) throw error ?? new Error("Falha ao gerar link");
      const a = document.createElement("a");
      a.href = data.signedUrl;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e: any) {
      toast.error(e?.message ?? t("account.errDownload"));
    }
  }

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-6xl px-3 py-6 sm:px-4 sm:py-10">
        <header className="mb-6 sm:mb-8">
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{t("account.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground break-words">{t("account.greeting")} {user.email}</p>
        </header>

        <div className="mb-6 grid gap-3 sm:mb-8 sm:grid-cols-2 sm:gap-4 md:grid-cols-3">
          <StatCard icon={<CreditCard className="h-5 w-5" />} label={t("account.currentPlan")} value={sub?.plans?.name ?? t("account.none")} />
          <StatCard icon={<Sparkles className="h-5 w-5" />} label={t("account.creditsRemaining")} value={sub ? String(sub.credits_remaining) : "0"} accent />
          <StatCard icon={<Download className="h-5 w-5" />} label={t("account.downloadedCount")} value={String(downloads.length)} />
        </div>

        <Tabs defaultValue="downloads">
          <TabsList className="flex w-full overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabsTrigger value="downloads" className="shrink-0">{t("account.tabDownloads")}</TabsTrigger>
            <TabsTrigger value="favorites" className="shrink-0">{t("account.tabFavorites")}</TabsTrigger>
            <TabsTrigger value="subscription" className="shrink-0">{t("account.tabSubscription")}</TabsTrigger>
            <TabsTrigger value="orders" className="shrink-0">{t("account.tabOrders")}</TabsTrigger>
          </TabsList>

          <TabsContent value="downloads" className="mt-6">
            {downloads.length === 0 ? (
              <Empty msg={t("account.emptyDownloads")} cta={{ label: t("account.exploreCatalog"), to: "/catalogo" }} />
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {downloads.map((d: any) => {
                  const title = tField(d.artworks as any, "title", lang) || d.artworks.title;
                  return (
                    <div key={d.id} className="overflow-hidden rounded-xl border border-border/60 bg-card">
                      <Link to="/artes/$slug" params={{ slug: d.artworks.slug }} className="block aspect-square overflow-hidden bg-surface-2">
                        <img src={d.artworks.preview_url} alt={title} className="h-full w-full object-cover" />
                      </Link>
                      <div className="p-3">
                        <h3 className="line-clamp-1 text-sm font-medium">{title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">{t("account.downloadedOn")} {formatDate(d.last_downloaded_at)}</p>
                        <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => redownload({ ...d.artworks, title })}>
                          <Download className="mr-1 h-3 w-3" /> {t("account.redownload")}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites" className="mt-6">
            {favorites.length === 0 ? (
              <Empty msg={t("account.emptyFavorites")} cta={{ label: t("account.exploreCatalog"), to: "/catalogo" }} />
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {favorites.map((f: any) => f.artworks && <ArtworkCard key={f.artwork_id} artwork={f.artworks} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="subscription" className="mt-6">
            {sub ? (
              <div className="rounded-2xl border border-border/60 bg-card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Badge className="mb-2 bg-gradient-brand text-brand-foreground border-0">{sub.plans.name}</Badge>
                    <p className="text-2xl font-bold">{formatBRL(sub.plans.price_cents)}<span className="text-sm font-normal text-muted-foreground">{t("plans.perMonth")}</span></p>
                    <p className="mt-1 text-sm text-muted-foreground">{t("account.renewsOn")} {formatDate(sub.current_period_end)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{t("account.creditsRemaining")}</p>
                    <p className="text-3xl font-black text-primary">{sub.credits_remaining}<span className="text-sm text-muted-foreground">/{sub.plans.monthly_credits}</span></p>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Button onClick={openPortal} disabled={portalLoading} className="bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-90">
                    {portalLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("account.opening")}</> : t("account.managePlan")}
                  </Button>
                  <Button asChild variant="outline"><Link to="/planos">{t("account.switchPlan")}</Link></Button>
                </div>
              </div>
            ) : (
              <Empty msg={t("account.emptySub")} cta={{ label: t("account.seePlans"), to: "/planos" }} />
            )}
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            {orders.length === 0 ? (
              <Empty msg={t("account.emptyOrders")} cta={{ label: t("account.exploreCatalog"), to: "/catalogo" }} />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border/60">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="bg-surface-2 text-xs uppercase text-muted-foreground">
                    <tr><th className="px-4 py-3 text-left">{t("account.thArt")}</th><th className="px-4 py-3 text-left">{t("account.thDate")}</th><th className="px-4 py-3 text-left">{t("account.thValue")}</th><th className="px-4 py-3 text-left">{t("account.thStatus")}</th></tr>
                  </thead>
                  <tbody>
                    {orders.map((o: any) => {
                      const itemCount = Array.isArray(o.items) ? o.items.length : (o.artworks ? 1 : 0);
                      const title = o.artworks ? (tField(o.artworks, "title", lang) || o.artworks.title) : null;
                      const label = title
                        ? title
                        : itemCount > 0
                          ? `${itemCount} ${itemCount === 1 ? t("account.oneArt") : t("account.manyArt")}`
                          : t("account.orderLabel");
                      return (
                        <tr key={o.id} className="border-t border-border/40">
                          <td className="px-4 py-3">
                            {o.artworks ? (
                              <Link to="/artes/$slug" params={{ slug: o.artworks.slug }} className="hover:text-primary">{label}</Link>
                            ) : (
                              <span>{label}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{formatDate(o.created_at)}</td>
                          <td className="px-4 py-3">{formatBRL(o.amount_cents)}</td>
                          <td className="px-4 py-3"><Badge variant={o.status === "paid" ? "default" : "secondary"}>{translateOrderStatus(o.status)}</Badge></td>
                        </tr>
                      );
                    })}
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
