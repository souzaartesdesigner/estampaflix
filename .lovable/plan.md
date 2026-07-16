
# Plataforma de Artes Digitais para Sublimação

Vou construir uma plataforma full-stack inspirada visualmente no estampaflix.com, com venda avulsa + assinaturas mensais com créditos, painel administrativo e área do cliente.

## Escopo & Fases

O escopo é grande. Proponho entregar em **3 fases** para manter qualidade. Confirme se posso seguir nessa ordem (ou reordenar):

### Fase 1 — Fundação (esta entrega)
- Design system inspirado no estampaflix (paleta escura com destaques vibrantes, tipografia moderna, layout de grid de artes)
- Lovable Cloud (Postgres + Auth + Storage) habilitado
- Autenticação: cadastro, login, recuperação de senha, Google OAuth
- Schema do banco: `profiles`, `user_roles`, `categories`, `tags`, `artworks`, `artwork_tags`, `subscriptions`, `plans`, `downloads`, `orders`, `blog_posts`, `support_messages`
- RLS + `has_role()` security definer + storage buckets (público para previews com marca d'água, privado para arquivos finais)
- Páginas públicas: Home, Catálogo com filtros/busca, Página do Produto, Planos, Blog (listagem + post), Suporte (form + FAQ)
- Área do cliente: histórico de downloads, minha assinatura, compras avulsas
- Painel admin (/admin) com CRUD de artes, categorias/tags, usuários, blog, mensagens de suporte, relatórios

### Fase 2 — Pagamentos
- Integração Stripe (Lovable Payments) para assinaturas recorrentes (Premium Lite/Pro/Plus) e compras avulsas
- Webhooks para ativar/renovar assinaturas e resetar créditos mensais
- Server function protegida de download que valida auth + desconta 1 crédito (idempotente por arte já baixada)

### Fase 3 — Polimento
- Marca d'água automática em previews via edge processing
- SEO, sitemap, Open Graph por arte/post
- Otimizações de performance (lazy loading, CDN)

## Detalhes técnicos (Fase 1)

**Stack:** TanStack Start + React + Tailwind + shadcn/ui + Lovable Cloud (Supabase). Design tokens semânticos em `src/styles.css`.

**Regra de créditos:**
- `subscriptions.credits_remaining` + `current_period_end`
- Download server function: verifica se `downloads` já contém `(user_id, artwork_id)` → libera sem descontar; senão decrementa `credits_remaining` e insere linha
- Reset via webhook Stripe `invoice.paid` (Fase 2); enquanto isso, função SQL cron-friendly

**Storage:**
- Bucket `artwork-previews` (público, com watermark aplicado no upload pelo admin)
- Bucket `artwork-files` (privado; acesso apenas via signed URL emitida pela server function após validação)

**Roles:** Enum `app_role` (`admin`, `customer`), tabela `user_roles`, função `has_role()`.

## Perguntas antes de começar

1. **Pagamentos** — Confirma Stripe (Lovable Payments integrado, sem precisar de conta própria)? Ou prefere Mercado Pago (exige integração manual via chave)?
2. **Idioma/moeda** — Português BR + BRL confirmado?
3. **Primeiro admin** — Me passa o e-mail que deve ser promovido a admin após o primeiro cadastro?
4. **Marca d'água** — Você faz upload das artes já com marca d'água, ou quer que o sistema aplique automaticamente?

Se aprovar o plano e responder as 4 perguntas, começo pela Fase 1.
