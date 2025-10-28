import { Router } from "express";
import { SellerController } from "../controllers/SellerController";
import { AuthMiddleware } from "../middleware/auth.middleware";

const router = Router();


// 所有賣家路由都需要認證 + 賣家權限
router.use(AuthMiddleware.authenticateToken);
router.use(AuthMiddleware.requireSeller);

// 賣家訂單管理
router.get("/orders", SellerController.getOrders);
router.put("/orders/:id/status", SellerController.updateOrderStatus);
router.post("/orders/:id/ship", SellerController.shipOrder);

// 賣家商品管理
// router.get("/analytics/sales", SellerController.getSalesAnalytics);
router.get("/products", SellerController.getMyProducts);
router.put("/products/:id/status", SellerController.updateProductStatus)
router.put("/products/:id", SellerController.updateProduct)

export default router;
