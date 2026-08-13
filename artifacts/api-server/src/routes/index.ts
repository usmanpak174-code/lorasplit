import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import storesRouter from "./stores";
import stockRouter from "./stock";
import alertsRouter from "./alerts";
import plansRouter from "./plans";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(storesRouter);
router.use(stockRouter);
router.use(alertsRouter);
router.use(plansRouter);

export default router;
