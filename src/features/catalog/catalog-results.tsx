import { Badge } from "@/components/ui/badge";
import { SlidersHorizontal, X } from "lucide-react";
import { ArtworkCard } from "@/components/artwork-card";
import { useI18n } from "@/lib/i18n";
import type { CatalogSearch } from "./catalog-constants";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type Props = {
  filters: CatalogSearch;
  artworks: any[];
  count: number;
  page: number;
  itemsPerPage: number;
  isLoading: boolean;
  onRemoveFilter: (key: keyof CatalogSearch) => void;
  onPageChange: (page: number) => void;
};

export function CatalogResults({ 
  filters, 
  artworks, 
  count, 
  page, 
  itemsPerPage, 
  isLoading, 
  onRemoveFilter,
  onPageChange
}: Props) {
  const { t } = useI18n();
  const activeFilters = Object.entries(filters).filter(([k, v]) => v && k !== 'page') as Array<[keyof CatalogSearch, string]>;
  const totalPages = Math.ceil(count / itemsPerPage);

  const renderPaginationItems = () => {
    const items = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      items.push(1);
      if (page > 3) items.push("ellipsis-start");
      
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      
      for (let i = start; i <= end; i++) {
        items.push(i);
      }
      
      if (page < totalPages - 2) items.push("ellipsis-end");
      items.push(totalPages);
    }

    return items.map((item, idx) => {
      if (typeof item === "string") {
        return (
          <PaginationItem key={`ellipsis-${idx}`}>
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      return (
        <PaginationItem key={item}>
          <PaginationLink
            onClick={(e) => {
              e.preventDefault();
              onPageChange(item);
            }}
            href={`#page=${item}`}
            isActive={page === item}
            className="cursor-pointer"
          >
            {item}
          </PaginationLink>
        </PaginationItem>
      );
    });
  };

  const startRange = (page - 1) * itemsPerPage + 1;
  const endRange = Math.min(page * itemsPerPage, count);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {!isLoading && count > 0 && (
          <span className="text-sm text-muted-foreground">
            Mostrando {startRange}–{endRange} de {count.toLocaleString()} resultados
          </span>
        )}
        
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
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
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
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
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {artworks.map((a: any) => <ArtworkCard key={a.id} artwork={a} />)}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={(e) => {
                        e.preventDefault();
                        if (page > 1) onPageChange(page - 1);
                      }}
                      href={`#page=${page - 1}`}
                      className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {renderPaginationItems()}

                  <PaginationItem>
                    <PaginationNext
                      onClick={(e) => {
                        e.preventDefault();
                        if (page < totalPages) onPageChange(page + 1);
                      }}
                      href={`#page=${page + 1}`}
                      className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
}
