# Plano — 4 features de alta prioridade

Vou implementar em ordem para minimizar retrabalho (o carrinho e os cupons compartilham o mesmo checkout Pix; e-mails dependem de setup de domínio).

## 1. Carrinho de compras (Pix múltiplo)

**DB**
- Nova tabela `cart_items(user_id, artwork_id, created_at)` com RLS por dono.
- `orders` ganha coluna `items jsonb` (snapshot: `[{artwork_id, title, price_cents}]`) e torna `artwork_id` nullable para pedidos multi-item. Compras antigas continuam funcionando.
- RPC `grant_order_downloads(_order_id)`: ao pagar, cria linhas em `downloads` para cada item — chamada pelo webhook MP.

**Server**
- `createPixOrder` aceita `{ artworkId }` (compra rápida) **ou** `{ cartCheckout: true }` (soma todos os itens do carrinho do usuário). Gera 1 Pix com valor total.
- Webhook Mercado Pago: se `items` existir, chama `grant_order_downloads`; senão mantém o fluxo atual (1 arte).

**UI**
- Ícone de carrinho no header com contador.
- Botão "Adicionar ao carrinho" na página do produto (ao lado de "Comprar Individualmente" — que passa a significar "compra rápida de 1 arte").
- Nova rota `/carrinho` com lista, remover item, total, botão "Finalizar compra via Pix".
- Após pagamento, todos os itens aparecem em Minha Conta.

## 2. Favoritos / Wishlist

**DB**
- Tabela `favorites(user_id, artwork_id, created_at)` com RLS por dono e unique key.

**UI**
- Botão de coração no `ArtworkCard` e na página do produto (toggle otimista via TanStack Query).
- Aba "Favoritos" em `/minha-conta` listando artes salvas.
- Estado desconectado: clicar redireciona para `/auth`.

## 3. E-mails transacionais

Uso da infraestrutura **Lovable Emails** (nativa, sem provedor externo).

**Setup** (se ainda não houver domínio verificado, mostro o diálogo de configuração de domínio antes).

**Templates React Email criados**
- `pix-payment-confirmed`: pagamento avulso confirmado + link para downloads.
- `subscription-activated`: assinatura ativada com nº de créditos.
- `subscription-renewed`: renovação mensal + créditos restaurados.
- `welcome`: boas-vindas ao cadastro.
- `support-received`: confirmação de recebimento da mensagem de suporte.

**Gatilhos**
- Webhook Stripe → dispara `subscription-activated` / `subscription-renewed`.
- Webhook Mercado Pago (Pix pago) → `pix-payment-confirmed`.
- Trigger no cadastro → `welcome`.
- Envio do formulário de suporte → `support-received`.

Todos os templates seguem o design system (neon dark + azul #007bff), corpo branco (regra da plataforma).

## 4. Cupons de desconto

**DB**
- Tabela `coupons(code unique, discount_type enum('percent','fixed'), discount_value int, max_uses, uses_count, expires_at, applies_to enum('subscription','pix','both'), active bool)`.
- Tabela `coupon_redemptions(coupon_id, user_id, order_id/subscription_id)` para evitar reuso quando `once_per_user`.
- RPC `validate_coupon(_code, _context)` retorna desconto aplicável.

**Aplicação**
- Campo "Cupom" no `/carrinho` e no card de compra individual da página do produto → recalcula total antes de gerar o Pix.
- Campo "Cupom" na página `/planos` antes de redirecionar ao Stripe Checkout → aplica `discounts: [{ coupon }]` no Stripe (cria coupon espelho no Stripe via API na primeira validação).

**Admin**
- Nova rota `/admin/cupons` com CRUD: criar código, %/valor fixo, validade, limite de usos, escopo (assinatura/avulso/ambos), ativar/desativar.

## Ordem de execução

1. Cupons DB + admin (base para checkout).
2. Carrinho DB + UI + integração Pix multi-item + aplicação de cupom.
3. Wishlist (independente, rápido).
4. E-mails (setup domínio se preciso → templates → wiring nos webhooks).

## Notas técnicas

- Compras antigas 1-a-1 permanecem funcionando durante toda a migração (retrocompatibilidade em `orders.artwork_id`).
- Cupons Stripe: espelhados via API do Stripe apenas quando aplicados a assinaturas; para Pix são aplicados localmente no cálculo do total.
- Todos os novos endpoints server-side validam auth via `requireSupabaseAuth`.
- Todas as tabelas novas terão `GRANT` explícito + RLS por `auth.uid()`.

Confirma e começo pela etapa 1 (cupons + carrinho DB)?
