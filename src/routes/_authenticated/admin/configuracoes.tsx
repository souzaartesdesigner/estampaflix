import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, Upload as UploadIcon, Palette, Phone, Search as SearchIcon, FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({ component: Configuracoes });

function Configuracoes() {
  const { data: settings, isLoading } = useSiteSettings();
  const qc = useQueryClient();
  const [form, setForm] = useState<any>({});
  const [logoUploading, setLogoUploading] = useState(false);
  const [faviconUploading, setFaviconUploading] = useState(false);

  useEffect(() => { if (settings) setForm(settings); }, [settings]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("site_settings").update(form).eq("id", true);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Configurações salvas"); qc.invalidateQueries({ queryKey: ["site-settings"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  async function upload(file: File, kind: "logo" | "favicon") {
    const setter = kind === "logo" ? setLogoUploading : setFaviconUploading;
    setter(true);
    try {
      const path = `settings/${kind}-${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("artwork-previews").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("artwork-previews").getPublicUrl(path);
      setForm((f: any) => ({ ...f, [kind === "logo" ? "logo_url" : "favicon_url"]: data.publicUrl }));
      toast.success("Imagem carregada");
    } catch (e: any) { toast.error(e.message); } finally { setter(false); }
  }

  const set = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target?.value ?? e }));

  if (isLoading) return <p className="text-muted-foreground">Carregando…</p>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Configurações da loja</h1>
        <Button onClick={() => save.mutate()} disabled={save.isPending} className="bg-gradient-brand text-brand-foreground">
          <Save className="mr-2 h-4 w-4" /> Salvar alterações
        </Button>
      </div>

      <Tabs defaultValue="identity">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="identity"><Palette className="mr-1 h-4 w-4" />Identidade</TabsTrigger>
          <TabsTrigger value="contact"><Phone className="mr-1 h-4 w-4" />Contato</TabsTrigger>
          <TabsTrigger value="seo"><SearchIcon className="mr-1 h-4 w-4" />SEO / Analytics</TabsTrigger>
          <TabsTrigger value="footer"><FileText className="mr-1 h-4 w-4" />Rodapé & Legal</TabsTrigger>
          <TabsTrigger value="promo">Banner topo</TabsTrigger>
        </TabsList>

        <TabsContent value="identity" className="space-y-4">
          <Section title="Identidade visual">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome da loja"><Input value={form.site_name ?? ""} onChange={set("site_name")} /></Field>
              <Field label="Tagline"><Input value={form.tagline ?? ""} onChange={set("tagline")} /></Field>
              <Field label="Cor primária">
                <div className="flex gap-2">
                  <Input value={form.primary_color ?? ""} onChange={set("primary_color")} placeholder="#007bff" />
                  <input type="color" value={form.primary_color ?? "#007bff"} onChange={(e) => setForm((f: any) => ({ ...f, primary_color: e.target.value }))} className="h-10 w-14 rounded border border-border/60 bg-transparent" />
                </div>
              </Field>
              <div />
              <ImageField label="Logo" url={form.logo_url} onFile={(f) => upload(f, "logo")} uploading={logoUploading} onClear={() => setForm((f: any) => ({ ...f, logo_url: null }))} />
              <ImageField label="Favicon" url={form.favicon_url} onFile={(f) => upload(f, "favicon")} uploading={faviconUploading} onClear={() => setForm((f: any) => ({ ...f, favicon_url: null }))} />
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <Section title="Contato & redes sociais">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="E-mail de suporte"><Input type="email" value={form.support_email ?? ""} onChange={set("support_email")} placeholder="suporte@exemplo.com" /></Field>
              <Field label="WhatsApp"><Input value={form.whatsapp ?? ""} onChange={set("whatsapp")} placeholder="+55 11 90000-0000" /></Field>
              <Field label="Instagram (URL)"><Input value={form.instagram_url ?? ""} onChange={set("instagram_url")} placeholder="https://instagram.com/…" /></Field>
              <Field label="Facebook (URL)"><Input value={form.facebook_url ?? ""} onChange={set("facebook_url")} placeholder="https://facebook.com/…" /></Field>
              <Field label="TikTok (URL)"><Input value={form.tiktok_url ?? ""} onChange={set("tiktok_url")} placeholder="https://tiktok.com/@…" /></Field>
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          <Section title="Analytics & rastreamento">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Google Analytics 4 ID"><Input value={form.ga4_measurement_id ?? ""} onChange={set("ga4_measurement_id")} placeholder="G-XXXXXXX" /></Field>
              <Field label="Meta Pixel ID"><Input value={form.meta_pixel_id ?? ""} onChange={set("meta_pixel_id")} placeholder="123456789012345" /></Field>
              <Field label="Google Search Console"><Input value={form.google_search_console_id ?? ""} onChange={set("google_search_console_id")} placeholder="Meta content" /></Field>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Os códigos são injetados automaticamente no head do site.</p>
          </Section>
        </TabsContent>

        <TabsContent value="footer" className="space-y-4">
          <Section title="Rodapé & informações legais">
            <div className="grid gap-4">
              <Field label="Texto do rodapé"><Textarea rows={3} value={form.footer_text ?? ""} onChange={set("footer_text")} /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Razão social"><Input value={form.legal_business_name ?? ""} onChange={set("legal_business_name")} /></Field>
                <Field label="CNPJ / CPF"><Input value={form.legal_document ?? ""} onChange={set("legal_document")} /></Field>
              </div>
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="promo" className="space-y-4">
          <Section title="Banner promocional no topo">
            <div className="mb-4 flex items-center gap-3">
              <Switch checked={!!form.promo_banner_enabled} onCheckedChange={(v) => setForm((f: any) => ({ ...f, promo_banner_enabled: v }))} />
              <Label>Ativar banner no topo do site</Label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Texto"><Input value={form.promo_banner_text ?? ""} onChange={set("promo_banner_text")} placeholder="🎉 15% OFF em toda loja com o cupom PRIMEIRA" /></Field>
              <Field label="Link (opcional)"><Input value={form.promo_banner_link ?? ""} onChange={set("promo_banner_link")} placeholder="/planos" /></Field>
            </div>
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <section className="rounded-xl border border-border/60 bg-card p-5">
      <h2 className="mb-4 font-semibold">{title}</h2>
      {children}
    </section>
  );
}
function Field({ label, children }: any) {
  return <div><Label className="mb-1.5 block text-xs uppercase text-muted-foreground">{label}</Label>{children}</div>;
}
function ImageField({ label, url, onFile, uploading, onClear }: any) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs uppercase text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-3">
        {url ? <img src={url} alt={label} className="h-14 w-14 rounded-md border border-border/60 object-contain bg-surface-2" /> : <div className="grid h-14 w-14 place-items-center rounded-md border border-dashed border-border/60 bg-surface-2 text-xs text-muted-foreground">Sem</div>}
        <label className="cursor-pointer">
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          <span className="inline-flex items-center gap-1 rounded-md border border-border/60 px-3 py-2 text-sm hover:bg-muted"><UploadIcon className="h-3 w-3" /> {uploading ? "Enviando…" : "Carregar"}</span>
        </label>
        {url && <Button size="sm" variant="ghost" onClick={onClear}>Remover</Button>}
      </div>
    </div>
  );
}
