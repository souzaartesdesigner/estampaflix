import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { PlansLanding } from "@/features/plans/plans-landing";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/format";
import { createCheckoutSession } from "@/lib/stripe.functions";
import { toast } from "sonner";
import { Check, Zap, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const plansQuery = queryOptions({
  queryKey: ["plans"],
  queryFn: async () => (await supabase.from("plans").select("*").eq("is_active", true).order("sort_order")).data ?? [],
});

export const Route = createFileRoute("/planos")({
  loader: ({ context }) => context.queryClient.ensureQueryData(plansQuery),
  head: () => ({
    meta: [
      { title: "Planos de assinatura — Estampa Flix" },
      { name: "description", content: "Compare os planos Lite, Pro e Plus da Estampa Flix: créditos mensais para baixar artes digitais em alta resolução, licença comercial e cancelamento a qualquer momento." },
      { property: "og:title", content: "Planos de assinatura — Estampa Flix" },
      { property: "og:description", content: "Escolha entre Lite, Pro e Plus. Créditos mensais para baixar artes em 300 DPI com licença comercial. Cancele quando quiser." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://estampaflix.com/planos" },
      { name: "keywords", content: "assinatura de artes para sublimação, planos de estampas digitais, pacote de artes DTF, créditos para download" },
    ],
    links: [{ rel: "canonical", href: "https://estampaflix.com/planos" }],
  }),
  component: Planos,
});

function Planos() {
  const { data: plans } = useSuspenseQuery(plansQuery);
  const checkoutFn = useServerFn(createCheckoutSession);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { t } = useI18n();

  async function handleSubscribe(planId: string) {
    setLoadingId(planId);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        window.location.href = `/auth?redirect=${encodeURIComponent("/planos")}`;
        return;
      }
      const { url } = await checkoutFn({ data: { planId } });
      if (url) window.location.href = url;
      else throw new Error(t("plans.checkoutUrlMissing"));
    } catch (err: any) {
      toast.error(err?.message ?? t("plans.checkoutError"));
      setLoadingId(null);
    }
  }

  return (
    <SiteLayout>
      <section className="relative">
        <div className="mx-auto w-full max-w-5xl px-4 py-10 text-center sm:py-16">
          <Badge className="mb-4 bg-primary/15 text-primary border-primary/30">{t("plans.badge")}</Badge>
          <h1 className="font-display text-3xl font-black sm:text-4xl md:text-5xl">{t("plans.title")}</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">{t("plans.subtitle")}</p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-3 py-8 sm:px-4 sm:py-12">
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {plans.map((plan, idx) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-5 sm:p-6 ${
                idx === 1 ? "border-primary/60 bg-card shadow-brand sm:col-span-2 lg:col-span-1" : "border-border/60 bg-card"
              }`}
            >
              {idx === 1 && (
                <Badge className="absolute right-4 top-4 bg-gradient-brand text-brand-foreground border-0"><Zap className="mr-1 h-3 w-3" /> {t("plans.popular")}</Badge>
              )}
              <h2 className="font-display text-xl font-bold">{plan.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              <div className="mt-4 flex flex-wrap items-baseline gap-1">
                <span className="text-3xl font-black sm:text-4xl">{formatBRL(plan.price_cents)}</span>
                <span className="text-sm text-muted-foreground">{t("plans.perMonth")}</span>
              </div>
              <div className="mt-2 text-sm font-medium text-primary">{plan.monthly_credits} {t("plans.downloadsPerMonth")}</div>
              <ul className="mt-4 flex flex-1 flex-col gap-2 text-sm">
                {(plan.features as string[]).map((f: string) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loadingId !== null}
                className="mt-6 bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-90"
              >
                {loadingId === plan.id ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("plans.redirecting")}</>
                ) : (
                  t("plans.subscribeNow")
                )}
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">{t("plans.securePayment")}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-border/60 bg-card p-8">
          <h2 className="font-display text-2xl font-bold">{t("plans.howTitle")}</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {[
              { title: t("plans.step1Title"), desc: t("plans.step1Desc") },
              { title: t("plans.step2Title"), desc: t("plans.step2Desc") },
              { title: t("plans.step3Title"), desc: t("plans.step3Desc") },
            ].map((s) => (
              <div key={s.title}>
                <h3 className="font-semibold text-primary">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

// Link import kept in case future navigation is added
void Link;
