import dotenv from "dotenv";
import path from "path";

// 載入環境變數
dotenv.config({ path: path.join(__dirname, ".env") });

// 定義必要的環境變數
// 這就像是檢查清單，確保所有重要的設定都有
const requiredEnvVars = [
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
  "JWT_SECRET",
  "PORT",
];

// 驗證環境變數的函數
export const validateEnv = (): void => {
  const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missing.length > 0) {
    console.log("❌ ", missing.join(", "));
    console.error("請檢查你的 config/.env 檔案");
    process.exit(1);
  }
  console.log("✅ 環境變數驗證通過");
};

// 導出設定物件，讓其他檔案可以輕鬆使用
export const config = {
  database: {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT!),
    name: process.env.DB_NAME!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
  },
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  },
  app: {
    port: parseInt(process.env.PORT || "3000"),
    nodeEnv: process.env.NODE_ENV || "development",
  },
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || "12"),
  },
};
