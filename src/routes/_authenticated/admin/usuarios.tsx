import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/usuarios")({ component: Users });

function Users() {
  const { data: rows = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      const { data: subs } = await supabase.from("subscriptions").select("user_id,plans(name),status,credits_remaining");
      const { data: roles } = await supabase.from("user_roles").select("user_id,role");
      const byUser = new Map<string, any>();
      (profiles ?? []).forEach((p: any) => byUser.set(p.id, { ...p, subscription: null, roles: [] }));
      (subs ?? []).forEach((s: any) => { const u = byUser.get(s.user_id); if (u && s.status === "active") u.subscription = s; });
      (roles ?? []).forEach((r: any) => { const u = byUser.get(r.user_id); if (u) u.roles.push(r.role); });
      return Array.from(byUser.values());
    },
  });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">Usuários</h1>
      <div className="overflow-hidden rounded-xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-xs uppercase text-muted-foreground">
            <tr><th className="px-4 py-3 text-left">Nome</th><th className="px-4 py-3 text-left">E-mail</th><th className="px-4 py-3 text-left">Plano</th><th className="px-4 py-3 text-left">Papéis</th><th className="px-4 py-3 text-left">Criado em</th></tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-t border-border/40">
                <td className="px-4 py-3">{u.full_name ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3">{u.subscription ? <Badge>{u.subscription.plans?.name} • {u.subscription.credits_remaining} cr.</Badge> : "—"}</td>
                <td className="px-4 py-3 flex gap-1">{u.roles.map((r: string) => <Badge key={r} variant={r === "admin" ? "default" : "secondary"}>{r}</Badge>)}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
