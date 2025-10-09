import { Request, Response } from "express";
import { OrderService } from "../services/OrderService";
import { ApiResponse } from "../utils/apiResponse";
import { CreateOrderInput } from "../types/order.types";

export class OrderController {
  /**
     * 建立訂單（從購物車結帳）
     * POST /api/v1/orders
  */

  static async createOrder(req: Request, res: Response) {
    try {
      // 1. 認證檢查（中介軟體已處理，但要確認）
      if (!req.user) {
        return ApiResponse.error(res, "Authentication required", 401);
      }

      const {shippingAddress, notes }: CreateOrderInput = req.body;
      
      if (!shippingAddress || !shippingAddress.name || !shippingAddress.phone || !shippingAddress.address){
        return ApiResponse.error(res, "Complete shipping address is required", 400);
      }

      const { name, phone, address } = shippingAddress;

      if (!name?.trim()) {
        return ApiResponse.error(res, "Recipient name is required", 400);
      }
      if (!phone?.trim()) {
        return ApiResponse.error(res, "Phone number is required", 400);
      }

      if (!address?.trim()) {
        return ApiResponse.error(res, "Address is required", 400);
      }
      // 格式驗證
      if (name.length > 50) {
        return ApiResponse.error(res, "Name too long (max 50 characters)", 400);
      }

      if (address.length > 200) {
        return ApiResponse.error(res, "Address too long (max 200 characters)", 400);
      }
      // 電話號碼簡單驗證（台灣手機號碼）
      const phoneRegex = /^09\d{8}$/;
      if (!phoneRegex.test(phone.replace(/[-\s]/g, ''))) {
        return ApiResponse.error(res, "Invalid phone number format", 400);
      }


      const orderService = new OrderService();
      const newOrder = await orderService.createOrderFromCart(
        req.user.id,
        shippingAddress,
        notes
      );

      return ApiResponse.success(
        res,
        newOrder,
        "Order created successfully",
        201
      );
      
    } catch (error: any) {
      console.error("Create order error: ", error)

      if (error.message.includes("Cart is empty") ||
          error.message.includes("Insufficient stock")) {
            return ApiResponse.error(res, error.message, 422);
          }
      return ApiResponse.error(res, "Failed to create order", 500);
    }
  }


  /**
   * 獲取用戶訂單列表
   * GET /api/v1/orders
   */
  static async getOrders(req: Request, res: Response) {
    try {
      if (!req.user) {
        return ApiResponse.error(res, "Authentication required", 401);
      }

      const orderService = new OrderService();
      const orders = await orderService.getUserOrders(req.user.id);

      return ApiResponse.success(res, orders, "Orders retrieved successfully");
    } catch (error) {
      console.error("Get orders error:", error);
      return ApiResponse.error(res, "Failed to retrieve orders", 500);
    }
  }


  /**
   * id取得訂單
   * GET /api/v1/orders/:id/
   */

  static async getOrderById(req: Request, res: Response) {
    try {
      if (!req.user) {
        return ApiResponse.error(res, "Authentication required", 401);
      }

      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return ApiResponse.error(res, "Invalid order ID", 400);
      }

      const orderService = new OrderService()
      const order = await orderService.getOrderById(orderId, req.user.id);

      if (!order) {
        return ApiResponse.error(res, "Order not found", 404);
      }
      return ApiResponse.success(res, order, "Order retrieved successfully");
    } catch (error) {
      console.error("Get orders by ID error:", error);
      return ApiResponse.error(res, "Failed to retrieve orders by id", 500);
    }
  }
  
  /**
   * 取消訂單
   * PATCH /api/v1/orders/:id/cancel
   */
  static async cancelOrder(req: Request, res: Response) {
    try {
      if (!req.user) {
        return ApiResponse.error(res, "Authentication required", 401);
      };
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return ApiResponse.error(res, "Invalid order ID", 400);
      }
      const orderService = new OrderService();
      const cancelledOrder = await orderService.cancelOrder(orderId, req.user.id);
      return ApiResponse.success(res, cancelledOrder, "Order cancelled successfully");
    } catch (error: any) {
      console.error("Cancel order error: ", error)
      if (error.message.includes("訂單不存在") || error.message.includes("只能取消待處理的訂單")) {
        return ApiResponse.error(res, error.message, 422);
      }

      return ApiResponse.error(res, "Failed to cancel order", 500); 
    }
  }




}