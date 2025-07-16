import { Router } from "express";
import { AuthController } from "../controllers/AuthController";

const router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
// router.post("/refresh", AuthController.refreshToken);

// 🔒 受保護路由（需要登入才能使用）
// 注意：這些路由暫時註解掉，等我們建立認證中介軟體後再開啟
// router.get('/profile', authenticateToken, AuthController.getProfile);
// router.put('/profile', authenticateToken, AuthController.updateProfile);
// router.post('/logout', authenticateToken, AuthController.logout);

export default router;
