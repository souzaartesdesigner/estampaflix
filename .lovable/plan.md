# Plan: Add 8px Border Radius to Catalog PDF Images

Add a consistent 8px border radius to product images in the generated PDF catalog and the UI preview, as requested in the uploaded documentation.

## User Review Required

> [!IMPORTANT]
> The border radius will be applied to both the live preview in the app and the final exported PDF to ensure visual consistency.

## Proposed Changes

### Catalog Generator
#### [src/routes/gerador-catalogo.tsx](src/routes/gerador-catalogo.tsx)

- Update the `generatePdf` function to apply a clipping path with a 2.1mm radius (equivalent to 8px) before drawing each product image.
- Update the UI preview grid to use Tailwind's `rounded-lg` class on the image containers to match the PDF output.

## Technical Details

- **PDF Clipping**: `jsPDF` units are in millimeters. 8px at 96 DPI is approx. 2.116mm. I will use `2.1` as the radius value.
- **Implementation**: Wrap `doc.addImage` with:
  ```typescript
  doc.saveGraphicsState();
  doc.roundedRect(imgX, imgY, w, h, 2.1, 2.1);
  doc.clip();
  doc.addImage(...);
  doc.restoreGraphicsState();
  ```
- **UI Match**: Add `rounded-lg` to the `div` wrapping the `<img>` in the preview grid (line ~903).

## Verification Plan

### Automated Tests
- N/A (Manual visual verification is more effective for PDF layout)

### Manual Verification
- Open the "Gerador de Catálogo" page.
- Select some products.
- Verify that images in the grid have rounded corners.
- Click "Gerar PDF" and open the resulting file.
- Verify that images in the PDF have rounded corners.
