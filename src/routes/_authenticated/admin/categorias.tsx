import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { slugify } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/categorias")({ component: Categorias });

function Categorias() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const { data: items = [] } = useQuery({
    queryKey: ["admin-categories-list"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order").order("name")).data ?? [],
  });
  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("categories").insert({ name, slug: slugify(name) });
      if (error) throw error;
    },
    onSuccess: () => { setName(""); qc.invalidateQueries({ queryKey: ["admin-categories-list"] }); toast.success("Categoria criada"); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("categories").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-categories-list"] }),
  });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">Categorias</h1>
      <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) add.mutate(); }} className="mb-6 flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da categoria" />
        <Button type="submit" className="bg-gradient-brand text-brand-foreground">Adicionar</Button>
      </form>
      <div className="overflow-hidden rounded-xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3 text-left">Nome</th><th className="px-4 py-3 text-left">Slug</th><th></th></tr></thead>
          <tbody>
            {items.map((c: any) => (
              <tr key={c.id} className="border-t border-border/40">
                <td className="px-4 py-3">{c.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.slug}</td>
                <td className="px-4 py-3 text-right"><Button size="icon" variant="ghost" onClick={() => del.mutate(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
