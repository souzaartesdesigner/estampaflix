# Plano de Correção do Layout e Organização da Página de Produto

Este plano visa restaurar a organização da versão desktop da página de produto, garantindo que as alterações solicitadas anteriormente sejam aplicadas **exclusivamente no mobile**.

## Alterações

### 1. Página de Produto (`src/routes/artes.$slug.tsx`)
- **Restaurar Layout Desktop**: Garantir que a imagem fique à esquerda e as informações à direita.
- **Ordem Mobile Específica**:
  1. Imagem do Produto (`ArtworkGallery`).
  2. Título e Ações de Compra (`ArtworkInfo`).
  3. Informações Técnicas (`ProductInfoPanel`).
  4. Avaliações (`ArtworkReviews`).
  5. Descrição (`ArtworkDescription`).
  6. Produtos Relacionados (`RelatedArtworks`).
- **Técnica**: Utilizar classes de ordenação do Tailwind (`order-X`, `lg:order-none`) para variar a posição conforme o dispositivo sem quebrar o HTML.

### 2. Cabeçalho (`src/components/site-header.tsx`)
- Garantir que o botão de "Entrar" (ícone de usuário) apareça apenas no mobile quando deslogado, sem afetar o layout de tablet/desktop.

### 3. Catálogo (`src/routes/catalogo.tsx`)
- Certificar que o fechamento automático da aba de filtros ocorra apenas em telas menores (mobile).

## Detalhes Técnicos
- Utilização de `flex-col` no container principal por padrão (mobile) com `lg:flex-row` para desktop.
- Reordenamento via CSS Grid/Flexbox `order` properties.

## Validação
- Verificar visualmente a versão desktop (deve voltar ao original).
- Verificar via simulador mobile a ordem exata solicitada.
