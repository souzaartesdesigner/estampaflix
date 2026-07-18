import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const STORAGE_KEY = "estampahub_cookie_consent_v1";

export function CookieBanner() {
  const { t } = useI18n();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setShow(true);
    } catch {}
  }, []);

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted: true, at: new Date().toISOString() }));
    } catch {}
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label={t("cookies.title")}
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-2xl border border-border/60 bg-card/95 p-4 shadow-2xl backdrop-blur-lg md:inset-x-auto md:right-6 md:bottom-6 md:p-5"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          <Cookie className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{t("cookies.title")}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("cookies.body")}{" "}
            <Link to="/privacidade" className="text-primary underline">
              {t("cookies.readMore")}
            </Link>
            .
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" className="bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-90" onClick={accept}>
              {t("cookies.accept")}
            </Button>
          </div>
        </div>
        <button
          onClick={accept}
          aria-label={t("cookies.close")}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
