import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/suporte")({ component: SuporteAdmin });

function SuporteAdmin() {
  const qc = useQueryClient();
  const { data: msgs = [] } = useQuery({
    queryKey: ["admin-support"],
    queryFn: async () => (await supabase.from("support_messages").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const [openId, setOpenId] = useState<string | null>(null);
  const [reply, setReply] = useState("");

  const save = useMutation({
    mutationFn: async ({ id, status, admin_reply }: any) => {
      const { error } = await supabase.from("support_messages").update({ status, admin_reply }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-support"] }); toast.success("Atualizado"); setOpenId(null); },
  });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">Mensagens de suporte</h1>
      <div className="space-y-3">
        {msgs.map((m: any) => (
          <div key={m.id} className="rounded-xl border border-border/60 bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{m.subject}</h3>
                  <Badge variant={m.status === "new" ? "default" : "secondary"}>{m.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">De {m.name} &lt;{m.email}&gt; em {formatDate(m.created_at)}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => { setOpenId(openId === m.id ? null : m.id); setReply(m.admin_reply ?? ""); }}>
                {openId === m.id ? "Fechar" : "Responder"}
              </Button>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm">{m.message}</p>
            {openId === m.id && (
              <div className="mt-4 space-y-2">
                <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} placeholder="Sua resposta..." />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => save.mutate({ id: m.id, status: "resolved", admin_reply: reply })} className="bg-gradient-brand text-brand-foreground">Marcar resolvido</Button>
                  <Button size="sm" variant="outline" onClick={() => save.mutate({ id: m.id, status: "in_progress", admin_reply: reply })}>Em andamento</Button>
                </div>
              </div>
            )}
          </div>
        ))}
        {msgs.length === 0 && <p className="rounded-xl border border-dashed border-border/60 p-12 text-center text-muted-foreground">Nenhuma mensagem ainda.</p>}
      </div>
    </div>
  );
}
