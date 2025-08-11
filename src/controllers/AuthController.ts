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
  /**
   * 取得個人資料
   * GET /api/auth/profile
   * 需要 JWT 認證
   */
  static async getProfile(req: Request, res: Response) {
    try {
      // 1. 從 req.user 取得用戶 ID (由中介軟體注入)
      const userId = req.user?.id;
      
      if (!userId) {
        return ApiResponse.error(res, "User not found in token");
      }

      // 2. 使用 UserService 查找用戶
      const userService = new UserService()
      const user = await userService.findById(userId)

      if (!user) {
        return ApiResponse.error(res, "User not found");
      }

      // 3. 回傳用戶資料 (已經移除密碼)
      return ApiResponse.success(res, user, "Profile retrieved successfully");

    } catch (error) {
      console.error("Get profile error:", error);
      return ApiResponse.error(res, "Failed to get profile");

    }
  }
  /**
   * 更新個人資料
   * PUT /api/auth/profile
   * 需要 JWT 認證
   */
  static async updateProfile(req: Request, res: Response) {
    try {
      // 1. 從 req.user 取得用戶 ID
      const userId = req.user?.id;
      if (!userId) {
        return ApiResponse.error(res, "User not found in token");
      }
      // 2. 取得要更新的資料
      const updateData = req.body; // {email?, username?, fullName?, phone?, address? }
      // 3. 使用 UserService 更新用戶
      const userService = new UserService();
      const updatedUser = await userService.updateUser(userId, updateData)
      // 4. 回傳更新後的用戶資料
      return ApiResponse.success(res, updatedUser, "Profile updated successfully");

    } catch (error) {
      console.error("Update profile error", error);
    }
  } 
  /**
   * 修改密碼
   * PUT /api/auth/password
   * 需要 JWT 認證
   */
  static async updatePassword(req: Request, res: Response) {
    try {
      // 1. 從 req.user 取得用戶 ID
      const userId = req.user?.id;

      if (!userId) {
        return ApiResponse.error(res, "User not found in token");
      }

      // 2. 取得新密碼
      const { newPassword, currentPassword} = req.body;

      if (!newPassword) {
        return ApiResponse.error(res, "New password is required");
      }

      // 3. 驗證當前密碼 (增加安全性)
      if (currentPassword) {
        const userService = new UserService()
        const isValidCurrent = await userService.validateCredentials(
          req.user?.email!, 
          currentPassword
        )
        if (!isValidCurrent){
          return ApiResponse.error(res, "Current password is incorrect")
        }
      }
      // 4. 更新密碼
      const userService = new UserService()
      await userService.updatePassword(userId, newPassword);

      return ApiResponse.success(res, null, "Password updated successfully")
    } catch (error: any) {
      console.log("Update password error: ", error);
      return ApiResponse.error(res, "Failed to update password");
    }
  }

  /**
   * 登出功能
   * POST /api/auth/logout
   * 需要 JWT 認證
   */
  /**
  JWT 的特性：
  - 無狀態：伺服器不記住誰登入了
  - 自包含：token 包含所有必要資訊
  - 去中心化：不需要伺服器端 session

  真正的登出邏輯：
  1. 前端：刪除儲存的 token
  2. 後端：回傳成功訊息（可選）
  */
  static async logout(req: Request, res: Response) {
    try {
      // 目前的簡單實作：只回傳成功訊息
      // JWT 是無狀態的，真正的"登出"是由前端處理（刪除 token）
      return ApiResponse.success(res, null, "Logout successful");
      // const token = getTokenFromHeader(req);
      
    } catch (error) {
      console.log("Logout error:", error);
      return ApiResponse.error(res, "Logout failed");
    }
  }
}
