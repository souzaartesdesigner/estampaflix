import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Download, Loader2, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { createPixOrder } from "@/lib/mercadopago.functions";
import { useCart } from "@/hooks/use-cart";
import { formatBRL } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

type Props = {
  artwork: any;
  session: any;
  sub: any;
  owned: boolean | undefined;
};

export function ArtworkActions({ artwork, session, sub, owned }: Props) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const cart = useCart();
  const inCart = cart.contains(artwork.id);
  const canDownload = !!sub && (sub.credits_remaining ?? 0) > 0;

  const downloadMut = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("consume_download", { _artwork_id: artwork.id });
      if (error) throw error;
      const row: any = Array.isArray(data) ? data[0] : data;
      if (row?.external_url) {
        return { url: row.external_url as string, credits: row.credits_remaining, was_new: row.was_new, kind: "external" as const };
      }
      if (!row?.file_path) throw new Error(t("product.errFileUnavailable"));
      const { data: signed, error: sErr } = await supabase.storage
        .from("artwork-files")
        .createSignedUrl(row.file_path, 60, { download: true });
      if (sErr || !signed?.signedUrl) throw sErr ?? new Error(t("product.errFileUnavailable"));
      return { url: signed.signedUrl, credits: row.credits_remaining, was_new: row.was_new, kind: "file" as const };
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["my-subscription"] });
      if (res.kind === "external") {
        window.open(res.url, "_blank", "noopener,noreferrer");
      } else {
        const a = document.createElement("a");
        a.href = res.url;
        a.rel = "noopener";
        a.download = "";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      toast.success(res.was_new ? `${t("product.creditsReleased")} ${res.credits}` : t("product.alreadyDownloaded"));
    },
    onError: (err: any) => {
      const msg = err.message || "";
      if (msg.includes("no_credits")) toast.error(t("product.errNoCredits"));
      else if (msg.includes("no_active_subscription")) toast.error(t("product.errNoSub"));
      else if (msg.includes("not_authenticated")) { toast.error(t("product.errLogin")); navigate({ to: "/auth" }); }
      else toast.error(msg || t("account.errDownload"));
    },
  });

  const createPix = useServerFn(createPixOrder);
  const buyMut = useMutation({
    mutationFn: async () => {
      if (!session) {
        navigate({ to: "/auth" });
        throw new Error("not_authenticated");
      }
      return await createPix({ data: { artworkId: artwork.id } });
    },
    onSuccess: (res) => {
      navigate({ to: "/pagamento/pix/$orderId", params: { orderId: res.orderId } });
    },
    onError: (err: any) => {
      if (err?.message === "not_authenticated") return;
      toast.error(err?.message || t("product.errStartPayment"));
    },
  });

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-black">{formatBRL(artwork.price_cents)}</span>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {session ? (
          owned ? (
            <>
              <Button
                onClick={() => downloadMut.mutate()}
                disabled={downloadMut.isPending}
                className="bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-90"
              >
                <Download className="mr-2 h-4 w-4" />
                {downloadMut.isPending ? t("product.downloading") : t("product.download")}
              </Button>
              <p className="text-xs text-success">{t("product.owned")}</p>
            </>
          ) : (
            <>
              <Button
                onClick={() => downloadMut.mutate()}
                disabled={downloadMut.isPending || !canDownload}
                className="bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-90"
              >
                <Download className="mr-2 h-4 w-4" />
                {downloadMut.isPending ? t("product.downloading") : canDownload ? `${t("product.download")} (${sub!.credits_remaining} ${t("product.creditsRemaining")})` : t("product.downloadWithPlan")}
              </Button>
              {!sub && (
                <p className="text-xs text-muted-foreground">
                  {t("product.noSubscription")} <Link to="/planos" className="text-primary underline">{t("product.seePlans")}</Link>.
                </p>
              )}
              {sub && !canDownload && (
                <p className="text-xs text-warning">
                  {t("product.noCredits")} <Link to="/planos" className="text-primary underline">{t("product.upgrade")}</Link>.
                </p>
              )}
              <Button variant="outline" onClick={() => buyMut.mutate()} disabled={buyMut.isPending}>
                {buyMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
                {t("product.buyPix")} ({formatBRL(artwork.price_cents)})
              </Button>
              <Button
                variant="secondary"
                onClick={() => (inCart ? navigate({ to: "/carrinho" }) : cart.add(artwork.id))}
                disabled={cart.adding}
              >
                {inCart ? (
                  <><Check className="mr-2 h-4 w-4" /> {t("product.inCart")}</>
                ) : (
                  <><Plus className="mr-2 h-4 w-4" /> {t("product.addToCart")}</>
                )}
              </Button>
            </>
          )
        ) : (
          <Button asChild className="bg-gradient-brand text-brand-foreground shadow-brand">
            <Link to="/auth">{t("product.signInToDownload")}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export function useArtworkSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: async () => (await supabase.auth.getSession()).data.session,
  });
}

export function useMySubscription(userId: string | undefined) {
  return useQuery({
    queryKey: ["my-subscription", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("credits_remaining,status,current_period_end,plans(name,tier)")
        .eq("user_id", userId!)
        .eq("status", "active")
        .maybeSingle();
      return data;
    },
  });
}

export function useArtworkOwnership(userId: string | undefined, artworkId: string) {
  return useQuery({
    queryKey: ["artwork-owned", userId, artworkId],
    enabled: !!userId,
    queryFn: async () => {
      const [dl, ord] = await Promise.all([
        supabase.from("downloads").select("id").eq("user_id", userId!).eq("artwork_id", artworkId).maybeSingle(),
        supabase.from("orders").select("id").eq("user_id", userId!).eq("artwork_id", artworkId).eq("status", "paid").maybeSingle(),
      ]);
      return !!(dl.data || ord.data);
    },
  });
}
