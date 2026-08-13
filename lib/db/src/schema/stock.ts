import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { productsTable } from "./products";
import { storesTable } from "./stores";

export const stockStatusEnum = ["in_stock", "low_stock", "out_of_stock", "reserved"] as const;

export const stockTable = pgTable("stock", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => productsTable.id),
  storeId: integer("store_id")
    .notNull()
    .references(() => storesTable.id),
  status: text("status").notNull().$type<"in_stock" | "low_stock" | "out_of_stock" | "reserved">(),
  stockQty: integer("stock_qty"),
  checkedAt: timestamp("checked_at").defaultNow().notNull(),
});

export const insertStockSchema = createInsertSchema(stockTable).omit({ id: true });
export type InsertStock = z.infer<typeof insertStockSchema>;
export type Stock = typeof stockTable.$inferSelect;
