import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { slugify } from "@/lib/format";
import { detectFormat } from "@/features/artwork/formats";
import { Upload, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon } from "lucide-react";
import { processExternalImage } from "@/lib/artwork-upload.functions";

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

/** O CSV do WooCommerce não tem coluna de formato: deduzimos pelo link/nome/tags. */
function guessFormat(...sources: string[]): string | null {
  return detectFormat(...sources);
}


type LogItem = { title: string; status: "ok" | "error" | "skip"; message?: string };

function Importar() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, currentAction: "" });
  const [log, setLog] = useState<LogItem[]>([]);
  const [defaultCreditCost, setDefaultCreditCost] = useState(1);
  const [defaultFormat, setDefaultFormat] = useState("cdr");
  const [publishAll, setPublishAll] = useState(true);
  const [keepHtml, setKeepHtml] = useState(true);
  const [autoFormat, setAutoFormat] = useState(true);
  const processImage = useServerFn(processExternalImage);


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
    let finalSlug = slug;
    while (true) {
      const { data } = await supabase.from("artworks").select("id").eq("slug", finalSlug).maybeSingle();
      if (!data) return finalSlug;
      i++;
      finalSlug = `${slug}-${i}`;
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
      const cShort = idx("Descrição curta");
      const cPrice = idx("Preço");
      const cSale = idx("Preço promocional");
      const cCats = idx("Categorias");
      const cTags = idx("Tags");
      const cImg = idx("Imagens");
      const cDlUrl = idx("URL do download 1");
      const cExtUrl = idx("URL externa");
      const cSku = idx("SKU"); 
      const cFeat = idx("Em destaque?");
      const cAlt = idx("alt_text");
      // Yoast SEO (quando o CSV trouxer as metas)
      const findCol = (needle: string) =>
        header.findIndex((h) => h.toLowerCase().includes(needle));
      const cSeoTitle = findCol("wpseo_title");
      const cSeoDesc = findCol("wpseo_metadesc");
      const cSeoKw = findCol("wpseo_focuskw");

      if (cName < 0) throw new Error("Coluna 'Nome' não encontrada");

      const data = rows.slice(1);
      setProgress({ done: 0, total: data.length, currentAction: "Lendo CSV..." });
      const logs: LogItem[] = [];

      for (let r = 0; r < data.length; r++) {
        const row = data[r];
        const title = (row[cName] || "").trim();
        // Generate internal unique product_code if missing
        let product_code = cSku >= 0 ? (row[cSku] || "").trim() : "";
        if (!product_code) {
          product_code = `EF-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        }

        try {
          if (!title) throw new Error("Nome vazio");

          // Categories logic
          const categoryIds: string[] = [];
          if (cCats >= 0 && row[cCats]) {
            const names = row[cCats].split(",").map((s) => s.trim()).filter(Boolean);
            for (const nm of names) {
              const leaf = nm.split(">").pop()?.trim() || nm;
              const id = await ensureCategory(leaf);
              if (id && !categoryIds.includes(id)) categoryIds.push(id);
            }
          }
          const category_id: string | null = categoryIds[0] ?? null;

          // Description
          const rawDesc = cDesc >= 0 ? row[cDesc] : "";
          const description = keepHtml ? rawDesc : stripHtml(rawDesc);

          // Prices
          const sale = cSale >= 0 ? parsePriceToCents(row[cSale]) : 0;
          const regular = cPrice >= 0 ? parsePriceToCents(row[cPrice]) : 0;
          const price_cents = sale > 0 ? sale : regular;

          // Images - Download and Transfer
          setProgress(p => ({ ...p, currentAction: `Processando imagens (${r + 1}/${data.length})...` }));
          
          const rawImageUrls = (cImg >= 0 ? row[cImg] : "")
            .split(",")
            .map((s) => s.trim())
            .filter((s) => /^https?:\/\//i.test(s));
          
          if (rawImageUrls.length === 0) throw new Error("Sem URL de imagem");

          // Process Main Preview
          let preview_url = "";
          try {
            preview_url = await processImage({ data: { url: rawImageUrls[0], folder: "arts" } });
          } catch (imgErr) {
            console.warn("Falha ao transferir imagem principal, usando URL original:", imgErr);
            preview_url = rawImageUrls[0];
          }

          // Process Gallery
          const gallery_urls: string[] = [];
          const rawGallery = Array.from(new Set(rawImageUrls.slice(1))).slice(0, 12);
          for (const gUrl of rawGallery) {
            try {
              const internalUrl = await processImage({ data: { url: gUrl, folder: "gallery" } });
              gallery_urls.push(internalUrl);
            } catch (imgErr) {
              console.warn("Falha ao transferir imagem da galeria, usando URL original:", imgErr);
              gallery_urls.push(gUrl);
            }
          }

          const external_url = (cDlUrl >= 0 ? row[cDlUrl] : "").trim() || (cExtUrl >= 0 ? row[cExtUrl] : "").trim() || null;
          const is_published = cPub >= 0 ? (row[cPub] || "").trim() === "1" : publishAll;
          const is_featured = cFeat >= 0 ? (row[cFeat] || "").trim() === "1" : false;

          // SEO metadata
          const shortDesc = cShort >= 0 ? stripHtml(row[cShort] || "").replace(/\s+/g, " ").trim() : "";
          const plainDesc = stripHtml(rawDesc).replace(/\s+/g, " ").trim();
          
          const rawSeoTitle = (cSeoTitle >= 0 ? (row[cSeoTitle] || "").trim() : "") || "%%title%% — Estampa Flix";
          const rawSeoDesc = (cSeoDesc >= 0 ? (row[cSeoDesc] || "").trim() : "") || (shortDesc || plainDesc || "%%title%%: arte digital em alta resolução para sublimação, DTF e estamparia com licença comercial.");
          const rawSeoKw = (cSeoKw >= 0 ? (row[cSeoKw] || "").trim() : "") || "%%title%%";

          const cleanSeoTitle = rawSeoTitle.replace(/%%title%%/gi, title);
          const cleanSeoDesc = rawSeoDesc.replace(/%%title%%/gi, title);
          const cleanSeoKw = rawSeoKw.replace(/%%title%%/gi, title);

          // ALWAYS generate a unique slug incrementally
          const baseSlug = slugify(title);
          const slug = await uniqueSlug(baseSlug);

          const payload = {
            title,
            slug,
            description,
            category_id,
            preview_url,
            gallery_urls,
            product_code, // Always provided/generated
            seo_title: cleanSeoTitle.slice(0, 70),
            seo_description: cleanSeoDesc.slice(0, 160),
            seo_keyword: cleanSeoKw.slice(0, 120),
            alt_text: cAlt >= 0 ? (row[cAlt] || "").trim() || null : null,
            file_path: null,
            external_url,
            file_format:
              (autoFormat
                ? guessFormat(external_url ?? "", title, cTags >= 0 ? row[cTags] : "", rawDesc)
                : null) || defaultFormat.trim().toLowerCase().replace(/^\./, ""),
            price_cents,
            credit_cost: defaultCreditCost,
            is_published: publishAll ? true : is_published,
            is_featured,
          };

          // FORCE INSERT - Never update
          const { data: ins, error } = await supabase.from("artworks").insert(payload).select("id").single();
          if (error) throw error;
          const artworkId = ins.id;

          // Multi-categorias
          if (categoryIds.length) {
            await supabase
              .from("artwork_categories")
              .insert(categoryIds.map((cid) => ({ artwork_id: artworkId, category_id: cid })));
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
              await supabase.from("artwork_tags").insert(tagIds.map((tid) => ({ artwork_id: artworkId, tag_id: tid })));
            }
          }

          logs.push({ title, status: "ok", message: "criado" });
        } catch (err: any) {
          logs.push({ title: title || `Linha ${r + 2}`, status: "error", message: err.message || String(err) });
        }
        setProgress(p => ({ ...p, done: r + 1 }));
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
            <Label>Formato padrão (fallback)</Label>
            <Input value={defaultFormat} onChange={(e) => setDefaultFormat(e.target.value)} placeholder="cdr, png, psd..." />
            <p className="text-xs text-muted-foreground">Usado quando não for possível detectar o formato no CSV.</p>
          </div>
          <div className="flex flex-col justify-end gap-3">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={publishAll} onCheckedChange={setPublishAll} /> Publicar todos
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={keepHtml} onCheckedChange={setKeepHtml} /> Manter HTML na descrição
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={autoFormat} onCheckedChange={setAutoFormat} /> Detectar formato automaticamente
            </label>
          </div>

        </div>

        <Button onClick={importAll} disabled={!file || busy} className="bg-gradient-brand text-brand-foreground">
          {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importando...</> : <><Upload className="mr-2 h-4 w-4" /> Iniciar importação</>}
        </Button>

        {progress.total > 0 && (
          <div className="text-sm text-muted-foreground">
            {progress.currentAction || "Progresso"}: {progress.done} / {progress.total}
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