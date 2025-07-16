import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { AppDataSource} from './config/typeorm';
import { join } from 'path';
import { timeStamp } from 'console';


const app = express();

// 中介軟體設定
app.use(helmet({
  contentSecurityPolicy: false, // 開發階段先關閉
}));
app.use(cors({
  origin: process.env.NODE_ENV === 'development' ? '*' : ['http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 請求日誌中介軟體（開發環境）
if (process.env.NODE_ENV == 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  })
}

// 基本路由
app.get('/', (req, res) => {
  res.json({
    message: 'Neng Shop API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// 路由設定
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: AppDataSource.isInitialized ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// API 路由（目前先留空，之後會加入）
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/products', productRoutes);

//404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found', 
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString()
  })
})

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('錯誤發生', err);

  // 在開發環境顯示完整錯誤資訊
  const errorResponse = {
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };
  
  res.status(500).json(errorResponse);
})

export default app;
