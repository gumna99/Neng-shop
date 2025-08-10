import { Request, Response } from "express";
import { ApiResponse } from "../utils/apiResponse";
import { UserService } from "../services/UserService";
import { JwtUtil } from "../utils/jwt"

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
      const userService = new UserService();

      const newUser = await userService.createUser(req.body);

      return ApiResponse.success(
        res,
        newUser,
        "User registered successfully",
        201  // Created status code
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
      const { email, password } = req.body;

      if (!email || !password) {
        return ApiResponse.error(res, "Email and password are required");
      }

      const userService = new UserService();
      const user = await userService.validateCredentials(email, password)
      if (!user){
        return ApiResponse.error(res, "Invalid email or password");
      }

      const tokens = JwtUtil.generateTokenPair({
        id: user.id,
        email: user.email,
        role: user.role
      })

      return ApiResponse.success(
        res,
        {user,
          ...tokens
        }, 
        "Login successful"
      );
    } catch (error) {
      console.error("Login error:", error);
      return ApiResponse.error(res, "Login failed");
    }
  }
}
