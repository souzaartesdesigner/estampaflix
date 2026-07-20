import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = {
  site_name: string;
  tagline: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string | null;
  support_email: string | null;
  whatsapp: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  ga4_measurement_id: string | null;
  meta_pixel_id: string | null;
  google_search_console_id: string | null;
  footer_text: string | null;
  legal_business_name: string | null;
  legal_document: string | null;
  promo_banner_enabled: boolean;
  promo_banner_text: string | null;
  promo_banner_link: string | null;
};

const DEFAULTS: SiteSettings = {
  site_name: "EstampaHub",
  tagline: "Artes digitais para sublimação",
  logo_url: null,
  favicon_url: null,
  primary_color: "#007bff",
  support_email: null,
  whatsapp: null,
  instagram_url: null,
  facebook_url: null,
  tiktok_url: null,
  ga4_measurement_id: null,
  meta_pixel_id: null,
  google_search_console_id: null,
  footer_text: null,
  legal_business_name: null,
  legal_document: null,
  promo_banner_enabled: false,
  promo_banner_text: null,
  promo_banner_link: null,
};

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async (): Promise<SiteSettings> => {
      const { data } = await (supabase as any).from("site_settings").select("*").eq("id", true).maybeSingle();
      return { ...DEFAULTS, ...(data ?? {}) };
    },
    staleTime: 60_000,
  });
}
