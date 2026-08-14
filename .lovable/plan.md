# Plano: Aumentar espaçamento na paginação

Aumentar o espaçamento entre os itens de navegação da paginação no catálogo, tanto no desktop quanto no mobile, para melhorar a usabilidade e evitar que os botões fiquem muito próximos.

## Alterações

### Componentes de UI
- Ajustar `src/components/ui/pagination.tsx` para aumentar o `gap` padrão de `gap-1` (4px) para `gap-2` (8px) no `PaginationContent`.

### Catálogo
- Ajustar `src/features/catalog/catalog-results.tsx` para aumentar o `gap` na versão mobile de `gap-1` para `gap-2`.

## Detalhes técnicos
- Uso de classes utilitárias do Tailwind CSS.
- Manutenção da responsividade e do design "Neon Dark Blue".

## Verificação
- Visualização manual da paginação no desktop e no mobile (simulando 320px e larguras maiores).
- Garantir que o aumento do gap não cause overflow horizontal em telas pequenas (o que já foi tratado anteriormente ocultando o texto em telas < 370px).
