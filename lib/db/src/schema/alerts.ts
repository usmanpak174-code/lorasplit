import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { productsTable } from "./products";

export const alertsTable = pgTable("alerts", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  productId: integer("product_id")
    .notNull()
    .references(() => productsTable.id),
  status: text("status").notNull().$type<"pending" | "active" | "cancelled">().default("pending"),
  postalCode: text("postal_code"),
  radiusKm: integer("radius_km"),
  chain: text("chain"),
  planId: text("plan_id"),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAlertSchema = createInsertSchema(alertsTable).omit({ id: true, createdAt: true });
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alertsTable.$inferSelect;
