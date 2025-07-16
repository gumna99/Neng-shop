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
├── config/          # 設定檔案
│   ├── database.ts  # 原生 PostgreSQL 連線配置
│   ├── typeorm.ts   # TypeORM DataSource 配置
│   └── env.ts       # 環境變數管理
├── entities/        # TypeORM 實體定義
│   └── User.entity.ts
├── repositories/    # 資料存取層
│   └── BaseRepository.ts
├── services/        # 業務邏輯層
├── controllers/     # HTTP 請求處理層
├── routes/          # API 路由定義
├── middleware/      # 中介軟體
├── utils/           # 工具函數
│   ├── password.ts  # 密碼加密工具
│   └── jwt.ts       # JWT 權杖工具
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
npm run dev:db:both      # 比較兩種連線方式

# 建構
npm run build            # 編譯 TypeScript
npm start               # 啟動生產環境服務器

# 測試
npm test                # 執行測試
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
  - JWT 權杖管理系統
  - 密碼加密和驗證工具
  - API 回應格式標準化
  - TypeScript 型別定義

- ✅ **資料模型設計**
  - User Entity 完整實作
  - 基礎 Repository 抽象類別
  - 分頁查詢機制
  - 資料驗證規則

### 開發中功能

- 🔄 **API 路由實作**
  - 使用者管理 API
  - 認證授權端點
  - 錯誤處理中介軟體

### 待開發功能

- 📋 **商品管理系統**
  - Product Entity 設計
  - 商品 CRUD API
  - 庫存管理機制
  - 搜尋和篩選功能

- 📋 **訂單處理系統**
  - Order Entity 設計
  - 訂單狀態管理
  - 購物車功能
  - 付款整合

- 📋 **權限控制系統**
  - 角色權限矩陣
  - API 存取控制
  - 資源擁有權驗證

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

**專案狀態**: 開發中 | **版本**: 1.0.0 | **最後更新**: 2025-07-16