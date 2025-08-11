import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { AuthMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
// router.post("/refresh", AuthController.refreshToken);

// 🔒 受保護路由（需要登入才能使用）
router.get('/profile', AuthMiddleware.authenticateToken, AuthController.getProfile);
router.put('/profile', AuthMiddleware.authenticateToken, AuthController.updateProfile);
router.put('/password', AuthMiddleware.authenticateToken, AuthController.updatePassword);
router.post('/logout', AuthMiddleware.authenticateToken, AuthController.logout);

export default router;
