import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import {
  catalogSearchSchema,
  type CatalogSearch,
} from "@/features/catalog/catalog-constants";
import { CatalogFilters } from "@/features/catalog/catalog-filters";
import { CatalogResults } from "@/features/catalog/catalog-results";

export const Route = createFileRoute("/catalogo")({
  validateSearch: (search) => catalogSearchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Catálogo de artes digitais — Estampa Flix" },
      { name: "description", content: "Explore milhares de artes digitais prontas para sublimação, DTF e estamparia. Filtre por categoria, formato, cor e tags e baixe em alta resolução." },
      { property: "og:title", content: "Catálogo de artes digitais — Estampa Flix" },
      { property: "og:description", content: "Milhares de artes em 300 DPI para sublimação e DTF. Filtre por categoria, formato, cor e tags e baixe com licença comercial." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://estampaflix.com/catalogo" },
      { name: "keywords", content: "catálogo de artes para sublimação, estampas digitais prontas, arte para camiseta, arte para caneca, artes DTF, download de estampas" },
    ],
    links: [{ rel: "canonical", href: "https://estampaflix.com/catalogo" }],
  }),
  component: Catalogo,
});

function Catalogo() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [q, setQ] = useState(search.q ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { t } = useI18n();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("id,slug,name,parent_id,translations").order("sort_order").order("name")).data ?? [],
  });
  const { data: tags = [] } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => (await supabase.from("tags").select("id,slug,name,translations").order("name")).data ?? [],
  });
  const { data: formats = [] } = useQuery({
    queryKey: ["artwork-formats"],
    queryFn: async () => {
      const { data } = await supabase.from("artworks").select("file_format").eq("is_published", true).not("file_format", "is", null);
      const set = new Set<string>();
      for (const r of data ?? []) {
        const f = (r.file_format || "").trim().toLowerCase().replace(/^\./, "");
        if (f) set.add(f);
      }
      return Array.from(set).sort();
    },
  });


  const filters = useMemo(() => search, [search]);

  const { data: artworks = [], isLoading } = useQuery({
    queryKey: ["catalog", filters, categories.length],
    queryFn: async () => {
      let artworkIdsFilter: string[] | null = null;
      if (filters.categoria) {
        const cat = categories.find((c: any) => c.slug === filters.categoria);
        if (!cat) return [];
        const ids = [cat.id, ...categories.filter((c: any) => c.parent_id === cat.id).map((c: any) => c.id)];
        const { data: links } = await supabase
          .from("artwork_categories")
          .select("artwork_id")
          .in("category_id", ids);
        artworkIdsFilter = Array.from(new Set((links ?? []).map((l: any) => l.artwork_id)));
        if (artworkIdsFilter.length === 0) return [];
      }

      let query = supabase
        .from("artworks")
        .select("id,slug,title,preview_url,price_cents,is_featured,is_trending,download_count,category_id,colors,file_format,translations,categories!artworks_category_id_fkey(id,name,slug,translations),artwork_categories(categories(id,name,slug,translations)),artwork_tags(tag_id,tags(slug))")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(60);

      if (filters.q) query = query.ilike("title", `%${filters.q}%`);
      if (artworkIdsFilter) query = query.in("id", artworkIdsFilter);
      if (filters.formato) query = query.eq("file_format", filters.formato);
      if (filters.cor) query = query.contains("colors", [filters.cor]);
      const { data } = await query;
      let rows = data ?? [];
      if (filters.tag) {
        rows = rows.filter((r: any) => r.artwork_tags?.some((tt: any) => tt.tags?.slug === filters.tag));
      }
      return rows;
    },
  });


  function update(patch: Partial<CatalogSearch>) {
    navigate({ to: "/catalogo", search: { ...filters, ...patch } as any });
  }

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-4 sm:py-8">
        <header className="mb-5 sm:mb-6">
          <h1 className="font-display text-2xl font-bold sm:text-3xl md:text-4xl">{t("catalog.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("catalog.subtitle")}</p>
        </header>

        <form
          onSubmit={(e) => { e.preventDefault(); update({ q: q || undefined }); }}
          className="mb-4 flex gap-2 sm:mb-6"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("catalog.searchPlaceholder")} className="pl-9" />
          </div>
          <Button type="submit" className="bg-gradient-brand text-brand-foreground">{t("catalog.search")}</Button>
        </form>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setFiltersOpen((v) => !v)}
          className="mb-4 w-full justify-center gap-2 lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {filtersOpen ? t("catalog.hideFilters") ?? "Ocultar filtros" : t("catalog.showFilters") ?? "Filtros"}
        </Button>

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className={`${filtersOpen ? "block" : "hidden"} space-y-6 lg:block`}>
            <CatalogFilters filters={filters} categories={categories} tags={tags} formats={formats} onChange={update} />
          </aside>

          <CatalogResults
            filters={filters}
            artworks={artworks}
            isLoading={isLoading}
            onRemoveFilter={(k) => update({ [k]: undefined } as any)}
          />
        </div>
      </div>
    </SiteLayout>
  );
}
