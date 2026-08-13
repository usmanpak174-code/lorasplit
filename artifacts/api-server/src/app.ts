import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import router from "./routes";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

const candidateStaticDirs = [
  path.resolve(process.cwd(), "artifacts/portasplit-alerts/dist/public"),
  path.resolve(process.cwd(), "dist/public"),
  path.resolve(__dirname, "../../portasplit-alerts/dist/public"),
  path.resolve(__dirname, "../portasplit-alerts/dist/public"),
];

const staticDir = candidateStaticDirs.find((dir) => fs.existsSync(dir)) || candidateStaticDirs[0];

app.use(express.static(staticDir));

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method !== "GET" || req.path.startsWith("/api")) return next();
  const indexPath = path.join(staticDir, "index.html");
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  next();
});

export default app;
