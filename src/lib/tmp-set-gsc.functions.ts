import { createServerFn } from "@tanstack/react-start";

export const setGscVerification = createServerFn({ method: "POST" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .update({ google_search_console_id: "In4AG-B4ylm9Rn3vb8CA1mpjxtB6syQp4_lfoG6QLok" })
      .eq("id", true)
      .select("google_search_console_id");
    if (error) throw error;
    return { data };
  });
