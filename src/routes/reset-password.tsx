import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Redefinir senha" }, { name: "robots", content: "noindex" }] }),
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Senha atualizada!");
    navigate({ to: "/minha-conta" });
  }

  return (
    <SiteLayout>
      <div className="mx-auto flex min-h-[60vh] w-full max-w-md items-center px-4 py-12">
        <div className="w-full rounded-2xl border border-border/60 bg-card p-8">
          <h1 className="font-display text-2xl font-bold">Definir nova senha</h1>
          <p className="mt-1 text-sm text-muted-foreground">Escolha uma senha segura para sua conta.</p>
          <form onSubmit={submit} className="mt-6 space-y-3">
            <div className="grid gap-1.5">
              <Label htmlFor="p">Nova senha</Label>
              <Input id="p" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-brand text-brand-foreground">
              {loading ? "Salvando..." : "Salvar senha"}
            </Button>
          </form>
        </div>
      </div>
    </SiteLayout>
  );
}
