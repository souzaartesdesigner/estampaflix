import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site-layout";
import { ArtworkCard } from "@/components/artwork-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, ChevronLeft, ChevronRight, FileText as FileIcon, Palette, Sparkles, Zap } from "lucide-react";
import { formatBRL } from "@/lib/format";
import { useEffect, useRef, useState } from "react";
import { useI18n, tField } from "@/lib/i18n";

const homeQuery = queryOptions({
  queryKey: ["home-data"],
  queryFn: async () => {
    const [{ data: featured }, { data: recent }, { data: trending }, { data: categories }, { data: plans }] =
      await Promise.all([
        supabase.from("artworks").select("id,slug,title,preview_url,price_cents,is_featured,is_trending,download_count,translations").eq("is_published", true).eq("is_featured", true).limit(8),
        supabase.from("artworks").select("id,slug,title,preview_url,price_cents,is_featured,is_trending,download_count,translations").eq("is_published", true).order("created_at", { ascending: false }).limit(12),
        supabase.from("artworks").select("id,slug,title,preview_url,price_cents,is_featured,is_trending,download_count,translations").eq("is_published", true).eq("is_trending", true).limit(8),
        supabase.from("categories").select("id,slug,name,cover_url,translations").order("sort_order").limit(12),
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
  const { t, lang } = useI18n();

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-20 lg:grid-cols-2 lg:py-28">
          <div className="flex flex-col justify-center gap-6">
            <Badge className="w-fit bg-primary/15 text-primary border-primary/30">
              <Sparkles className="mr-1 h-3 w-3" /> {t("home.badge")}
            </Badge>
            <h1 className="font-display text-4xl font-black leading-tight md:text-6xl">
              {t("home.heroTitle1")} <span className="text-gradient-brand">{t("home.heroTitleHighlight")}</span> {t("home.heroTitle2")}
            </h1>
            <p className="max-w-lg text-lg text-muted-foreground">{t("home.heroSubtitle")}</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-90">
                <Link to="/planos">{t("home.ctaPlans")} <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/catalogo">{t("home.ctaCatalog")}</Link>
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> {t("home.check1")}</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> {t("home.check2")}</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> {t("home.check3")}</span>
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
                  <img src={a.preview_url} alt={tField(a as any, "title", lang) || a.title} className="h-full w-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      {data.categories.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-16">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="font-display text-2xl font-bold md:text-3xl">{t("home.categoriesTitle")}</h2>
            <Button asChild variant="secondary" className="rounded-lg">
              <Link to="/catalogo">{t("home.viewCategories")}</Link>
            </Button>
          </div>
          <CategoriesCarousel categories={data.categories} />
        </section>
      )}

      {/* RECENT */}
      <section className="mx-auto w-full max-w-7xl px-4 py-8">
        <SectionTitle title={t("home.recentTitle")} subtitle={t("home.recentSubtitle")} cta={{ to: "/catalogo", label: t("home.viewAll") }} />
        <ArtGrid items={data.recent.slice(0, 8)} emptyMsg={t("home.emptyGrid")} />
      </section>

      {/* TRENDING */}
      {data.trending.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-8">
          <SectionTitle title={t("home.trendingTitle")} subtitle={t("home.trendingSubtitle")} icon={<Zap className="h-5 w-5 text-brand-2" />} />
          <ArtGrid items={data.trending} emptyMsg={t("home.emptyGrid")} />
        </section>
      )}

      {/* FEATURED */}
      {data.featured.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-8">
          <SectionTitle title={t("home.featuredTitle")} subtitle={t("home.featuredSubtitle")} />
          <ArtGrid items={data.featured} emptyMsg={t("home.emptyGrid")} />
        </section>
      )}

      {/* PLANS */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16">
        <SectionTitle title={t("home.plansTitle")} subtitle={t("home.plansSubtitle")} center />
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {data.plans.map((plan, idx) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                idx === 1 ? "border-primary/60 bg-card shadow-brand" : "border-border/60 bg-card"
              }`}
            >
              {idx === 1 && (
                <Badge className="absolute right-4 top-4 bg-gradient-brand text-brand-foreground border-0">{t("home.popular")}</Badge>
              )}
              <h3 className="font-display text-xl font-bold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-black">{formatBRL(plan.price_cents)}</span>
                <span className="text-sm text-muted-foreground">{t("plans.perMonth")}</span>
              </div>
              <div className="mt-2 text-sm text-primary">{plan.monthly_credits} {t("plans.downloadsPerMonth")}</div>
              <ul className="mt-4 flex flex-1 flex-col gap-2 text-sm">
                {(plan.features as string[]).map((f: string) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {f}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-6 bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-90">
                <Link to="/planos">{t("home.subscribe")} {plan.name}</Link>
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
    <div className={`mb-6 flex gap-4 ${center ? "flex-col items-center text-center" : "items-end justify-between"}`}>
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

function ArtGrid({ items, emptyMsg }: { items: any[]; emptyMsg: string }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 p-12 text-center text-sm text-muted-foreground">
        {emptyMsg}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {items.map((a) => <ArtworkCard key={a.id} artwork={a} />)}
    </div>
  );
}

function CategoriesCarousel({ categories }: { categories: any[] }) {
  const { t, lang } = useI18n();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);
  const [activePage, setActivePage] = useState(0);
  const [paused, setPaused] = useState(false);

  const recompute = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const pages = Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth));
    setPageCount(pages);
    setActivePage(Math.round(el.scrollLeft / el.clientWidth));
  };

  useEffect(() => {
    recompute();
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => setActivePage(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", onScroll); ro.disconnect(); };
  }, [categories.length]);

  useEffect(() => {
    if (paused || pageCount <= 1) return;
    const id = setInterval(() => {
      const el = scrollerRef.current;
      if (!el) return;
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % pageCount;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    }, 4000);
    return () => clearInterval(id);
  }, [paused, pageCount]);

  const scrollByPage = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const next = Math.min(pageCount - 1, Math.max(0, Math.round(el.scrollLeft / el.clientWidth) + dir));
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <button
        type="button"
        aria-label={t("home.previous")}
        onClick={() => scrollByPage(-1)}
        className="absolute -left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-primary shadow-lg ring-1 ring-border/60 backdrop-blur transition hover:bg-primary hover:text-primary-foreground md:-left-5"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label={t("home.next")}
        onClick={() => scrollByPage(1)}
        className="absolute -right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-primary shadow-lg ring-1 ring-border/60 backdrop-blur transition hover:bg-primary hover:text-primary-foreground md:-right-5"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {categories.map((c: any) => {
          const samples: any[] = c.samples ?? [];
          const filled = [...samples, ...Array(Math.max(0, 4 - samples.length)).fill(null)];
          const catName = tField(c as any, "name", lang) || c.name;
          return (
            <Link
              key={c.id}
              to="/catalogo"
              search={{ categoria: c.slug } as any}
              className="group w-[260px] flex-none snap-start md:w-[280px]"
            >
              <div className="grid grid-cols-2 grid-rows-2 gap-2">
                {filled.slice(0, 4).map((s, i) => (
                  <div key={i} className="aspect-square overflow-hidden rounded-md bg-[#ebebeb] ring-1 ring-border/40">
                    {s ? (
                      <img src={s.preview_url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : c.cover_url && i === 0 ? (
                      <img src={c.cover_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
                        <Palette className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between px-1">
                <span className="text-sm font-semibold text-foreground group-hover:text-primary">{catName}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <FileIcon className="h-3.5 w-3.5" />
                  {c.count}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {pageCount > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${t("home.next")} ${i + 1}`}
              onClick={() => {
                const el = scrollerRef.current;
                if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
              }}
              className={`h-2 rounded-full transition-all ${i === activePage ? "w-6 bg-primary" : "w-2 bg-muted-foreground/40 hover:bg-muted-foreground/70"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
