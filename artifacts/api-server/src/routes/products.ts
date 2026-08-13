import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, productsTable, stockTable } from "@workspace/db";
import {
  ListProductsResponse,
  GetProductParams,
  GetProductResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/products", async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable).orderBy(productsTable.id);
  res.json(ListProductsResponse.parse(products));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetProductParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, params.data.id));

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  // Aggregate stock counts
  const stats = await db
    .select({
      status: stockTable.status,
      count: sql<number>`count(*)::int`,
      lastChecked: sql<string>`max(${stockTable.checkedAt})`,
    })
    .from(stockTable)
    .where(eq(stockTable.productId, product.id))
    .groupBy(stockTable.status);

  let inStockCount = 0, lowStockCount = 0, outOfStockCount = 0, reservedCount = 0;
  let lastCheckedAt: string | null = null;

  for (const row of stats) {
    if (row.status === "in_stock") inStockCount = row.count;
    else if (row.status === "low_stock") lowStockCount = row.count;
    else if (row.status === "out_of_stock") outOfStockCount = row.count;
    else if (row.status === "reserved") reservedCount = row.count;
    if (!lastCheckedAt || row.lastChecked > lastCheckedAt) lastCheckedAt = row.lastChecked;
  }

  const storeCount = inStockCount + lowStockCount + outOfStockCount + reservedCount;

  res.json(
    GetProductResponse.parse({
      ...product,
      storeCount,
      inStockCount,
      lowStockCount,
      outOfStockCount,
      reservedCount,
      lastCheckedAt,
    })
  );
});

export default router;
