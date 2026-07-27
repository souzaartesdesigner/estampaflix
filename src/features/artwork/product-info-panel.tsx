import { Download, FileType, Hash, LayoutGrid, ShieldCheck, Zap } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { formatDescription, formatLabel } from "./formats";
import { FileFormatIcon } from "./file-format-icon";


type Row = { icon: React.ReactNode; label: string; value: React.ReactNode };

export function ProductInfoPanel({ artwork }: { artwork: any }) {
  const fmt = artwork.file_format as string | null;
  const fmtLabel = formatLabel(fmt);
  const fmtDesc = formatDescription(fmt);
  const code = String(artwork.id ?? "").split("-")[0]?.toUpperCase();

  const rows: Row[] = [];

  if (fmt) {
    rows.push({
      icon: <FileType className="h-4 w-4" />,
      label: "Formato do arquivo",
      value: (
        <span className="flex flex-wrap items-center gap-2">
          <FileFormatIcon format={fmt} />
          <span>{fmtDesc}</span>
        </span>
      ),

    });
  }

  if (artwork.categories) {
    rows.push({
      icon: <LayoutGrid className="h-4 w-4" />,
      label: "Categoria",
      value: (
        <Link to="/catalogo" search={{ categoria: artwork.categories.slug } as any} className="text-primary hover:underline">
          {artwork.categories.name}
        </Link>
      ),
    });
  }

  rows.push({ icon: <Zap className="h-4 w-4" />, label: "Entrega", value: "Download imediato após a compra" });
  rows.push({
    icon: <ShieldCheck className="h-4 w-4" />,
    label: "Licença",
    value: (
      <Link to="/licenca" className="text-primary hover:underline">
        Licença de uso comercial
      </Link>
    ),
  });

  if ((artwork.download_count ?? 0) > 0) {
    rows.push({
      icon: <Download className="h-4 w-4" />,
      label: "Downloads",
      value: `+ de ${artwork.download_count} downloads realizados`,
    });
  }

  if (code) {
    rows.push({ icon: <Hash className="h-4 w-4" />, label: "Código do produto", value: code });
  }

  return (
    <section className="mt-6 rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur sm:p-5">
      <h2 className="mb-3 font-display text-base font-semibold sm:text-lg">Informações do produto</h2>
      <dl className="divide-y divide-border/50 text-sm">
        {rows.map((r, i) => (
          <div key={i} className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-start sm:gap-4">
            <dt className="flex min-w-[170px] items-center gap-2 text-muted-foreground">
              <span className="text-primary">{r.icon}</span>
              {r.label}
            </dt>
            <dd className="flex-1 text-foreground">{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
