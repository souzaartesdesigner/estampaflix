import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";

const MP_API = "https://api.mercadopago.com";

/**
 * Mercado Pago webhook - Pix payment notifications.
 * Docs: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 *
 * The x-signature header contains: ts=...,v1=<hmac_sha256>
 * The manifest is: id:<data.id>;request-id:<x-request-id>;ts:<ts>;
 * HMAC secret is the "Chave secreta" from the webhook config panel.
 */
export const Route = createFileRoute("/api/public/mercadopago/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const bodyText = await request.text();

          let paymentId: string | null = null;
          try {
            const body = JSON.parse(bodyText);
            paymentId =
              body?.data?.id?.toString() ??
              body?.resource?.toString().split("/").pop() ??
              url.searchParams.get("data.id") ??
              url.searchParams.get("id");
          } catch {
            paymentId = url.searchParams.get("data.id") ?? url.searchParams.get("id");
          }

          if (!paymentId) {
            return new Response("missing payment id", { status: 400 });
          }

          // Signature verification (best-effort; skip if secret not set for backward compat)
          const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
          const sigHeader = request.headers.get("x-signature");
          const requestId = request.headers.get("x-request-id") ?? "";
          if (secret && sigHeader) {
            const parts = Object.fromEntries(
              sigHeader.split(",").map((p) => {
                const [k, v] = p.trim().split("=");
                return [k, v];
              }),
            );
            const ts = parts.ts;
            const v1 = parts.v1;
            if (ts && v1) {
              const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`;
              const expected = createHmac("sha256", secret)
                .update(manifest)
                .digest("hex");
              const a = Buffer.from(expected);
              const b = Buffer.from(v1);
              if (a.length !== b.length || !timingSafeEqual(a, b)) {
                console.warn("MP webhook signature mismatch");
                return new Response("invalid signature", { status: 401 });
              }
            }
          }

          const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
          if (!token) {
            console.error("MERCADO_PAGO_ACCESS_TOKEN not configured");
            return new Response("misconfigured", { status: 500 });
          }

          const mpRes = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!mpRes.ok) {
            console.error("MP fetch payment failed", mpRes.status);
            // Return 200 so MP doesn't retry forever on genuinely missing ids
            return new Response("ok", { status: 200 });
          }
          const mp: any = await mpRes.json();

          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );

          const nextStatus =
            mp.status === "approved"
              ? "paid"
              : ["cancelled", "rejected", "refunded"].includes(mp.status)
                ? mp.status === "refunded"
                  ? "refunded"
                  : "failed"
                : null;

          if (!nextStatus) return new Response("ok");

          const update: Record<string, unknown> = { status: nextStatus };
          if (nextStatus === "paid") update.paid_at = new Date().toISOString();

          const { error } = await supabaseAdmin
            .from("orders")
            .update(update)
            .eq("provider", "mercadopago")
            .eq("provider_payment_id", String(paymentId));

          if (error) {
            console.error("MP webhook update error:", error);
            return new Response("db error", { status: 500 });
          }

          return new Response("ok");
        } catch (e) {
          console.error("MP webhook error:", e);
          return new Response("error", { status: 500 });
        }
      },
      GET: async () => new Response("ok"),
    },
  },
});
