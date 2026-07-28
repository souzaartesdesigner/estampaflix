import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/format";
import { useCart } from "@/hooks/use-cart";
import { Plus, Sparkles, Loader2, Check } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type Suggestion = {
  id: string;
  slug: string;
  title: string;
  preview_url: string;
  price_cents: number;
  category_id: string | null;
};

export function CartUpsell() {
  const { t } = useI18n();
  const cart = useCart();

  const cartIds = cart.items.map((i) => i.artwork_id);
  const categoryIds = Array.from(
    new Set(cart.items.map((i: any) => i.artworks?.category_id).filter(Boolean))
  ) as string[];

  const { data = [], isLoading } = useQuery({
    queryKey: ["cart-upsell", cartIds.sort().join(","), categoryIds.sort().join(",")],
    enabled: cart.items.length > 0,
    queryFn: async (): Promise<Suggestion[]> => {
      let q = supabase
        .from("artworks")
        .select("id,slug,title,preview_url,price_cents,category_id")
        .eq("is_published", true)
        .order("download_count", { ascending: false })
        .limit(8);
      if (cartIds.length) q = q.not("id", "in", `(${cartIds.join(",")})`);
      if (categoryIds.length) q = q.in("category_id", categoryIds);
      const { data } = await q;
      let list = (data ?? []) as Suggestion[];
      if (list.length < 4) {
        const { data: extra } = await supabase
          .from("artworks")
          .select("id,slug,title,preview_url,price_cents,category_id")
          .eq("is_published", true)
          .not("id", "in", `(${[...cartIds, ...list.map((l) => l.id)].join(",") || "''"})`)
          .order("download_count", { ascending: false })
          .limit(4 - list.length);
        list = [...list, ...((extra ?? []) as Suggestion[])];
      }
      return list.slice(0, 4);
    },
  });

  if (cart.items.length === 0) return null;
  if (isLoading || data.length === 0) return null;

  return (
    <section className="rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold sm:text-base">
          {t("cart.upsellTitle")}
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {data.map((a) => (
          <ArtworkCard key={a.id} artwork={a as any} />
        ))}
      </div>
    </section>
  );
}
