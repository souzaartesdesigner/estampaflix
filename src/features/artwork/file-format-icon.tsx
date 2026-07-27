import { formatLabel } from "./formats";

type Props = { format: string; className?: string };

/**
 * Badge textual padronizado para formatos de arquivo.
 * Exibe sempre o nome do formato em maiúsculo, sem ícones ou logos.
 */
export function FileFormatIcon({ format, className = "" }: Props) {
  const label = formatLabel(format);
  return (
    <span
      className={
        "inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] border border-primary/50 bg-primary/15 px-1.5 text-[9px] font-black leading-none tracking-tight text-primary uppercase " +
        className
      }
      aria-hidden="true"
    >
      {label}
    </span>
  );
}
