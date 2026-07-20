import { useSiteSettings } from "@/hooks/use-site-settings";
import { X } from "lucide-react";
import { useState, useEffect } from "react";

export function PromoBanner() {
  const { data } = useSiteSettings();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const key = `promo-dismissed-${data?.promo_banner_text ?? ""}`;
      setDismissed(sessionStorage.getItem(key) === "1");
    }
  }, [data?.promo_banner_text]);

  if (!data?.promo_banner_enabled || !data.promo_banner_text || dismissed) return null;

  const content = (
    <>
      <span className="flex-1 text-center">{data.promo_banner_text}</span>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDismissed(true);
          if (typeof window !== "undefined") {
            sessionStorage.setItem(`promo-dismissed-${data.promo_banner_text}`, "1");
          }
        }}
        className="p-1 opacity-80 hover:opacity-100"
        aria-label="Fechar"
      >
        <X className="h-3 w-3" />
      </button>
    </>
  );

  const className = "flex items-center gap-2 bg-gradient-brand px-4 py-2 text-xs font-medium text-brand-foreground sm:text-sm";

  if (data.promo_banner_link) {
    return <a href={data.promo_banner_link} className={className}>{content}</a>;
  }
  return <div className={className}>{content}</div>;
}
