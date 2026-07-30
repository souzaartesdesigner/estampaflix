import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Trash2, Eye, EyeOff, Tag, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { ArtworkForm } from "@/features/admin/artes/artwork-form";
import { ArtworksTable } from "@/features/admin/artes/artworks-table";

export const Route = createFileRoute("/_authenticated/admin/artes")({ component: Artes });

function Artes() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [bulkAction, setBulkAction] = useState<"" | "price" | "category" | "credit_cost">("");
  const [bulkValue, setBulkValue] = useState<string>("");
  const [bulkOpen, setBulkOpen] = useState(false);

  const { data: artworks = [] } = useQuery({
    queryKey: ["admin-artworks"],
    queryFn: async () => (await supabase.from("artworks").select("id,slug,title,description,category_id,preview_url,file_path,file_format,colors,price_cents,license_type,is_published,is_featured,is_trending,download_count,view_count,created_at,updated_at,credit_cost,gallery_urls,translations,featured_order,seo_title,seo_description,seo_keyword,product_code,alt_text,noindex,tech_specs,resolution,dimensions,usage_instructions,license_text, categories!artworks_category_id_fkey(name), artwork_categories(category_id)").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => (await supabase.from("categories").select("id,name,parent_id").order("name")).data ?? [],
  });

  const filtered = useMemo(() => {
    if (!search) return artworks;
    const t = search.toLowerCase();
    return artworks.filter((a: any) => a.title?.toLowerCase().includes(t) || a.categories?.name?.toLowerCase().includes(t));
  }, [artworks, search]);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("artworks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-artworks"] }); toast.success("Arte excluída"); },
    onError: (e: any) => toast.error(e.message),
  });

  const bulkUpdate = useMutation({
    mutationFn: async (patch: Record<string, any>) => {
      const { error } = await (supabase.from("artworks") as any).update(patch).in("id", selected);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-artworks"] }); toast.success("Artes atualizadas"); setSelected([]); setBulkOpen(false); setBulkValue(""); setBulkAction(""); },
    onError: (e: any) => toast.error(e.message),
  });

  const bulkAddCategory = useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await (supabase.from("artwork_categories") as any).upsert(
        selected.map((id) => ({ artwork_id: id, category_id: categoryId })),
        { onConflict: "artwork_id,category_id" }
      );
      if (error) throw error;
      // Define como principal quando a arte ainda não tem categoria principal
      await (supabase.from("artworks") as any).update({ category_id: categoryId }).in("id", selected).is("category_id", null);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-artworks"] }); toast.success("Categoria adicionada"); setSelected([]); setBulkOpen(false); setBulkValue(""); setBulkAction(""); },
    onError: (e: any) => toast.error(e.message),
  });

  const bulkDelete = useMutation({

    mutationFn: async () => {
      const { error } = await supabase.from("artworks").delete().in("id", selected);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-artworks"] }); toast.success("Artes excluídas"); setSelected([]); },
    onError: (e: any) => toast.error(e.message),
  });

  function toggle(id: string) {
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  }
  function toggleAll() {
    setSelected((s) => s.length === filtered.length ? [] : filtered.map((a: any) => a.id));
  }

  function applyBulk() {
    if (bulkAction === "price") {
      const cents = Math.round(parseFloat(bulkValue.replace(",", ".")) * 100);
      if (!Number.isFinite(cents) || cents < 0) return toast.error("Preço inválido");
      bulkUpdate.mutate({ price_cents: cents });
    } else if (bulkAction === "category") {
      if (!bulkValue) return toast.error("Selecione a categoria");
      bulkAddCategory.mutate(bulkValue);
    } else if (bulkAction === "credit_cost") {
      const c = parseInt(bulkValue, 10);
      if (!Number.isFinite(c) || c < 0) return toast.error("Valor inválido");
      bulkUpdate.mutate({ credit_cost: c });
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Artes</h1>
        <div className="flex gap-2">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar…" className="w-56" />
          <Button onClick={() => { setEditing(null); setOpen(true); }} className="bg-gradient-brand text-brand-foreground">
            <Plus className="mr-2 h-4 w-4" /> Nova arte
          </Button>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-primary/40 bg-primary/5 p-3">
          <span className="text-sm font-medium">{selected.length} selecionadas</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => bulkUpdate.mutate({ is_published: true })}><Eye className="mr-1 h-3 w-3" /> Publicar</Button>
            <Button size="sm" variant="outline" onClick={() => bulkUpdate.mutate({ is_published: false })}><EyeOff className="mr-1 h-3 w-3" /> Despublicar</Button>
            <Button size="sm" variant="outline" onClick={() => { setBulkAction("price"); setBulkOpen(true); }}><DollarSign className="mr-1 h-3 w-3" /> Alterar preço</Button>
            <Button size="sm" variant="outline" onClick={() => { setBulkAction("category"); setBulkOpen(true); }}><Tag className="mr-1 h-3 w-3" /> Adicionar categoria</Button>
            <Button size="sm" variant="outline" onClick={() => { setBulkAction("credit_cost"); setBulkOpen(true); }}>Créditos</Button>
            <Button size="sm" variant="destructive" onClick={() => { if (confirm(`Excluir ${selected.length} artes?`)) bulkDelete.mutate(); }}><Trash2 className="mr-1 h-3 w-3" /> Excluir</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected([])}>Limpar</Button>
          </div>
        </div>
      )}

      <ArtworksTable
        artworks={filtered}
        onEdit={(a) => { setEditing(a); setOpen(true); }}
        onDelete={(id) => del.mutate(id)}
        selected={selected}
        onToggle={toggle}
        onToggleAll={toggleAll}
      />

      {open && (
        <ArtworkForm key={editing?.id ?? "new"} open={open} onOpenChange={setOpen} editing={editing} categories={categories} />
      )}

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkAction === "price" && "Alterar preço em massa"}
              {bulkAction === "category" && "Adicionar categoria em massa"}
              {bulkAction === "credit_cost" && "Alterar custo em créditos"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{selected.length} artes serão atualizadas.</p>
            {bulkAction === "price" && (
              <Input type="number" step="0.01" min="0" value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} placeholder="Ex: 9.90" />
            )}
            {bulkAction === "credit_cost" && (
              <Input type="number" min="0" value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} placeholder="Ex: 1" />
            )}
            {bulkAction === "category" && (
              <Select value={bulkValue} onValueChange={setBulkValue}>
                <SelectTrigger><SelectValue placeholder="Selecionar categoria" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancelar</Button>
            <Button onClick={applyBulk} disabled={bulkUpdate.isPending} className="bg-gradient-brand text-brand-foreground">Aplicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
