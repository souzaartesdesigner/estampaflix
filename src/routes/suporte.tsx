import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Mail, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/suporte")({
  head: () => ({ meta: [{ title: "Suporte — EstampaHub" }, { name: "description", content: "Fale com nosso time. Formulário de contato e FAQ." }] }),
  component: Suporte,
});

const schema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(100),
  email: z.string().trim().email("E-mail inválido").max(255),
  subject: z.string().trim().min(3, "Assunto muito curto").max(150),
  message: z.string().trim().min(10, "Mensagem muito curta").max(2000),
});

const FAQ = [
  { q: "Como funciona a assinatura?", a: "Você escolhe um plano (Lite, Pro ou Plus), ganha créditos mensais para baixar as artes que quiser e a assinatura renova automaticamente todo mês." },
  { q: "Posso usar as artes comercialmente?", a: "Sim! Todos os planos incluem licença de uso comercial. Você pode aplicar em produtos que vender." },
  { q: "Downloads repetidos consomem créditos?", a: "Não. Se você já baixou uma arte antes, pode baixar de novo pelo seu histórico sem gastar novos créditos." },
  { q: "E se eu ficar sem créditos no meio do mês?", a: "Você pode fazer upgrade para um plano maior a qualquer momento, ou comprar artes avulsas." },
  { q: "Como cancelo minha assinatura?", a: "Pela sua área do cliente em Minha Assinatura, com um clique. Sem burocracia." },
  { q: "Qual a qualidade dos arquivos?", a: "Todas as artes vêm em alta resolução (300 DPI), prontas para sublimação, DTF e impressão profissional." },
];

function Suporte() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("support_messages").insert(parsed.data);
    setLoading(false);
    if (error) return toast.error("Erro ao enviar. Tente novamente.");
    toast.success("Mensagem enviada! Retornaremos em breve.");
    setForm({ name: "", email: "", subject: "", message: "" });
  }

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-5xl px-4 py-12">
        <header className="mb-10 text-center">
          <h1 className="font-display text-4xl font-black">Suporte</h1>
          <p className="mt-2 text-muted-foreground">Estamos aqui pra ajudar. Encontre respostas ou fale com a gente.</p>
        </header>

        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 font-display text-2xl font-bold"><MessageCircle className="mr-2 inline h-5 w-5 text-primary" /> Fale conosco</h2>
            <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border/60 bg-card p-6">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={100} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={255} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="subject">Assunto</Label>
                <Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} maxLength={150} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="message">Mensagem</Label>
                <Textarea id="message" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} maxLength={2000} required />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-gradient-brand text-brand-foreground shadow-brand">
                <Mail className="mr-2 h-4 w-4" /> {loading ? "Enviando..." : "Enviar mensagem"}
              </Button>
            </form>
          </div>

          <div>
            <h2 className="mb-4 font-display text-2xl font-bold">Perguntas frequentes</h2>
            <Accordion type="single" collapsible className="rounded-2xl border border-border/60 bg-card px-4">
              {FAQ.map((item, i) => (
                <AccordionItem key={i} value={String(i)}>
                  <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
