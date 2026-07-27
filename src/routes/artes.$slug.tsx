import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site-layout";
import { ArtworkGallery } from "@/components/artwork-gallery";
import { ArtworkReviews } from "@/components/artwork-reviews";
import { tField, useI18n } from "@/lib/i18n";
import {
  ArtworkErrorBoundary,
  ArtworkNotFound,
} from "@/features/artwork/artwork-boundaries";
import { ArtworkInfo } from "@/features/artwork/artwork-info";
import { ArtworkDescription } from "@/features/artwork/artwork-description";
import { ProductInfoPanel } from "@/features/artwork/product-info-panel";
import { RelatedArtworks } from "@/features/artwork/related-artworks";
import {
  useArtworkOwnership,
  useArtworkSession,
  useMySubscription,
} from "@/features/artwork/artwork-actions";

export const Route = createFileRoute("/artes/$slug")({
  loader: async ({ params }) => {
    const { data } = await supabase
      .from("artworks")
      .select("*, categories!artworks_category_id_fkey(name,slug), artwork_categories(categories(id,name,slug)), artwork_tags(tags(id,name,slug))")
      .eq("slug", params.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (!data) throw notFound();
    return data;
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Arte não encontrada" }, { name: "robots", content: "noindex" }] };
    const url = `https://estampaflix.com/artes/${params.slug}`;
    const plainDesc = (loaderData.description ?? "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const fallback = `${loaderData.title} — arte digital em alta resolução (300 DPI) para sublimação, DTF e estamparia, com licença comercial na Estampa Flix.`;
    const seoDesc = ((loaderData as any).seo_description ?? "").trim();
    const description = seoDesc || (plainDesc.length >= 50 ? plainDesc.slice(0, 300) : fallback);
    const seoTitle = ((loaderData as any).seo_title ?? "").trim() || `${loaderData.title} — Estampa Flix`;
    const keyword = ((loaderData as any).seo_keyword ?? "").trim();
    return {
      meta: [
        { title: seoTitle },
        { name: "description", content: description },
        ...(keyword ? [{ name: "keywords", content: keyword }] : []),
        { property: "og:title", content: seoTitle },
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
            brand: { "@type": "Brand", name: "Estampa Flix" },
            offers: {
              "@type": "Offer",
              url,
              priceCurrency: "BRL",
              price: (Number(loaderData.price_cents ?? 0) / 100).toFixed(2),
              availability: "https://schema.org/InStock",
            },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Início", item: "https://estampaflix.com/" },
              { "@type": "ListItem", position: 2, name: "Catálogo", item: "https://estampaflix.com/catalogo" },
              { "@type": "ListItem", position: 3, name: loaderData.title, item: url },
            ],
          }),
        },
      ],
    };
  },
  component: ArtworkPage,
  notFoundComponent: ArtworkNotFound,
  errorComponent: ArtworkErrorBoundary,
});

function ArtworkPage() {
  const artwork = Route.useLoaderData();
  const { t, lang } = useI18n();
  const trTitle = tField(artwork as any, "title", lang) || artwork.title;
  const trDesc = tField(artwork as any, "description", lang) || (artwork.description ?? "");
  const galleryImages = [artwork.preview_url, ...((artwork as any).gallery_urls ?? [])].filter(Boolean);

  const { data: session } = useArtworkSession();
  const { data: sub } = useMySubscription(session?.user.id);
  const { data: owned } = useArtworkOwnership(session?.user.id, artwork.id);

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-6xl px-3 py-6 sm:px-4 sm:py-8">
        <nav className="mb-4 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">{t("product.crumbHome")}</Link> /{" "}
          <Link to="/catalogo" className="hover:text-foreground">{t("product.crumbCatalog")}</Link> /{" "}
          <span className="text-foreground">{trTitle}</span>
        </nav>

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <div>
            <ArtworkGallery images={galleryImages} alt={trTitle} />
            <ProductInfoPanel artwork={artwork} />
          </div>
          <ArtworkInfo artwork={artwork} title={trTitle} session={session} sub={sub} owned={owned} />
        </div>

        <RelatedArtworks
          categoryIds={Array.from(new Set([
            (artwork as any).category_id,
            ...(((artwork as any).artwork_categories ?? []).map((r: any) => r.categories?.id)),
          ].filter(Boolean))) as string[]}
          currentId={artwork.id}
        />

        <ArtworkReviews artworkId={artwork.id} />

        <ArtworkDescription html={trDesc} />
      </div>
    </SiteLayout>
  );
}
