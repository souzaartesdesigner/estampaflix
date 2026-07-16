import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2, Pencil, ImageIcon } from "lucide-react";
import { slugify } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/categorias")({ component: Categorias });

function Categorias() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<any>(null);

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
          <thead className="bg-surface-2 text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3 text-left">Imagem</th><th className="px-4 py-3 text-left">Nome</th><th className="px-4 py-3 text-left">Slug</th><th></th></tr></thead>
          <tbody>
            {items.map((c: any) => (
              <tr key={c.id} className="border-t border-border/40">
                <td className="px-4 py-3">
                  {c.cover_url ? (
                    <img src={c.cover_url} alt="" className="h-12 w-12 rounded object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded bg-surface-2 text-muted-foreground"><ImageIcon className="h-5 w-5" /></div>
                  )}
                </td>
                <td className="px-4 py-3">{c.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.slug}</td>
                <td className="px-4 py-3 text-right">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(c)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm("Excluir categoria?")) del.mutate(c.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && <EditCategory key={editing.id} category={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function EditCategory({ category, onClose }: { category: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: category.name ?? "",
    slug: category.slug ?? "",
    description: category.description ?? "",
    cover_url: category.cover_url ?? "",
    featured: category.featured ?? false,
  });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      let cover_url = form.cover_url;
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `categories/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("artwork-previews").upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        cover_url = supabase.storage.from("artwork-previews").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from("categories").update({
        name: form.name,
        slug: form.slug || slugify(form.name),
        description: form.description || null,
        cover_url: cover_url || null,
        featured: form.featured,
      }).eq("id", category.id);
      if (error) throw error;
      toast.success("Categoria atualizada");
      qc.invalidateQueries({ queryKey: ["admin-categories-list"] });
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao salvar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Editar categoria</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-2"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="grid gap-2"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
          <div className="grid gap-2"><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
          <div className="grid gap-2">
            <Label>Imagem da categoria</Label>
            {form.cover_url && <img src={form.cover_url} alt="" className="h-32 w-full rounded object-cover" />}
            <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <Input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} placeholder="ou cole uma URL https://..." />
          </div>
          <Button type="submit" disabled={busy} className="w-full bg-gradient-brand text-brand-foreground">{busy ? "Salvando..." : "Salvar"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
