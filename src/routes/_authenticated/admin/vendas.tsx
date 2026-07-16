import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatBRL, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/vendas")({ component: Vendas });

function Vendas() {
  const { data } = useQuery({
    queryKey: ["admin-sales"],
    queryFn: async () => {
      const [{ data: orders }, { data: subs }, { data: profiles }] = await Promise.all([
        supabase.from("orders").select("*, artworks(title)").order("created_at", { ascending: false }).limit(100),
        supabase.from("subscriptions").select("*, plans(name,price_cents,monthly_credits)").order("created_at", { ascending: false }).limit(100),
        supabase.from("profiles").select("id,email,full_name"),
      ]);
      const pmap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      return {
        orders: (orders ?? []).map((o: any) => ({ ...o, profile: pmap.get(o.user_id) })),
        subs: (subs ?? []).map((s: any) => ({ ...s, profile: pmap.get(s.user_id) })),
      };
    },
  });

  const orderRev = (data?.orders ?? []).filter((o: any) => o.status === "paid").reduce((a: number, b: any) => a + b.amount_cents, 0);
  const subRev = (data?.subs ?? []).filter((s: any) => s.status === "active").reduce((a: number, b: any) => a + (b.plans?.price_cents ?? 0), 0);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">Vendas</h1>
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card label="Compras avulsas (total)" value={formatBRL(orderRev)} />
        <Card label="Assinaturas ativas (MRR)" value={formatBRL(subRev)} />
        <Card label="Total mensal" value={formatBRL(orderRev + subRev)} accent />
      </div>

      <h2 className="mb-2 font-display text-lg font-bold">Assinaturas ativas</h2>
      <div className="mb-8 overflow-hidden rounded-xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3 text-left">Cliente</th><th className="px-4 py-3 text-left">Plano</th><th className="px-4 py-3 text-left">Créditos</th><th className="px-4 py-3 text-left">Renova em</th></tr></thead>
          <tbody>
            {(data?.subs ?? []).map((s: any) => (
              <tr key={s.id} className="border-t border-border/40">
                <td className="px-4 py-3">{s.profiles?.email ?? "—"}</td>
                <td className="px-4 py-3">{s.plans?.name}</td>
                <td className="px-4 py-3">{s.credits_remaining}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(s.current_period_end)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-2 font-display text-lg font-bold">Compras avulsas</h2>
      <div className="overflow-hidden rounded-xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3 text-left">Cliente</th><th className="px-4 py-3 text-left">Arte</th><th className="px-4 py-3 text-left">Valor</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Data</th></tr></thead>
          <tbody>
            {(data?.orders ?? []).map((o: any) => (
              <tr key={o.id} className="border-t border-border/40">
                <td className="px-4 py-3">{o.profiles?.email ?? "—"}</td>
                <td className="px-4 py-3">{o.artworks?.title}</td>
                <td className="px-4 py-3">{formatBRL(o.amount_cents)}</td>
                <td className="px-4 py-3"><Badge variant={o.status === "paid" ? "default" : "secondary"}>{o.status}</Badge></td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(o.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ label, value, accent }: any) {
  return (
    <div className={`rounded-xl border p-5 ${accent ? "border-primary/40 bg-card shadow-brand" : "border-border/60 bg-card"}`}>
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}
