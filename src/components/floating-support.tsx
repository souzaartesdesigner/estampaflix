import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

export function FloatingSupport() {
  const { t } = useI18n();
  return (
    <Link
      to="/suporte"
      aria-label={t("float.support")}
      className="fixed bottom-3 right-3 z-[9999] transition-transform duration-300 hover:scale-110 sm:bottom-5 sm:right-5"
    >
      <img
        src="https://estampaflix.com/wp-content/uploads/2025/12/ATENDIMENTO.png"
        alt={t("float.support")}
        loading="lazy"
        decoding="async"
        width={120}
        height={120}
        className="h-[72px] w-[72px] cursor-pointer drop-shadow-[0_10px_30px_rgba(0,123,255,0.45)] sm:h-[96px] sm:w-[96px] md:h-[120px] md:w-[120px]"
      />
    </Link>
  );
}
