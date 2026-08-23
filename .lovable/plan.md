# Plan - Subscription Paywall for PDF Generator

Implement a paywall for the PDF generation feature in the Catalog Generator. Users can still browse and select artworks, but downloading the PDF requires an active Premium subscription.

## Proposed Changes

### PDF Generator Route (`src/routes/gerador-catalogo.tsx`)
- Import `useUserSubscription` hook to check for active Premium plans.
- Add local state for the current user (`user`) and the Paywall Modal (`isPaywallOpen`).
- Initialize auth state in a `useEffect` using `supabase.auth`.
- Modify `generatePdf` function to check for an active subscription before proceeding.
- Implement a `PaywallModal` component using the shadcn/ui `Dialog` component.
- The modal will feature:
    - Title: "Recurso Exclusivo para Assinantes"
    - Description: "Para gerar catálogos em PDF com a sua própria logo e enviar para seus clientes, você precisa de um plano Premium ativo."
    - Primary CTA: "Conhecer Planos" (redirecting to `/planos`).
    - Secondary CTA: "Fechar".

## Technical Details

### Auth & Subscription Check
```typescript
const [user, setUser] = useState<any>(null);
const { data: subscription, isLoading: isLoadingSub } = useUserSubscription(user?.id);

useEffect(() => {
  supabase.auth.getUser().then(({ data }) => setUser(data.user));
}, []);

const hasActiveSubscription = !!subscription && subscription.status === 'active';
```

### Paywall Interception
In `generatePdf`:
```typescript
async function generatePdf() {
  if (!user || !hasActiveSubscription) {
    setIsPaywallOpen(true);
    return;
  }
  // ... existing generation logic
}
```

## Verification Plan

### Manual Verification
1. **Anonymous User**:
    - Navigate to `/gerador-catalogo`.
    - Select a few artworks.
    - Click "Gerar PDF".
    - Verify that the "Recurso Exclusivo para Assinantes" modal appears.
2. **Logged-in User (No Subscription)**:
    - Log in with an account that has no active subscription.
    - Go to `/gerador-catalogo`, select artworks, and click "Gerar PDF".
    - Verify that the conversion modal appears.
3. **Premium User**:
    - Log in with an account that has an active Premium subscription.
    - Go to `/gerador-catalogo`, select artworks, and click "Gerar PDF".
    - Verify that the PDF is generated and downloaded without the modal appearing.

