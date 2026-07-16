import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const MP_API = "https://api.mercadopago.com";

function getAccessToken() {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) throw new Error("MERCADO_PAGO_ACCESS_TOKEN not configured");
  return token;
}

export const createPixOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { artworkId: string }) =>
    z.object({ artworkId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // 1. Fetch artwork (RLS: is_published check public)
    const { data: artwork, error: artErr } = await supabase
      .from("artworks")
      .select("id,title,price_cents,is_published")
      .eq("id", data.artworkId)
      .eq("is_published", true)
      .maybeSingle();
    if (artErr) throw new Error(artErr.message);
    if (!artwork) throw new Error("artwork_not_found");
    if (!artwork.price_cents || artwork.price_cents <= 0)
      throw new Error("invalid_price");

    // 2. Reuse an existing pending Pix order for this user+artwork if not expired
    const { data: existing } = await supabase
      .from("orders")
      .select("id,provider,status,pix_qr_code,pix_qr_code_base64,pix_expires_at,amount_cents")
      .eq("user_id", userId)
      .eq("artwork_id", artwork.id)
      .eq("provider", "mercadopago")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (
      existing &&
      existing.pix_qr_code &&
      existing.pix_expires_at &&
      new Date(existing.pix_expires_at).getTime() > Date.now() + 60_000
    ) {
      return {
        orderId: existing.id,
        qrCode: existing.pix_qr_code,
        qrCodeBase64: existing.pix_qr_code_base64,
        expiresAt: existing.pix_expires_at,
        amountCents: existing.amount_cents,
      };
    }

    // 3. Get user email for MP payer
    const { data: profile } = await supabase
      .from("profiles")
      .select("email,full_name")
      .eq("id", userId)
      .maybeSingle();
    const payerEmail = profile?.email || `${userId}@estampahub.local`;

    // 4. Create MP Pix payment
    const idempotencyKey = crypto.randomUUID();
    const amount = Number((artwork.price_cents / 100).toFixed(2));
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    const mpRes = await fetch(`${MP_API}/v1/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        transaction_amount: amount,
        description: artwork.title,
        payment_method_id: "pix",
        date_of_expiration: expiresAt.toISOString().replace("Z", "-00:00"),
        payer: {
          email: payerEmail,
          first_name: profile?.full_name?.split(" ")[0] || "Cliente",
        },
        metadata: {
          artwork_id: artwork.id,
          user_id: userId,
        },
      }),
    });

    if (!mpRes.ok) {
      const errText = await mpRes.text();
      console.error("MP create payment failed:", mpRes.status, errText);
      throw new Error("mp_create_failed");
    }
    const mp: any = await mpRes.json();
    const qrCode = mp.point_of_interaction?.transaction_data?.qr_code as
      | string
      | undefined;
    const qrCodeBase64 = mp.point_of_interaction?.transaction_data
      ?.qr_code_base64 as string | undefined;
    if (!qrCode) throw new Error("mp_no_qr_code");

    // 5. Persist order via admin (no INSERT policy for authenticated on orders)
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error: ordErr } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        artwork_id: artwork.id,
        amount_cents: artwork.price_cents,
        status: "pending",
        provider: "mercadopago",
        provider_payment_id: String(mp.id),
        pix_qr_code: qrCode,
        pix_qr_code_base64: qrCodeBase64,
        pix_expires_at: expiresAt.toISOString(),
      })
      .select("id")
      .single();
    if (ordErr) throw new Error(ordErr.message);

    return {
      orderId: order.id,
      qrCode,
      qrCodeBase64,
      expiresAt: expiresAt.toISOString(),
      amountCents: artwork.price_cents,
    };
  });

export const checkPixOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { orderId: string }) =>
    z.object({ orderId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: order, error } = await supabase
      .from("orders")
      .select(
        "id,status,provider,provider_payment_id,pix_qr_code,pix_qr_code_base64,pix_expires_at,amount_cents,artwork_id,artworks(slug,title)",
      )
      .eq("id", data.orderId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) throw new Error("order_not_found");

    // If still pending, poll MP directly (webhook is authoritative but this is a UX fallback)
    if (order.status === "pending" && order.provider_payment_id) {
      try {
        const mpRes = await fetch(
          `${MP_API}/v1/payments/${order.provider_payment_id}`,
          { headers: { Authorization: `Bearer ${getAccessToken()}` } },
        );
        if (mpRes.ok) {
          const mp: any = await mpRes.json();
          if (mp.status === "approved") {
            const { supabaseAdmin } = await import(
              "@/integrations/supabase/client.server"
            );
            await supabaseAdmin
              .from("orders")
              .update({ status: "paid", paid_at: new Date().toISOString() })
              .eq("id", order.id)
              .eq("status", "pending");
            return { ...order, status: "paid" as const };
          }
          if (["cancelled", "rejected", "refunded"].includes(mp.status)) {
            const { supabaseAdmin } = await import(
              "@/integrations/supabase/client.server"
            );
            await supabaseAdmin
              .from("orders")
              .update({ status: "failed" })
              .eq("id", order.id)
              .eq("status", "pending");
            return { ...order, status: "failed" as const };
          }
        }
      } catch (e) {
        console.error("MP poll error:", e);
      }
    }

    return order;
  });
