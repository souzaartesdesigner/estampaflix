import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site-layout";
import { ArtworkCard } from "@/components/artwork-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";
import { useI18n, tField } from "@/lib/i18n";

const searchSchema = z.object({
  q: z.string().optional(),
  categoria: z.string().optional(),
  tag: z.string().optional(),
  formato: z.string().optional(),
  cor: z.string().optional(),
});

export const Route = createFileRoute("/catalogo")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Catálogo de artes digitais — EstampaHub" },
      { name: "description", content: "Explore milhares de artes digitais prontas para sublimação, DTF e estamparia. Filtre por categoria, formato, cor e tags e baixe em alta resolução." },
      { property: "og:title", content: "Catálogo de artes digitais — EstampaHub" },
      { property: "og:description", content: "Milhares de artes em 300 DPI para sublimação e DTF. Filtre por categoria, formato, cor e tags e baixe com licença comercial." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://loving-code-flow.lovable.app/catalogo" },
    ],
    links: [{ rel: "canonical", href: "https://loving-code-flow.lovable.app/catalogo" }],
  }),
  component: Catalogo,
});

const FORMATS = ["png", "jpg", "psd", "zip", "rar"];
const COLORS = [
  { key: "color.black", value: "black" },
  { key: "color.white", value: "white" },
  { key: "color.red", value: "red" },
  { key: "color.blue", value: "blue" },
  { key: "color.green", value: "green" },
  { key: "color.yellow", value: "yellow" },
  { key: "color.pink", value: "pink" },
  { key: "color.purple", value: "purple" },
];

function Catalogo() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [q, setQ] = useState(search.q ?? "");
  const { t, lang } = useI18n();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("id,slug,name,parent_id,translations").order("sort_order").order("name")).data ?? [],
  });
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
  const { data: tags = [] } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => (await supabase.from("tags").select("id,slug,name,translations").order("name")).data ?? [],
  });

  const filters = useMemo(() => search, [search]);

  const { data: artworks = [], isLoading } = useQuery({
    queryKey: ["catalog", filters],
    queryFn: async () => {
      let query = supabase
        .from("artworks")
        .select("id,slug,title,preview_url,price_cents,is_featured,is_trending,download_count,category_id,colors,file_format,translations,artwork_tags(tag_id,tags(slug))")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(60);

      if (filters.q) query = query.ilike("title", `%${filters.q}%`);
      if (filters.categoria) {
        const cat = categories.find((c: any) => c.slug === filters.categoria);
        if (cat) {
          const ids = [cat.id, ...categories.filter((c: any) => c.parent_id === cat.id).map((c: any) => c.id)];
          query = query.in("category_id", ids);
        }
      }
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

  function update(patch: Record<string, string | undefined>) {
    navigate({ to: "/catalogo", search: { ...filters, ...patch } as any });
  }

  const activeFilters = Object.entries(filters).filter(([, v]) => v);

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <header className="mb-6">
          <h1 className="font-display text-3xl font-bold md:text-4xl">{t("catalog.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("catalog.subtitle")}</p>
        </header>

        <form
          onSubmit={(e) => { e.preventDefault(); update({ q: q || undefined }); }}
          className="mb-6 flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("catalog.searchPlaceholder")} className="pl-9" />
          </div>
          <Button type="submit" className="bg-gradient-brand text-brand-foreground">{t("catalog.search")}</Button>
        </form>

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="space-y-6">
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
                      onClick={() => update({ categoria: filters.categoria === c.slug ? undefined : c.slug })}
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
                    onClick={() => update({ formato: filters.formato === f ? undefined : f })}
                    className={`rounded-md border px-2 py-1 text-xs uppercase transition-colors ${
                      filters.formato === f ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </FilterGroup>

            <FilterGroup title={t("catalog.colors")}>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    title={t(c.key)}
                    aria-label={t(c.key)}
                    onClick={() => update({ cor: filters.cor === c.value ? undefined : c.value })}
                    className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                      filters.cor === c.value ? "border-primary" : "border-border"
                    }`}
                    style={{ background: c.value }}
                  />
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
                        onClick={() => update({ tag: filters.tag === tt.slug ? undefined : tt.slug })}
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
          </aside>

          <div>
            {activeFilters.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                {activeFilters.map(([k, v]) => (
                  <Badge key={k} variant="secondary" className="gap-1">
                    {String(v)}
                    <button type="button" aria-label={`${t("catalog.removeFilter")} ${String(v)}`} onClick={() => update({ [k]: undefined })}><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            )}
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-square animate-pulse rounded-xl bg-surface" />
                ))}
              </div>
            ) : artworks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 p-12 text-center text-sm text-muted-foreground">
                {t("catalog.empty")}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {artworks.map((a: any) => <ArtworkCard key={a.id} artwork={a} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

function FilterOption({ label, active, depth = 0, onClick }: { label: string; active: boolean; depth?: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ paddingLeft: `${8 + depth * 12}px` }}
      className={`block w-full rounded-md py-1.5 pr-2 text-left text-sm transition-colors ${
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
