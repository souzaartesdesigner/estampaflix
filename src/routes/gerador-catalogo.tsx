import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, Upload, FileDown, CheckSquare, XSquare, Loader2, X, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/gerador-catalogo")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Gerador de Catálogo em PDF — Estampa Flix" },
      {
        name: "description",
        content:
          "Monte portfólios em PDF com as artes da Estampa Flix, adicione a sua logo e envie para os seus clientes. Ferramenta exclusiva para assinantes.",
      },
      { property: "og:title", content: "Gerador de Catálogo em PDF — Estampa Flix" },
      {
        property: "og:description",
        content: "Selecione artes, adicione sua logo e gere um catálogo em PDF personalizado em segundos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CatalogGeneratorPage,
});

const PAGE_LIMIT = 60;

function CatalogGeneratorPage() {
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [logo, setLogo] = useState<{ dataUrl: string; name: string } | null>(null);
  const [columns, setColumns] = useState("3");
  const [generating, setGenerating] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["catalog-generator-categories"],
    queryFn: async () =>
      (
        await supabase
          .from("categories")
          .select("id,slug,name,parent_id")
          .is("parent_id", null)
          .order("sort_order")
          .order("name")
      ).data ?? [],
  });

  const { data: artworks = [], isLoading } = useQuery({
    queryKey: ["catalog-generator-artworks", term, categorySlug, categories.length],
    queryFn: async () => {
      let ids: string[] | null = null;
      if (categorySlug) {
        const cat = (categories as any[]).find((c) => c.slug === categorySlug);
        if (!cat) return [];
        const { data: subs } = await supabase.from("categories").select("id").eq("parent_id", cat.id);
        const catIds = [cat.id, ...((subs ?? []) as any[]).map((s) => s.id)];
        const { data: links } = await supabase
          .from("artwork_categories")
          .select("artwork_id")
          .in("category_id", catIds);
        ids = Array.from(new Set(((links ?? []) as any[]).map((l) => l.artwork_id)));
        if (ids.length === 0) return [];
      }

      let query = supabase
        .from("artworks")
        .select("id,slug,title,preview_url,alt_text")
        .eq("is_published", true)
        .not("preview_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(PAGE_LIMIT);

      if (term.trim()) query = query.ilike("title", `%${term.trim()}%`);
      if (ids) query = query.in("id", ids.slice(0, 500));

      const { data } = await query;
      return data ?? [];
    },
  });

  const selectedList = useMemo(
    () => (artworks as any[]).filter((a) => selected[a.id]),
    [artworks, selected],
  );
  const selectedCount = Object.values(selected).filter(Boolean).length;

  function toggle(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }

  function onLogoChange(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Envie um arquivo de imagem (PNG ou JPG).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogo({ dataUrl: String(reader.result), name: file.name });
    reader.onerror = () => toast.error("Não foi possível ler a imagem.");
    reader.readAsDataURL(file);
  }

  async function generatePdf() {
    if (selectedList.length === 0) {
      toast.error("Selecione ao menos uma arte.");
      return;
    }
    setGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 12;
      const cols = Number(columns);
      const gap = 6;
      const cellW = (pageW - margin * 2 - gap * (cols - 1)) / cols;
      const cellH = cellW;

      const logoMeta = logo ? await loadImage(logo.dataUrl) : null;
      const drawHeader = () => {
        if (!logo || !logoMeta) return margin;
        const ratio = Math.min(70 / logoMeta.width, 22 / logoMeta.height);
        const w = logoMeta.width * ratio;
        const h = logoMeta.height * ratio;
        doc.addImage(logo.dataUrl, (pageW - w) / 2, margin, w, h, undefined, "FAST");
        return margin + h + 8;
      };

      let x = margin;
      let y = drawHeader();
      let col = 0;
      for (const art of selectedList) {
        if (col === cols) {
          col = 0;
          x = margin;
          y += cellH + gap;
          if (y + cellH > pageH - margin) {
            doc.addPage();
            y = drawHeader();
          }
        }
        const img = await toDataUrl(art.preview_url);
        if (img) {
          const ratio = Math.min(cellW / img.width, cellH / img.height);
          const w = img.width * ratio;
          const h = img.height * ratio;
          doc.addImage(img.dataUrl, x + (cellW - w) / 2, y + (cellH - h) / 2, w, h, undefined, "FAST");
        }
        x += cellW + gap;
        col += 1;
      }


      console.log("PDFDEBUG pages", doc.getNumberOfPages(), "items", selectedList.length);
      doc.save("catalogo.pdf");
      toast.success("Catálogo gerado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível gerar o PDF. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-10">
        <header className="mb-8 max-w-2xl">
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Gerador de Catálogo</h1>
          <p className="mt-2 text-muted-foreground">
            Monte um portfólio em PDF com as artes que você quiser, adicione a logo da sua marca e envie direto
            para os seus clientes — sem preços e sem marca d'água.
          </p>
        </header>

        <section className="rounded-2xl border border-border/50 bg-card p-4 md:p-6">
          <div className="flex flex-col gap-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setTerm(q);
              }}
              className="relative"
            >
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar artes por nome…"
                className="pl-9"
              />
            </form>

            <div className="flex flex-wrap gap-2">
              <Pill active={!categorySlug} onClick={() => setCategorySlug(null)}>
                Todas
              </Pill>
              {(categories as any[]).map((c) => (
                <Pill
                  key={c.id}
                  active={categorySlug === c.slug}
                  onClick={() => setCategorySlug(categorySlug === c.slug ? null : c.slug)}
                >
                  {c.name}
                </Pill>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border/50 bg-card p-4">
              <Label className="text-sm font-semibold">Logo do cliente</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Aparece apenas no topo do PDF. Não é salva no servidor.
              </p>
              {logo ? (
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-border/50 bg-surface-2 p-3">
                  <img src={logo.dataUrl} alt="Logo enviada pelo cliente" className="h-10 w-auto max-w-24 object-contain" />
                  <span className="line-clamp-1 flex-1 text-xs text-muted-foreground">{logo.name}</span>
                  <button
                    type="button"
                    aria-label="Remover logo"
                    onClick={() => setLogo(null)}
                    className="rounded-full p-1 hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="mt-3 flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
                  <Upload className="h-5 w-5" />
                  Enviar logo (PNG/JPG)
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onLogoChange(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
            </div>

            <div className="rounded-2xl border border-border/50 bg-card p-4">
              <Label className="text-sm font-semibold">Colunas no PDF</Label>
              <Select value={columns} onValueChange={setColumns}>
                <SelectTrigger className="mt-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 colunas (recomendado)</SelectItem>
                  <SelectItem value="4">4 colunas (compacto)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-2xl border border-border/50 bg-card p-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{selectedCount}</span> arte(s) selecionada(s)
              </p>
              <Button className="mt-3 w-full" onClick={generatePdf} disabled={generating || selectedCount === 0}>
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                {generating ? "Gerando PDF…" : "Gerar PDF"}
              </Button>
            </div>
          </aside>

          <section>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSelected((s) => {
                    const next = { ...s };
                    for (const a of artworks as any[]) next[a.id] = true;
                    return next;
                  })
                }
              >
                <CheckSquare className="h-4 w-4" /> Selecionar tudo
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelected({})}>
                <XSquare className="h-4 w-4" /> Limpar seleção
              </Button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-square animate-pulse rounded-2xl bg-surface-2" />
                ))}
              </div>
            ) : (artworks as any[]).length === 0 ? (
              <p className="rounded-2xl border border-border/50 bg-card p-10 text-center text-muted-foreground">
                Nenhuma arte encontrada com esses filtros.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {(artworks as any[]).map((a) => {
                  const isOn = !!selected[a.id];
                  return (
                    <button
                      type="button"
                      key={a.id}
                      onClick={() => toggle(a.id)}
                      className={cn(
                        "group relative overflow-hidden rounded-2xl border bg-card text-left transition-colors",
                        isOn ? "border-primary" : "border-border/50 hover:border-primary/40",
                      )}
                    >
                      <div className="aspect-square overflow-hidden bg-surface-2">
                        <img
                          src={a.preview_url}
                          alt={a.alt_text?.trim() || a.title}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span className="absolute left-2 top-2">
                        <span
                          aria-hidden
                          className={cn(
                            "grid h-5 w-5 place-items-center rounded border",
                            isOn
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background/80",
                          )}
                        >
                          {isOn && <Check className="h-3.5 w-3.5" />}
                        </span>

                      </span>
                      <p className="line-clamp-2 p-3 text-xs text-foreground/90">{a.title}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </SiteLayout>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function toDataUrl(url: string): Promise<{ dataUrl: string; width: number; height: number } | null> {
  try {
    const img = await loadImage(url);
    const max = 1000;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { dataUrl: canvas.toDataURL("image/jpeg", 0.85), width: canvas.width, height: canvas.height };
  } catch {
    return null;
  }
}
