import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ARTWORK_COLS =
  "id,slug,title,preview_url,price_cents,is_featured,is_trending,download_count,translations";

export const homeQuery = queryOptions({
  queryKey: ["home-data"],
  queryFn: async () => {
    const [{ data: featured }, { data: recent }, { data: trending }, { data: categories }, { data: plans }] =
      await Promise.all([
        supabase.from("artworks").select(ARTWORK_COLS).eq("is_published", true).eq("is_featured", true).limit(8),
        supabase.from("artworks").select(ARTWORK_COLS).eq("is_published", true).order("created_at", { ascending: false }).limit(12),
        supabase.from("artworks").select(ARTWORK_COLS).eq("is_published", true).eq("is_trending", true).limit(8),
        supabase.from("categories").select("id,slug,name,cover_url,translations").order("sort_order").limit(12),
        supabase.from("plans").select("*").eq("is_active", true).order("sort_order"),
      ]);
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
    return {
      featured: featured ?? [],
      recent: recent ?? [],
      trending: trending ?? [],
      categories: catsWithSamples,
      plans: plans ?? [],
    };
  },
});
