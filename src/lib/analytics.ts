
/**
 * Google Analytics 4 tracking helpers.
 * Wraps window.gtag for safe use in React components.
 */

interface GtagEventProps {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  currency?: string;
  [key: string]: any;
}

/**
 * Triggers a custom GA4 event and Meta Pixel event
 */
export const trackEvent = ({ action, category, label, value, currency = "BRL", ...rest }: GtagEventProps) => {
  if (typeof window !== "undefined") {
    // GA4
    if ((window as any).gtag) {
      (window as any).gtag("event", action, {
        event_category: category,
        event_label: label,
        value: value,
        currency: currency,
        ...rest,
      });
    }

    // Meta Pixel
    if ((window as any).fbq) {
      const fbEventMap: Record<string, string> = {
        view_item: "ViewContent",
        add_to_cart: "AddToCart",
        begin_checkout: "InitiateCheckout",
        purchase: "Purchase",
      };

      const fbEventName = fbEventMap[action];
      if (fbEventName) {
        const fbParams: any = {
          currency: currency,
          value: value,
        };

        if (rest.items && rest.items.length > 0) {
          fbParams.content_ids = rest.items.map((i: any) => i.item_id);
          fbParams.content_type = "product";
          fbParams.content_name = rest.items[0].item_name;
          fbParams.content_category = rest.items[0].item_category;
        }

        if (action === "purchase") {
          fbParams.order_id = rest.transaction_id;
        }

        (window as any).fbq("track", fbEventName, fbParams);
      }
    }
  }
};

/**
 * Track when a user views a product
 */
export const trackViewItem = (artwork: any) => {
  trackEvent({
    action: "view_item",
    currency: "BRL",
    value: (artwork.price_cents ?? 0) / 100,
    items: [
      {
        item_id: artwork.id,
        item_name: artwork.title,
        item_category: artwork.categories?.name || artwork.artwork_categories?.[0]?.categories?.name,
        price: (artwork.price_cents ?? 0) / 100,
        quantity: 1,
      },
    ],
  });
};

/**
 * Track when a user adds a product to the cart
 */
export const trackAddToCart = (artwork: any) => {
  trackEvent({
    action: "add_to_cart",
    currency: "BRL",
    value: (artwork.price_cents ?? 0) / 100,
    items: [
      {
        item_id: artwork.id,
        item_name: artwork.title,
        item_category: artwork.categories?.name || artwork.artwork_categories?.[0]?.categories?.name,
        price: (artwork.price_cents ?? 0) / 100,
        quantity: 1,
      },
    ],
  });
};

/**
 * Track when a user starts the checkout process
 */
export const trackBeginCheckout = (items: any[], totalCents: number) => {
  trackEvent({
    action: "begin_checkout",
    currency: "BRL",
    value: totalCents / 100,
    items: items.map((it) => ({
      item_id: it.artwork_id || it.id,
      item_name: it.artworks?.title || it.title,
      price: (it.artworks?.price_cents || it.price_cents || 0) / 100,
      quantity: 1,
    })),
  });
};

/**
 * Track a successful purchase
 */
export const trackPurchase = (orderId: string, items: any[], totalCents: number) => {
  trackEvent({
    action: "purchase",
    transaction_id: orderId,
    currency: "BRL",
    value: totalCents / 100,
    items: items.map((it) => ({
      item_id: it.artwork_id || it.id,
      item_name: it.artworks?.title || it.title,
      price: (it.artworks?.price_cents || it.price_cents || 0) / 100,
      quantity: 1,
    })),
  });
};
