
import { UserRole } from '../entities/User.entity';

// 建立使用者時的輸入資料
export interface CreateUserInput {
  email: string;
  password: string;
  username: string;
  fullName?: string;
  role?: UserRole;
  phone?: string;
  address?: string;
}

// 更新使用者時的輸入資料
export interface UpdateUserInput {
  email?: string;
  username?: string;
  fullName?: string;
  avatarUrl?: string;
  phone?: string;
  address?: string;
  isDeleted?: boolean;
}

// 回傳給前端的使用者資料（不包含密碼）
export interface UserResponse {
  id: number;
  email: string;
  username: string;
  fullname: string | null;
  role: UserRole;
  isVerified: boolean;
  phone: string | null;
  address: string | null;

}

// 登入請求資料
export interface LoginInput {
  email: string;
  password: string;
}

// 登入成功回應
export interface LoginResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

// JWT 權杖中的資料
export interface JwtPayload {
  id: number;
  email: string;
  role: UserRole;
  iat?: number;  // issued at
  exp?: number;  // expires at
}

// 使用者列表查詢參數
export interface UserListQuery {
  page?: number;
  limit?: number;
  role?: UserRole;
  search?: string;  // 搜尋 email 或 username
  isActive?: boolean;
}