import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { formatDistanceToNow } from "date-fns";
import { ptBR, enUS, es } from "date-fns/locale";

type Review = {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles?: { full_name: string | null; email: string | null } | null;
};

export function ArtworkReviews({ artworkId }: { artworkId: string }) {
  const qc = useQueryClient();
  const { t, lang } = useI18n();
  const locale = lang === "pt" ? ptBR : lang === "es" ? es : enUS;

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => (await supabase.auth.getSession()).data.session,
  });
  const uid = session?.user.id;

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", artworkId],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id,user_id,rating,comment,created_at,profiles(full_name,email)")
        .eq("artwork_id", artworkId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      return (data ?? []) as unknown as Review[];
    },
  });

  const { data: canReview } = useQuery({
    queryKey: ["can-review", uid, artworkId],
    enabled: !!uid,
    queryFn: async () => {
      const { data } = await supabase.rpc("has_purchased_or_downloaded", { _user_id: uid!, _artwork_id: artworkId });
      return !!data;
    },
  });

  const mine = reviews.find((r) => r.user_id === uid);
  const [rating, setRating] = useState<number>(mine?.rating ?? 5);
  const [comment, setComment] = useState(mine?.comment ?? "");
  useEffect(() => {
    if (mine) {
      setRating(mine.rating);
      setComment(mine.comment ?? "");
    }
  }, [mine?.id]);

  const submit = useMutation({
    mutationFn: async () => {
      if (!uid) throw new Error("not_authenticated");
      const payload = { user_id: uid, artwork_id: artworkId, rating, comment: comment.trim() || null };
      const { error } = await supabase.from("reviews").upsert(payload, { onConflict: "user_id,artwork_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", artworkId] });
      toast.success(t("product.reviewSubmit"));
    },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });

  const del = useMutation({
    mutationFn: async () => {
      if (!mine) return;
      const { error } = await supabase.from("reviews").delete().eq("id", mine.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", artworkId] });
      setRating(5);
      setComment("");
      toast.success("Removida");
    },
  });

  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;

  return (
    <section className="mt-12 rounded-2xl border border-border/60 bg-card p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">{t("product.reviews")}</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`h-4 w-4 ${s <= Math.round(avg) ? "fill-primary text-primary" : "text-muted-foreground"}`} />
              ))}
            </div>
            <span className="font-semibold">{avg.toFixed(1)}</span>
            <span className="text-muted-foreground">({reviews.length})</span>
          </div>
        )}
      </div>

      {/* Write review */}
      {uid && (
        <div className="mb-6 rounded-xl border border-border/60 bg-surface/40 p-4">
          <p className="mb-3 text-sm font-medium">{t("product.reviewYours")}</p>
          {canReview ? (
            <>
              <div className="mb-3 flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    aria-label={`${s} estrelas`}
                    className="transition-transform hover:scale-110"
                  >
                    <Star className={`h-7 w-7 ${s <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t("product.reviewComment")}
                rows={3}
                className="mb-3"
              />
              <div className="flex gap-2">
                <Button onClick={() => submit.mutate()} disabled={submit.isPending} className="bg-gradient-brand text-brand-foreground">
                  {mine ? t("product.reviewUpdate") : t("product.reviewSubmit")}
                </Button>
                {mine && (
                  <Button variant="ghost" size="sm" onClick={() => del.mutate()}>
                    <Trash2 className="mr-1 h-4 w-4" /> {t("product.reviewDelete")}
                  </Button>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t("product.reviewGate")}</p>
          )}
        </div>
      )}

      {/* List */}
      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("product.reviewsEmpty")}</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => {
            const name = r.profiles?.full_name || r.profiles?.email?.split("@")[0] || "Cliente";
            return (
              <div key={r.id} className="rounded-xl border border-border/50 bg-surface/30 p-4">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-semibold">{name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale })}
                  </span>
                </div>
                <div className="mb-2 flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`h-4 w-4 ${s <= r.rating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                  ))}
                </div>
                {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
