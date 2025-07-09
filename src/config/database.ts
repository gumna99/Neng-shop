import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, ".env") });
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  // 連線池設定 - 這些數字是根據一般中小型應用調整的
  max: 20, // 最大連線數：同時最多20個連線
  idleTimeoutMillis: 30000, // 閒置連線30秒後關閉
  connectionTimeoutMillis: 2000, // 連線超時時間2秒
});

// 測試連線
export const testConnection = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    console.log("✅ 資料庫連線成功！");

    //
    const result = await client.query("SELECT NOW()");
    console.log("📅 資料庫時間：", result.rows[0].now);

    client.release(); // 記得釋放連線回池子裡
  } catch (error) {
    console.log("❌ 資料庫連線失敗：", error);
    throw error;
  }
};

export const closeDatabase = async (): Promise<void> => {
  await pool.end();
  console.log("🔌 資料庫連線池已關閉");
};

export default pool;
