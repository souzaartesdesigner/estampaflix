import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/lib/i18n";


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Esta página não carregou
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo deu errado do nosso lado. Você pode tentar recarregar ou voltar ao início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Estampa Flix — Artes digitais para sublimação, DTF e estamparia" },
      { name: "description", content: "Milhares de artes digitais em alta qualidade (300 DPI) para sublimação, DTF e estamparia. Assine e baixe novas estampas todo mês com licença comercial." },
      { property: "og:title", content: "Estampa Flix — Artes digitais para sublimação, DTF e estamparia" },
      { property: "og:description", content: "Milhares de artes digitais em alta qualidade (300 DPI) para sublimação, DTF e estamparia. Assine e baixe novas estampas todo mês com licença comercial." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Estampa Flix" },
      { property: "og:url", content: "https://estampaflix.com/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Estampa Flix — Artes digitais para sublimação, DTF e estamparia" },
      { name: "twitter:description", content: "Milhares de artes digitais em alta qualidade (300 DPI) para sublimação, DTF e estamparia. Assine e baixe novas estampas todo mês com licença comercial." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8a36e287-6af7-46bc-9720-aead028ba808/id-preview-91e266b7--bb6fa90b-8f5d-47be-8009-cbab5c7a45fa.lovable.app-1784641090696.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8a36e287-6af7-46bc-9720-aead028ba808/id-preview-91e266b7--bb6fa90b-8f5d-47be-8009-cbab5c7a45fa.lovable.app-1784641090696.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "preconnect", href: "https://tkzkespxrbgudujvuecq.supabase.co", crossOrigin: "anonymous" },
      { rel: "dns-prefetch", href: "https://tkzkespxrbgudujvuecq.supabase.co" },
      { rel: "dns-prefetch", href: "https://estampaflix.com" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&family=Sora:wght@700;800&display=swap" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: "Estampa Flix",
              url: "https://estampaflix.com/",
            },
            {
              "@type": "WebSite",
              name: "Estampa Flix",
              url: "https://estampaflix.com/",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://estampaflix.com/catalogo?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            },
          ],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <Outlet />
        <Toaster richColors position="top-right" />
      </I18nProvider>
    </QueryClientProvider>
  );
}

