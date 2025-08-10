# Neng Shop 電商會員系統

一個基於 Node.js + TypeScript + PostgreSQL 的現代化電商會員系統，支援原生 SQL 和 TypeORM 雙軌開發架構。

## 🎯 專案概述

Neng Shop 是一個完整的電商會員系統，具備使用者管理、商品管理、訂單處理等核心功能。專案採用雙軌技術架構，同時支援原生 SQL 和 TypeORM，適合學習和理解不同資料存取方式的優缺點。

### 核心功能

- **使用者系統**：註冊、登入、權限管理（買家、賣家、管理員）
- **商品系統**：商品 CRUD、庫存管理、搜尋功能
- **訂單系統**：訂單建立、狀態管理、歷史記錄
- **認證系統**：JWT 權杖、密碼加密、OAuth 整合
- **權限控制**：基於角色的存取控制（RBAC）

## 🛠️ 技術架構

### 後端技術棧

- **框架**: Express.js + TypeScript
- **資料庫**: PostgreSQL (Docker 容器化)
- **ORM**: TypeORM + 原生 SQL (雙軌並行)
- **認證**: JWT + bcrypt
- **驗證**: Joi + class-validator
- **開發工具**: nodemon、ts-node、Docker Compose

### 專案結構

```
src/
├── app.ts           # Express 應用程式主檔案
├── index.ts         # 應用程式入口點
├── config/          # 設定檔案
│   ├── database.ts  # 原生 PostgreSQL 連線配置
│   ├── typeorm.ts   # TypeORM DataSource 配置
│   └── env.ts       # 環境變數管理
├── entities/        # TypeORM 實體定義
│   └── User.entity.ts
├── models/          # 資料模型定義
├── repositories/    # 資料存取層
│   └── BaseRepository.ts
├── services/        # 業務邏輯層
├── controllers/     # HTTP 請求處理層
│   └── AuthController.ts
├── routes/          # API 路由定義
│   ├── auth.ts      # 認證相關路由
│   └── index.ts     # 路由入口檔案
├── middleware/      # 中介軟體
├── utils/           # 工具函數
│   ├── password.ts  # 密碼加密工具
│   ├── jwt.ts       # JWT 權杖工具
│   └── apiResponse.ts # API 回應格式化工具
├── types/           # TypeScript 型別定義
│   ├── api.types.ts # API 回應格式
│   └── user.types.ts # 使用者相關型別
└── scripts/         # 開發輔助腳本
    └── testBothConnections.ts
```

## 🚀 快速開始

### 環境要求

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+

### 安裝步驟

1. **克隆專案**
```bash
git clone <repository-url>
cd Neng-shop
```

2. **安裝依賴**
```bash
npm install
```

3. **環境配置**
```bash
# 在 src/config/ 目錄下創建 .env 檔案
DB_HOST=localhost
DB_PORT=5432
DB_NAME=neng_shop
DB_USER=myusername
DB_PASSWORD=mypassword
JWT_SECRET=your-jwt-secret-key
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=3000
BCRYPT_ROUNDS=12
```

4. **啟動資料庫**
```bash
docker-compose up -d
```

5. **測試連線**
```bash
# 測試原生 SQL 和 TypeORM 連線
npm run dev:db
```

6. **啟動開發服務器**
```bash
npm run dev
```

## 📝 可用指令

```bash
# 開發模式
npm run dev              # 啟動開發服務器
npm run dev:db           # 測試資料庫連線
npm run dev:db:typeorm   # 測試 TypeORM 連線

# 建構
npm run build            # 編譯 TypeScript
npm start               # 啟動生產環境服務器

# 測試 (尚未實作)
# npm test               # 執行測試 (待實作)
```

## 🔧 開發特色

### 雙軌技術架構

本專案採用**雙軌並行**的開發方式：

1. **原生 SQL 層** (`src/config/database.ts`)
   - 使用 `pg` 套件直接連線 PostgreSQL
   - 適合學習 SQL 語句和資料庫操作
   - 提供完整的控制權和效能優化

2. **TypeORM 層** (`src/config/typeorm.ts`)
   - 使用 TypeORM 提供的 Entity 和 Repository
   - 支援裝飾器語法和關聯關係
   - 提供 Migration 和 Schema 同步功能

### 安全性設計

- **密碼安全**: 使用 bcrypt 進行密碼雜湊 (12 rounds)
- **JWT 認證**: 雙權杖系統 (Access + Refresh Token)
- **資料驗證**: Joi 和 class-validator 雙重驗證
- **環境變數**: 敏感資訊全部使用環境變數管理

### 型別安全

- **完整的 TypeScript 支援**: 嚴格模式啟用
- **自定義型別**: 為 API、使用者、資料庫操作定義明確型別
- **裝飾器支援**: 啟用 `experimentalDecorators` 和 `emitDecoratorMetadata`

## 🗃️ 資料庫設計

### 使用者實體 (User Entity)

```typescript
@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ unique: true })
  username: string;

  @Column({ type: 'enum', enum: ['buyer', 'seller', 'admin'], default: 'buyer' })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  // OAuth 支援
  @Column({ nullable: true })
  googleId: string;

  @Column({ default: false })
  isOAuthUser: boolean;

  // 時間戳記
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 資料庫管理

```bash
# 啟動 PostgreSQL 和 pgAdmin
docker-compose up -d

# 資料庫連線測試
npm run dev:db

# 查看資料庫管理介面
# pgAdmin: http://localhost:8080
# Email: admin@example.com
# Password: admin123
```

## 🔒 認證與授權

### JWT 權杖系統

```typescript
// 生成權杖對
const tokens = JwtUtil.generateTokenPair(user);

// 驗證 Access Token
const payload = JwtUtil.verifyAccessToken(token);

// 驗證 Refresh Token
const refreshPayload = JwtUtil.verifyRefreshToken(refreshToken);
```

### 密碼管理

```typescript
// 密碼加密
const hashedPassword = await PasswordUtils.hash(password);

// 密碼驗證
const isValid = await PasswordUtils.compare(password, hashedPassword);

// 密碼強度檢查
const validation = PasswordUtils.validateStrength(password);
```

## 📡 API 端點文檔

### 認證相關 API

#### ✅ 已實作端點

**用戶註冊**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "username": "johndoe",
  "fullName": "John Doe",
  "role": "buyer"
}
```

**用戶登入**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**回應格式**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "johndoe",
      "role": "buyer"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": "15m"
  },
  "timestamp": "2025-08-10T10:30:00.000Z"
}
```

#### 🔄 開發中端點

- `GET /api/auth/profile` - 取得個人資料 (需要 JWT)
- `PUT /api/auth/profile` - 更新個人資料 (需要 JWT)
- `PUT /api/auth/password` - 修改密碼 (需要 JWT)
- `POST /api/auth/logout` - 登出 (需要 JWT)
- `POST /api/auth/refresh` - 更新權杖

## 🎨 API 設計

### 統一回應格式

```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
  path?: string;
}
```

### 錯誤處理

```typescript
// 錯誤碼定義
export const ERROR_CODES = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
  // ...
};
```

## 📊 開發進度

### 已完成功能

- ✅ **基礎設施建置**
  - Express + TypeScript 專案架構
  - Docker PostgreSQL 環境
  - 雙軌資料庫連線設定
  - 環境變數管理系統

- ✅ **核心工具開發**
  - JWT 權杖管理系統 (Access + Refresh Token)
  - 密碼加密和驗證工具 (bcrypt + 12 rounds)
  - API 回應格式標準化
  - TypeScript 型別定義 (使用者、API、JWT)

- ✅ **資料模型設計**
  - User Entity 完整實作 (軟刪除、角色系統、OAuth 支援)
  - UserService 完整 CRUD 功能
  - 基礎 Repository 抽象類別
  - 資料驗證規則 (Joi + class-validator)

- ✅ **認證系統 (80% 完成)**
  - 使用者註冊 API (POST /api/auth/register)
  - 使用者登入 API (POST /api/auth/login)
  - JWT 權杖生成和驗證
  - 密碼強度驗證和加密

### 開發中功能

- 🔄 **JWT 中介軟體 (90% 完成)**
  - JWT 權杖驗證中介軟體
  - 角色權限檢查 (buyer/seller/admin)
  - 資源擁有權驗證
  - Express Request 擴展 (支援 req.user)

### 待開發功能

- 📋 **受保護的 API 端點 (第 3 週剩餘任務)**
  - 個人資料 API (GET/PUT /api/auth/profile)
  - 修改密碼 API (PUT /api/auth/password)
  - 登出功能 (POST /api/auth/logout)
  - Refresh Token API (POST /api/auth/refresh)
  - Google OAuth 整合

- 📋 **商品管理系統 (第 4 週)**
  - Product Entity 設計
  - 商品 CRUD API
  - 庫存管理機制
  - 搜尋和篩選功能

- 📋 **購物車系統 (第 5 週)**
  - Cart Entity 設計
  - 購物車 CRUD API
  - 庫存檢查機制
  - 價格變動處理

- 📋 **訂單處理系統 (第 6 週)**
  - Order Entity 設計
  - 訂單狀態管理
  - 結帳流程
  - 交易原子性保證

## 🤝 貢獻指南

### 開發規範

1. **程式碼風格**: 遵循 TypeScript 嚴格模式
2. **提交訊息**: 使用 `feat:`, `fix:`, `docs:` 等前綴
3. **分支策略**: 功能分支 → 開發分支 → 主分支
4. **測試要求**: 新功能必須包含相應測試

### 本地開發

```bash
# 確保資料庫運行
docker-compose up -d

# 測試連線
npm run dev:db

# 啟動開發模式
npm run dev

# 編譯檢查
npm run build
```

## 📚 學習資源

### 推薦閱讀

- [TypeORM 官方文檔](https://typeorm.io/)
- [Express.js 最佳實務](https://expressjs.com/en/advanced/best-practice-security.html)
- [JWT 最佳實務](https://tools.ietf.org/html/rfc7519)
- [PostgreSQL 官方文檔](https://www.postgresql.org/docs/)

### 技術對比學習

本專案特別適合學習：
- 原生 SQL vs ORM 的差異
- 不同資料存取模式的優缺點
- 企業級 Node.js 應用架構
- 現代 TypeScript 開發實務

## 📄 授權

本專案採用 MIT 授權條款。

## 🐛 問題回報

如果您發現任何問題，請在 GitHub Issues 中回報。

---

**專案狀態**: 穩定開發中 | **版本**: 0.3.0 | **最後更新**: 2025-08-10

**目前進度**: 第 3 週 - 認證系統 (80% 完成) | **下一里程碑**: JWT 中介軟體完成