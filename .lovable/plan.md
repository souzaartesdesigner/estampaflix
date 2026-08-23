# Plan - Subscription Paywall for PDF Generator

Implement a paywall for the PDF generation feature in the Catalog Generator. Users can still browse and select artworks, but downloading the PDF requires an active Premium subscription.

## Proposed Changes

### PDF Generator Route (`src/routes/gerador-catalogo.tsx`)
- Import `useAuth` to check user authentication status.
- Import `useUserSubscription` to check for active Premium plans.
- Add local state `isPaywallOpen` to control the conversion modal.
- Modify `generatePdf` function:
    - Check if the user is logged in.
    - Check if the user has an active subscription.
    - If either check fails, prevent PDF generation and open the `PaywallModal`.
- Implement `PaywallModal` component using `Dialog` from shadcn/ui.

### Components
- Ensure the `Dialog` components (from `src/components/ui/dialog.tsx`) are correctly used for the modal.

## Technical Details

### Paywall Logic
```typescript
const { user } = useAuth();
const { data: subscription } = useUserSubscription(user?.id);

const canGeneratePdf = !!user && subscription?.status === 'active';

async function handleGenerateClick() {
  if (!canGeneratePdf) {
    setIsPaywallOpen(true);
    return;
  }
  await generatePdf();
}
```

### UI - Conversion Modal
- **Title**: "Recurso Exclusivo para Assinantes"
- **Text**: "Para gerar catálogos em PDF com a sua própria logo e enviar para seus clientes, você precisa de um plano Premium ativo."
- **Primary CTA**: Button "Conhecer Planos" (redirects to `/planos` or similar pricing page).
- **Secondary CTA**: "Fechar" button.

## Verification Plan

### Manual Verification
- Access `/gerador-catalogo` as an anonymous user.
- Select artworks and click "Gerar PDF".
- Verify that the conversion modal appears.
- Log in with a non-subscriber account and repeat.
- Log in with a subscriber account and verify that the PDF is generated correctly.
