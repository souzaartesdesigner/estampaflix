# Plan - Catalog PDF Generator Fixes

The goal is to fix visual bugs in the generated PDF: unwanted outlines around images, inconsistent rounding (especially on the first image), and rendering issues with social icons.

## User Review Required

> [!IMPORTANT]
> The fixes involve low-level `jsPDF` path manipulation to ensure pixel-perfect clipping and icon rendering.

- **Instagram Icon**: I will improve the Instagram icon rendering by using a higher resolution canvas and ensuring no artifacts are left behind.
- **Image Outlines**: I will remove the `doc.roundedRect` call for images as a visible element and use it strictly as a clipping path.
- **Rounding Consistency**: I will ensure `saveGraphicsState` and `restoreGraphicsState` are properly balanced and that the clipping path is applied exactly once per image.

## Proposed Changes

### PDF Generation logic

#### [src/routes/gerador-catalogo.tsx](src/routes/gerador-catalogo.tsx)

- Modify `generatePdf` to:
    - Change `doc.roundedRect(imgX, imgY, w, h, 2.1, 2.1)` to use `null` or a style that doesn't draw a stroke if possible, or use `doc.path` for clipping to be absolutely sure no stroke is rendered.
    - Ensure `paintBg` is called at the very beginning of `drawHeader` and that `doc.addPage()` resets the graphics state if needed.
    - Fix the Instagram button background rendering: clearing the canvas before drawing the gradient and ensuring the pill shape is correctly scaled.
    - Update `renderSocialIconForPdf` to handle scaling more gracefully and ensure icons are sharp.

#### [src/styles.css](src/styles.css)

- (Already contains `custom-scrollbar`, no changes needed unless the user reports issues there).

## Verification Plan

### Automated Tests
- I cannot easily run automated tests on PDF binary output in this environment without complex dependencies, but I will use a reproduction script with Playwright to generate a PDF and inspect the console logs for any jspdf errors.

### Manual Verification
1. Open the "Gerador de Catálogo" page.
2. Select a few artworks (at least 10 to trigger multiple rows/pages).
3. Upload a logo and set background/text colors.
4. Enable WhatsApp and Instagram buttons.
5. Click "Gerar PDF".
6. Verify:
    - Images have 8px (2.1mm) rounded corners.
    - No black/dark outlines appear around images.
    - The Instagram button has a smooth pill shape with a clear icon.
    - The rounding is applied to the first image of every page.
