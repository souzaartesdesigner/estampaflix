import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/pagamento/sucesso")({
  head: () => ({ meta: [{ title: "Pagamento confirmado — Estampa Flix" }, { name: "robots", content: "noindex" }] }),
  component: Sucesso,
});

function Sucesso() {
  return (
    <SiteLayout>
      <section className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
        <CheckCircle2 className="h-16 w-16 text-success" />
        <h1 className="mt-4 font-display text-3xl font-black md:text-4xl">Assinatura confirmada!</h1>
        <p className="mt-3 text-muted-foreground">
          Seus créditos já estão disponíveis. Pode começar a baixar suas artes agora mesmo.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild className="bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-90">
            <Link to="/catalogo">Explorar catálogo</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/minha-conta">Minha conta</Link>
          </Button>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          Se os créditos não aparecerem em alguns segundos, atualize a página.
        </p>
      </section>
    </SiteLayout>
  );
}
