import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site-layout";
import { formatDate } from "@/lib/format";

const blogQuery = queryOptions({
  queryKey: ["blog-list"],
  queryFn: async () => (await supabase.from("blog_posts").select("id,slug,title,excerpt,cover_url,author_name,published_at").eq("is_published", true).order("published_at", { ascending: false })).data ?? [],
});

export const Route = createFileRoute("/blog")({
  loader: ({ context }) => context.queryClient.ensureQueryData(blogQuery),
  head: () => ({ meta: [{ title: "Blog — EstampaHub" }, { name: "description", content: "Dicas, tutoriais e novidades sobre sublimação e artes digitais." }] }),
  component: Blog,
});

function Blog() {
  const { data: posts } = useSuspenseQuery(blogQuery);
  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <header className="mb-8">
          <h1 className="font-display text-4xl font-black">Blog</h1>
          <p className="mt-2 text-muted-foreground">Dicas, tutoriais e novidades do universo da sublimação.</p>
        </header>
        {posts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 p-12 text-center text-muted-foreground">Nenhum artigo publicado ainda.</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <Link key={p.id} to="/blog/$slug" params={{ slug: p.slug }} className="group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition-all hover:-translate-y-1 hover:border-primary/50">
                <div className="aspect-video overflow-hidden bg-surface-2">
                  {p.cover_url ? <img src={p.cover_url} alt={p.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" /> : <div className="grid h-full place-items-center text-muted-foreground">Sem imagem</div>}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <h2 className="font-display text-lg font-bold leading-tight">{p.title}</h2>
                  {p.excerpt && <p className="line-clamp-3 text-sm text-muted-foreground">{p.excerpt}</p>}
                  <div className="mt-auto flex items-center justify-between pt-3 text-xs text-muted-foreground">
                    <span>{p.author_name}</span>
                    <span>{formatDate(p.published_at)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
