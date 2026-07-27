import { z } from "zod";

export const catalogSearchSchema = z.object({
  q: z.string().optional(),
  categoria: z.string().optional(),
  tag: z.string().optional(),
  formato: z.string().optional(),
  cor: z.string().optional(),
});

export type CatalogSearch = z.infer<typeof catalogSearchSchema>;

/** Sugestões iniciais — a lista real é montada com os formatos cadastrados nos produtos. */
export const FORMAT_SUGGESTIONS = FORMAT_KEYS as unknown as string[];

/** Normaliza o formato digitado (mapeia para uma chave conhecida quando possível). */
export function normalizeFormat(value: string) {
  return normalizeFormatKey(value) ?? (value || "").trim().toLowerCase().replace(/^\./, "");
}

export const COLORS = [
  { key: "color.black", value: "black" },
  { key: "color.white", value: "white" },
  { key: "color.red", value: "red" },
  { key: "color.blue", value: "blue" },
  { key: "color.green", value: "green" },
  { key: "color.yellow", value: "yellow" },
  { key: "color.pink", value: "pink" },
  { key: "color.purple", value: "purple" },
] as const;
