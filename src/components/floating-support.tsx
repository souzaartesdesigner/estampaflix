import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

export function FloatingSupport() {
  const { t } = useI18n();
  return (
    <Link
      to="/suporte"
      aria-label={t("float.support")}
      className="fixed bottom-5 right-5 z-[9999] transition-transform duration-300 hover:scale-110"
    >
      <img
        src="https://estampaflix.com/wp-content/uploads/2025/12/ATENDIMENTO.png"
        alt={t("float.support")}
        loading="lazy"
        decoding="async"
        width={120}
        height={120}
        className="h-[120px] w-[120px] cursor-pointer drop-shadow-[0_10px_30px_rgba(0,123,255,0.45)]"
      />
    </Link>
  );
}
