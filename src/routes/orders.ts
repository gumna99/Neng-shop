import { Router } from "express";
import { OrderController } from "../controllers/OrderController";
import { AuthMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(AuthMiddleware.authenticateToken);

router.post("/", OrderController.createOrder);

router.get("/", OrderController.getOrders);

router.get("/:id", OrderController.getOrderById);

router.patch("/:id/cancel", OrderController.cancelOrder);

export default router;