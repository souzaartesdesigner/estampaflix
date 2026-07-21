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
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/suporte")({
  head: () => ({
    meta: [
      { title: "Suporte e perguntas frequentes — Estampa Flix" },
      { name: "description", content: "Tire dúvidas sobre assinatura, créditos, licença comercial e downloads na Estampa Flix, ou fale com nosso time pelo formulário de contato." },
      { property: "og:title", content: "Suporte — Estampa Flix" },
      { property: "og:description", content: "Perguntas frequentes sobre planos, créditos e licença de uso, além de canal direto com a equipe da Estampa Flix." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://loving-code-flow.lovable.app/suporte" },
    ],
    links: [{ rel: "canonical", href: "https://loving-code-flow.lovable.app/suporte" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            { "@type": "Question", name: "Como funciona a assinatura?", acceptedAnswer: { "@type": "Answer", text: "Você escolhe um plano (Lite, Pro ou Plus), ganha créditos mensais para baixar as artes que quiser e a assinatura renova automaticamente todo mês." } },
            { "@type": "Question", name: "Posso usar as artes comercialmente?", acceptedAnswer: { "@type": "Answer", text: "Sim. Todos os planos incluem licença de uso comercial e você pode aplicar em produtos que vender." } },
            { "@type": "Question", name: "Downloads repetidos consomem créditos?", acceptedAnswer: { "@type": "Answer", text: "Não. Se você já baixou uma arte antes, pode baixar de novo pelo seu histórico sem gastar novos créditos." } },
            { "@type": "Question", name: "E se eu ficar sem créditos no meio do mês?", acceptedAnswer: { "@type": "Answer", text: "Você pode fazer upgrade para um plano maior a qualquer momento, ou comprar artes avulsas." } },
            { "@type": "Question", name: "Como cancelo minha assinatura?", acceptedAnswer: { "@type": "Answer", text: "Pela sua área do cliente em Minha Assinatura, com um clique. Sem burocracia." } },
            { "@type": "Question", name: "Qual a qualidade dos arquivos?", acceptedAnswer: { "@type": "Answer", text: "Todas as artes vêm em alta resolução (300 DPI), prontas para sublimação, DTF e impressão profissional." } },
          ],
        }),
      },
    ],
  }),
  component: Suporte,
});

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  subject: z.string().trim().min(3).max(150),
  message: z.string().trim().min(10).max(2000),
});

function Suporte() {
  const { t } = useI18n();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  const FAQ = [
    { q: t("support.faq1q"), a: t("support.faq1a") },
    { q: t("support.faq2q"), a: t("support.faq2a") },
    { q: t("support.faq3q"), a: t("support.faq3a") },
    { q: t("support.faq4q"), a: t("support.faq4a") },
    { q: t("support.faq5q"), a: t("support.faq5a") },
    { q: t("support.faq6q"), a: t("support.faq6a") },
  ];

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
    if (error) return toast.error(t("support.error"));
    toast.success(t("support.sent"));
    setForm({ name: "", email: "", subject: "", message: "" });
  }

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-5xl px-4 py-12">
        <header className="mb-10 text-center">
          <h1 className="font-display text-4xl font-black">{t("support.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("support.subtitle")}</p>
        </header>

        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 font-display text-2xl font-bold"><MessageCircle className="mr-2 inline h-5 w-5 text-primary" /> {t("support.contactTitle")}</h2>
            <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border/60 bg-card p-6">
              <div className="grid gap-2">
                <Label htmlFor="name">{t("support.name")}</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={100} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">{t("support.email")}</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={255} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="subject">{t("support.subject")}</Label>
                <Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} maxLength={150} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="message">{t("support.message")}</Label>
                <Textarea id="message" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} maxLength={2000} required />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-gradient-brand text-brand-foreground shadow-brand">
                <Mail className="mr-2 h-4 w-4" /> {loading ? t("support.sending") : t("support.send")}
              </Button>
            </form>
          </div>

          <div>
            <h2 className="mb-4 font-display text-2xl font-bold">{t("support.faqTitle")}</h2>
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
