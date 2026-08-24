import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/esqueci-a-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar acesso — Estampa Flix" },
      { name: "description", content: "Esqueceu sua senha? Recupere o acesso à sua conta na Estampa Flix." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EsqueciSenha,
});

function EsqueciSenha() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/minha-conta", search: { tab: "profile" } });
    });
  }, [navigate]);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0a0a0a] text-white overflow-hidden">
      {/* Lado Esquerdo (Desktop Hero) */}
      <div className="hidden lg:flex lg:max-w-[60%] flex-1 relative overflow-hidden items-center justify-center p-12 border-r border-white/5">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <Link to="/">
            <img
              src="https://estampaflix.com/__l5e/assets-v1/803758df-7757-44c9-8c71-26e110368b12/estampa-flix-logo.png"
              alt="Logo Estampa Flix"
              className="mb-12 h-12 w-auto object-contain"
            />
          </Link>
          <h1 className="text-6xl xl:text-7xl font-black tracking-tighter leading-[0.9] mb-6">
            SUBLIMAÇÃO <br />
            <span className="text-primary">EM ESCALA.</span>
          </h1>
          <p className="text-xl text-muted-foreground font-medium max-w-lg">
            Conecte-se, baixe milhares de artes e gere seus catálogos interativos em minutos.
          </p>
        </div>
      </div>

      {/* Lado Direito (Formulário) */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="lg:hidden absolute top-8 left-8">
           <Link to="/">
            <img
              src="https://estampaflix.com/__l5e/assets-v1/803758df-7757-44c9-8c71-26e110368b12/estampa-flix-logo.png"
              alt="Logo Estampa Flix"
              className="h-8 w-auto object-contain"
            />
          </Link>
        </div>
        
        <div className="w-full max-w-md">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl p-7 sm:p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight">
                Recuperar <span className="text-primary">acesso</span>
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                Digite seu e-mail e enviaremos um link de recuperação.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-white/5 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl font-bold bg-primary hover:opacity-90 transition-all text-white mt-2"
              >
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Lembrou sua senha?{" "}
              <Link to="/login" className="text-primary hover:brightness-110 font-bold">
                Voltar para o Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
