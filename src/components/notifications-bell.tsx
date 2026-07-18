import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotifications } from "@/hooks/use-notifications";
import { useI18n } from "@/lib/i18n";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { ptBR, enUS, es } from "date-fns/locale";

export function NotificationsBell() {
  const { list, unread, markAll, markOne, hasUser } = useNotifications();
  const { t, lang } = useI18n();
  const locale = lang === "pt" ? ptBR : lang === "es" ? es : enUS;

  if (!hasUser) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
          <span className="text-sm font-semibold">{t("notif.title")}</span>
          {unread > 0 && (
            <button onClick={() => markAll()} className="flex items-center gap-1 text-xs text-primary hover:underline">
              <Check className="h-3 w-3" /> {t("notif.markAll")}
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {list.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">{t("notif.empty")}</p>
          ) : (
            list.map((n) => {
              const Content = (
                <div className={`flex flex-col gap-1 border-b border-border/40 p-3 text-sm transition-colors hover:bg-muted/50 ${n.is_read ? "opacity-60" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{n.title}</p>
                    {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                  {n.message && <p className="text-xs text-muted-foreground">{n.message}</p>}
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale })}
                  </span>
                </div>
              );
              return n.link ? (
                <Link key={n.id} to={n.link as any} onClick={() => !n.is_read && markOne(n.id)}>
                  {Content}
                </Link>
              ) : (
                <div key={n.id} onClick={() => !n.is_read && markOne(n.id)} className="cursor-pointer">
                  {Content}
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
