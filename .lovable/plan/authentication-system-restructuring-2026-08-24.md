# Authentication System Restructuring

Restructuring authentication flow by replacing the unified `/auth` route with three independent pages (`/login`, `/cadastro`, `/esqueci-a-senha`) following the "Estampaflix" visual identity.

## Proposed Changes

### 1. New Authentication Layout
- Create `src/components/auth/auth-layout.tsx` to provide the requested "Split Screen Dark Mode with Glassmorphism" container.
- **Left Side**: Desktop-only hero with the title "SUBLIMAÇÃO EM ESCALA." and gradients.
- **Right Side**: Centered form container with glassmorphism effects.

### 2. New Routes
- **`src/routes/login.tsx`**: Implementation of the Login form with email/password and link to recovery.
- **`src/routes/cadastro.tsx`**: Implementation of the Sign-up form with Name, Email, WhatsApp, and Password.
- **`src/routes/esqueci-a-senha.tsx`**: Implementation of the Password Recovery form.

### 3. Deletions and Cleanup
- Remove `src/routes/auth.tsx`.
- Update all internal links in the codebase that point to `/auth` to point to `/login` or `/cadastro` as appropriate.
- Update redirects in `src/routes/reset-password.tsx` to point to `/login`.

### 4. Integration
- Maintain current Supabase Auth logic (sign in, sign up, password reset, OAuth).
- Ensure existing redirects (e.g., to `/minha-conta`) are preserved.

## Technical Details
- Use `backdrop-blur-md`, `bg-white/5`, and `border-white/10` for glassmorphism.
- Apply `text-primary` (Estampaflix Blue) to highlighted text elements.
- Ensure responsive design (split screen hidden on mobile).
- Update TanStack Router navigation calls across the project.

## Verification Plan
- Manually test each new route: `/login`, `/cadastro`, and `/esqueci-a-senha`.
- Verify Supabase authentication flow (Login and Signup).
- Check responsiveness on mobile and desktop.
- Run `rg "/auth"` to ensure no legacy links remain.
