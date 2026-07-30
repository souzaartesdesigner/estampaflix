/**
 * Pipeline de transformação de imagens.
 *
 * As imagens das artes vêm de origens variadas (storage do site + URLs externas
 * importadas do CSV), então usamos um proxy de imagens público que:
 *  - reescala para a largura realmente exibida (economia de dados no mobile)
 *  - converte para formatos modernos (WebP hoje; AVIF quando disponível)
 *  - serve por CDN com cache agressivo
 *
 * Toda URL é degradada com segurança: se a transformação falhar, o componente
 * <SmartImage> volta a usar a URL original.
 */

const CDN_ORIGIN = "https://wsrv.nl/";

/** Formatos de saída suportados pelo pipeline, em ordem de preferência. */
export type ImageFormat = "avif" | "webp" | "origin";

/** O proxy atual ainda não expõe AVIF; manter a lista facilita ligar depois. */
export const ENABLED_FORMATS: ImageFormat[] = ["webp"];

/**
 * Larguras responsivas padrão (px).
 *
 * Menos variantes = mais acertos no cache do CDN. Cada largura inédita obriga o
 * proxy a buscar o original (~1,5 s); já em cache a resposta cai para ~50 ms.
 * Por isso mantemos poucas larguras bem espaçadas por contexto de uso.
 */
export const CARD_WIDTHS = [400, 800];
export const HERO_WIDTHS = [640, 1280, 1920];
export const DETAIL_WIDTHS = [800, 1600];
export const THUMB_WIDTHS = [160];


/** Só transformamos URLs http(s) públicas e absolutas. */
export function canTransform(src: string | null | undefined): src is string {
  if (!src) return false;
  if (!/^https?:\/\//i.test(src)) return false;
  if (src.startsWith(CDN_ORIGIN)) return false;
  if (/\.svg(\?|$)/i.test(src)) return false;
  return true;
}

type TransformOptions = {
  width: number;
  quality?: number;
  format?: ImageFormat;
  /** Corta preenchendo a largura/altura (usado quando o layout é quadrado). */
  height?: number;
};

export function transformedUrl(src: string, opts: TransformOptions): string {
  if (!canTransform(src)) return src;
  const params = new URLSearchParams();
  params.set("url", src);
  params.set("w", String(opts.width));
  if (opts.height) {
    params.set("h", String(opts.height));
    params.set("fit", "cover");
  }
  params.set("q", String(opts.quality ?? 74));
  // Nunca ampliar acima do tamanho original.
  params.set("we", "");
  // Cache longo no CDN: evita reprocessar a imagem a cada visita.
  params.set("maxage", "1y");

  const format = opts.format ?? ENABLED_FORMATS[0];
  if (format && format !== "origin") params.set("output", format);
  return `${CDN_ORIGIN}?${params.toString()}`;
}

export function buildSrcSet(
  src: string,
  widths: number[],
  opts: Omit<TransformOptions, "width"> = {},
): string | undefined {
  if (!canTransform(src)) return undefined;
  return widths
    .map((w) => `${transformedUrl(src, { ...opts, width: w })} ${w}w`)
    .join(", ");

}
