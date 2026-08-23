import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import { Search, Upload, FileDown, CheckSquare, XSquare, Loader2, X, Check, Plus, Lock } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useUserSubscription } from "@/hooks/use-user-subscription";

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

const PAGE_LIMIT = 300;
const DEFAULT_BG = "#e8e8e8";

function refLabel(art: any) {
  const code = art?.product_code?.trim();
  return code ? `Ref: ${code}` : "";
}

function CatalogGeneratorPage() {
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, any>>({});
  const [logo, setLogo] = useState<{ dataUrl: string; name: string } | null>(null);
  const [columns, setColumns] = useState("3");
  const [bgColor, setBgColor] = useState(DEFAULT_BG);
  const [generating, setGenerating] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [userId, setUserId] = useState<string | undefined>();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id));
  }, []);

  const { data: sub } = useUserSubscription(userId);
  const isPremium = !!sub && ["lite", "pro", "plus"].includes(sub.plans?.tier || "");

  const handlePremiumClick = (e: React.MouseEvent) => {
    if (!isPremium) {
      e.preventDefault();
      setPremiumModalOpen(true);
      return true;
    }
    return false;
  };

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

  const resolveCategoryIds = async (slug: string): Promise<string[] | null> => {
    const cat = (categories as any[]).find((c) => c.slug === slug);
    if (!cat) return null;
    const { data: subs } = await supabase.from("categories").select("id").eq("parent_id", cat.id);
    const catIds = [cat.id, ...((subs ?? []) as any[]).map((s) => s.id)];
    const { data: links } = await supabase
      .from("artwork_categories")
      .select("artwork_id")
      .in("category_id", catIds);
    return Array.from(new Set(((links ?? []) as any[]).map((l) => l.artwork_id)));
  };

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["catalog-generator-artworks", term, categorySlug, categories.length],
    queryFn: async ({ pageParam }) => {
      const from = pageParam * PAGE_LIMIT;
      const to = from + PAGE_LIMIT - 1;

      let ids: string[] | null = null;
      if (categorySlug) {
        ids = await resolveCategoryIds(categorySlug);
        if (ids && ids.length === 0) {
          return { items: [], total: 0, nextPage: undefined };
        }
      }

      let query = supabase
        .from("artworks")
        .select("id,slug,title,preview_url,alt_text,product_code", { count: "exact" })
        .eq("is_published", true)
        .not("preview_url", "is", null)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (term.trim()) query = query.ilike("title", `%${term.trim()}%`);
      if (ids) query = query.in("id", ids);

      const { data: rows, count } = await query;
      const items = rows ?? [];
      return {
        items,
        total: count ?? items.length,
        nextPage: items.length === PAGE_LIMIT ? pageParam + 1 : undefined,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextPage,
    placeholderData: (prev) => prev,
  });

  const artworks = (data?.pages.flatMap((p) => p.items) ?? []) as any[];
  const total = data?.pages[0]?.total ?? 0;
  const hasMore = !!hasNextPage && artworks.length < total;

  const selectedList = useMemo(() => Object.values(selected) as any[], [selected]);
  const selectedCount = selectedList.length;
  const cols = Number(columns);

  function toggle(art: any) {
    setSelected((s) => {
      const next = { ...s };
      if (next[art.id]) delete next[art.id];
      else next[art.id] = art;
      return next;
    });
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
      const margin = 8;
      const gap = 4;
      const captionH = 7;
      const cellW = (pageW - margin * 2 - gap * (cols - 1)) / cols;
      const imgH = cellW;
      const cellH = imgH + captionH;

      const paintBg = () => {
        doc.setFillColor(isPremium ? bgColor : DEFAULT_BG);
        doc.rect(0, 0, pageW, pageH, "F");
      };

      const logoMeta = (isPremium && logo) ? await loadImage(logo.dataUrl) : null;
      const drawHeader = () => {
        paintBg();
        if (!isPremium || !logo || !logoMeta) return margin;
        const ratio = Math.min(90 / logoMeta.width, 30 / logoMeta.height);
        const w = logoMeta.width * ratio;
        const h = logoMeta.height * ratio;
        doc.addImage(logo.dataUrl, (pageW - w) / 2, margin, w, h, undefined, "FAST");
        return margin + h + 6;
      };

      const drawWatermark = () => {
        if (!isPremium) {
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text("Gerado via Estampaflix", pageW / 2, pageH - 5, { align: "center" });
        }
      };

      doc.setFontSize(11);
      doc.setTextColor(20, 20, 20);

      let x = margin;
      let y = drawHeader();
      let col = 0;
      for (const art of selectedList) {
        if (col === cols) {
          col = 0;
          x = margin;
          y += cellH + gap;
          if (y + cellH > pageH - margin) {
            drawWatermark();
            doc.addPage();
            y = drawHeader();
          }
        }
        const img = await toDataUrl(art.preview_url, bgColor);
        if (img) {
          const ratio = Math.min(cellW / img.width, imgH / img.height);
          const w = img.width * ratio;
          const h = img.height * ratio;
          const imgX = x + (cellW - w) / 2;
          const imgY = y + (imgH - h) / 2;
          doc.addImage(img.dataUrl, imgX, imgY, w, h, undefined, "FAST");

          const cleanPhone = isPremium ? whatsapp.replace(/\D/g, "") : "";
          if (cleanPhone) {
            const code = art.product_code?.trim() || "";
            const msg = `Olá! Gostaria de encomendar um produto com esta estampa: Ref: ${code}`;
            const whatsappLink = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
            doc.link(imgX, imgY, w, h, { url: whatsappLink });
          }
        }
        const label = refLabel(art);
        if (label) doc.text(label, x + cellW / 2, y + imgH + 5, { align: "center" });
        x += cellW + gap;
        col += 1;
      }

      drawWatermark();
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
      <div className="container mx-auto px-4 py-10 pb-32">
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
            <div 
              className={cn(
                "rounded-2xl border border-border/50 bg-card p-4 transition-opacity",
                !isPremium && "opacity-60"
              )}
              onClick={handlePremiumClick}
            >
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Logo do cliente</Label>
                {!isPremium && <Lock className="h-3 w-3 text-muted-foreground" />}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Aparece apenas no topo do PDF. Não é salva no servidor.
              </p>
              {logo && isPremium ? (
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-border/50 bg-surface-2 p-3">
                  <img src={logo.dataUrl} alt="Logo enviada pelo cliente" className="h-10 w-auto max-w-24 object-contain" />
                  <span className="line-clamp-1 flex-1 text-xs text-muted-foreground">{logo.name}</span>
                  <button
                    type="button"
                    aria-label="Remover logo"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLogo(null);
                    }}
                    className="rounded-full p-1 hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className={cn(
                  "mt-3 flex flex-col items-center gap-2 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground transition-colors",
                  isPremium ? "cursor-pointer hover:border-primary/50 hover:text-foreground" : "cursor-default"
                )}>
                  <Upload className="h-5 w-5" />
                  Enviar logo (PNG/JPG)
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={!isPremium}
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

            <div 
              className={cn(
                "rounded-2xl border border-border/50 bg-card p-4 transition-opacity",
                !isPremium && "opacity-60"
              )}
              onClick={handlePremiumClick}
            >
              <div className="flex items-center justify-between">
                <Label htmlFor="pdf-bg" className="text-sm font-semibold">
                  Cor de fundo do PDF
                </Label>
                {!isPremium && <Lock className="h-3 w-3 text-muted-foreground" />}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <input
                  id="pdf-bg"
                  type="color"
                  value={isPremium ? bgColor : DEFAULT_BG}
                  disabled={!isPremium}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-transparent p-1"
                />
                <span className="text-sm text-muted-foreground">{(isPremium ? bgColor : DEFAULT_BG).toUpperCase()}</span>
              </div>
            </div>

            <div 
              className={cn(
                "rounded-2xl border border-border/50 bg-card p-4 transition-opacity",
                !isPremium && "opacity-60"
              )}
              onClick={handlePremiumClick}
            >
              <div className="flex items-center justify-between">
                <Label htmlFor="whatsapp" className="text-sm font-semibold">
                  WhatsApp (com DDD)
                </Label>
                {!isPremium && <Lock className="h-3 w-3 text-muted-foreground" />}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Torna as imagens no PDF clicáveis para compra direta.
              </p>
              <Input
                id="whatsapp"
                type="text"
                value={isPremium ? whatsapp : ""}
                disabled={!isPremium}
                onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ""))}
                placeholder="Ex: 11999999999"
                className="mt-3"
              />
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
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSelected((s) => {
                    const next = { ...s };
                    for (const a of artworks) next[a.id] = a;
                    return next;
                  })
                }
              >
                <CheckSquare className="h-4 w-4" /> Selecionar tudo
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelected({})}>
                <XSquare className="h-4 w-4" /> Limpar seleção
              </Button>
              {hasMore && (
                <Button size="sm" onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className="gap-2">
                  {isFetchingNextPage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Carregar mais
                </Button>
              )}
            </div>

            <p className="mb-4 text-sm text-muted-foreground">
              Encontrado(s) <span className="font-semibold text-foreground">{total}</span> produto(s). Carregados{" "}
              <span className="font-semibold text-foreground">{artworks.length}</span>.{" "}
              <span className="font-semibold text-primary">{selectedCount}</span> arte(s) selecionada(s) no total.
            </p>

            {isLoading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-square animate-pulse rounded-2xl bg-surface-2" />
                ))}
              </div>
            ) : artworks.length === 0 ? (
              <p className="rounded-2xl border border-border/50 bg-card p-10 text-center text-muted-foreground">
                Nenhuma arte encontrada com esses filtros.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {artworks.map((a) => {
                  const isOn = !!selected[a.id];
                  return (
                    <button
                      type="button"
                      key={a.id}
                      onClick={() => toggle(a)}
                      className={cn(
                        "group relative overflow-hidden rounded-2xl border bg-card text-left transition-colors",
                        isOn ? "border-primary" : "border-border/50 hover:border-primary/40",
                      )}
                    >
                      <div className="aspect-square w-full overflow-hidden bg-surface-2">
                        <img
                          src={a.preview_url}
                          alt={a.alt_text?.trim() || a.title}
                          loading="lazy"
                          className="block h-full w-full object-cover"
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
                      <p className="line-clamp-2 p-3 text-base font-medium leading-snug text-foreground">{a.title}</p>
                      {a.product_code && (
                        <p className="px-3 pb-3 text-sm text-muted-foreground">{refLabel(a)}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {hasMore && !isLoading && artworks.length > 0 && (
              <div className="mt-8 flex justify-center">
                <Button
                  size="lg"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="gap-2 shadow-lg shadow-primary/30"
                >
                  {isFetchingNextPage ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                  Carregar mais produtos
                </Button>
              </div>
            )}

            {selectedCount > 0 && (
              <div className="mt-10">
                <h2 className="mb-3 font-display text-xl font-bold">Pré-visualização do PDF</h2>
                <div
                  className="rounded-2xl border border-border/50 p-6"
                  style={{ backgroundColor: isPremium ? bgColor : DEFAULT_BG }}
                >
                  {isPremium && logo && (
                    <img
                      src={logo.dataUrl}
                      alt="Logo do cliente no topo do catálogo"
                      className="mx-auto mb-6 h-16 w-auto max-w-[240px] object-contain"
                    />
                  )}
                  <div
                    className="grid gap-3"
                    style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                  >
                    {selectedList.map((a) => (
                      <figure key={a.id} className="text-center">
                        <div className="aspect-square w-full overflow-hidden">
                          <img
                            src={a.preview_url}
                            alt={a.alt_text?.trim() || a.title}
                            loading="lazy"
                            className="block h-full w-full object-contain"
                          />
                        </div>
                        <figcaption className="mt-1 text-sm font-medium text-[#141414]">{refLabel(a)}</figcaption>
                      </figure>
                    ))}
                  </div>
                  {!isPremium && (
                    <div className="mt-8 border-t border-border/30 pt-4 text-center">
                      <p className="text-xs text-muted-foreground/60">Gerado via Estampaflix</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>

        <Dialog open={premiumModalOpen} onOpenChange={setPremiumModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" /> Recurso Exclusivo Premium
              </DialogTitle>
              <DialogDescription className="pt-2 text-base">
                Assine um dos nossos planos (Premium Lite, Pro ou Plus) para personalizar seus catálogos com sua logo, cores e links diretos para o seu WhatsApp!
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={() => setPremiumModalOpen(false)}>
                Agora não
              </Button>
              <Button asChild className="bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-90">
                <Link to="/planos">Conhecer Planos</Link>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      </div>

      {selectedCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-primary">{selectedCount}</span> arte(s) selecionada(s) no total
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelected({})}>
                <XSquare className="h-4 w-4" /> Limpar seleção
              </Button>
              <Button size="sm" onClick={generatePdf} disabled={generating} className="shadow-lg shadow-primary/30">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                {generating ? "Gerando PDF…" : "Gerar PDF"}
              </Button>
            </div>
          </div>
        </div>
      )}
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

async function toDataUrl(
  url: string,
  background = "#ffffff",
): Promise<{ dataUrl: string; width: number; height: number } | null> {
  try {
    const img = await loadImage(url);
    const max = 1400;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { dataUrl: canvas.toDataURL("image/jpeg", 0.9), width: canvas.width, height: canvas.height };
  } catch {
    return null;
  }
}
