import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/format";
import { Check, Zap } from "lucide-react";

const plansQuery = queryOptions({
  queryKey: ["plans"],
  queryFn: async () => (await supabase.from("plans").select("*").eq("is_active", true).order("sort_order")).data ?? [],
});

export const Route = createFileRoute("/planos")({
  loader: ({ context }) => context.queryClient.ensureQueryData(plansQuery),
  head: () => ({ meta: [{ title: "Planos — EstampaHub" }, { name: "description", content: "Compare os planos Premium Lite, Pro e Plus." }] }),
  component: Planos,
});

function Planos() {
  const { data: plans } = useSuspenseQuery(plansQuery);
  return (
    <SiteLayout>
      <section className="bg-gradient-hero">
        <div className="mx-auto w-full max-w-5xl px-4 py-16 text-center">
          <Badge className="mb-4 bg-primary/15 text-primary border-primary/30">Assinatura mensal</Badge>
          <h1 className="font-display text-4xl font-black md:text-5xl">Escolha seu plano</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Créditos mensais para baixar as artes que quiser. Cancele quando quiser, sem burocracia.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan, idx) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                idx === 1 ? "border-primary/60 bg-card shadow-brand" : "border-border/60 bg-card"
              }`}
            >
              {idx === 1 && (
                <Badge className="absolute right-4 top-4 bg-gradient-brand text-brand-foreground border-0"><Zap className="mr-1 h-3 w-3" /> Popular</Badge>
              )}
              <h3 className="font-display text-xl font-bold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-black">{formatBRL(plan.price_cents)}</span>
                <span className="text-sm text-muted-foreground">/mês</span>
              </div>
              <div className="mt-2 text-sm font-medium text-primary">{plan.monthly_credits} downloads / mês</div>
              <ul className="mt-4 flex flex-1 flex-col gap-2 text-sm">
                {(plan.features as string[]).map((f: string) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {f}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-6 bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-90">
                <Link to="/auth" search={{ plan: plan.tier } as any}>Assinar agora</Link>
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">Pagamento em breve via Stripe</p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-border/60 bg-card p-8">
          <h2 className="font-display text-2xl font-bold">Como funciona</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {[
              { t: "1. Escolha seu plano", d: "Selecione Lite, Pro ou Plus com base no volume mensal que você precisa." },
              { t: "2. Baixe suas artes", d: "Cada download consome 1 crédito. Downloads repetidos da mesma arte não descontam." },
              { t: "3. Renovação automática", d: "Todo mês seus créditos são renovados. Cancele quando quiser." },
            ].map((s) => (
              <div key={s.t}>
                <h3 className="font-semibold text-primary">{s.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
