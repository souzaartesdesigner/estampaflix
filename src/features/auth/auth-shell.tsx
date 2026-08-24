import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Sparkles, Check } from "lucide-react";
import logoAsset from "@/assets/estampa-flix-logo.png.asset.json";
import { useSiteSettings } from "@/hooks/use-site-settings";

const PERKS = [
  "Artes em alta resolução",
  "Downloads rápidos",
  "Novas artes regularmente",
  "Conteúdo para sublimadores",
];


export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { data: settings } = useSiteSettings();
  const logo = settings?.logo_url || logoAsset.url;
  const siteName = settings?.site_name ?? "Estampa Flix";

  return (
    <main className="relative flex min-h-screen w-full flex-col lg:flex-row">
      {/* Painel visual (showcase) — ~34% no desktop */}
      <section className="relative flex w-full shrink-0 flex-col justify-start gap-8 overflow-hidden border-b border-border/40 px-6 py-10 lg:w-[34%] lg:min-h-screen lg:border-b-0 lg:border-r lg:border-r-primary/15 lg:px-10 lg:py-10 xl:px-12">
        {/* Background atual, restrito ao painel esquerdo */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-background"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 90% 45% at 25% 12%, var(--brand), transparent 65%), radial-gradient(ellipse 80% 40% at 85% 90%, var(--brand-2), transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-background/80"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "linear-gradient(oklch(1 0 0 / 0.5) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            opacity: 0.035,
            maskImage: "radial-gradient(ellipse at 35% 35%, black, transparent 78%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 top-1/3 -z-10 h-72 w-72 rounded-full blur-[130px]"
          style={{ background: "var(--brand)", opacity: 0.18 }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-px lg:block"
          style={{
            background:
              "linear-gradient(180deg, transparent, oklch(0.635 0.208 253 / 0.35), transparent)",
          }}
        />

        <Link to="/" className="relative inline-flex w-fit items-center">
          <img src={logo} alt={siteName} className="h-9 w-auto object-contain" />
        </Link>

        <div className="relative max-w-full animate-fade-in">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
            <Sparkles className="h-3 w-3" /> Artes digitais para sublimação
          </span>
          <h2 className="mt-5 max-w-full font-display text-[clamp(1.6rem,2.2vw,2.3rem)] font-bold leading-[1.12] tracking-tight">
            Suas artes.
            <br />
            Sua produção.
            <br />
            <span className="text-primary">Mais possibilidades.</span>
          </h2>
          <p className="mt-4 max-w-[34ch] text-sm leading-relaxed text-muted-foreground">
            Encontre artes prontas para transformar suas ideias em produtos incríveis.
          </p>

          <ul className="mt-7 grid max-w-[34ch] gap-2.5">
            {PERKS.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-sm text-foreground/90">
                <span className="grid h-4.5 w-4.5 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                  <Check className="h-2.5 w-2.5" />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative mt-auto hidden text-xs text-muted-foreground lg:block">
          © {new Date().getFullYear()} {siteName}.
        </p>
      </section>


      {/* Formulário */}
      <section className="relative flex w-full flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-[440px]">
          <div className="mb-7 flex flex-col items-center text-center lg:hidden">
            <Link to="/">
              <img src={logo} alt={siteName} className="h-9 w-auto object-contain" />
            </Link>
          </div>

          <div className="relative overflow-hidden rounded-[26px] border border-border/60 bg-card/60 p-7 shadow-elegant backdrop-blur-2xl sm:p-9">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-10 top-0 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, oklch(0.635 0.208 253 / 0.9), transparent)",
              }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-40 w-2/3 rounded-full blur-3xl"
              style={{ background: "var(--brand)", opacity: 0.12 }}
            />

            <div className="relative mb-6">
              <h1 className="font-display text-2xl font-bold tracking-tight sm:text-[27px]">{title}</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
            </div>

            <div className="relative">{children}</div>
          </div>

          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </section>
    </main>
  );
}

export function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "Mínimo de 6 caracteres", ok: password.length >= 6 },
    { label: "Uma letra maiúscula", ok: /[A-Z]/.test(password) },
    { label: "Um número", ok: /[0-9]/.test(password) },
    { label: "Um símbolo (!@#...)", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const label = score <= 1 ? "Fraca" : score === 2 ? "Razoável" : score === 3 ? "Boa" : "Forte";
  const color =
    score <= 1 ? "bg-destructive" : score === 2 ? "bg-warning" : score === 3 ? "bg-primary" : "bg-success";

  return (
    <div className="rounded-xl border border-border/60 bg-surface/40 p-3.5">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Força da senha</span>
        <span className="font-medium">{label}</span>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-border">
        <div className={`h-full transition-all duration-300 ${color}`} style={{ width: `${(score / 4) * 100}%` }} />
      </div>
      <ul className="grid gap-1 text-xs sm:grid-cols-2">
        {checks.map((c) => (
          <li key={c.label} className={c.ok ? "text-success" : "text-muted-foreground"}>
            {c.ok ? "✓" : "○"} {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GoogleButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-border/60 bg-surface/40 py-2.5 text-sm font-medium transition-colors hover:bg-surface hover:text-foreground"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
        <path fill="#EA4335" d="M12 5c1.6 0 3.1.6 4.2 1.6l3.1-3.1C17.5 1.7 14.9.6 12 .6 7.3.6 3.3 3.3 1.4 7.3l3.6 2.8C6 7.1 8.8 5 12 5z" />
        <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.4H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
        <path fill="#FBBC05" d="M5 14.1c-.3-.9-.5-1.9-.5-2.9s.2-2 .5-2.9L1.4 5.5C.5 7.3 0 9.3 0 11.4s.5 4.1 1.4 5.9l3.6-2.8z" />
        <path fill="#34A853" d="M12 22.2c3.2 0 5.9-1.1 7.8-2.9l-3.7-2.9c-1 .7-2.4 1.1-4.1 1.1-3.2 0-5.9-2.1-6.9-5L1.4 15.3C3.3 19.3 7.3 22.2 12 22.2z" />
      </svg>
      {label}
    </button>
  );
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  error,
  visible,
  onToggle,
  autoFocus,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  error?: string;
  visible: boolean;
  onToggle: () => void;
  autoFocus?: boolean;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="w-full rounded-xl border border-border/60 bg-surface/40 py-2.5 pl-3.5 pr-11 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary/60 focus:bg-surface focus:ring-2 focus:ring-primary/25"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          {visible ? <EyeOff /> : <Eye />}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function Eye() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOff() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 8 10 8a18 18 0 0 1-2.16 3.19M6.6 6.6A18 18 0 0 0 2 12s3.5 8 10 8a9.3 9.3 0 0 0 5.4-1.6" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

export function TextField({
  id,
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  error,
  autoFocus,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  error?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="w-full rounded-xl border border-border/60 bg-surface/40 px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary/60 focus:bg-surface focus:ring-2 focus:ring-primary/25"
      />
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
