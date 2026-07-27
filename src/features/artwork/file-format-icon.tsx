import { FileImage, FileText, FileType, Layers, PenTool, Shapes } from "lucide-react";
import corelAsset from "@/assets/coreldraw.webp.asset.json";
import { normalizeFormatKey } from "./formats";

type Props = { format: string; className?: string };

/** Marca textual para formatos com identidade forte (Photoshop, Illustrator). */
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
  const key = normalizeFormatKey(format);

  switch (key) {
    case "cdr":
      return (
        <img
          src={corelAsset.url}
          alt="CorelDRAW"
          className="h-5 w-5 rounded-[4px] object-contain"
          loading="lazy"
        />
      );
    case "psd":
      return <BrandMark label="Ps" />;
    case "ai":
      return <BrandMark label="Ai" />;
    case "eps":
      return <PenTool className={className} />;
    case "svg":
      return <Shapes className={className} />;
    case "pdf":
      return <FileText className={className} />;
    case "png":
    case "jpg":
    case "webp":
      return <FileImage className={className} />;
    case "zip":
      return <Layers className={className} />;
    default:
      return <FileType className={className} />;
  }
}
