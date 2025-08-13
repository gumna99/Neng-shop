import { Request, Response, NextFunction } from "express";
import { JwtUtil } from "../utils/jwt";
import { ApiResponse } from "../utils/apiResponse";
import { JwtPayload } from "../types/user.types";

// 擴展 Express Request 接口，加入用戶資訊
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export class AuthMiddleware {
  /**
   * JWT 驗證中介軟體
   * 驗證 Authorization header 中的 Bearer token
   */
  static authenticateToken(req: Request, res: Response, next: NextFunction) {
    // 1. 從 header 取得 token
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // "Bearer TOKEN"

    if (!token) {
      return ApiResponse.error(res, "Access token required");
    }
    try {
      // 2. 驗證 token
      const decoded = JwtUtil.verifyAccessToken(token);
      // 3. 將用戶資訊注入到 request 中
      req.user = decoded;
      // 4. 繼續下一個中介軟體
      next();
    } catch (error: any) {
      console.error("Token verification error:", error.message);
      // 處理不同類型的 token 錯誤
      if (error.message === "TOKEN_EXPIRED") {
        return ApiResponse.error(res, "Token expired");
      }
      if (error.message === "TOKEN_INVALID") {
        return ApiResponse.error(res, "Invalid token");
      }

      return ApiResponse.error(res, "Token verification failed");
    }
  }

  /**
   * 角色權限檢查中介軟體
   * 檢查用戶是否具有指定角色
   */
  static requireRole(roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      // 確保已經通過 authenticateToken
      if (!req.user) {
        return ApiResponse.error(res, "Authentication required");
      }

      // 檢查用戶角色
      if (!roles.includes(req.user.role)) {
        return ApiResponse.error(res, "Insufficient permissions");
      }

      next();
    };
  }

  /**
   * 檢查是否為管理員
   */
  static requireAdmin(req: Request, res: Response, next: NextFunction) {
    return AuthMiddleware.requireRole(["admin"])(req, res, next);
  }
  /**
   * 檢查是否為賣家或管理員
   */
  static requireSeller(req: Request, res: Response, next: NextFunction) {
    return AuthMiddleware.requireRole(["seller", "admin"])(req, res, next);
  }
  /**
   * 可選的認證中介軟體
   * 如果有 token 就驗證，沒有也不會報錯
   */
  static optionalAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      // 沒有 token 也繼續執行
      return next();
    }

    try {
      const decoded = JwtUtil.verifyAccessToken(token);
      req.user = decoded;
    } catch (error) {
      // 有 token 但無效，不阻止請求繼續
      console.warn("Optional auth failed:", error);
    }

    next();
  }
}

// const authHeader = req.headers.authorization;
