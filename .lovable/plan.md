# Plano de Ajuste de Responsividade - Página de Produto

Este plano visa corrigir problemas de transbordamento horizontal e garantir que o conteúdo se ajuste corretamente em dispositivos móveis finos (como o Samsung Galaxy Z Flip) na página de detalhes do produto.

## Alterações Propostas

### 1. Ajuste na Galeria de Arte (`src/components/artwork-gallery.tsx`)
- Garantir que o contêiner principal da galeria não exceda a largura da tela (`max-w-full`).
- Adicionar `touch-none` ou ajustes de `overflow` para evitar que gestos de zoom ou navegação causem deslocamento lateral inesperado no layout pai.

### 2. Ajuste na Página de Produto (`src/routes/artes.$slug.tsx`)
- Refinar o grid e o espaçamento (`padding`) no contêiner principal para telas ultra-estreitas.
- Substituir `px-3` por um valor ligeiramente menor ou usar `clamp` para garantir margens seguras sem comprimir excessivamente o conteúdo.

### 3. Ajuste nas Ações e Informações do Produto (`src/features/artwork/artwork-actions.tsx` e `src/features/artwork/artwork-info.tsx`)
- Garantir que os botões e selos (Badges) usem `flex-wrap` onde apropriado para não "empurrar" a largura do contêiner.
- Revisar o uso de larguras fixas em elementos internos.

## Detalhes Técnicos
- Utilização de classes utilitárias do Tailwind CSS como `max-w-full`, `overflow-hidden`, `break-words` e `flex-wrap`.
- Teste de regressão visual para garantir que o layout desktop e tablet permaneça inalterado.

## Verificação
- Validar a página de produto em diferentes viewports usando o simulador do navegador (320px, 360px, 375px).
- Verificar se o scroll horizontal foi eliminado.
