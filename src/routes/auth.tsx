import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — Estampa Flix" },
      { name: "description", content: "Acesse sua conta na Estampa Flix ou crie uma nova para assinar planos, baixar artes digitais e gerenciar suas compras." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Auth,
});

function Auth() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/minha-conta" });
    });
  }, [navigate]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Bem-vindo de volta!");
    navigate({ to: "/minha-conta" });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name }, emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada! Confira seu e-mail para confirmar.");
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) toast.error("Erro ao entrar com Google");
  }

  async function forgot() {
    if (!email) return toast.error("Digite seu e-mail primeiro");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return toast.error(error.message);
    toast.success("E-mail de recuperação enviado!");
  }

  return (
    <SiteLayout>
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-4 py-12">
        <div className="w-full rounded-2xl border border-border/60 bg-card p-8 shadow-elegant">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-gradient-brand shadow-brand">
              <Sparkles className="h-6 w-6 text-brand-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold">Entrar ou criar conta — Estampa Flix</h1>
            <p className="mt-1 text-sm text-muted-foreground">Entre ou crie sua conta para começar</p>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-4">
              <form onSubmit={signIn} className="space-y-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="grid gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                    <button type="button" onClick={forgot} className="text-xs text-primary hover:underline">Esqueci minha senha</button>
                  </div>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-gradient-brand text-brand-foreground shadow-brand">
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-4">
              <form onSubmit={signUp} className="space-y-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="email2">E-mail</Label>
                  <Input id="email2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="password2">Senha (mín. 6 caracteres)</Label>
                  <Input id="password2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-gradient-brand text-brand-foreground shadow-brand">
                  {loading ? "Criando..." : "Criar conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" onClick={google} className="w-full">
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5c1.6 0 3.1.6 4.2 1.6l3.1-3.1C17.5 1.7 14.9.6 12 .6 7.3.6 3.3 3.3 1.4 7.3l3.6 2.8C6 7.1 8.8 5 12 5z"/><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.4H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/><path fill="#FBBC05" d="M5 14.1c-.3-.9-.5-1.9-.5-2.9s.2-2 .5-2.9L1.4 5.5C.5 7.3 0 9.3 0 11.4s.5 4.1 1.4 5.9l3.6-2.8z"/><path fill="#34A853" d="M12 22.2c3.2 0 5.9-1.1 7.8-2.9l-3.7-2.9c-1 .7-2.4 1.1-4.1 1.1-3.2 0-5.9-2.1-6.9-5L1.4 15.3C3.3 19.3 7.3 22.2 12 22.2z"/></svg>
            Entrar com Google
          </Button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Ao continuar você aceita nossos <Link to="/suporte" className="underline">termos de uso</Link>.
          </p>
        </div>
      </div>
    </SiteLayout>
  );
}
