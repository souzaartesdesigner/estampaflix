import { useMemo } from "react";
import { tField, useI18n } from "@/lib/i18n";
import { COLORS, FORMATS, type CatalogSearch } from "./catalog-constants";
import { FilterGroup, FilterOption } from "./filter-group";

type Props = {
  filters: CatalogSearch;
  categories: any[];
  tags: any[];
  onChange: (patch: Partial<CatalogSearch>) => void;
};

export function CatalogFilters({ filters, categories, tags, onChange }: Props) {
  const { t, lang } = useI18n();

  const orderedCategories = useMemo(() => {
    const roots = categories.filter((c: any) => !c.parent_id);
    const childrenBy: Record<string, any[]> = {};
    for (const c of categories as any[]) {
      if (c.parent_id) (childrenBy[c.parent_id] ??= []).push(c);
    }
    const out: Array<{ cat: any; depth: number }> = [];
    for (const r of roots) {
      out.push({ cat: r, depth: 0 });
      for (const child of childrenBy[r.id] ?? []) out.push({ cat: child, depth: 1 });
    }
    for (const c of categories as any[]) {
      if (c.parent_id && !categories.find((p: any) => p.id === c.parent_id)) {
        out.push({ cat: c, depth: 0 });
      }
    }
    return out;
  }, [categories]);

  return (
    <>
      <FilterGroup title={t("catalog.categories")}>
        <div className="space-y-1">
          {orderedCategories.map(({ cat: c, depth }) => {
            const nm = tField(c as any, "name", lang) || c.name;
            return (
              <FilterOption
                key={c.id}
                label={depth > 0 ? `— ${nm}` : nm}
                active={filters.categoria === c.slug}
                depth={depth}
                onClick={() => onChange({ categoria: filters.categoria === c.slug ? undefined : c.slug })}
              />
            );
          })}
        </div>
      </FilterGroup>

      <FilterGroup title={t("catalog.format")}>
        <div className="flex flex-wrap gap-1">
          {FORMATS.map((f) => (
            <button
              key={f}
              onClick={() => onChange({ formato: filters.formato === f ? undefined : f })}
              className={`rounded-md border px-2 py-1 text-xs uppercase transition-colors ${
                filters.formato === f ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </FilterGroup>


      {tags.length > 0 && (
        <FilterGroup title={t("catalog.tags")}>
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 20).map((tt: any) => {
              const nm = tField(tt, "name", lang) || tt.name;
              return (
                <button
                  key={tt.id}
                  onClick={() => onChange({ tag: filters.tag === tt.slug ? undefined : tt.slug })}
                  className={`rounded-full border px-2 py-0.5 text-xs transition-colors ${
                    filters.tag === tt.slug ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"
                  }`}
                >
                  {nm}
                </button>
              );
            })}
          </div>
        </FilterGroup>
      )}
    </>
  );
}
