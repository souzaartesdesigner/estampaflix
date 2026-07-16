import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function SiteFooter() {
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
          <p className="mt-3 text-sm text-muted-foreground">
            Artes digitais em alta qualidade para sublimação, DTF e produção criativa.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Navegação</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/catalogo" className="hover:text-foreground">Catálogo</Link></li>
            <li><Link to="/planos" className="hover:text-foreground">Planos</Link></li>
            <li><Link to="/blog" className="hover:text-foreground">Blog</Link></li>
            <li><Link to="/suporte" className="hover:text-foreground">Suporte</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Conta</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/auth" className="hover:text-foreground">Entrar / Criar conta</Link></li>
            <li><Link to="/minha-conta" className="hover:text-foreground">Minha conta</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Legal</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Termos de uso</li>
            <li>Política de privacidade</li>
            <li>Licença de uso comercial</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/40 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} EstampaHub — Todos os direitos reservados.
      </div>
    </footer>
  );
}
