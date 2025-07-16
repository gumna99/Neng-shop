// import express, { Request, Response } from "express";

// const app = express();
// const port = 3000;

// app.get("/", (req: Request, res: Response) => {
//   res.send("Hello from TypeScript + Express!");
// });

// app.listen(port, () => {
//   console.log(`Server is running on http://localhost:${port}`);
// });



/////////
import app from './app';
import { initializeTypeORM, closeTypeORM } from './config/typeorm';
import { validateEnv, config } from './config/env';

const startServer = async () => {
  try {
    console.log('🚀 啟動 Neng Shop 伺服器...\n');
    
    // 第一步：驗證環境變數
    console.log('1️⃣ 驗證環境變數...');
    validateEnv();
    console.log('✅ 環境變數驗證完成');
    
    // 第二步：初始化 TypeORM 連線
    console.log('\n2️⃣ 初始化資料庫連線...');
    await initializeTypeORM();
    console.log('✅ 資料庫連線初始化完成');
    
    // 第三步：啟動 HTTP 伺服器
    console.log('\n3️⃣ 啟動 HTTP 伺服器...');
    const PORT = config.app.port;
    
    const server = app.listen(PORT, () => {
      console.log('✅ 伺服器啟動成功！');
      console.log(`\n📊 伺服器資訊：`);
      console.log(`   🌐 URL: http://localhost:${PORT}`);
      console.log(`   🏥 健康檢查: http://localhost:${PORT}/health`);
      console.log(`   🌍 環境: ${config.app.nodeEnv}`);
      console.log(`   📅 啟動時間: ${new Date().toISOString()}`);
      console.log('\n按 Ctrl+C 關閉伺服器');
    });
    
    // 伺服器錯誤處理
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} 已被使用，請嘗試其他 port 或關閉佔用的程序`);
      } else {
        console.error('❌ 伺服器啟動失敗：', error);
      }
      process.exit(1);
    });
    
  } catch (error) {
    console.error('❌ 應用程式啟動失敗：', error);
    process.exit(1);
  }
};

// 優雅關閉處理
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 收到 ${signal} 信號，開始優雅關閉...`);
  
  try {
    // 關閉 TypeORM 連線
    await closeTypeORM();
    console.log('✅ 資料庫連線已關閉');
    
    console.log('✅ 伺服器已優雅關閉');
    process.exit(0);
  } catch (error) {
    console.error('❌ 關閉過程中發生錯誤：', error);
    process.exit(1);
  }
};

// 監聽關閉信號
process.on('SIGINT', () => gracefulShutdown('SIGINT'));   // Ctrl+C
process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // Docker stop
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart

// 處理未捕獲的異常
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕獲的異常：', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未處理的 Promise 拒絕：', reason);
  console.error('Promise：', promise);
  process.exit(1);
});

// 啟動伺服器
startServer();