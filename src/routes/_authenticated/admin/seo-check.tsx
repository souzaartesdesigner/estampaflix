import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/seo-check")({ component: SeoCheckPage });

type Row = {
  id: string;
  slug: string;
  title: string;
  seo_title: string | null;
  seo_description: string | null;
  seo_keyword: string | null;
  alt_text: string | null;
  noindex: boolean;
  is_published: boolean;
};

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function issuesOf(a: Row) {
  const out: string[] = [];
  const desc = (a.seo_description ?? "").trim();
  if (!desc) out.push("Sem meta description");
  else if (desc.length < 50 || desc.length > 160) out.push(`Meta description com ${desc.length} caracteres`);
  if (!(a.alt_text ?? "").trim()) out.push("Sem alt text");
  if (!(a.seo_keyword ?? "").trim()) out.push("Sem frase-chave foco");
  if (!SLUG_RE.test(a.slug ?? "")) out.push("Slug não amigável");
  if (a.noindex) out.push("Marcada como noindex");
  return out;
}

function SeoCheckPage() {
  const [q, setQ] = useState("");
  const [onlyIssues, setOnlyIssues] = useState(true);

  const { data: artworks = [], isLoading } = useQuery({
    queryKey: ["admin-seo-check"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artworks")
        .select("id,slug,title,seo_title,seo_description,seo_keyword,alt_text,noindex,is_published")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const rows = useMemo(
    () =>
      artworks
        .map((a) => ({ a, issues: issuesOf(a) }))
        .filter(({ a, issues }) => (onlyIssues ? issues.length > 0 : true))
        .filter(({ a }) => (q.trim() ? a.title.toLowerCase().includes(q.trim().toLowerCase()) || a.slug.includes(q.trim().toLowerCase()) : true)),
    [artworks, onlyIssues, q],
  );

  const withIssues = artworks.filter((a) => issuesOf(a).length > 0).length;

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-bold">SEO Check</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Auditoria das artes publicadas: meta description, alt text, frase-chave, slug e noindex.
      </p>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-xs text-muted-foreground">Artes publicadas</p>
          <p className="font-display text-2xl font-bold">{artworks.length}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-xs text-muted-foreground">Com pendências</p>
          <p className="font-display text-2xl font-bold text-destructive">{withIssues}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-xs text-muted-foreground">100% otimizadas</p>
          <p className="font-display text-2xl font-bold text-success">{artworks.length - withIssues}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por título ou slug" className="max-w-xs" />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={onlyIssues} onChange={(e) => setOnlyIssues(e.target.checked)} />
          Mostrar apenas com pendências
        </label>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : rows.length === 0 ? (
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">
          <CheckCircle2 className="h-5 w-5 text-success" /> Nenhuma pendência encontrada.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Arte</th>
                <th className="p-3">Pendências</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ a, issues }) => (
                <tr key={a.id} className="border-t border-border/50 align-top">
                  <td className="p-3">
                    <p className="font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">/{a.slug}</p>
                  </td>
                  <td className="p-3">
                    {issues.length === 0 ? (
                      <Badge className="bg-success/15 text-success">OK</Badge>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {issues.map((i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive"
                          >
                            <AlertTriangle className="h-3 w-3" /> {i}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-3">
                      <Link to="/admin/artes" className="text-xs text-primary hover:underline">
                        Editar
                      </Link>
                      <a
                        href={`/artes/${a.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Ver <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
