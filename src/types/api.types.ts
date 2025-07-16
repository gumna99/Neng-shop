// API 統一回應格式定義
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string | ApiError;
  timestamp: string;
  path?: string;
}

// 分頁回應格式
export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// 錯誤類型定義
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  field?: string; // 用於表單驗證錯誤
}

// HTTP 狀態碼常數
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// 錯誤碼定義
export const ERROR_CODES = {
  // 認證相關
  INVALD_CREDENTIALS: "INVELID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",

  // 使用者相關
  USER_NOT_FOUND: "USER_NOT_FOUND",
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
  USERNAME_ALREADY_EXISTS: "USERNAME_ALREADY_EXISTS",
  WEAK_PASSWORD: "WEAK_PASSWORD",

  // 商品相關
  PRODUCT_NOT_FOUND: "PRODUCT_NOT_FOUND",
  INSUFFICIENT_STOCK: "INSUFFICIENT_STOCK",

  // 一般錯誤
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  NOT_FOUND: "NOT_FOUND",
};
