import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "pt" | "en" | "es";

export const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇪🇸" },
];

type Dict = Record<string, string>;
const DICTS: Record<Lang, Dict> = {
  pt: {
    "nav.home": "Início",
    "nav.catalog": "Catálogo",
    "nav.plans": "Planos",
    "nav.blog": "Blog",
    "nav.support": "Suporte",
    "nav.signIn": "Entrar",
    "nav.subscribe": "Assinar",
    "nav.myAccount": "Minha conta",
    "nav.cart": "Meu carrinho",
    "nav.admin": "Painel admin",
    "nav.signOut": "Sair",
    "search.placeholder": "Buscar artes, temas, tags...",
    "product.download": "Fazer Download",
    "product.buyPix": "Comprar Individualmente via Pix",
    "product.addToCart": "Adicionar ao carrinho",
    "product.inCart": "No carrinho — ver",
    "product.description": "Descrição",
    "product.related": "Produtos relacionados",
    "product.tags": "Tags",
    "product.reviews": "Avaliações",
    "product.reviewsEmpty": "Ainda sem avaliações. Seja o primeiro a avaliar.",
    "product.reviewGate": "Compre ou baixe esta arte para poder avaliar.",
    "product.reviewYours": "Sua avaliação",
    "product.reviewComment": "Escreva um comentário (opcional)",
    "product.reviewSubmit": "Enviar avaliação",
    "product.reviewUpdate": "Atualizar avaliação",
    "product.reviewDelete": "Remover",
    "gallery.zoom": "Ampliar",
    "gallery.close": "Fechar",
    "notif.title": "Notificações",
    "notif.empty": "Você não tem notificações.",
    "notif.markAll": "Marcar todas como lidas",
  },
  en: {
    "nav.home": "Home",
    "nav.catalog": "Catalog",
    "nav.plans": "Plans",
    "nav.blog": "Blog",
    "nav.support": "Support",
    "nav.signIn": "Sign in",
    "nav.subscribe": "Subscribe",
    "nav.myAccount": "My account",
    "nav.cart": "My cart",
    "nav.admin": "Admin panel",
    "nav.signOut": "Sign out",
    "search.placeholder": "Search artworks, themes, tags...",
    "product.download": "Download",
    "product.buyPix": "Buy individually via Pix",
    "product.addToCart": "Add to cart",
    "product.inCart": "In cart — view",
    "product.description": "Description",
    "product.related": "Related products",
    "product.tags": "Tags",
    "product.reviews": "Reviews",
    "product.reviewsEmpty": "No reviews yet. Be the first to review.",
    "product.reviewGate": "Purchase or download this artwork to review it.",
    "product.reviewYours": "Your review",
    "product.reviewComment": "Write a comment (optional)",
    "product.reviewSubmit": "Submit review",
    "product.reviewUpdate": "Update review",
    "product.reviewDelete": "Delete",
    "gallery.zoom": "Zoom",
    "gallery.close": "Close",
    "notif.title": "Notifications",
    "notif.empty": "You have no notifications.",
    "notif.markAll": "Mark all as read",
  },
  es: {
    "nav.home": "Inicio",
    "nav.catalog": "Catálogo",
    "nav.plans": "Planes",
    "nav.blog": "Blog",
    "nav.support": "Soporte",
    "nav.signIn": "Entrar",
    "nav.subscribe": "Suscribirse",
    "nav.myAccount": "Mi cuenta",
    "nav.cart": "Mi carrito",
    "nav.admin": "Panel admin",
    "nav.signOut": "Salir",
    "search.placeholder": "Buscar artes, temas, tags...",
    "product.download": "Descargar",
    "product.buyPix": "Comprar individualmente vía Pix",
    "product.addToCart": "Añadir al carrito",
    "product.inCart": "En el carrito — ver",
    "product.description": "Descripción",
    "product.related": "Productos relacionados",
    "product.tags": "Etiquetas",
    "product.reviews": "Reseñas",
    "product.reviewsEmpty": "Aún no hay reseñas. Sé el primero en opinar.",
    "product.reviewGate": "Compra o descarga esta arte para poder reseñar.",
    "product.reviewYours": "Tu reseña",
    "product.reviewComment": "Escribe un comentario (opcional)",
    "product.reviewSubmit": "Enviar reseña",
    "product.reviewUpdate": "Actualizar reseña",
    "product.reviewDelete": "Eliminar",
    "gallery.zoom": "Ampliar",
    "gallery.close": "Cerrar",
    "notif.title": "Notificaciones",
    "notif.empty": "No tienes notificaciones.",
    "notif.markAll": "Marcar todas como leídas",
  },
};

type I18nCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("pt");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("lang")) as Lang | null;
    if (saved && ["pt", "en", "es"].includes(saved)) setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", l);
      document.documentElement.setAttribute("lang", l === "pt" ? "pt-BR" : l);
    }
  };

  const t = (key: string) => DICTS[lang][key] ?? DICTS.pt[key] ?? key;

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  const c = useContext(Ctx);
  if (!c) return { lang: "pt", setLang: () => {}, t: (k) => DICTS.pt[k] ?? k };
  return c;
}

/** Read translated field from a row that stores `translations: { en: {...}, es: {...} }` */
export function tField<T extends Record<string, any>>(row: T | null | undefined, field: keyof T, lang: Lang): string {
  if (!row) return "";
  const base = (row[field] as unknown as string) ?? "";
  if (lang === "pt") return base;
  const trans = (row as any).translations?.[lang]?.[field as string];
  return (trans && String(trans).trim().length > 0) ? String(trans) : base;
}
