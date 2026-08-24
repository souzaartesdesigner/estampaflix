# Plan: Authentication Restructuring - Estampaflix

Restructure the authentication flow by replacing the unified `/auth` route with dedicated `/login`, `/cadastro`, and `/esqueci-a-senha` pages, featuring a modern "Split Screen" design with glassmorphism.

## User Review Required

> [!IMPORTANT]
> The current primary color is `#007bff` and secondary is `#071b30`. I will use these for the "Estampaflix" branding as requested.

## Proposed Changes

### Routes & Navigation

#### [DELETE] `src/routes/auth.tsx`
- Remove the old unified authentication page.

#### [CREATE] `src/routes/login.tsx`
- Implement the "Split Screen" layout.
- Left side: Hero section with "SUBLIMAÇÃO EM ESCALA." branding.
- Right side: Sign-in form (Email, Password with eye icon, "Esqueceu a senha?" link).
- Footer: Link to `/cadastro`.
- Maintain Supabase Auth integration.

#### [CREATE] `src/routes/cadastro.tsx`
- Implement the "Split Screen" layout.
- Right side: Registration form (Name, Email, WhatsApp, Password).
- Footer: Link to `/login`.
- Maintain Supabase Auth integration.

#### [CREATE] `src/routes/esqueci-a-senha.tsx`
- Implement the "Split Screen" layout.
- Right side: Password recovery form (Email).
- Footer: Link to `/login`.
- Maintain Supabase Auth integration.

#### [UPDATE] Navigation & Links
- **`src/components/site-header.tsx`**: Update "Entrar" link to `/login`.
- **`src/components/site-footer.tsx`**: Update authentication link to `/login`.
- **`src/components/artwork-reviews.tsx`**: Update "fazer login" link to `/login`.
- **`src/routes/_authenticated/admin/pedidos.$id.tsx`** (if applicable): Ensure any auth redirects point to the new routes.
- **`src/routes/_authenticated/route.tsx`** (or similar gate): Ensure unauthenticated users are redirected to `/login`.

### Design & Styling
- **Layout**: `min-h-screen flex flex-col lg:flex-row bg-[#0a0a0a]`.
- **Hero (Left)**: `lg:max-w-[60%]`, hidden on mobile, primary color glows/gradients.
- **Card (Right)**: Glassmorphism effect (`bg-white/5 backdrop-blur-md border border-white/10`).
- **Inputs**: `h-12`, translucent dark background, primary color focus borders.
- **Buttons**: `bg-primary`, `h-12`, rounded-xl, hover effects.

## Technical Details
- Use `@tanstack/react-router` for all routing.
- Integrate `supabase` from `@/integrations/supabase/client` for auth operations.
- Use `lucide-react` for icons (Eye, Phone, etc.).
- Ensure all forms have proper validation and loading states using `sonner` for feedback.
- Redirect already authenticated users to `/minha-conta`.
