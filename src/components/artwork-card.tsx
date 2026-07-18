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
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-brand"
    >
      <div className="relative aspect-square overflow-hidden bg-surface-2">
        {artwork.preview_url ? (
          <img
            src={artwork.preview_url}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.08]"
          />
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground">{t("card.noImage")}</div>
        )}
        {/* Subtle diagonal watermark, quieter than before */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.12] mix-blend-overlay"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-30deg, transparent 0 80px, oklch(1 0 0 / 0.2) 80px 81px)",
          }}
        >
          <span className="rotate-[-20deg] font-display text-xl font-black tracking-[0.2em] text-white/60">
            ESTAMPAHUB
          </span>
        </div>
        {/* Bottom gradient veil for legibility on hover */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background/80 via-background/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
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
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Download className="h-3 w-3" /> {artwork.download_count ?? 0}
          </span>
        </div>
      </div>
    </Link>
  );
}

