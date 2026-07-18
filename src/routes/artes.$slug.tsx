import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { createPixOrder } from "@/lib/mercadopago.functions";
import { SiteLayout } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/format";
import { Download, ShoppingCart, Tag as TagIcon, Palette, FileType, Loader2, Plus, Check } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArtworkCard } from "@/components/artwork-card";
import { FavoriteButton } from "@/components/favorite-button";
import { useCart } from "@/hooks/use-cart";
import { ArtworkGallery } from "@/components/artwork-gallery";
import { ArtworkReviews } from "@/components/artwork-reviews";
import { useI18n, tField } from "@/lib/i18n";


function sanitizeHtml(html: string): string {
  if (!html) return "";
  let s = html
    // literal escape sequences from CSV
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\\t/g, " ");
  // strip dangerous blocks
  s = s.replace(/<(script|style|iframe|object|embed|link|meta)[^>]*>[\s\S]*?<\/\1>/gi, "");
  s = s.replace(/<(script|style|iframe|object|embed|link|meta)[^>]*\/?>/gi, "");
  // strip on* handlers and javascript: urls
  s = s.replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, "");
  s = s.replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, "");
  s = s.replace(/\s+on[a-z]+\s*=\s*[^\s>]+/gi, "");
  s = s.replace(/(href|src)\s*=\s*"(\s*javascript:[^"]*)"/gi, '$1="#"');
  s = s.replace(/(href|src)\s*=\s*'(\s*javascript:[^']*)'/gi, "$1='#'");
  // if the source has no HTML tags at all, convert newlines to <br>
  if (!/<[a-z][\s\S]*>/i.test(s)) {
    s = s.replace(/\n/g, "<br>");
  }
  return s.trim();
}


export const Route = createFileRoute("/artes/$slug")({
  loader: async ({ params }) => {
    const { data } = await supabase
      .from("artworks")
      .select("*, categories(name,slug), artwork_tags(tags(id,name,slug))")
      .eq("slug", params.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (!data) throw notFound();
    return data;
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Arte não encontrada" }, { name: "robots", content: "noindex" }] };
    const url = `https://loving-code-flow.lovable.app/artes/${params.slug}`;
    const plainDesc = (loaderData.description ?? "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const fallback = `${loaderData.title} — arte digital em alta resolução (300 DPI) para sublimação, DTF e estamparia, com licença comercial na EstampaHub.`;
    const description = plainDesc.length >= 50 ? plainDesc.slice(0, 300) : fallback;
    return {
      meta: [
        { title: `${loaderData.title} — EstampaHub` },
        { name: "description", content: description },
        { property: "og:title", content: loaderData.title },
        { property: "og:description", content: description.slice(0, 200) },
        { property: "og:image", content: loaderData.preview_url },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        { name: "twitter:image", content: loaderData.preview_url },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: loaderData.title,
            image: loaderData.preview_url,
            description,
            sku: loaderData.slug,
            brand: { "@type": "Brand", name: "EstampaHub" },
            offers: {
              "@type": "Offer",
              url,
              priceCurrency: "BRL",
              price: (Number(loaderData.price_cents ?? 0) / 100).toFixed(2),
              availability: "https://schema.org/InStock",
            },
          }),
        },
      ],
    };
  },
  component: ArtworkPage,
  notFoundComponent: NotFound,
  errorComponent: ErrBoundary,
});

function NotFound() {
  const { t } = useI18n();
  return (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">{t("product.notFound")}</h1>
        <p className="mt-2 text-muted-foreground">{t("product.notFoundDesc")}</p>
        <Button asChild className="mt-6"><Link to="/catalogo">{t("product.backToCatalog")}</Link></Button>
      </div>
    </SiteLayout>
  );
}
function ErrBoundary() {
  const { t } = useI18n();
  return (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">{t("product.somethingWrong")}</h1>
      </div>
    </SiteLayout>
  );
}

function ArtworkPage() {
  const artwork = Route.useLoaderData();
  const { lang, t } = useI18n();
  const trTitle = tField(artwork as any, "title", lang) || artwork.title;
  const trDesc = tField(artwork as any, "description", lang) || (artwork.description ?? "");
  const galleryImages = [artwork.preview_url, ...((artwork as any).gallery_urls ?? [])].filter(Boolean);


  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => (await supabase.auth.getSession()).data.session,
  });

  const { data: sub } = useQuery({
    queryKey: ["my-subscription", session?.user.id],
    enabled: !!session?.user.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("credits_remaining,status,current_period_end,plans(name,tier)")
        .eq("user_id", session!.user.id)
        .eq("status", "active")
        .maybeSingle();
      return data;
    },
  });

  const { data: owned } = useQuery({
    queryKey: ["artwork-owned", session?.user.id, artwork.id],
    enabled: !!session?.user.id,
    queryFn: async () => {
      const [dl, ord] = await Promise.all([
        supabase
          .from("downloads")
          .select("id")
          .eq("user_id", session!.user.id)
          .eq("artwork_id", artwork.id)
          .maybeSingle(),
        supabase
          .from("orders")
          .select("id")
          .eq("user_id", session!.user.id)
          .eq("artwork_id", artwork.id)
          .eq("status", "paid")
          .maybeSingle(),
      ]);
      return !!(dl.data || ord.data);
    },
  });

  const downloadMut = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("consume_download", { _artwork_id: artwork.id });
      if (error) throw error;
      const row: any = Array.isArray(data) ? data[0] : data;
      if (row?.external_url) {
        return { url: row.external_url as string, credits: row.credits_remaining, was_new: row.was_new, kind: "external" as const };
      }
      if (!row?.file_path) throw new Error(t("product.errFileUnavailable"));
      const { data: signed, error: sErr } = await supabase.storage
        .from("artwork-files")
        .createSignedUrl(row.file_path, 60, { download: true });
      if (sErr || !signed?.signedUrl) throw sErr ?? new Error(t("product.errFileUnavailable"));
      return { url: signed.signedUrl, credits: row.credits_remaining, was_new: row.was_new, kind: "file" as const };
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["my-subscription"] });
      if (res.kind === "external") {
        window.open(res.url, "_blank", "noopener,noreferrer");
      } else {
        const a = document.createElement("a");
        a.href = res.url;
        a.rel = "noopener";
        a.download = "";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      toast.success(res.was_new ? `${t("product.creditsReleased")} ${res.credits}` : t("product.alreadyDownloaded"));
    },
    onError: (err: any) => {
      const msg = err.message || "";
      if (msg.includes("no_credits")) toast.error(t("product.errNoCredits"));
      else if (msg.includes("no_active_subscription")) toast.error(t("product.errNoSub"));
      else if (msg.includes("not_authenticated")) { toast.error(t("product.errLogin")); navigate({ to: "/auth" }); }
      else toast.error(msg || t("account.errDownload"));
    },
  });

  const createPix = useServerFn(createPixOrder);
  const buyMut = useMutation({
    mutationFn: async () => {
      if (!session) {
        navigate({ to: "/auth" });
        throw new Error("not_authenticated");
      }
      return await createPix({ data: { artworkId: artwork.id } });
    },
    onSuccess: (res) => {
      navigate({ to: "/pagamento/pix/$orderId", params: { orderId: res.orderId } });
    },
    onError: (err: any) => {
      if (err?.message === "not_authenticated") return;
      toast.error(err?.message || t("product.errStartPayment"));
    },
  });

  const canDownload = !!sub && (sub.credits_remaining ?? 0) > 0;
  const tags: any[] = (artwork as any).artwork_tags?.map((at: any) => at.tags).filter(Boolean) ?? [];
  const cart = useCart();
  const inCart = cart.contains(artwork.id);

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <nav className="mb-4 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">{t("product.crumbHome")}</Link> / <Link to="/catalogo" className="hover:text-foreground">{t("product.crumbCatalog")}</Link> / <span className="text-foreground">{trTitle}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2">
          <ArtworkGallery images={galleryImages} alt={trTitle} />

          {/* INFO */}
          <div className="flex flex-col gap-4">

            {(artwork as any).categories && (
              <Link to="/catalogo" search={{ categoria: (artwork as any).categories.slug } as any} className="text-xs uppercase tracking-wider text-primary hover:underline">
                {tField((artwork as any).categories, "name", lang) || (artwork as any).categories.name}
              </Link>
            )}
            <h1 className="font-display text-3xl font-bold md:text-4xl">{trTitle}</h1>
            <div className="flex items-center gap-2">
              <FavoriteButton artworkId={artwork.id} size="md" />
              <span className="text-xs text-muted-foreground">{t("product.saveFavorites")}</span>
            </div>



            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {artwork.file_format && <span className="flex items-center gap-1"><FileType className="h-4 w-4" /> {artwork.file_format.toUpperCase()}</span>}
              {artwork.colors && artwork.colors.length > 0 && (
                <span className="flex items-center gap-1"><Palette className="h-4 w-4" /> {artwork.colors.length} {t("product.colorsSuffix")}</span>
              )}
              <span className="flex items-center gap-1"><Download className="h-4 w-4" /> {artwork.download_count ?? 0} {t("product.downloads")}</span>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-5">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black">{formatBRL(artwork.price_cents)}</span>
                <span className="text-sm text-muted-foreground">{t("product.avulso")}</span>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                {session ? (
                  owned ? (
                    <>
                      <Button
                        onClick={() => downloadMut.mutate()}
                        disabled={downloadMut.isPending}
                        className="bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-90"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {downloadMut.isPending ? t("product.downloading") : t("product.download")}
                      </Button>
                      <p className="text-xs text-success">{t("product.owned")}</p>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => downloadMut.mutate()}
                        disabled={downloadMut.isPending || !canDownload}
                        className="bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-90"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {downloadMut.isPending ? t("product.downloading") : canDownload ? `${t("product.download")} (${sub!.credits_remaining} ${t("product.creditsRemaining")})` : t("product.downloadWithPlan")}
                      </Button>
                      {!sub && (
                        <p className="text-xs text-muted-foreground">
                          {t("product.noSubscription")} <Link to="/planos" className="text-primary underline">{t("product.seePlans")}</Link>.
                        </p>
                      )}
                      {sub && !canDownload && (
                        <p className="text-xs text-warning">
                          {t("product.noCredits")} <Link to="/planos" className="text-primary underline">{t("product.upgrade")}</Link>.
                        </p>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => buyMut.mutate()}
                        disabled={buyMut.isPending}
                      >
                        {buyMut.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ShoppingCart className="mr-2 h-4 w-4" />
                        )}
                        {t("product.buyPix")} ({formatBRL(artwork.price_cents)})
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => (inCart ? navigate({ to: "/carrinho" }) : cart.add(artwork.id))}
                        disabled={cart.adding}
                      >
                        {inCart ? (
                          <><Check className="mr-2 h-4 w-4" /> {t("product.inCart")}</>
                        ) : (
                          <><Plus className="mr-2 h-4 w-4" /> {t("product.addToCart")}</>
                        )}
                      </Button>
                    </>
                  )
                ) : (
                  <Button asChild className="bg-gradient-brand text-brand-foreground shadow-brand">
                    <Link to="/auth">{t("product.signInToDownload")}</Link>
                  </Button>
                )}
              </div>
            </div>

            {tags.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("product.tags")}</h3>
                <div className="flex flex-wrap gap-1">
                  {tags.map((tg: any) => (
                    <Link key={tg.id} to="/catalogo" search={{ tag: tg.slug } as any}>
                      <Badge variant="secondary" className="gap-1"><TagIcon className="h-3 w-3" /> {tField(tg, "name", lang) || tg.name}</Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <RelatedArtworks
          categoryId={(artwork as any).category_id}
          currentId={artwork.id}
        />

        <ArtworkReviews artworkId={artwork.id} />

        {trDesc && (
          <section className="mt-12 rounded-2xl border border-border/60 bg-card p-6 md:p-8">
            <h2 className="mb-4 font-display text-2xl font-bold">{t("product.description")}</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {htmlToText(trDesc)}
            </p>
          </section>
        )}

      </div>
    </SiteLayout>
  );
}

function RelatedArtworks({ categoryId, currentId }: { categoryId: string | null; currentId: string }) {
  const { t } = useI18n();
  const { data } = useQuery({
    queryKey: ["related-artworks", categoryId, currentId],
    enabled: !!categoryId,
    queryFn: async () => {
      const { data } = await supabase
        .from("artworks")
        .select("id,slug,title,preview_url,price_cents,is_featured,is_trending,download_count,translations")
        .eq("is_published", true)
        .eq("category_id", categoryId!)
        .neq("id", currentId)
        .order("download_count", { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  if (!categoryId || !data || data.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="font-display text-2xl font-bold">{t("product.related")}</h2>
        <Link to="/catalogo" className="text-sm text-primary hover:underline">{t("product.seeMore")}</Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {data.map((a: any) => (
          <ArtworkCard key={a.id} artwork={a} />
        ))}
      </div>
    </section>
  );
}

