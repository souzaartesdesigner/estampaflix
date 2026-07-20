# Painel Admin — Nível Profissional

Vou implementar os 6 itens da lista "Importante". Ordem otimizada para minimizar retrabalho (configurações e destaques são a base para o resto do site consumir).

## 1. Configurações da loja (`/admin/configuracoes`)

**DB**: nova tabela `site_settings` (chave/valor JSON, singleton) com campos:
- Identidade: nome da loja, tagline, logo_url, favicon_url, cor primária
- Contato: email suporte, whatsapp, instagram, facebook, tiktok
- SEO/Analytics: GA4 measurement_id, Meta Pixel ID, texto do rodapé
- Banner topo: mensagem promocional + link + ativo

**UI**: página com abas (Identidade / Contato / SEO / Rodapé). Upload de logo/favicon no bucket existente. Aplicado em tempo real via hook `useSiteSettings()` no header/footer/head da rota `__root`.

## 2. Destaques da home editáveis

**DB**: colunas `is_featured`, `featured_order` já existem em `artworks` (verificar; se não, adicionar). Nova tabela `home_sections` com blocos configuráveis (nome, tipo `featured|popular|new|category`, ordem, ativo).

**UI**: página `/admin/home` com:
- Lista das artes marcadas como destaque com drag-and-drop de ordem (usando `@dnd-kit/sortable`, já instalável)
- Toggle de qual seção aparece na home e sua ordem
- Home passa a ler dessa configuração em vez de hardcoded

## 3. Banners / carrossel promocional

**DB**: tabela `banners(id, title, image_url, link_url, position enum('home_hero','home_middle','catalog_top'), is_active, order, starts_at, ends_at)`.

**UI**: `/admin/banners` com CRUD + upload de imagem + preview. Componente `<PromoBanner position="…"/>` consome e exibe carrossel automático nos locais.

## 4. Log de e-mails + reenviar

**DB**: tabela `email_logs(id, to_email, template, subject, status enum('sent','failed','pending'), provider_message_id, error, related_order_id, related_user_id, created_at)`. Toda função que envia e-mail passa a inserir aqui.

**UI**:
- Aba "E-mails enviados" na página do pedido (`/admin/pedidos/:id`) mostrando o que foi disparado
- Botão "Reenviar" que chama server function que refaz o envio e loga
- Página global `/admin/emails` opcional listando últimos 200 envios com filtro

Observação: a infraestrutura de envio (Lovable Emails + domínio) precisa estar configurada. Se ainda não estiver, o log fica pronto e o envio real ativa quando você conectar o domínio.

## 5. Suporte com estado

**DB**: adicionar em `support_messages` as colunas `status enum('open','in_progress','resolved','closed')`, `assigned_to uuid`, `admin_reply text`, `replied_at`, `replied_by`. Default 'open'.

**UI**: `/admin/suporte` reformulada com:
- Kanban / tabs por status (Abertas / Em andamento / Resolvidas)
- Detalhe do ticket com histórico + campo de resposta que envia e-mail ao cliente
- Atribuir a admin, mudar status, marcar resolvida

## 6. Ações em massa nas artes

**UI** em `/admin/artes`:
- Checkbox em cada linha + "selecionar todos"
- Barra de ações flutuante quando há seleção: Publicar / Despublicar / Mover para categoria / Ajustar preço (± %) / Ajustar custo em créditos / Deletar
- Confirmação em modal antes de executar
- Duplicar arte com 1 clique (botão individual)

## Ordem de execução

1. **Configurações da loja** — base para header/footer/SEO usarem
2. **Ações em massa** (curto, alto impacto) 
3. **Suporte com estado**
4. **Banners** 
5. **Destaques da home**
6. **Log de e-mails** (por último; se não houver domínio ainda, log fica dormente)

## Notas técnicas

- Todas novas tabelas: RLS com policies `has_role(auth.uid(), 'admin')` para escrita; leituras públicas só onde faz sentido (settings, banners ativos, home_sections).
- Todos os grants `authenticated` + `service_role` (e `anon` para settings/banners/home_sections públicos).
- `@dnd-kit/core` e `@dnd-kit/sortable` para drag-and-drop.
- Uploads reaproveitam bucket `artwork-previews` (já público).
- E-mails: adicionar wrapper `sendEmail()` que sempre loga em `email_logs` antes/depois do envio real.

Posso começar pelo item 1?
