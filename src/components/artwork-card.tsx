import { Link } from "@tanstack/react-router";
import { formatBRL } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
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
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-brand"
    >
      <div className="relative aspect-square overflow-hidden bg-surface-2">
        {artwork.preview_url ? (
          <img
            src={artwork.preview_url}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground">{t("card.noImage")}</div>
        )}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20 mix-blend-overlay"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-30deg, transparent 0 60px, oklch(1 0 0 / 0.25) 60px 61px)",
          }}
        >
          <span className="rotate-[-20deg] font-display text-2xl font-black tracking-widest text-white/70">
            ESTAMPAHUB
          </span>
        </div>
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {artwork.is_featured && <Badge className="bg-gradient-brand text-brand-foreground border-0">{t("card.featured")}</Badge>}
          {artwork.is_trending && <Badge variant="secondary">{t("card.trending")}</Badge>}
        </div>
        <FavoriteButton artworkId={artwork.id} size="sm" className="absolute right-2 top-2" />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-1 text-sm font-medium">{title}</h3>
        <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{formatBRL(artwork.price_cents)}</span>
          <span className="inline-flex items-center gap-1"><Download className="h-3 w-3" /> {artwork.download_count ?? 0}</span>
        </div>
      </div>
    </Link>
  );
}
