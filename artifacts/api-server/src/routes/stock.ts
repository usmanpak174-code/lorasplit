import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, storesTable, stockTable, alertsTable } from "@workspace/db";
import {
  GetStockMapQueryParams,
  GetStockMapResponse,
  GetStockSummaryQueryParams,
  GetStockSummaryResponse,
  ListChainsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/stock/map", async (req, res): Promise<void> => {
  const parsed = GetStockMapQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const productId = parsed.data.productId ?? 1;

  const rows = await db
    .select({
      storeId: storesTable.id,
      name: storesTable.name,
      chain: storesTable.chain,
      lat: storesTable.lat,
      lng: storesTable.lng,
      city: storesTable.city,
      status: stockTable.status,
      stockQty: stockTable.stockQty,
    })
    .from(storesTable)
    .leftJoin(
      stockTable,
      and(
        eq(stockTable.storeId, storesTable.id),
        eq(stockTable.productId, productId)
      )
    );

  res.json(
    GetStockMapResponse.parse(
      rows.map((r) => ({
        ...r,
        status: r.status ?? "out_of_stock",
      }))
    )
  );
});

router.get("/stock/summary", async (req, res): Promise<void> => {
  const parsed = GetStockSummaryQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const productId = parsed.data.productId ?? 1;

  const [totalRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(storesTable);

  const statusRows = await db
    .select({
      status: stockTable.status,
      count: sql<number>`count(*)::int`,
      lastChecked: sql<string>`max(${stockTable.checkedAt})`,
    })
    .from(stockTable)
    .where(eq(stockTable.productId, productId))
    .groupBy(stockTable.status);

  let inStockCount = 0, lowStockCount = 0, outOfStockCount = 0, reservedCount = 0;
  let lastCheckedAt: string | null = null;

  for (const row of statusRows) {
    if (row.status === "in_stock") inStockCount = row.count;
    else if (row.status === "low_stock") lowStockCount = row.count;
    else if (row.status === "out_of_stock") outOfStockCount = row.count;
    else if (row.status === "reserved") reservedCount = row.count;
    if (!lastCheckedAt || row.lastChecked > lastCheckedAt) lastCheckedAt = row.lastChecked;
  }

  const [subRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(alertsTable)
    .where(eq(alertsTable.status, "active"));

  res.json(
    GetStockSummaryResponse.parse({
      totalStores: totalRow?.count ?? 0,
      inStockCount,
      lowStockCount,
      outOfStockCount,
      reservedCount,
      lastCheckedAt,
      activeSubscribers: subRow?.count ?? 0,
    })
  );
});

router.get("/stock/chains", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      chain: storesTable.chain,
      storeCount: sql<number>`count(distinct ${storesTable.id})::int`,
      inStockCount: sql<number>`count(case when ${stockTable.status} = 'in_stock' then 1 end)::int`,
    })
    .from(storesTable)
    .leftJoin(stockTable, eq(stockTable.storeId, storesTable.id))
    .groupBy(storesTable.chain)
    .orderBy(storesTable.chain);

  res.json(
    ListChainsResponse.parse(
      rows.map((r) => ({ ...r, logoUrl: null }))
    )
  );
});

export default router;
