import { Request, Response } from "express";
import { ApiResponse } from "../utils/apiResponse";

export class AuthController {
  /**
   * 使用者註冊
   * POST /api/v1/auth/register
   */
  static async register(req: Request, res: Response) {
    try {
      // 1. 驗證輸入資料
      // 2. 檢查使用者是否已存在
      // 3. 建立新使用者
      // 4. 回傳成功訊息
      console.log("Register request body:", req.body);

      return ApiResponse.success(
        res,
        { message: "Register endpoint is ready" },
        "Registration endpoint works!"
      );
    } catch (error) {
      console.error("Register error:", error);
      return ApiResponse.error(res, "Registration failed");
    }
  }
  /**
   * 使用者登入
   * POST /api/v1/auth/login
   */
  static async login(req: Request, res: Response) {
    try {
      // 1. 驗證輸入資料 (email, password)
      // 2. 查找使用者
      // 3. 驗證密碼
      // 4. 生成 JWT token
      // 5. 回傳 token 和使用者資訊
      console.log("Login request body:", req.body);

      return ApiResponse.success(
        res,
        { message: "Login endpoint is ready" },
        "Login endpoint works!"
      );
    } catch (error) {
      console.error("Login error:", error);
      return ApiResponse.error(res, "Login failed");
    }
  }
}
