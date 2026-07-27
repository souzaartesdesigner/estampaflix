import { Link } from "@tanstack/react-router";
import { Download, Palette, Tag as TagIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/favorite-button";
import { tField, useI18n } from "@/lib/i18n";
import { ArtworkActions } from "./artwork-actions";
import { FileFormatIcon } from "./file-format-icon";
import { formatDescription } from "./formats";

type Props = {
  artwork: any;
  title: string;
  session: any;
  sub: any;
  owned: boolean | undefined;
};

export function ArtworkInfo({ artwork, title, session, sub, owned }: Props) {
  const { t, lang } = useI18n();
  const tags: any[] = artwork.artwork_tags?.map((at: any) => at.tags).filter(Boolean) ?? [];

  const header = (
    <div className="flex flex-col gap-3">
      {artwork.categories && (
        <Link
          to="/catalogo"
          search={{ categoria: artwork.categories.slug } as any}
          className="text-xs uppercase tracking-wider text-primary hover:underline"
        >
          {tField(artwork.categories, "name", lang) || artwork.categories.name}
        </Link>
      )}
      <h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1>
      <div className="flex items-center gap-2">
        <FavoriteButton artworkId={artwork.id} size="md" />
        <span className="text-xs text-muted-foreground">{t("product.saveFavorites")}</span>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        {artwork.file_format && (
          <span className="flex items-center gap-1.5">
            <FileFormatIcon format={artwork.file_format} /> {formatDescription(artwork.file_format)}
          </span>
        )}
        {artwork.colors && artwork.colors.length > 0 && (
          <span className="flex items-center gap-1"><Palette className="h-4 w-4" /> {artwork.colors.length} {t("product.colorsSuffix")}</span>
        )}
        {(artwork.download_count ?? 0) > 0 && (
          <span className="flex items-center gap-1"><Download className="h-4 w-4" /> + de {artwork.download_count} {t("product.downloads")}</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <ArtworkActions artwork={artwork} session={session} sub={sub} owned={owned} header={header} />

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
  );
}
