import { Router } from "express";
import { CartController } from "../controllers/CartController";
import { AuthMiddleware } from "../middleware/auth.middleware";

const router = Router();

// 所有購物車路由都需要認證
router.use(AuthMiddleware.authenticateToken);
router.get('/', CartController.getCart);
router.post('/items', CartController.addItemToCart);
router.put('/items/:cartItemId', CartController.updateItemQuantity);
router.delete('/items/:cartItemId', CartController.removeItem);
router.delete('/', CartController.clearCart);

export default router;