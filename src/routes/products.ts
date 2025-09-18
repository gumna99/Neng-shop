import { Router } from "express";
import { ProductController } from "../controllers/ProductController";
import { AuthMiddleware } from "../middleware/auth.middleware";

const router = Router();

// 公開路由 (不需認證)
router.get('/', ProductController.getProducts);           // 商品列表
router.get('/categories', ProductController.getCategories)
router.get('/:id', ProductController.getProductById);     // 商品詳情

// 需要認證的路由
router.post('/', AuthMiddleware.authenticateToken, ProductController.createProduct);
router.put('/:id', AuthMiddleware.authenticateToken, ProductController.updateProduct);
router.delete('/:id', AuthMiddleware.authenticateToken, ProductController.deleteProduct);

export default router;