import { Link } from "@tanstack/react-router";
import { formatBRL } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

import { FavoriteButton } from "./favorite-button";

import { ShoppingCart, Check, Crown, Gift } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useI18n, tField } from "@/lib/i18n";

export type ArtworkCardData = {
  id: string;
  slug: string;
  title: string;
  preview_url: string;
  price_cents: number;
  license_type?: string | null;
  is_featured?: boolean;
  is_trending?: boolean;
  download_count?: number | null;
  translations?: any;
  categories?: { id?: string; name: string; slug: string; translations?: any } | null;
  artwork_categories?: Array<{ categories: { id?: string; name: string; slug: string; translations?: any } | null }> | null;
};

export function ArtworkCard({ artwork }: { artwork: ArtworkCardData }) {
  const { t, lang } = useI18n();
  const cart = useCart();
  const inCart = cart.contains(artwork.id);
  const title = tField(artwork as any, "title", lang) || artwork.title;
  const cats = [
    ...(artwork.categories ? [artwork.categories] : []),
    ...((artwork.artwork_categories ?? []).map((r) => r.categories).filter(Boolean) as NonNullable<ArtworkCardData["categories"]>[]),
  ].filter((c, i, arr) => arr.findIndex((x) => x!.slug === c!.slug) === i);
  return (
    <Link
      to="/artes/$slug"
      params={{ slug: artwork.slug }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-brand"
    >
      <div className="relative aspect-square overflow-hidden bg-surface-2">
        {artwork.preview_url ? (
          <img
            src={artwork.preview_url}
            alt={title}
            loading="lazy"
            decoding="async"
            width={400}
            height={400}
            className="h-full w-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.08]"
          />
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground">{t("card.noImage")}</div>
        )}
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
          {artwork.license_type === "free" ? (
            <Badge className="border-0 bg-success text-background shadow-glow">GRÁTIS</Badge>
          ) : (
            <Badge className="border-0 bg-gradient-brand text-brand-foreground shadow-glow">PREMIUM</Badge>
          )}
          {artwork.is_featured && (
            <Badge variant="secondary" className="bg-background/70 backdrop-blur-md">
              {t("card.featured")}
            </Badge>
          )}
          {artwork.is_trending && (
            <Badge variant="secondary" className="bg-background/70 backdrop-blur-md">
              {t("card.trending")}
            </Badge>
          )}
        </div>

        <FavoriteButton
          artworkId={artwork.id}
          size="sm"
          className="absolute right-2.5 top-2.5 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100"
        />
        <button
          type="button"
          disabled={inCart || cart.adding}
          aria-label={inCart ? "No carrinho" : "Adicionar ao carrinho"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!inCart) cart.add(artwork.id);
          }}
          className="absolute right-2.5 top-12 grid h-8 w-8 place-items-center rounded-full border border-border/60 bg-background/80 backdrop-blur transition-all hover:bg-background disabled:border-primary/60 disabled:text-primary [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:focus-visible:opacity-100 [@media(hover:hover)]:group-hover:opacity-100"
        >
          {inCart ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
        </button>
      </div>
      <div className="flex flex-1 flex-col items-center gap-1 p-3.5 text-center">
        <h3 className="line-clamp-3 text-sm font-semibold tracking-tight text-foreground/95 transition-colors group-hover:text-primary md:line-clamp-none">
          {title}
        </h3>
        <div className="mt-auto flex w-full flex-col items-center gap-1 pt-2 md:flex-row md:items-center md:justify-between md:gap-2 md:text-left">
          {cats.length > 0 ? (
            <span className="line-clamp-2 min-w-0 text-[11px] text-muted-foreground md:order-2 md:text-right">
              {cats.slice(0, 2).map((c) => tField(c as any, "name", lang) || c!.name).join(" · ")}
            </span>
          ) : (
            <span className="hidden md:order-2 md:block" />
          )}
          <span className="font-display text-base font-bold tracking-tight text-foreground md:order-1 md:shrink-0">
            {artwork.license_type === "free" ? "Grátis" : formatBRL(artwork.price_cents)}
          </span>
        </div>
      </div>




    </Link>
  );
}

