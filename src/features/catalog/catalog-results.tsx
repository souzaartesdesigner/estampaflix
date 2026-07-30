import { Badge } from "@/components/ui/badge";
import { SlidersHorizontal, X } from "lucide-react";
import { ArtworkCard } from "@/components/artwork-card";
import { useI18n } from "@/lib/i18n";
import type { CatalogSearch } from "./catalog-constants";

type Props = {
  filters: CatalogSearch;
  artworks: any[];
  isLoading: boolean;
  onRemoveFilter: (key: keyof CatalogSearch) => void;
};

export function CatalogResults({ filters, artworks, isLoading, onRemoveFilter }: Props) {
  const { t } = useI18n();
  const activeFilters = Object.entries(filters).filter(([, v]) => v) as Array<[keyof CatalogSearch, string]>;

  return (
    <div>
      {activeFilters.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          {activeFilters.map(([k, v]) => (
            <Badge key={k} variant="secondary" className="gap-1">
              {String(v)}
              <button
                type="button"
                aria-label={`${t("catalog.removeFilter")} ${String(v)}`}
                onClick={() => onRemoveFilter(k)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card"
            >
              <div className="aspect-square w-full animate-pulse bg-surface-2" />
              <div className="flex flex-col items-center gap-2 p-3.5">
                <div className="h-4 w-4/5 animate-pulse rounded bg-surface-2" />
                <div className="h-3 w-2/5 animate-pulse rounded bg-surface-2" />
                <div className="mt-2 h-5 w-1/3 animate-pulse rounded bg-surface-2" />
              </div>
            </div>
          ))}
        </div>

      ) : artworks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 p-12 text-center text-sm text-muted-foreground">
          {t("catalog.empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {artworks.map((a: any) => <ArtworkCard key={a.id} artwork={a} />)}
        </div>
      )}
    </div>
  );
}
