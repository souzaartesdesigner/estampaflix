import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { useSiteContent } from "@/hooks/use-site-content";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { sanitizeHtml } from "@/lib/sanitize-html";
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

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 5.834h-.004c-1.587 0-3.13-.426-4.48-1.229l-.322-.191-3.34.876.892-3.257-.209-.332a5.908 5.908 0 0 1-.899-3.158c0-3.282 2.672-5.954 5.955-5.954 1.591 0 3.086.62 4.208 1.746a5.909 5.909 0 0 1 1.746 4.208c0 3.282-2.672 5.954-5.954 5.954m0-13.37a7.418 7.418 0 0 0-7.416 7.416 7.36 7.36 0 0 0 1.108 3.92l-1.108 4.04 4.133-1.085a7.418 7.418 0 0 0 3.283.762 7.418 7.418 0 0 0 7.416-7.416 7.418 7.418 0 0 0-7.416-7.416z" />
    </svg>
  );
}

function normalizeWhatsApp(raw: string | null | undefined) {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return digits.startsWith("55") ? digits : `55${digits}`;
}

export const Route = createFileRoute("/suporte")({
  head: () => ({
    meta: [
      { title: "Suporte e perguntas frequentes — Estampa Flix" },
      { name: "description", content: "Tire dúvidas sobre assinatura, créditos, licença comercial e downloads na Estampa Flix, ou fale com nosso time pelo formulário de contato." },
      { property: "og:title", content: "Suporte — Estampa Flix" },
      { property: "og:description", content: "Perguntas frequentes sobre planos, créditos e licença de uso, além de canal direto com a equipe da Estampa Flix." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://estampaflix.com/suporte" },
      { name: "keywords", content: "suporte estampa flix, dúvidas sublimação, como baixar artes, licença comercial" },
    ],
    links: [{ rel: "canonical", href: "https://estampaflix.com/suporte" }],
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
  const cms = useSiteContent("page_suporte");
  const { data: settings } = useSiteSettings();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  const whatsappNumber = normalizeWhatsApp(settings?.whatsapp);
  const whatsappText = settings?.whatsapp_message?.trim() || t("support.whatsappDefaultMessage");
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappText)}`
    : null;

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
          <h1 className="font-display text-4xl font-black">{cms?.title || t("support.title")}</h1>
          {cms?.content ? (
            <div
              className="mx-auto mt-2 max-w-2xl text-muted-foreground [&_a]:text-primary [&_a]:underline [&_p]:mb-2"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(cms.content) }}
            />
          ) : (
            <p className="mt-2 text-muted-foreground">{t("support.subtitle")}</p>
          )}
        </header>

        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-6">
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

            {whatsappHref && (
              <div className="rounded-2xl border border-border/60 bg-card p-6">
                <h3 className="mb-2 font-display text-lg font-bold">{t("support.whatsappTitle")}</h3>
                <p className="mb-4 text-sm text-muted-foreground">{t("support.whatsappBody")}</p>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-3 font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  {t("support.whatsappButton")}
                </a>
              </div>
            )}
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
