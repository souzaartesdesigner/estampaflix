import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ARTWORK_COLS =
  "id,slug,title,preview_url,price_cents,is_featured,is_trending,download_count,translations";

export const homeQuery = queryOptions({
  queryKey: ["home-data"],
  queryFn: async () => {
    const nowIso = new Date().toISOString();
    const [
      { data: featured },
      { data: recent },
      { data: trending },
      { data: popular },
      { data: categories },
      { data: plans },
      { data: sections },
      { data: heroBanners },
      { data: middleBanners },
    ] = await Promise.all([
      supabase.from("artworks").select(ARTWORK_COLS).eq("is_published", true).eq("is_featured", true).order("featured_order", { ascending: true }).limit(12),
      supabase.from("artworks").select(ARTWORK_COLS).eq("is_published", true).order("created_at", { ascending: false }).limit(12),
      supabase.from("artworks").select(ARTWORK_COLS).eq("is_published", true).eq("is_trending", true).limit(8),
      supabase.from("artworks").select(ARTWORK_COLS).eq("is_published", true).order("download_count", { ascending: false }).limit(12),
      supabase.from("categories").select("id,slug,name,cover_url,translations").order("sort_order").limit(12),
      supabase.from("plans").select("*").eq("is_active", true).order("sort_order"),
      (supabase as any).from("home_sections").select("*").eq("is_active", true).order("sort_order"),
      (supabase as any).from("banners").select("*").eq("is_active", true).eq("position", "home_hero").order("sort_order"),
      (supabase as any).from("banners").select("*").eq("is_active", true).eq("position", "home_middle").order("sort_order"),
    ]);

    const filterWindow = (b: any) =>
      (!b.starts_at || b.starts_at <= nowIso) && (!b.ends_at || b.ends_at >= nowIso);

    const cats = categories ?? [];
    const catsWithSamples = await Promise.all(
      cats.map(async (c) => {
        const [{ data: samples }, { count }] = await Promise.all([
          supabase.from("artworks").select("id,preview_url").eq("is_published", true).eq("category_id", c.id).order("created_at", { ascending: false }).limit(4),
          supabase.from("artworks").select("id", { count: "exact", head: true }).eq("is_published", true).eq("category_id", c.id),
        ]);
        return { ...c, samples: samples ?? [], count: count ?? 0 };
      })
    );

    // Prefetch items for "category"-typed sections
    const sectionsList = (sections ?? []) as any[];
    const categorySections = sectionsList.filter((s) => s.section_type === "category" && s.category_id);
    const catItemsEntries = await Promise.all(
      categorySections.map(async (s) => {
        const { data } = await supabase
          .from("artworks")
          .select(ARTWORK_COLS)
          .eq("is_published", true)
          .eq("category_id", s.category_id)
          .order("created_at", { ascending: false })
          .limit(s.item_limit ?? 8);
        return [s.id, data ?? []] as const;
      })
    );
    const categoryItems: Record<string, any[]> = Object.fromEntries(catItemsEntries);

    return {
      featured: featured ?? [],
      recent: recent ?? [],
      trending: trending ?? [],
      popular: popular ?? [],
      categories: catsWithSamples,
      plans: plans ?? [],
      sections: sectionsList,
      heroBanners: (heroBanners ?? []).filter(filterWindow),
      middleBanners: (middleBanners ?? []).filter(filterWindow),
      categoryItems,
    };
  },
});
