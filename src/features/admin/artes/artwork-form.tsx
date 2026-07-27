import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/format";
import { FORMAT_SUGGESTIONS, normalizeFormat } from "@/features/catalog/catalog-constants";


type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: any;
  categories: any[];
};

async function uploadFile(file: File, bucket: string, folder: string) {
  const ext = file.name.split(".").pop();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) throw error;
  if (bucket === "artwork-previews") {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }
  return path;
}

export function ArtworkForm({ open, onOpenChange, editing, categories }: Props) {
  const qc = useQueryClient();
  const isEdit = !!editing;
  const [form, setForm] = useState<any>({
    title: editing?.title ?? "",
    description: editing?.description ?? "",
    slug: editing?.slug ?? "",
    category_id: editing?.category_id ?? "",
    preview_url: editing?.preview_url ?? "",
    file_path: editing?.file_path ?? "",
    external_url: editing?.external_url ?? "",
    file_format: editing?.file_format ?? "png",
    price_cents: editing?.price_cents ?? 990,
    credit_cost: editing?.credit_cost ?? 1,
    is_published: editing?.is_published ?? true,
    is_featured: editing?.is_featured ?? false,
    is_trending: editing?.is_trending ?? false,
    colors: (editing?.colors ?? []).join(","),
    gallery_urls: (editing?.gallery_urls ?? []) as string[],
    translations: (editing?.translations ?? {}) as Record<string, { title?: string; description?: string }>,
  });
  const [categoryIds, setCategoryIds] = useState<string[]>(() => {
    const linked: string[] = (editing?.artwork_categories ?? []).map((r: any) => r.category_id).filter(Boolean);
    const all = new Set<string>(linked);
    if (editing?.category_id) all.add(editing.category_id);
    return Array.from(all);
  });
  const [sourceType, setSourceType] = useState<"upload" | "external">(
    editing?.external_url ? "external" : "upload"
  );
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [artFile, setArtFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);


  const { data: knownFormats = [] } = useQuery({
    queryKey: ["admin-artwork-formats"],
    queryFn: async () => {
      const { data } = await supabase.from("artworks").select("file_format").not("file_format", "is", null);
      const set = new Set<string>(FORMAT_SUGGESTIONS);
      for (const r of data ?? []) {
        const f = normalizeFormat(r.file_format || "");
        if (f) set.add(f);
      }
      return Array.from(set).sort();
    },
  });


  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      let preview_url = form.preview_url;
      let file_path = form.file_path;
      let external_url: string | null = form.external_url?.trim() || null;

      if (previewFile) preview_url = await uploadFile(previewFile, "artwork-previews", "arts");
      if (!preview_url) throw new Error("Adicione uma imagem de preview (URL ou upload).");

      const gallery_urls = [...(form.gallery_urls ?? [])];
      for (const gf of galleryFiles) {
        const url = await uploadFile(gf, "artwork-previews", "gallery");
        gallery_urls.push(url);
      }

      if (sourceType === "external") {
        if (!external_url) throw new Error("Informe o link do Google Drive (ou externo).");
        file_path = null as any;
      } else {
        external_url = null;
        if (artFile) file_path = await uploadFile(artFile, "artwork-files", "arts");
        if (!file_path) throw new Error("Envie o arquivo para download.");
      }

      const payload = {
        title: form.title,
        description: form.description,
        slug: form.slug || slugify(form.title),
        category_id: form.category_id || null,
        preview_url,
        file_path,
        external_url,
        file_format: normalizeFormat(form.file_format) || null,
        price_cents: Number(form.price_cents),
        credit_cost: Number(form.credit_cost),
        is_published: form.is_published,
        is_featured: form.is_featured,
        is_trending: form.is_trending,
        colors: form.colors.split(",").map((s: string) => s.trim()).filter(Boolean),
        gallery_urls,
        translations: form.translations,
      };

      const { error } = isEdit
        ? await supabase.from("artworks").update(payload).eq("id", editing.id)
        : await supabase.from("artworks").insert(payload);
      if (error) throw error;
      toast.success(isEdit ? "Arte atualizada" : "Arte criada");
      qc.invalidateQueries({ queryKey: ["admin-artworks"] });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao salvar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{isEdit ? "Editar arte" : "Nova arte"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-2"><Label>Título</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
          <div className="grid gap-2"><Label>Slug (URL)</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="deixe vazio para gerar automaticamente" /></div>
          <div className="grid gap-2"><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Categoria</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Formato</Label>
              <Input
                list="artwork-format-options"
                value={form.file_format}
                onChange={(e) => setForm({ ...form, file_format: e.target.value })}
                placeholder="cdr, psd, ai, png..."
              />
              <datalist id="artwork-format-options">
                {knownFormats.map((f: string) => <option key={f} value={f} />)}
              </datalist>
              <p className="text-xs text-muted-foreground">Digite qualquer formato ou escolha um já usado.</p>
            </div>

          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2"><Label>Preço (centavos)</Label><Input type="number" value={form.price_cents} onChange={(e) => setForm({ ...form, price_cents: e.target.value })} required /></div>
            <div className="grid gap-2"><Label>Custo em créditos</Label><Input type="number" min={0} value={form.credit_cost} onChange={(e) => setForm({ ...form, credit_cost: e.target.value })} required /></div>
            <div className="grid gap-2"><Label>Cores (vírgula)</Label><Input value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} placeholder="black,white,red" /></div>
          </div>
          <div className="grid gap-2">
            <Label>Imagem de preview (upload ou URL)</Label>
            <Input type="file" accept="image/*" onChange={(e) => setPreviewFile(e.target.files?.[0] ?? null)} />
            <Input value={form.preview_url} onChange={(e) => setForm({ ...form, preview_url: e.target.value })} placeholder="https://..." />
          </div>
          <div className="grid gap-3 rounded-lg border border-border/60 p-4">
            <Label>Fonte do arquivo</Label>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant={sourceType === "upload" ? "default" : "outline"} onClick={() => setSourceType("upload")}>Upload no site</Button>
              <Button type="button" size="sm" variant={sourceType === "external" ? "default" : "outline"} onClick={() => setSourceType("external")}>Link Google Drive / Externo</Button>
            </div>
            {sourceType === "upload" ? (
              <div className="grid gap-2">
                <Label className="text-xs text-muted-foreground">Arquivo para download (privado, baixado automaticamente)</Label>
                <Input type="file" onChange={(e) => setArtFile(e.target.files?.[0] ?? null)} />
                {form.file_path && <p className="text-xs text-muted-foreground">Atual: {form.file_path}</p>}
              </div>
            ) : (
              <div className="grid gap-2">
                <Label className="text-xs text-muted-foreground">Link do Google Drive (o cliente será redirecionado ao clicar em Fazer Download)</Label>
                <Input
                  value={form.external_url}
                  onChange={(e) => setForm({ ...form, external_url: e.target.value })}
                  placeholder="https://drive.google.com/..."
                />
              </div>
            )}
          </div>
          <div className="grid gap-2 rounded-lg border border-border/60 p-4">
            <Label>Galeria (imagens secundárias)</Label>
            <Input type="file" accept="image/*" multiple onChange={(e) => setGalleryFiles(Array.from(e.target.files ?? []))} />
            {form.gallery_urls.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.gallery_urls.map((u: string, i: number) => (
                  <div key={i} className="relative">
                    <img src={u} alt="" className="h-16 w-16 rounded object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, gallery_urls: form.gallery_urls.filter((_: string, j: number) => j !== i) })}
                      className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-destructive text-xs text-destructive-foreground"
                    >×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-3 rounded-lg border border-border/60 p-4">
            <Label>Traduções (opcional)</Label>
            {(["en", "es"] as const).map((lg) => (
              <div key={lg} className="grid gap-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{lg === "en" ? "Inglês" : "Espanhol"}</p>
                <Input
                  placeholder={`Título em ${lg.toUpperCase()}`}
                  value={form.translations?.[lg]?.title ?? ""}
                  onChange={(e) => setForm({ ...form, translations: { ...form.translations, [lg]: { ...form.translations?.[lg], title: e.target.value } } })}
                />
                <Textarea
                  rows={2}
                  placeholder={`Descrição em ${lg.toUpperCase()}`}
                  value={form.translations?.[lg]?.description ?? ""}
                  onChange={(e) => setForm({ ...form, translations: { ...form.translations, [lg]: { ...form.translations?.[lg], description: e.target.value } } })}
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2"><Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} /> Publicada</label>
            <label className="flex items-center gap-2"><Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} /> Destaque</label>
            <label className="flex items-center gap-2"><Switch checked={form.is_trending} onCheckedChange={(v) => setForm({ ...form, is_trending: v })} /> Em alta</label>
          </div>
          <Button type="submit" disabled={busy} className="w-full bg-gradient-brand text-brand-foreground">{busy ? "Salvando..." : isEdit ? "Salvar" : "Criar"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
