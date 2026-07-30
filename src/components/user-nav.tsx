import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreditCard, Download, Heart, LogOut, MessageCircle, Settings, ShieldCheck, User } from "lucide-react";
import { useSiteSettings } from "@/hooks/use-site-settings";

type Props = { user: { id: string; email?: string | null; user_metadata?: any }; isAdmin?: boolean };

function ItemIcon({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`flex h-7 w-7 items-center justify-center rounded-lg bg-muted/60 ${className}`}>{children}</span>
  );
}

export function UserNav({ user, isAdmin }: Props) {
  const navigate = useNavigate();
  const { data: settings } = useSiteSettings();

  const { data: profile } = useQuery({
    queryKey: ["nav-profile", user.id],
    queryFn: async () =>
      (await supabase.from("profiles").select("full_name, avatar_url, email").eq("id", user.id).maybeSingle()).data,
  });

  const { data: sub } = useQuery({
    queryKey: ["nav-subscription", user.id],
    queryFn: async () =>
      (
        await supabase
          .from("subscriptions")
          .select("id, credits_remaining, status")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle()
      ).data,
  });

  const { data: todayCount = 0 } = useQuery({
    queryKey: ["nav-free-downloads", user.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("free_downloads_today");
      return (data as number) ?? 0;
    },
  });

  const name =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    (user.email ? user.email.split("@")[0] : "Minha conta");
  const email = profile?.email ?? user.email ?? "";
  const avatar = profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null;
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((p: string) => p[0])
    .join("")
    .toUpperCase();

  const downloadsBadge = sub ? "Ilimitado" : `${todayCount} / 5 hoje`;

  const whatsappRaw = settings?.whatsapp ?? "";
  const whatsappHref = whatsappRaw
    ? `https://wa.me/${whatsappRaw.replace(/\D/g, "")}`
    : null;

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <User className="h-4 w-4" />
          <span className="hidden max-w-[120px] truncate sm:inline">{name}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[280px] rounded-2xl border-border/60 p-2 shadow-2xl">
        <div className="flex items-center gap-3 px-2 py-2.5">
          {avatar ? (
            <img src={avatar} alt={name} className="h-11 w-11 rounded-full object-cover" />
          ) : (
            <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-brand text-sm font-bold text-brand-foreground">
              {initials || "U"}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild className="gap-3 rounded-xl px-2 py-2">
          <Link to="/minha-conta">
            <ItemIcon><Settings className="h-4 w-4" /></ItemIcon>
            <span className="text-sm">Minha conta</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="gap-3 rounded-xl px-2 py-2">
          <Link to="/cobranca">
            <ItemIcon><CreditCard className="h-4 w-4" /></ItemIcon>
            <span className="text-sm">Cobrança</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="gap-3 rounded-xl px-2 py-2">
          <Link to="/downloads">
            <ItemIcon><Download className="h-4 w-4" /></ItemIcon>
            <span className="text-sm">Downloads</span>
            <span className="ml-auto rounded-full bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {downloadsBadge}
            </span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="gap-3 rounded-xl px-2 py-2">
          <Link to="/favoritos">
            <ItemIcon><Heart className="h-4 w-4" /></ItemIcon>
            <span className="text-sm">Favoritos</span>
          </Link>
        </DropdownMenuItem>

        {isAdmin && (
          <DropdownMenuItem asChild className="gap-3 rounded-xl px-2 py-2">
            <Link to="/admin">
              <ItemIcon><ShieldCheck className="h-4 w-4" /></ItemIcon>
              <span className="text-sm">Admin</span>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {whatsappHref && (
          <DropdownMenuItem asChild className="gap-3 rounded-xl px-2 py-2">
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
              <ItemIcon className="bg-green-500/10"><MessageCircle className="h-4 w-4 text-green-500" /></ItemIcon>
              <span className="text-sm">Suporte WhatsApp</span>
            </a>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          onClick={signOut}
          className="gap-3 rounded-xl px-2 py-2 text-destructive focus:text-destructive"
        >
          <ItemIcon className="bg-destructive/10"><LogOut className="h-4 w-4 text-destructive" /></ItemIcon>
          <span className="text-sm">Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
