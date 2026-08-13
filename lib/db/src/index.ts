import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

let pool: pg.Pool;
let db: any;

if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    pool.on("error", (err) => {
      console.warn("[AI Studio] Database pool error:", err.message);
    });
    db = drizzle(pool, { schema });
  } catch (err) {
    console.warn("[AI Studio] Database initialization error:", err);
  }
}

if (!db) {
  console.warn("[AI Studio] DATABASE_URL not set or invalid — using mock database proxy");
  pool = new Pool({ connectionString: "postgres://mock:mock@localhost:5432/mock" });
  pool.on("error", () => {});

  const emptyAsync = async () => [];
  const noOpObj = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d: any) => d?.data ?? {},
    update: async (d: any) => d?.data ?? {},
    delete: async () => ({}),
  };

  db = new Proxy({}, {
    get: (_, prop) => {
      if (prop === "select" || prop === "insert" || prop === "update" || prop === "delete") {
        const chain: any = () => chain;
        chain.from = () => chain;
        chain.where = () => chain;
        chain.leftJoin = () => chain;
        chain.rightJoin = () => chain;
        chain.innerJoin = () => chain;
        chain.groupBy = () => chain;
        chain.orderBy = () => chain;
        chain.limit = () => chain;
        chain.offset = () => chain;
        chain.returning = () => Promise.resolve([]);
        chain.values = () => chain;
        chain.set = () => chain;
        chain.then = (resolve: any) => Promise.resolve([]).then(resolve);
        chain.catch = (reject: any) => Promise.resolve([]).catch(reject);
        return chain;
      }
      if (prop === "query") {
        return new Proxy({}, { get: () => noOpObj });
      }
      return emptyAsync;
    },
  });
}

export { pool, db };
export * from "./schema";
