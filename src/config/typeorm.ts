import { DataSource } from "typeorm";
import { config } from "./env";

// TypeORM 的 DataSource 配置
// 這相當於原生 SQL 中的連線池設定
export const AppDataSource = new DataSource({
  type: "postgres",
  host: config.database.host,
  port: config.database.port,
  username: config.database.user,
  password: config.database.password,
  database: config.database.name,

  // 開發環境設定
  synchronize: config.app.nodeEnv === "development", // 自動同步 schema（僅開發用）
  logging: config.app.nodeEnv === "development", // 顯示 SQL 查詢日誌

  // Entity 和 Migration 路徑
  entities: ["src/entities/**/*.ts"], // Entity 檔案位置
  migrations: ["src/migrations/**/*.ts"], // Migration 檔案位置
  subscribers: ["src/subscribers/**/*.ts"], // Event subscribers

  // 連線池設定
  extra: {
    max: 20, // 最大連線數
    idleTimeoutMillis: 30000, // 閒置超時
    connectionTimeoutMillis: 2000, // 連線超時
  },
});

// 初始化 TypeORM 連線的函數
export const initializeTypeORM = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log("✅ TypeORM 資料庫連線成功！");
  } catch (error) {
    console.error("❌ TypeORM 資料庫連線失敗：", error);
    throw error;
  }
};

// 關閉 TypeORM 連線的函數
export const closeTypeORM = async (): Promise<void> => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log('🔌 TypeORM 連線已關閉');
  }
};
