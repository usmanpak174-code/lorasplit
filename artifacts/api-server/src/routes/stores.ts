import { Router, type IRouter } from "express";
import { eq, and, or, sql } from "drizzle-orm";
import { db, storesTable, stockTable } from "@workspace/db";
import {
  ListStoresQueryParams,
  ListStoresResponse,
  GetStoreParams,
  GetStoreResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/stores", async (req, res): Promise<void> => {
  const parsed = ListStoresQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { productId, chain, status, postalCode, radiusKm } = parsed.data;

  // Join stores with latest stock status
  const rows = await db
    .select({
      id: storesTable.id,
      name: storesTable.name,
      chain: storesTable.chain,
      address: storesTable.address,
      city: storesTable.city,
      postalCode: storesTable.postalCode,
      lat: storesTable.lat,
      lng: storesTable.lng,
      url: storesTable.url,
      stockStatus: stockTable.status,
      stockQty: stockTable.stockQty,
      lastCheckedAt: sql<string>`max(${stockTable.checkedAt})`,
      productId: stockTable.productId,
    })
    .from(storesTable)
    .leftJoin(
      stockTable,
      and(
        eq(stockTable.storeId, storesTable.id),
        productId ? eq(stockTable.productId, productId) : sql`true`
      )
    )
    .groupBy(
      storesTable.id,
      storesTable.name,
      storesTable.chain,
      storesTable.address,
      storesTable.city,
      storesTable.postalCode,
      storesTable.lat,
      storesTable.lng,
      storesTable.url,
      stockTable.status,
      stockTable.stockQty,
      stockTable.productId
    )
    .orderBy(storesTable.chain, storesTable.city);

  let filtered = rows;

  if (chain) {
    filtered = filtered.filter((r) => r.chain === chain);
  }
  if (status) {
    filtered = filtered.filter((r) => r.stockStatus === status);
  }

  // Simple postal code proximity filter (same department = first 2 digits match)
  if (postalCode && postalCode.length >= 2) {
    const dept = postalCode.substring(0, 2);
    if (radiusKm && radiusKm <= 25) {
      // Strict: same postal code prefix
      filtered = filtered.filter((r) => r.postalCode.startsWith(dept));
    } else {
      // Wider: adjacent departments (simplified)
      filtered = filtered.filter((r) => r.postalCode.substring(0, 2) === dept);
    }
  }

  res.json(
    ListStoresResponse.parse(
      filtered.map((r) => ({
        ...r,
        stockStatus: r.stockStatus ?? "out_of_stock",
        lastCheckedAt: r.lastCheckedAt ?? null,
      }))
    )
  );
});

router.get("/stores/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetStoreParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({
      id: storesTable.id,
      name: storesTable.name,
      chain: storesTable.chain,
      address: storesTable.address,
      city: storesTable.city,
      postalCode: storesTable.postalCode,
      lat: storesTable.lat,
      lng: storesTable.lng,
      url: storesTable.url,
      stockStatus: stockTable.status,
      stockQty: stockTable.stockQty,
      lastCheckedAt: sql<string>`${stockTable.checkedAt}`,
      productId: stockTable.productId,
    })
    .from(storesTable)
    .leftJoin(stockTable, eq(stockTable.storeId, storesTable.id))
    .where(eq(storesTable.id, params.data.id))
    .limit(1);

  if (!row) {
    res.status(404).json({ error: "Store not found" });
    return;
  }

  res.json(
    GetStoreResponse.parse({
      ...row,
      stockStatus: row.stockStatus ?? "out_of_stock",
      lastCheckedAt: row.lastCheckedAt ?? null,
    })
  );
});

export default router;
