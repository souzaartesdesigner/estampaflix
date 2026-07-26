import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Zap } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { useI18n } from "@/lib/i18n";
import { homeQuery } from "@/features/home/home-query";
import { HeroSection } from "@/features/home/hero-section";
import { HeroBanners } from "@/features/home/hero-banners";
import { CategoriesCarousel } from "@/features/home/categories-carousel";
import { SectionTitle } from "@/features/home/section-title";
import { ArtGrid } from "@/features/home/art-grid";
import { PlansSection } from "@/features/home/plans-section";
import { TestimonialsSection } from "@/features/home/testimonials-section";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQuery),
  head: () => ({
    meta: [
      { title: "Estampa Flix — Artes digitais para sublimação e DTF" },
      {
        name: "description",
        content:
          "Baixe artes digitais em 300 DPI para sublimação, DTF e estamparia. Assinatura com créditos mensais, licença comercial vitalícia e novas estampas toda semana.",
      },
      {
        name: "keywords",
        content:
          "artes para sublimação, estampas digitais, arte digital DTF, artes para camiseta, estampas prontas, arte para caneca, artes 300 dpi, licença comercial",
      },
      { property: "og:title", content: "Estampa Flix — Artes digitais para sublimação e DTF" },
      {
        property: "og:description",
        content:
          "Artes digitais em alta resolução para sublimação, DTF e estamparia, com licença comercial e novas estampas toda semana.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://estampaflix.com/" },
    ],
    links: [{ rel: "canonical", href: "https://estampaflix.com/" }],
  }),
  component: Home,
});

const DEFAULT_SECTIONS = [
  { id: "d-categories", section_type: "_categories", title: "", item_limit: 12, sort_order: 1 },
  { id: "d-new", section_type: "new", title: "", item_limit: 8, sort_order: 2 },
  { id: "d-popular", section_type: "popular", title: "", item_limit: 8, sort_order: 3 },
  { id: "d-featured", section_type: "featured", title: "", item_limit: 8, sort_order: 4 },
  { id: "d-plans", section_type: "_plans", title: "", item_limit: 0, sort_order: 5 },
] as any[];

function Home() {
  const { data } = useSuspenseQuery(homeQuery);
  const { t } = useI18n();

  const sections = data.sections && data.sections.length > 0 ? data.sections : DEFAULT_SECTIONS;

  const renderSection = (s: any) => {
    const limit = s.item_limit ?? 8;
    switch (s.section_type) {
      case "featured":
        if (data.featured.length === 0) return null;
        return (
          <section key={s.id} className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
            <SectionTitle title={s.title || t("home.featuredTitle")} subtitle={t("home.featuredSubtitle")} />
            <ArtGrid items={data.featured.slice(0, limit)} emptyMsg={t("home.emptyGrid")} />
          </section>
        );
      case "popular":
        if (data.popular.length === 0) return null;
        return (
          <section key={s.id} className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
            <SectionTitle
              title={s.title || t("home.trendingTitle")}
              subtitle={t("home.trendingSubtitle")}
              icon={<Zap className="h-5 w-5 text-brand-2" />}
            />
            <ArtGrid items={data.popular.slice(0, limit)} emptyMsg={t("home.emptyGrid")} />
          </section>
        );
      case "new":
        return (
          <section key={s.id} className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
            <SectionTitle
              title={s.title || t("home.recentTitle")}
              subtitle={t("home.recentSubtitle")}
              cta={{ to: "/catalogo", label: t("home.viewAll") }}
            />
            <ArtGrid items={data.recent.slice(0, limit)} emptyMsg={t("home.emptyGrid")} />
          </section>
        );
      case "category": {
        const items = data.categoryItems?.[s.id] ?? [];
        if (items.length === 0) return null;
        return (
          <section key={s.id} className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
            <SectionTitle title={s.title || "Categoria"} cta={{ to: "/catalogo", label: t("home.viewAll") }} />
            <ArtGrid items={items.slice(0, limit)} emptyMsg={t("home.emptyGrid")} />
          </section>
        );
      }
      case "manual": {
        const items = data.manualItems?.[s.id] ?? [];
        if (items.length === 0) return null;
        return (
          <section key={s.id} className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
            <SectionTitle title={s.title || "Seleção"} subtitle={t("home.featuredSubtitle")} />
            <ArtGrid items={items.slice(0, s.item_limit ?? 8)} emptyMsg={t("home.emptyGrid")} />
          </section>
        );
      }
      case "_categories":
        if (data.categories.length === 0) return null;
        return (
          <section key={s.id} className="mx-auto w-full max-w-7xl px-4 py-10 sm:py-16">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-bold sm:text-3xl">{t("home.categoriesTitle")}</h2>
              <Button asChild variant="secondary" size="sm" className="rounded-lg">
                <Link to="/catalogo">{t("home.viewCategories")}</Link>
              </Button>
            </div>
            <CategoriesCarousel categories={data.categories} />
          </section>
        );
      case "_plans":
        return <PlansSection key={s.id} plans={data.plans} />;
      default:
        return null;
    }
  };

  // If user configured sections, they may not include categories/plans — always ensure plans render at end.
  const hasPlans = sections.some((s: any) => s.section_type === "_plans");
  const hasCategories = sections.some((s: any) => s.section_type === "_categories");

  return (
    <SiteLayout>
      <HeroBanners banners={data.heroBanners} />
      <HeroSection recent={data.recent} />

      {!hasCategories && data.categories.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:py-16">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">{t("home.categoriesTitle")}</h2>
            <Button asChild variant="secondary" size="sm" className="rounded-lg">
              <Link to="/catalogo">{t("home.viewCategories")}</Link>
            </Button>
          </div>
          <CategoriesCarousel categories={data.categories} />
        </section>
      )}

      {sections.map(renderSection)}

      {data.middleBanners.length > 0 && <HeroBanners banners={data.middleBanners} />}

      {!hasPlans && <PlansSection plans={data.plans} />}

      <TestimonialsSection />
    </SiteLayout>
  );
}
