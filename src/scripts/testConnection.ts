import { testConnection, closeDatabase } from "../config/database";
import { validateEnv } from "../config/env";

// 這個腳本的目的是測試我們的基礎設施是否正常
const runTest = async () => {
  console.log("🔍 開始測試基礎設施...\n");

  try {
    console.log("1️⃣ 檢查環境變數...");
    validateEnv();

    console.log("\n2️⃣ 測試資料庫連線...");
    await testConnection();

    console.log("\n🎉 所有測試都通過了！你的基礎設施已經準備就緒。");
    
  } catch (error) {
    console.error("\n💥 測試失敗：", error);
    process.exit(1);
  } finally {
    // 無論成功或失敗，都要關閉資料庫連線
    await closeDatabase();
  }
};

runTest();
