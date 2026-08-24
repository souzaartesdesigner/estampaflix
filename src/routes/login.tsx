import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — Estampa Flix" },
      { name: "description", content: "Bem-vindo de volta à Estampa Flix. Acesse sua conta." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/minha-conta", search: { tab: "profile" } });
    });
  }, [navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Bem-vindo de volta!");
    navigate({ to: "/minha-conta", search: { tab: "profile" } });
  }

  async function handleGoogleLogin() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) toast.error("Erro ao entrar com Google");
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
                Bem-vindo <span className="text-primary">de volta</span>
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                Entre com suas credenciais para acessar sua conta.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <Link
                    to="/esqueci-a-senha"
                    className="text-xs text-primary hover:brightness-110 font-medium"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 bg-white/5 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl font-bold bg-primary hover:opacity-90 transition-all text-white"
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-white/10" />
              <span>OU</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <Button
              variant="outline"
              onClick={handleGoogleLogin}
              className="w-full h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3.1.6 4.2 1.6l3.1-3.1C17.5 1.7 14.9.6 12 .6 7.3.6 3.3 3.3 1.4 7.3l3.6 2.8C6 7.1 8.8 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.4H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                <path fill="#FBBC05" d="M5 14.1c-.3-.9-.5-1.9-.5-2.9s.2-2 .5-2.9L1.4 5.5C.5 7.3 0 9.3 0 11.4s.5 4.1 1.4 5.9l3.6-2.8z" />
                <path fill="#34A853" d="M12 22.2c3.2 0 5.9-1.1 7.8-2.9l-3.7-2.9c-1 .7-2.4 1.1-4.1 1.1-3.2 0-5.9-2.1-6.9-5L1.4 15.3C3.3 19.3 7.3 22.2 12 22.2z" />
              </svg>
              Entrar com Google
            </Button>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Ainda não tem conta?{" "}
              <Link to="/cadastro" className="text-primary hover:brightness-110 font-bold">
                Criar conta grátis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
