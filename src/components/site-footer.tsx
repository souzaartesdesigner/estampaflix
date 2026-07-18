import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="mt-24 border-t border-border/50 bg-surface/40">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand shadow-brand">
              <Sparkles className="h-4 w-4 text-brand-foreground" />
            </span>
            <span className="text-gradient-brand">EstampaHub</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{t("footer.tagline")}</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">{t("footer.navigation")}</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/catalogo" className="hover:text-foreground">{t("nav.catalog")}</Link></li>
            <li><Link to="/planos" className="hover:text-foreground">{t("nav.plans")}</Link></li>
            <li><Link to="/blog" className="hover:text-foreground">{t("nav.blog")}</Link></li>
            <li><Link to="/suporte" className="hover:text-foreground">{t("nav.support")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">{t("footer.account")}</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/auth" className="hover:text-foreground">{t("footer.signInCreate")}</Link></li>
            <li><Link to="/minha-conta" className="hover:text-foreground">{t("nav.myAccount")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">{t("footer.legal")}</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>{t("footer.terms")}</li>
            <li>{t("footer.privacy")}</li>
            <li>{t("footer.license")}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/40 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} EstampaHub — {t("footer.copyright")}
      </div>
    </footer>
  );
}
