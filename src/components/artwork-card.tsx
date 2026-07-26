import { Link } from "@tanstack/react-router";
import { formatBRL } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

import { FavoriteButton } from "./favorite-button";
import { useI18n, tField } from "@/lib/i18n";

export type ArtworkCardData = {
  id: string;
  slug: string;
  title: string;
  preview_url: string;
  price_cents: number;
  is_featured?: boolean;
  is_trending?: boolean;
  download_count?: number | null;
  translations?: any;
};

export function ArtworkCard({ artwork }: { artwork: ArtworkCardData }) {
  const { t, lang } = useI18n();
  const title = tField(artwork as any, "title", lang) || artwork.title;
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
          {artwork.is_featured && (
            <Badge className="border-0 bg-gradient-brand text-brand-foreground shadow-glow">
              {t("card.featured")}
            </Badge>
          )}
          {artwork.is_trending && (
            <Badge variant="secondary" className="bg-background/70 backdrop-blur-md">
              {t("card.trending")}
            </Badge>
          )}
        </div>
        <FavoriteButton artworkId={artwork.id} size="sm" className="absolute right-2.5 top-2.5" />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3.5">
        <h3 className="line-clamp-1 text-sm font-semibold tracking-tight text-foreground/95 transition-colors group-hover:text-primary">
          {title}
        </h3>
        <div className="mt-auto flex items-center justify-between pt-2 text-xs">
          <span className="font-display text-base font-bold tracking-tight text-foreground">
            {formatBRL(artwork.price_cents)}
          </span>
        </div>
      </div>
    </Link>
  );
}

