import { testConnection as testPgConnection, closeDatabase } from "../config/database";
import { initializeTypeORM, closeTypeORM, AppDataSource } from "../config/typeorm"
import { validateEnv } from "../config/env";

// 這個腳本的目的是測試我們的基礎設施是否正常
const runBothTests = async () => {
  console.log("🔍 開始測試基礎設施...\n");

  try {
    console.log("1️⃣ 檢查環境變數...");
    validateEnv();

    console.log("\n2️⃣ 測試資料庫連線...");
    await testPgConnection();

    console.log('\n3️⃣ 測試 TypeORM 連線...');
    await initializeTypeORM();

    console.log('\n4️⃣ 比較兩種連線方式...');
    await compareConnections();

    console.log("\n🎉 所有測試都通過了！你的基礎設施已經準備就緒。");

  } catch (error) {
    console.error("\n💥 測試失敗：", error);
    process.exit(1);
  } finally {
    // 無論成功或失敗，都要關閉資料庫連線
    await closeDatabase();
  }
};

// 比較兩種連線方式的功能
const compareConnections = async () => {
  try {

    const { Pool } = await import ('pg');
    const { config } = await import('../config/env');

    const pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
    });
    const pgResult = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('📊 原生 SQL 查詢結果：');
    console.log('   時間：', pgResult.rows[0].current_time);
    console.log('   版本：', pgResult.rows[0].pg_version.split(' ')[0] + ' ' + pgResult.rows[0].pg_version.split(' ')[1]);
    
    await pool.end();
    
    // TypeORM 方式：使用 QueryBuilder
    const typeormResult = await AppDataSource.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('\n📊 TypeORM 查詢結果：');
    console.log('   時間：', typeormResult[0].current_time);
    console.log('   版本：', typeormResult[0].pg_version.split(' ')[0] + ' ' + typeormResult[0].pg_version.split(' ')[1]);
    
  } catch (error) {
    console.error('比較連線時發生錯誤：', error);
  }
}

runBothTests();
