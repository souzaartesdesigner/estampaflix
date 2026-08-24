import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";

export const Route = createFileRoute("/esqueci-a-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar acesso — Estampa Flix" },
      {
        name: "description",
        content: "Recupere o acesso à sua conta na Estampa Flix.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return toast.error("Digite seu e-mail");
    
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    
    if (error) return toast.error(error.message);
    
    toast.success("E-mail de recuperação enviado!");
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            Recuperar <span className="text-primary">acesso</span>
          </h2>
          <p className="text-white/60 text-sm">
            Digite seu e-mail e enviaremos um link de recuperação.
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

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-primary hover:opacity-90 rounded-xl font-bold transition-all text-white shadow-lg shadow-primary/20"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
              </>
            ) : (
              "Enviar link de recuperação"
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-white/60">
          Lembrou sua senha?{" "}
          <Link to="/login" className="text-primary hover:brightness-110 font-bold flex items-center justify-center gap-1">
            <ArrowLeft size={14} /> Voltar para o Login
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
