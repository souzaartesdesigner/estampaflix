import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { createPixOrder } from "@/lib/mercadopago.functions";
import { SiteLayout } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatBRL, formatDate } from "@/lib/format";
import { Download, ShoppingCart, Tag as TagIcon, Palette, FileType, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/artes/$slug")({
  loader: async ({ params }) => {
    const { data } = await supabase
      .from("artworks")
      .select("*, categories(name,slug), artwork_tags(tags(id,name,slug))")
      .eq("slug", params.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — EstampaHub` },
          { name: "description", content: loaderData.description ?? "Arte digital para sublimação" },
          { property: "og:title", content: loaderData.title },
          { property: "og:image", content: loaderData.preview_url },
        ]
      : [{ title: "Arte não encontrada" }, { name: "robots", content: "noindex" }],
  }),
  component: ArtworkPage,
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">Arte não encontrada</h1>
        <p className="mt-2 text-muted-foreground">Ela pode ter sido removida ou nunca existiu.</p>
        <Button asChild className="mt-6"><Link to="/catalogo">Voltar ao catálogo</Link></Button>
      </div>
    </SiteLayout>
  ),
  errorComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">Algo deu errado</h1>
      </div>
    </SiteLayout>
  ),
});

function ArtworkPage() {
  const artwork = Route.useLoaderData();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => (await supabase.auth.getSession()).data.session,
  });

  const { data: sub } = useQuery({
    queryKey: ["my-subscription", session?.user.id],
    enabled: !!session?.user.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("credits_remaining,status,current_period_end,plans(name,tier)")
        .eq("user_id", session!.user.id)
        .eq("status", "active")
        .maybeSingle();
      return data;
    },
  });

  const downloadMut = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("consume_download", { _artwork_id: artwork.id });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row?.file_path) throw new Error("Arquivo indisponível.");
      const { data: signed, error: sErr } = await supabase.storage
        .from("artwork-files")
        .createSignedUrl(row.file_path, 60);
      if (sErr || !signed?.signedUrl) throw sErr ?? new Error("Não foi possível gerar o link.");
      return { url: signed.signedUrl, credits: row.credits_remaining, was_new: row.was_new };
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["my-subscription"] });
      window.open(res.url, "_blank");
      toast.success(res.was_new ? `Download liberado! Créditos restantes: ${res.credits}` : "Download liberado (você já havia baixado esta arte).");
    },
    onError: (err: any) => {
      const msg = err.message || "";
      if (msg.includes("no_credits")) toast.error("Você ficou sem créditos este mês. Faça upgrade do plano.");
      else if (msg.includes("no_active_subscription")) toast.error("Assine um plano para baixar esta arte.");
      else if (msg.includes("not_authenticated")) { toast.error("Faça login para baixar."); navigate({ to: "/auth" }); }
      else toast.error(msg || "Erro ao baixar.");
    },
  });

  const createPix = useServerFn(createPixOrder);
  const buyMut = useMutation({
    mutationFn: async () => {
      if (!session) {
        navigate({ to: "/auth" });
        throw new Error("not_authenticated");
      }
      return await createPix({ data: { artworkId: artwork.id } });
    },
    onSuccess: (res) => {
      navigate({ to: "/pagamento/pix/$orderId", params: { orderId: res.orderId } });
    },
    onError: (err: any) => {
      if (err?.message === "not_authenticated") return;
      toast.error(err?.message || "Não foi possível iniciar o pagamento.");
    },
  });

  const canDownload = !!sub && (sub.credits_remaining ?? 0) > 0;
  const tags: any[] = (artwork as any).artwork_tags?.map((t: any) => t.tags).filter(Boolean) ?? [];

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <nav className="mb-4 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Início</Link> / <Link to="/catalogo" className="hover:text-foreground">Catálogo</Link> / <span className="text-foreground">{artwork.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* IMAGE with watermark */}
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-surface">
            <div className="relative aspect-square">
              <img src={artwork.preview_url} alt={artwork.title} className="h-full w-full object-cover" />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-25 mix-blend-overlay"
                style={{ backgroundImage: "repeating-linear-gradient(-30deg, transparent 0 80px, oklch(1 0 0 / 0.25) 80px 81px)" }}
              >
                <span className="rotate-[-20deg] font-display text-5xl font-black tracking-widest text-white/70">ESTAMPAHUB</span>
              </div>
            </div>
          </div>

          {/* INFO */}
          <div className="flex flex-col gap-4">
            {(artwork as any).categories && (
              <Link to="/catalogo" search={{ categoria: (artwork as any).categories.slug } as any} className="text-xs uppercase tracking-wider text-primary hover:underline">
                {(artwork as any).categories.name}
              </Link>
            )}
            <h1 className="font-display text-3xl font-bold md:text-4xl">{artwork.title}</h1>
            {artwork.description && <p className="text-muted-foreground">{artwork.description}</p>}

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {artwork.file_format && <span className="flex items-center gap-1"><FileType className="h-4 w-4" /> {artwork.file_format.toUpperCase()}</span>}
              {artwork.colors && artwork.colors.length > 0 && (
                <span className="flex items-center gap-1"><Palette className="h-4 w-4" /> {artwork.colors.length} cores</span>
              )}
              <span className="flex items-center gap-1"><Download className="h-4 w-4" /> {artwork.download_count ?? 0} downloads</span>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-5">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black">{formatBRL(artwork.price_cents)}</span>
                <span className="text-sm text-muted-foreground">avulso</span>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                {session ? (
                  <>
                    <Button
                      onClick={() => downloadMut.mutate()}
                      disabled={downloadMut.isPending || !canDownload}
                      className="bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-90"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {downloadMut.isPending ? "Preparando..." : canDownload ? `Baixar (${sub!.credits_remaining} créditos)` : "Baixar com assinatura"}
                    </Button>
                    {!sub && (
                      <p className="text-xs text-muted-foreground">
                        Você ainda não tem assinatura ativa. <Link to="/planos" className="text-primary underline">Ver planos</Link>.
                      </p>
                    )}
                    {sub && !canDownload && (
                      <p className="text-xs text-warning">
                        Sem créditos este mês. <Link to="/planos" className="text-primary underline">Fazer upgrade</Link>.
                      </p>
                    )}
                    <Button variant="outline" disabled title="Em breve"><ShoppingCart className="mr-2 h-4 w-4" /> Comprar avulso (em breve)</Button>
                  </>
                ) : (
                  <Button asChild className="bg-gradient-brand text-brand-foreground shadow-brand">
                    <Link to="/auth">Entrar para baixar</Link>
                  </Button>
                )}
              </div>
            </div>

            {tags.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tags</h3>
                <div className="flex flex-wrap gap-1">
                  {tags.map((t) => (
                    <Link key={t.id} to="/catalogo" search={{ tag: t.slug } as any}>
                      <Badge variant="secondary" className="gap-1"><TagIcon className="h-3 w-3" /> {t.name}</Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
