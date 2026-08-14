# Plano de Ajustes Visuais e Correções de Frontend - Estampa Flix

Este plano visa realizar 4 melhorias específicas no frontend para aprimorar a experiência do usuário, focando em posicionamento de selos, tipografia, responsividade e correções de bugs em dispositivos móveis.

## Ajustes e Correções

### 1. Posição dos Selos (Badges) na Página de Detalhes
Os selos de "Premium", "Destaque" e "Em Alta" serão movidos para flutuar sobre a imagem principal do produto na página interna, mantendo a consistência visual com os cards da vitrine.

- **Arquivo:** `src/features/artwork/artwork-info.tsx` e `src/components/artwork-gallery.tsx` (ou `src/routes/artes.$slug.tsx`).
- **Ação:** Remover a lógica de renderização dos selos de `ArtworkInfo` e passá-la para `ArtworkGallery` para que sejam posicionados de forma absoluta no canto superior esquerdo da imagem principal.
- **Estilo:** `absolute top-4 left-4 z-10 flex flex-col gap-2 items-start`.

### 2. Tamanho da Fonte das Categorias nos Cards
Aumento do tamanho da fonte que exibe as categorias nos cards de produtos para melhorar a legibilidade.

- **Arquivo:** `src/components/artwork-card.tsx`.
- **Ação:** Alterar a classe CSS de `text-[11px]` para `text-[12px]`.

### 3. Grid de Produtos Consistente em Tablets
Garantir que todas as listagens de produtos exibam 2 itens por linha em dispositivos tablet (telas médias).

- **Arquivos:** `src/features/home/art-grid.tsx` e `src/features/artwork/related-artworks.tsx`.
- **Ação:** Adicionar/ajustar a classe `md:grid-cols-2` nos containers de grid.

### 4. Correção de Bug Mobile na Paginação do Catálogo
Eliminar o scroll horizontal indesejado e o efeito de zoom ao navegar entre páginas no catálogo, além de garantir o retorno suave ao topo da lista.

- **Arquivos:** `src/features/catalog/catalog-results.tsx` e `src/routes/catalogo.tsx`.
- **Ação:**
    - Adicionar `overflow-x-hidden` e `max-w-full` aos containers principais.
    - Garantir que `w-full` seja aplicado corretamente sem margens negativas que excedam a largura da tela.
    - Implementar `window.scrollTo({ top: 0, behavior: 'smooth' })` na função de mudança de página para evitar focos que causem zoom no mobile.

## Detalhes Técnicos
- Utilização de classes utilitárias do Tailwind CSS.
- Manutenção do padrão Neon Dark Blue do projeto.
- Preservação da lógica de internacionalização (i18n) existente.
