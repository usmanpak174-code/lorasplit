/**
 * Polar.sh checkout integration
 * Polar Product IDs for PortaSplit Alerts
 */

const POLAR_PRODUCT_ID = "197b7170-185b-4fa9-89e1-659fd5828502";
const POLAR_API = "https://api.polar.sh";

export interface CreateCheckoutResult {
  url: string;
  id: string;
}

const POLAR_PRODUCT_MAP: Record<string, string> = {
  week: "197b7170-185b-4fa9-89e1-659fd5828502",
  plan_1week: "197b7170-185b-4fa9-89e1-659fd5828502",
  basic: "197b7170-185b-4fa9-89e1-659fd5828502",
  month: "a076954a-18cc-4063-99b6-b5694a52807d",
  plan_1month: "a076954a-18cc-4063-99b6-b5694a52807d",
  pro: "a076954a-18cc-4063-99b6-b5694a52807d",
  "two-months": "aec4bb6f-a89b-4a32-8065-cb5041c4bccd",
  plan_2months: "aec4bb6f-a89b-4a32-8065-cb5041c4bccd",
};

export async function createPolarCheckout(opts: {
  email: string;
  planId: string;
  priceId?: string;
  metadata?: Record<string, string>;
}): Promise<CreateCheckoutResult> {
  const APP_URL = process.env.APP_URL || "https://alerteportasplit.vercel.app";
  const SUCCESS_URL = `${APP_URL}/?paid=true`;
  const POLAR_ACCESS_TOKEN = process.env.POLAR_ACCESS_TOKEN;

  const productOrPriceId =
    opts.priceId || POLAR_PRODUCT_MAP[opts.planId] || POLAR_PRODUCT_ID;

  // If POLAR_ACCESS_TOKEN is provided, use Polar API
  if (POLAR_ACCESS_TOKEN) {
    try {
      const body: Record<string, unknown> = {
        product_price_id: productOrPriceId,
        customer_email: opts.email,
        success_url: SUCCESS_URL,
        metadata: {
          planId: opts.planId,
          ...(opts.metadata ?? {}),
        },
      };

      const res = await fetch(`${POLAR_API}/v1/checkouts/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${POLAR_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = (await res.json()) as { url: string; id: string };
        if (data.url) {
          return { url: data.url, id: data.id || "polar-" + Date.now() };
        }
      }
    } catch (e) {
      console.error("Polar API error, falling back to direct checkout link:", e);
    }
  }

  // Custom Polar checkout URL if provided in env
  if (process.env.POLAR_CHECKOUT_URL) {
    const customUrl = new URL(process.env.POLAR_CHECKOUT_URL);
    if (opts.email) customUrl.searchParams.set("customer_email", opts.email);
    return { url: customUrl.toString(), id: "polar-env-" + Date.now() };
  }

  // Direct Polar product checkout link fallback
  const directCheckoutUrl = `https://buy.polar.sh/${productOrPriceId}?customer_email=${encodeURIComponent(
    opts.email
  )}`;

  return { url: directCheckoutUrl, id: "polar-direct-" + Date.now() };
}

