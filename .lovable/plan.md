# Plan - Fix SEO Persistence and Rendering

The user is reporting that SEO titles and meta descriptions are not being correctly set or persisted. The primary issue is that the `<title>` tag is being incorrectly placed inside the `meta` array in the `head()` function of TanStack Router routes, rather than at the top level of the return object. Additionally, some analytics fields are missing from the admin UI and the global site settings hook, which may lead to data loss or confusion.

## User Requirements
- Set global site title and meta description.
- Use the user's values verbatim (don't rewrite).
- Fix persistence issues in the admin panel (Meta Description/Title not saving).
- **Constraint**: DO NOT touch Analytics or Google Tag Manager settings (meaning preserve their values and current injection logic).

## Proposed Changes

### 1. Global Site Settings Hook (`src/hooks/use-site-settings.ts`)
- Update `SiteSettings` type to include all database columns (`google_ads_id`, `google_ads_purchase_label`, `body_scripts`).
- Update `DEFAULTS` to match the user's chosen fallback values for `seo_title` and `seo_description`.

### 2. Root Route (`src/routes/__root.tsx`)
- Update `loader` to select all relevant columns from `site_settings`.
- Fix `head()` function: move `title` from the `meta` array to the top-level return object.
- Ensure `og:image` and `twitter:image` use absolute URLs as required by SEO best practices.

### 3. Homepage and Category Routes
- `src/routes/index.tsx`: Fix `head()` by moving `title` to the top level.
- `src/routes/catalogo.$slug.tsx`: Fix `head()` by moving `title` to the top level.

### 4. Admin Settings Page (`src/routes/_authenticated/admin/configuracoes.tsx`)
- Add fields for Google Ads tracking (`google_ads_id`, `google_ads_purchase_label`) to the "Analytics" tab. This ensures these values are visible and preserved in the `form` state when saving.
- Verify that `upsert` correctly handles all fields.

## Verification Plan
- **Build Check**: Ensure no TypeScript errors after updating types.
- **Manual Verification (Playwright)**:
    - Check the `<title>` and `<meta name="description">` tags on the homepage and a category page.
    - Test saving SEO settings in the admin and verify they persist in the database and reflect on the frontend.
