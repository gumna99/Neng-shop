import { Router } from "express";
import authRoutes from "./auth";
import { ApiResponse } from "../utils/apiResponse";

const router = Router();

// API 版本控制 - 所有認證相關的路由都會有 /api/v1/auth 前綴
router.use("/v1/auth", authRoutes);

// health check
router.get("health", (req, res) => {
  const healthData = {
    status: "ok",
    version: "1.0.0",
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    database: "connected",
  };
  return ApiResponse.success(res, healthData, "API is running normally");
});

// 404
router.use("*", (req, res) => {
  return ApiResponse.notFound(res, `API endpoint ${req.originalUrl} not found`);
});

export default router;
