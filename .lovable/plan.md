---
name: Corrigir Redirecionamento Pós-Pagamento e Permissões Administrativas
description: Resolve o travamento na tela "Redirecionando para sua arte" após pagamento Pix e corrige a atribuição incorreta de artes ao administrador ao marcar pedidos como pagos manualmente.
type: feature
---

# Problemas Identificados
1. **Travamento no Redirecionamento**: O `useEffect` no componente `PixCheckoutPage` (`src/routes/pagamento.pix.$orderId.tsx`) não está processando corretamente a transição de estado após o pagamento ser confirmado via polling, ou o estado `status` não está sendo atualizado de forma reativa pelo TanStack Query no momento esperado.
2. **Atribuição Incorreta de Downloads**: A função `grant_order_downloads` no PostgreSQL (`supabase/migrations/20260718142421_...sql`) insere registros na tabela `downloads` usando o `user_id` do pedido, mas as RLS policies ou a lógica de chamada podem estar permitindo efeitos colaterais. O usuário relatou que o download "vem para a conta do admin", o que sugere que o admin ganha acesso ao item ou a visualização de downloads está misturada. No entanto, a causa mais provável é que o admin está testando e a função SQL está funcionando corretamente para o `user_id` do pedido, mas talvez o redirecionamento ou a visualização no admin dê a entender que o download é dele.
3. **Segurança**: A função `grant_order_downloads` é `SECURITY DEFINER`, o que é correto para contornar RLS ao liberar downloads, mas precisamos garantir que ela só seja executada por quem tem permissão e para o usuário correto.

# Plano de Ação
1. **Correção do Redirecionamento**:
   - Ajustar `src/routes/pagamento.pix.$orderId.tsx` para garantir que o redirecionamento ocorra assim que o polling detectar `status === 'paid'`.
   - Adicionar logs de depuração client-side para rastrear a mudança de status.
   - Garantir que o `navigate` use a rota absoluta e a aba correta.

2. **Correção da Lógica de Download**:
   - Revisar a função `grant_order_downloads` para garantir que ela não tenha ambiguidades de contexto.
   - No painel admin (`src/routes/_authenticated/admin/pedidos.$id.tsx`), verificar a chamada do RPC.
   - Investigar por que o admin "ganha" o download. Se o admin clica em "Marcar como pago", a função libera para o `user_id` do pedido. Se o admin *também* vê esse download em sua própria conta, pode haver um bug na query de exibição de downloads na página do usuário (`/minha-conta`) que não filtra corretamente pelo `auth.uid()` ou o cache está sujo.

3. **Verificação de RLS e Queries**:
   - Verificar a política de SELECT na tabela `public.downloads`.
   - Verificar a query na aba de downloads do usuário.

# Arquivos a serem modificados
- `src/routes/pagamento.pix.$orderId.tsx`
- `src/routes/_authenticated/admin/pedidos.$id.tsx`
- `src/lib/mercadopago.functions.ts` (para garantir retorno consistente de status)
