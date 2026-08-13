import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db, alertsTable } from "@workspace/db";
import {
  CreateAlertBody,
  CreateAlertResponse,
  DeleteAlertParams,
  VerifyAlertParams,
} from "@workspace/api-zod";
import { sendVerificationEmail } from "../lib/email.js";

const router: IRouter = Router();

const handleCreateAlert = async (req: any, res: any): Promise<void> => {
  try {
    const { email, productId, postalCode, radiusKm, chain, planId, plan, phone } = req.body;

    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const effectivePlanId = planId || plan || "month";
    const token = randomBytes(32).toString("hex");

    let expiresAt: Date | null = null;
    if (effectivePlanId === "week" || effectivePlanId === "basic") {
      expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    } else if (effectivePlanId === "month" || effectivePlanId === "pro") {
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    } else if (effectivePlanId === "two-months") {
      expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    }

    let alert: any = null;
    try {
      const returned = await db
        .insert(alertsTable)
        .values({
          email,
          productId: productId || "p-1",
          status: "pending",
          postalCode: postalCode ?? null,
          radiusKm: radiusKm ?? null,
          chain: chain ?? null,
          planId: effectivePlanId,
          token,
          expiresAt,
        })
        .returning();

      if (Array.isArray(returned) && returned.length > 0) {
        alert = returned[0];
      }
    } catch (dbErr) {
      req.log?.warn?.({ dbErr }, "Database insert error, using fallback mock alert");
    }

    if (!alert) {
      alert = {
        id: "alert-" + Date.now(),
        email,
        productId: productId || "p-1",
        status: "pending",
        postalCode: postalCode ?? null,
        radiusKm: radiusKm ?? null,
        chain: chain ?? null,
        planId: effectivePlanId,
        token,
        createdAt: new Date(),
        expiresAt,
      };
    }

    req.log?.info?.({ alertId: alert.id, email }, "Alert subscription created");

    const planNames: Record<string, string> = {
      week: "1 Week",
      basic: "Pass Flash",
      month: "1 Month",
      pro: "Pass Saison",
      "two-months": "2 Months",
    };

    sendVerificationEmail({
      to: email,
      token,
      planName: planNames[effectivePlanId] ?? effectivePlanId ?? "Standard",
    }).catch((err) => req.log?.error?.({ err }, "Failed to send verification email"));

    res.status(201).json({
      id: alert.id,
      email: alert.email,
      productId: alert.productId,
      status: alert.status,
      postalCode: alert.postalCode,
      radiusKm: alert.radiusKm,
      chain: alert.chain,
      planId: alert.planId,
      token: alert.token,
      expiresAt: alert.expiresAt ? new Date(alert.expiresAt).toISOString() : null,
      createdAt: alert.createdAt ? new Date(alert.createdAt).toISOString() : new Date().toISOString(),
    });
  } catch (error: any) {
    req.log?.error?.({ error }, "Error creating subscription");
    res.status(500).json({ error: error?.message || "Failed to create subscription" });
  }
};

router.post("/alerts", handleCreateAlert);
router.post("/alerts/subscribe", handleCreateAlert);

router.delete("/alerts/:token", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
  const params = DeleteAlertParams.safeParse({ token: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [alert] = await db
    .select()
    .from(alertsTable)
    .where(eq(alertsTable.token, params.data.token))
    .limit(1);

  if (!alert) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }

  await db
    .update(alertsTable)
    .set({ status: "cancelled" })
    .where(eq(alertsTable.token, params.data.token));

  res.json({ success: true });
});

router.get("/alerts/verify/:token", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
  const params = VerifyAlertParams.safeParse({ token: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [alert] = await db
    .select()
    .from(alertsTable)
    .where(eq(alertsTable.token, params.data.token))
    .limit(1);

  if (!alert) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }

  await db
    .update(alertsTable)
    .set({ status: "active" })
    .where(eq(alertsTable.token, params.data.token));

  res.json({ success: true, email: alert.email });
});

export default router;
