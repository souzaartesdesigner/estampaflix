import { FileImage, FileText, FileType, Layers, PenTool, Shapes } from "lucide-react";
import corelAsset from "@/assets/coreldraw.webp.asset.json";

type Props = { format: string; className?: string };

/** Marca textual para formatos com identidade forte (Corel, Photoshop, Illustrator). */
function BrandMark({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={
        "inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] border border-primary/50 bg-primary/15 px-1 text-[9px] font-black leading-none tracking-tight text-primary " +
        (className ?? "")
      }
      aria-hidden="true"
    >
      {label}
    </span>
  );
}

export function FileFormatIcon({ format, className = "h-4 w-4" }: Props) {
  const f = (format || "").trim().toLowerCase().replace(/^\./, "");

  if (f.includes("cdr") || f.includes("corel"))
    return (
      <img
        src={corelAsset.url}
        alt="CorelDRAW"
        className="h-5 w-5 rounded-[4px] object-contain"
        loading="lazy"
      />
    );
  if (f.includes("psd") || f.includes("photoshop")) return <BrandMark label="Ps" />;
  if (f.includes("ai") || f.includes("illustrator")) return <BrandMark label="Ai" />;
  if (f.includes("eps")) return <PenTool className={className} />;
  if (f.includes("svg")) return <Shapes className={className} />;
  if (f.includes("pdf")) return <FileText className={className} />;
  if (["png", "jpg", "jpeg", "webp", "gif", "tif", "tiff", "bmp"].some((x) => f.includes(x)))
    return <FileImage className={className} />;
  if (f.includes("zip") || f.includes("rar")) return <Layers className={className} />;
  return <FileType className={className} />;
}
