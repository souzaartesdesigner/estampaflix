import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — Estampa Flix" },
      {
        name: "description",
        content: "Acesse sua conta na Estampa Flix para baixar artes digitais e gerenciar suas compras.",
      },
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    
    if (error) return toast.error(error.message);
    
    toast.success("Bem-vindo de volta!");
    navigate({ to: "/minha-conta", search: { tab: "profile" } });
  }

  async function handleGoogleSignIn() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) toast.error("Erro ao entrar com Google");
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            Bem-vindo <span className="text-primary">de volta</span>
          </h2>
          <p className="text-white/60 text-sm">
            Entre com suas credenciais para acessar sua conta.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/80">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 bg-white/5 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" dangerouslySetInnerHTML={{ __html: "Senha" }} className="text-white/80" />
              <Link
                to="/esqueci-a-senha"
                className="text-xs text-primary hover:brightness-110 transition-all font-medium"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 bg-white/5 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all rounded-xl pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-primary hover:opacity-90 rounded-xl font-bold transition-all text-white shadow-lg shadow-primary/20"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#0f0f0f] px-2 text-white/40">Ou continue com</span>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={handleGoogleSignIn}
          className="w-full h-12 bg-white/5 border-white/10 hover:bg-white/10 rounded-xl font-medium transition-all text-white"
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3.1.6 4.2 1.6l3.1-3.1C17.5 1.7 14.9.6 12 .6 7.3.6 3.3 3.3 1.4 7.3l3.6 2.8C6 7.1 8.8 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.7-.2-2.4H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5 14.1c-.3-.9-.5-1.9-.5-2.9s.2-2 .5-2.9L1.4 5.5C.5 7.3 0 9.3 0 11.4s.5 4.1 1.4 5.9l3.6-2.8z"
            />
            <path
              fill="#34A853"
              d="M12 22.2c3.2 0 5.9-1.1 7.8-2.9l-3.7-2.9c-1 .7-2.4 1.1-4.1 1.1-3.2 0-5.9-2.1-6.9-5L1.4 15.3C3.3 19.3 7.3 22.2 12 22.2z"
            />
          </svg>
          Google
        </Button>

        <p className="text-center text-sm text-white/60">
          Ainda não tem conta?{" "}
          <Link to="/cadastro" className="text-primary hover:brightness-110 font-bold">
            Criar conta grátis
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
