import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Phone, Loader2, ArrowLeft } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Criar conta — Estampa Flix" },
      {
        name: "description",
        content: "Crie sua conta na Estampa Flix para baixar artes digitais e gerenciar suas compras.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Signup,
});

function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/minha-conta", search: { tab: "profile" } });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        data: { 
          full_name: name,
          whatsapp: whatsapp
        }, 
        emailRedirectTo: `${window.location.origin}/auth/callback` 
      },
    });
    setLoading(false);
    
    if (error) return toast.error(error.message);
    
    toast.success("Conta criada! Confira seu e-mail para confirmar.");
    navigate({ to: "/login" });
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            Crie sua <span className="text-primary">conta</span>
          </h2>
          <p className="text-white/60 text-sm">
            Preencha os dados abaixo para começar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white/80">Nome Completo</Label>
            <Input
              id="name"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-12 bg-white/5 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all rounded-xl"
            />
          </div>

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
            <Label htmlFor="whatsapp" className="text-white/80">WhatsApp</Label>
            <div className="relative">
              <Input
                id="whatsapp"
                placeholder="(00) 00000-0000"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                required
                className="h-12 bg-white/5 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all rounded-xl pl-10"
              />
              <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" dangerouslySetInnerHTML={{ __html: "Senha" }} className="text-white/80" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="h-12 bg-white/5 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all rounded-xl"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-primary hover:opacity-90 rounded-xl font-bold transition-all text-white shadow-lg shadow-primary/20"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando...
              </>
            ) : (
              "Criar conta"
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-white/60">
          Já tem conta?{" "}
          <Link to="/login" className="text-primary hover:brightness-110 font-bold">
            Entrar agora
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
