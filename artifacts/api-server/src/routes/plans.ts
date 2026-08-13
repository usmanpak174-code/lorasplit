import { Router, type IRouter } from "express";
import {
  ListPlansResponse,
  CreateCheckoutBody,
  CreateCheckoutResponse,
} from "@workspace/api-zod";
import { createPolarCheckout } from "../lib/polar.js";

const router: IRouter = Router();

const PLANS = [
  {
    id: "week",
    name: "1 Week",
    durationDays: 7,
    priceEur: 4.90,
    checkIntervalSeconds: 15,
    features: [
      "Alerts every 15 seconds",
      "All 11+ retail chains",
      "Email notification",
      "Location-based filtering",
    ],
    popular: false,
    polarProductId: "197b7170-185b-4fa9-89e1-659fd5828502",
    polarPriceId: "197b7170-185b-4fa9-89e1-659fd5828502",
  },
  {
    id: "month",
    name: "1 Month",
    durationDays: 30,
    priceEur: 9.90,
    checkIntervalSeconds: 15,
    features: [
      "Alerts every 15 seconds",
      "All 11+ retail chains",
      "Email notification",
      "Location-based filtering",
      "Reserved stock visibility",
    ],
    popular: true,
    polarProductId: "a076954a-18cc-4063-99b6-b5694a52807d",
    polarPriceId: "a076954a-18cc-4063-99b6-b5694a52807d",
  },
  {
    id: "two-months",
    name: "2 Months",
    durationDays: 60,
    priceEur: 14.90,
    checkIntervalSeconds: 15,
    features: [
      "Alerts every 15 seconds",
      "All 11+ retail chains",
      "Email notification",
      "Location-based filtering",
      "Reserved stock visibility",
      "Priority alerts",
    ],
    popular: false,
    polarProductId: "aec4bb6f-a89b-4a32-8065-cb5041c4bccd",
    polarPriceId: "aec4bb6f-a89b-4a32-8065-cb5041c4bccd",
  },
];

router.get("/plans", async (_req, res): Promise<void> => {
  res.json(ListPlansResponse.parse(PLANS));
});

router.post("/checkout", async (req, res): Promise<void> => {
  const { email, planId } = req.body || {};

  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  const requestedPlanId = planId || "month";
  const plan =
    PLANS.find(
      (p) =>
        p.id === requestedPlanId ||
        `plan_${p.id}` === requestedPlanId ||
        p.polarProductId === requestedPlanId
    ) || PLANS[1];

  try {
    const checkout = await createPolarCheckout({
      email,
      planId: plan.id,
      priceId: plan.polarPriceId,
      metadata: { planName: plan.name, priceEur: String(plan.priceEur) },
    });
    res.json({ checkoutUrl: checkout.url });
  } catch (err: any) {
    req.log?.error?.({ err }, "Polar.sh checkout failed");
    res.status(500).json({ error: err?.message || "Checkout unavailable" });
  }
});

export default router;
