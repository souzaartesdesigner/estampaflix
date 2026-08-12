import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/orders/cleanup-expired")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        
        const now = new Date().toISOString();
        
        const { data, error } = await supabaseAdmin
          .from("orders")
          .update({ status: "canceled" })
          .eq("status", "pending")
          .lt("pix_expires_at", now)
          .select("id");

        if (error) {
          console.error("Cleanup error:", error);
          return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        return new Response(JSON.stringify({ count: data?.length || 0 }), {
          headers: { "Content-Type": "application/json" }
        });
      },
      GET: async () => new Response("Use POST for cleanup"),
    },
  },
});
