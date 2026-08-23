# Plano de Correção para o Gerador de Catálogo

## Problemas Identificados
1. **Ícone do Instagram no PDF:** O ícone está invisível ou com problemas de renderização. O uso de `ctx.save()` e `ctx.scale()` pode estar causando problemas no canvas de renderização.
2. **Borda nas imagens:** Existe um contorno indesejado nas imagens do catálogo PDF.
3. **Arredondamento no primeiro produto da página:** As imagens do primeiro produto de cada página não estão respeitando o raio de 8px (2.1mm).

## Soluções Propostas

### 1. Ícone do Instagram
- Revisar a renderização do ícone do Instagram no Canvas. Garantir que a escala e o desenho do ícone (Path2D) estejam corretos dentro do Canvas de 120x120px.
- Verificar se a cor do ícone (branca) está sendo renderizada corretamente sobre o gradiente.

### 2. Borda nas Imagens
- Remover qualquer chamada de `doc.rect` ou `stroke()` que possa estar gerando a borda. Revisar se `doc.roundedRect` sem o estilo 'S' (stroke) está realmente apenas definindo o caminho de corte (clipping).

### 3. Arredondamento da Imagem
- Garantir que o estado gráfico do `jsPDF` seja redefinido corretamente após cada página, ou garantir que o `doc.clip()` esteja sendo aplicado corretamente mesmo após uma quebra de página.
- Verificar se `doc.saveGraphicsState()` e `doc.restoreGraphicsState()` estão encapsulando corretamente cada renderização de imagem para evitar vazamento de estado.

## Passos de Implementação
1. Modificar `renderSocialIconForPdf` para garantir que o ícone do Instagram seja desenhado corretamente no canvas.
2. Revisar o loop de renderização das artes no PDF (`generatePdf`) para remover possíveis contornos.
3. Verificar e ajustar a lógica de `clip()` e `roundedRect()` para garantir que o arredondamento de 8px (2.1mm) seja aplicado uniformemente a todas as imagens, incluindo a primeira de cada página.
4. Testar a geração do PDF e verificar visualmente os itens acima.
