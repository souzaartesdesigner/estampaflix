import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { slugify } from "@/lib/format";
import { Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/importar")({ component: Importar });

// RFC4180-ish CSV parser (handles quoted fields, doubled quotes, embedded newlines/commas)
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let i = 0;
  let inQuotes = false;
  // strip BOM
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ",") { row.push(field); field = ""; i++; continue; }
    if (c === "\r") { i++; continue; }
    if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
    field += c; i++;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

function stripHtml(html: string) {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

function parsePriceToCents(v: string): number {
  if (!v) return 0;
  const s = v.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(s);
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

type LogItem = { title: string; status: "ok" | "error" | "skip"; message?: string };

function Importar() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [log, setLog] = useState<LogItem[]>([]);
  const [defaultCreditCost, setDefaultCreditCost] = useState(1);
  const [defaultFormat, setDefaultFormat] = useState("cdr");
  const [publishAll, setPublishAll] = useState(true);
  const [keepHtml, setKeepHtml] = useState(true);

  async function ensureCategory(name: string): Promise<string | null> {
    const clean = name.trim();
    if (!clean) return null;
    const slug = slugify(clean);
    const { data: existing } = await supabase.from("categories").select("id").eq("slug", slug).maybeSingle();
    if (existing?.id) return existing.id;
    const { data, error } = await supabase.from("categories").insert({ slug, name: clean }).select("id").single();
    if (error) throw error;
    return data.id;
  }

  async function ensureTag(name: string): Promise<string | null> {
    const clean = name.trim();
    if (!clean) return null;
    const slug = slugify(clean);
    const { data: existing } = await supabase.from("tags").select("id").eq("slug", slug).maybeSingle();
    if (existing?.id) return existing.id;
    const { data, error } = await supabase.from("tags").insert({ slug, name: clean }).select("id").single();
    if (error) throw error;
    return data.id;
  }

  async function uniqueSlug(base: string): Promise<string> {
    let slug = base || `arte-${Date.now()}`;
    let i = 1;
    while (true) {
      const { data } = await supabase.from("artworks").select("id").eq("slug", slug).maybeSingle();
      if (!data) return slug;
      i++;
      slug = `${base}-${i}`;
    }
  }

  async function importAll() {
    if (!file) { toast.error("Selecione um arquivo CSV"); return; }
    setBusy(true);
    setLog([]);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length < 2) throw new Error("CSV vazio");
      const header = rows[0].map((h) => h.trim());
      const idx = (name: string) => header.indexOf(name);

      const cName = idx("Nome");
      const cPub = idx("Publicado");
      const cDesc = idx("Descrição");
      const cPrice = idx("Preço");
      const cSale = idx("Preço promocional");
      const cCats = idx("Categorias");
      const cTags = idx("Tags");
      const cImg = idx("Imagens");
      const cDlUrl = idx("URL do download 1");
      const cExtUrl = idx("URL externa");
      const cFeat = idx("Em destaque?");

      if (cName < 0) throw new Error("Coluna 'Nome' não encontrada");

      const data = rows.slice(1);
      setProgress({ done: 0, total: data.length });
      const logs: LogItem[] = [];

      for (let r = 0; r < data.length; r++) {
        const row = data[r];
        const title = (row[cName] || "").trim();
        try {
          if (!title) throw new Error("Nome vazio");

          // Category: use first entry; if it contains ">" use the last leaf
          let category_id: string | null = null;
          if (cCats >= 0 && row[cCats]) {
            const first = row[cCats].split(",")[0].trim();
            const leaf = first.split(">").pop()?.trim() || first;
            category_id = await ensureCategory(leaf);
          }

          // Description
          const rawDesc = cDesc >= 0 ? row[cDesc] : "";
          const description = keepHtml ? rawDesc : stripHtml(rawDesc);

          // Prices
          const sale = cSale >= 0 ? parsePriceToCents(row[cSale]) : 0;
          const regular = cPrice >= 0 ? parsePriceToCents(row[cPrice]) : 0;
          const price_cents = sale > 0 ? sale : regular;

          const preview_url = (cImg >= 0 ? row[cImg] : "").split(",")[0].trim();
          if (!preview_url) throw new Error("Sem URL de imagem");

          const external_url = (cDlUrl >= 0 ? row[cDlUrl] : "").trim() || (cExtUrl >= 0 ? row[cExtUrl] : "").trim() || null;

          const is_published = cPub >= 0 ? (row[cPub] || "").trim() === "1" : publishAll;
          const is_featured = cFeat >= 0 ? (row[cFeat] || "").trim() === "1" : false;

          const baseSlug = slugify(title);
          // Check if already exists by slug
          const { data: existing } = await supabase.from("artworks").select("id,slug").eq("slug", baseSlug).maybeSingle();
          const slug = existing?.slug ?? (await uniqueSlug(baseSlug));

          const payload = {
            title,
            slug,
            description,
            category_id,
            preview_url,
            file_path: null as string | null,
            external_url,
            file_format: defaultFormat,
            price_cents,
            credit_cost: defaultCreditCost,
            is_published: publishAll ? true : is_published,
            is_featured,
          };

          let artworkId: string;
          if (existing?.id) {
            const { error } = await supabase.from("artworks").update(payload).eq("id", existing.id);
            if (error) throw error;
            artworkId = existing.id;
          } else {
            const { data: ins, error } = await supabase.from("artworks").insert(payload).select("id").single();
            if (error) throw error;
            artworkId = ins.id;
          }

          // Tags
          if (cTags >= 0 && row[cTags]) {
            const tagNames = row[cTags].split(",").map((s) => s.trim()).filter(Boolean).slice(0, 15);
            const tagIds: string[] = [];
            for (const tn of tagNames) {
              const id = await ensureTag(tn);
              if (id) tagIds.push(id);
            }
            if (tagIds.length) {
              await supabase.from("artwork_tags").delete().eq("artwork_id", artworkId);
              await supabase.from("artwork_tags").insert(tagIds.map((tid) => ({ artwork_id: artworkId, tag_id: tid })));
            }
          }

          logs.push({ title, status: "ok", message: existing ? "atualizado" : "criado" });
        } catch (err: any) {
          logs.push({ title: title || `Linha ${r + 2}`, status: "error", message: err.message || String(err) });
        }
        setProgress({ done: r + 1, total: data.length });
        setLog([...logs]);
      }

      const okCount = logs.filter((l) => l.status === "ok").length;
      const errCount = logs.filter((l) => l.status === "error").length;
      toast.success(`Importação concluída: ${okCount} ok, ${errCount} erros`);
    } catch (err: any) {
      toast.error(err.message || "Erro na importação");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Importar CSV do WooCommerce</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Envie o arquivo CSV exportado do WooCommerce (separado por vírgula). Os produtos serão importados com título,
          descrição, preço, imagem, categoria, tags e link de download do Google Drive.
        </p>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
        <div className="grid gap-2">
          <Label>Arquivo CSV</Label>
          <Input type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <Label>Custo em créditos (padrão)</Label>
            <Input type="number" min={0} value={defaultCreditCost} onChange={(e) => setDefaultCreditCost(Number(e.target.value))} />
          </div>
          <div className="grid gap-2">
            <Label>Formato padrão</Label>
            <Input value={defaultFormat} onChange={(e) => setDefaultFormat(e.target.value)} placeholder="cdr, png, psd..." />
          </div>
          <div className="flex flex-col justify-end gap-3">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={publishAll} onCheckedChange={setPublishAll} /> Publicar todos
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={keepHtml} onCheckedChange={setKeepHtml} /> Manter HTML na descrição
            </label>
          </div>
        </div>

        <Button onClick={importAll} disabled={!file || busy} className="bg-gradient-brand text-brand-foreground">
          {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importando...</> : <><Upload className="mr-2 h-4 w-4" /> Iniciar importação</>}
        </Button>

        {progress.total > 0 && (
          <div className="text-sm text-muted-foreground">
            Progresso: {progress.done} / {progress.total}
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
            </div>
          </div>
        )}
      </div>

      {log.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">Resultado</h2>
          <ul className="max-h-96 space-y-1 overflow-y-auto text-sm">
            {log.map((l, i) => (
              <li key={i} className="flex items-start gap-2">
                {l.status === "ok" ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" /> : <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />}
                <span className="flex-1">{l.title}</span>
                <span className="text-xs text-muted-foreground">{l.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
