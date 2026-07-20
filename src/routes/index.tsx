import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Zap } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { useI18n } from "@/lib/i18n";
import { homeQuery } from "@/features/home/home-query";
import { HeroSection } from "@/features/home/hero-section";
import { CategoriesCarousel } from "@/features/home/categories-carousel";
import { SectionTitle } from "@/features/home/section-title";
import { ArtGrid } from "@/features/home/art-grid";
import { PlansSection } from "@/features/home/plans-section";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQuery),
  component: Home,
});

function Home() {
  const { data } = useSuspenseQuery(homeQuery);
  const { t } = useI18n();

  return (
    <SiteLayout>
      <HeroSection recent={data.recent} />

      {data.categories.length > 0 && (
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

      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
        <SectionTitle
          title={t("home.recentTitle")}
          subtitle={t("home.recentSubtitle")}
          cta={{ to: "/catalogo", label: t("home.viewAll") }}
        />
        <ArtGrid items={data.recent.slice(0, 8)} emptyMsg={t("home.emptyGrid")} />
      </section>

      {data.trending.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
          <SectionTitle
            title={t("home.trendingTitle")}
            subtitle={t("home.trendingSubtitle")}
            icon={<Zap className="h-5 w-5 text-brand-2" />}
          />
          <ArtGrid items={data.trending} emptyMsg={t("home.emptyGrid")} />
        </section>
      )}

      {data.featured.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
          <SectionTitle title={t("home.featuredTitle")} subtitle={t("home.featuredSubtitle")} />
          <ArtGrid items={data.featured} emptyMsg={t("home.emptyGrid")} />
        </section>
      )}

      <PlansSection plans={data.plans} />
    </SiteLayout>
  );
}
