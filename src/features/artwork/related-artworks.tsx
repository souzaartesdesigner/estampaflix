import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArtworkCard } from "@/components/artwork-card";
import { useI18n } from "@/lib/i18n";

export function RelatedArtworks({ categoryId, currentId }: { categoryId: string | null; currentId: string }) {
  const { t } = useI18n();
  const { data } = useQuery({
    queryKey: ["related-artworks", categoryId, currentId],
    enabled: !!categoryId,
    queryFn: async () => {
      const { data } = await supabase
        .from("artworks")
        .select("id,slug,title,preview_url,price_cents,is_featured,is_trending,download_count,translations")
        .eq("is_published", true)
        .eq("category_id", categoryId!)
        .neq("id", currentId)
        .order("download_count", { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  if (!categoryId || !data || data.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="font-display text-2xl font-bold">{t("product.related")}</h2>
        <Link to="/catalogo" className="text-sm text-primary hover:underline">{t("product.seeMore")}</Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {data.map((a: any) => (
          <ArtworkCard key={a.id} artwork={a} />
        ))}
      </div>
    </section>
  );
}
