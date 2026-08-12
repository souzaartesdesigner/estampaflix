import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/tmp-set-gsc")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("site_settings")
          .update({ google_search_console_id: "In4AG-B4ylm9Rn3vb8CA1mpjxtB6syQp4_lfoG6QLok" })
          .eq("id", true)
          .select("google_search_console_id");
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ data }), { status: 200, headers: { "Content-Type": "application/json" } });
      },
    },
  },
});
