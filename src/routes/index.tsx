import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site-layout";
import { ArtworkCard } from "@/components/artwork-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, Palette, Sparkles, Zap } from "lucide-react";
import { formatBRL } from "@/lib/format";

const homeQuery = queryOptions({
  queryKey: ["home-data"],
  queryFn: async () => {
    const [{ data: featured }, { data: recent }, { data: trending }, { data: categories }, { data: plans }] =
      await Promise.all([
        supabase.from("artworks").select("id,slug,title,preview_url,price_cents,is_featured,is_trending,download_count").eq("is_published", true).eq("is_featured", true).limit(8),
        supabase.from("artworks").select("id,slug,title,preview_url,price_cents,is_featured,is_trending,download_count").eq("is_published", true).order("created_at", { ascending: false }).limit(12),
        supabase.from("artworks").select("id,slug,title,preview_url,price_cents,is_featured,is_trending,download_count").eq("is_published", true).eq("is_trending", true).limit(8),
        supabase.from("categories").select("id,slug,name,cover_url").order("sort_order").limit(12),
        supabase.from("plans").select("*").eq("is_active", true).order("sort_order"),
      ]);
    const cats = categories ?? [];
    const catsWithSamples = await Promise.all(
      cats.map(async (c) => {
        const [{ data: samples }, { count }] = await Promise.all([
          supabase.from("artworks").select("id,preview_url").eq("is_published", true).eq("category_id", c.id).order("created_at", { ascending: false }).limit(4),
          supabase.from("artworks").select("id", { count: "exact", head: true }).eq("is_published", true).eq("category_id", c.id),
        ]);
        return { ...c, samples: samples ?? [], count: count ?? 0 };
      })
    );
    return { featured: featured ?? [], recent: recent ?? [], trending: trending ?? [], categories: catsWithSamples, plans: plans ?? [] };
  },
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQuery),
  component: Home,
});

function Home() {
  const { data } = useSuspenseQuery(homeQuery);

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-20 lg:grid-cols-2 lg:py-28">
          <div className="flex flex-col justify-center gap-6">
            <Badge className="w-fit bg-primary/15 text-primary border-primary/30">
              <Sparkles className="mr-1 h-3 w-3" /> Novas artes toda semana
            </Badge>
            <h1 className="font-display text-4xl font-black leading-tight md:text-6xl">
              Artes digitais que <span className="text-gradient-brand">transformam</span> a sua produção
            </h1>
            <p className="max-w-lg text-lg text-muted-foreground">
              Milhares de estampas prontas para sublimação, DTF e camisetas. Assine e baixe todo mês, ou compre avulso.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-90">
                <Link to="/planos">Ver planos <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/catalogo">Explorar catálogo</Link>
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Uso comercial liberado</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Alta resolução</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Suporte dedicado</span>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="grid grid-cols-3 gap-3">
              {data.recent.slice(0, 9).map((a, i) => (
                <div
                  key={a.id}
                  className={`aspect-square overflow-hidden rounded-xl border border-border/60 bg-surface ${
                    i === 4 ? "shadow-brand" : ""
                  }`}
                  style={{ transform: `translateY(${(i % 3) * 12}px)` }}
                >
                  <img src={a.preview_url} alt={a.title} className="h-full w-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      {data.categories.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-16">
          <SectionTitle title="Categorias populares" subtitle="Encontre a estampa perfeita" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
            {data.categories.map((c: any) => (
              <Link
                key={c.id}
                to="/catalogo"
                search={{ categoria: c.slug } as any}
                className="group relative flex aspect-square flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-border/60 bg-card text-center transition-all hover:-translate-y-1 hover:border-primary/50"
              >
                {c.cover_url ? (
                  <>
                    <img src={c.cover_url} alt={c.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                    <span className="relative z-10 mt-auto w-full px-2 pb-3 text-xs font-semibold text-foreground drop-shadow">{c.name}</span>
                  </>
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4">
                    <Palette className="h-6 w-6 text-primary" />
                    <span className="text-xs font-medium">{c.name}</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* RECENT */}
      <section className="mx-auto w-full max-w-7xl px-4 py-8">
        <SectionTitle title="Recém-adicionadas" subtitle="Fresquinhas no catálogo" cta={{ to: "/catalogo", label: "Ver tudo" }} />
        <ArtGrid items={data.recent.slice(0, 8)} />
      </section>

      {/* TRENDING */}
      {data.trending.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-8">
          <SectionTitle title="Em alta" subtitle="As mais baixadas do momento" icon={<Zap className="h-5 w-5 text-brand-2" />} />
          <ArtGrid items={data.trending} />
        </section>
      )}

      {/* FEATURED */}
      {data.featured.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-8">
          <SectionTitle title="Destaques da equipe" subtitle="Escolhidas a dedo pra você" />
          <ArtGrid items={data.featured} />
        </section>
      )}

      {/* PLANS */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16">
        <SectionTitle title="Planos de assinatura" subtitle="Baixe todo mês, economize sempre" center />
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {data.plans.map((plan, idx) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                idx === 1 ? "border-primary/60 bg-card shadow-brand" : "border-border/60 bg-card"
              }`}
            >
              {idx === 1 && (
                <Badge className="absolute right-4 top-4 bg-gradient-brand text-brand-foreground border-0">Mais popular</Badge>
              )}
              <h3 className="font-display text-xl font-bold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-black">{formatBRL(plan.price_cents)}</span>
                <span className="text-sm text-muted-foreground">/mês</span>
              </div>
              <div className="mt-2 text-sm text-primary">{plan.monthly_credits} downloads / mês</div>
              <ul className="mt-4 flex flex-1 flex-col gap-2 text-sm">
                {(plan.features as string[]).map((f: string) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {f}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-6 bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-90">
                <Link to="/planos">Assinar {plan.name}</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}

function SectionTitle({
  title,
  subtitle,
  cta,
  center,
  icon,
}: {
  title: string;
  subtitle?: string;
  cta?: { to: string; label: string };
  center?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className={`mb-6 flex items-end justify-between gap-4 ${center ? "flex-col items-center text-center" : ""}`}>
      <div>
        <h2 className="flex items-center gap-2 font-display text-2xl font-bold md:text-3xl">{icon}{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {cta && (
        <Link to={cta.to} className="text-sm font-medium text-primary hover:underline">
          {cta.label} →
        </Link>
      )}
    </div>
  );
}

function ArtGrid({ items }: { items: any[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 p-12 text-center text-sm text-muted-foreground">
        Nenhuma arte publicada ainda. Faça login como admin e comece a cadastrar em <Link to="/admin" className="text-primary underline">/admin</Link>.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {items.map((a) => <ArtworkCard key={a.id} artwork={a} />)}
    </div>
  );
}
