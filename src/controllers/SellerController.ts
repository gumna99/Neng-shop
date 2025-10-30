import { Request, Response } from "express";
import { SellerOrderService, STATUS_ERRORS } from "../services/SellerOrderService";
import { BusinessError } from "../services/OrderService";
import { ApiResponse } from "../utils/apiResponse";
import { OrderStatus, SellerOrderQuery, UpdateOrderStatusInput } from "../types/order.types";
import { ProductStatus } from "../entities/Product.entity";
import { SellerProductService } from "../services/SellerProductService";

export class SellerController {
  /**
   * 取得賣家訂單列表
   * GET /api/seller/orders
   */
  static async getOrders(req: Request, res: Response) {
    try {
      // 1. 權限檢查（中介軟體已處理，確保是賣家）
      if (!req.user) {
        return ApiResponse.error(res, "Authentication required", 401);
      }

      // 2. 從 JWT 取得賣家 ID
      const sellerId = req.user.id;

      // 3. 解析查詢參數（暫時使用型別斷言，之後可以加入驗證）
      const query: SellerOrderQuery = {
        status: req.query.status as OrderStatus,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        sortBy: req.query.sortBy as 'createdAt' | 'myTotal' | 'status',
        sortOrder: req.query.sortOrder as 'ASC' | 'DESC',
      };

      // 4. 呼叫專用的 SellerOrderService
      const sellerOrderService = new SellerOrderService();
      const orders = await sellerOrderService.getSellerOrders(sellerId, query);

      // 5. 回傳結果
      return ApiResponse.success(
        res,
        orders,
        "Seller orders retrieved successfully"
      );

    } catch (error: any) {
      console.error("Get seller orders error:", error);
      return ApiResponse.error(res, "Failed to retrieve seller orders", 500);
    }
  }

  /**
   * 更新訂單狀態
   * PUT /api/seller/orders/:id/status
   */
  static async updateOrderStatus(req: Request, res: Response) {
    try {
      // 1. 權限檢查
      if (!req.user) {
        return ApiResponse.error(res, "Authentication required", 401);
      }

      // 2. 參數驗證
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return ApiResponse.error(res, "Invalid order ID", 400);
      }

      const { status }: UpdateOrderStatusInput = req.body;
      if (!status) {
        return ApiResponse.error(res, "Status is required", 400);
      }

      // 3. 驗證狀態值是否有效
      if (!Object.values(OrderStatus).includes(status)) {
        return ApiResponse.error(res, "Invalid order status", 400);
      }

      // 4. 呼叫 Service 層
      const sellerId = req.user.id;
      const sellerOrderService = new SellerOrderService();
      const updatedOrder = await sellerOrderService.updateOrderStatus(
        orderId,
        sellerId,
        status
      );

      // 5. 回傳結果
      return ApiResponse.success(
        res,
        updatedOrder,
        "Order status updated successfully"
      );

    } catch (error: any) {
      console.error("Update order status error:", error);
      
      // 處理業務邏輯錯誤
      if (error instanceof BusinessError) {
        return ApiResponse.error(res, error.message, error.statusCode);
      }

      return ApiResponse.error(res, "Failed to update order status", 500);
    }
  }

  /**
   * 發貨處理（將訂單標記為已發貨）
   * POST /api/seller/orders/:id/ship
   */
  static async shipOrder(req: Request, res: Response) {
    try {
      // 1. 權限檢查
      if (!req.user) {
        return ApiResponse.error(res, "Authentication required", 401);
      }

      // 2. 參數驗證
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return ApiResponse.error(res, "Invalid order ID", 400);
      }

      // 3. 呼叫 Service 層，直接設定為 shipped 狀態
      const sellerId = req.user.id;
      const sellerOrderService = new SellerOrderService();
      const shippedOrder = await sellerOrderService.updateOrderStatus(
        orderId,
        sellerId,
        OrderStatus.SHIPPED
      );

      // 4. 回傳結果
      return ApiResponse.success(
        res,
        shippedOrder,
        "Order shipped successfully"
      );

    } catch (error: any) {
      console.error("Ship order error:", error);
      
      // 處理業務邏輯錯誤
      if (error instanceof BusinessError) {
        return ApiResponse.error(res, error.message, error.statusCode);
      }

      return ApiResponse.error(res, "Failed to ship order", 500);
    }
  }



  static async getMyProducts(req: Request, res: Response) {
    try {
      // 1. 權限檢查
      if (!req.user) {
        return ApiResponse.error(res, "Authentication required", 401);
      }
      const query = {
        status: req.query.status as ProductStatus,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sortBy: req.query.sortBy as 'createdAt' | 'name' | 'price' || 'createdAt',
        sortOrder: req.query.sortOrder as 'ASC' | 'DESC' || 'DESC'
      };
      // 參數驗證
      if (query.page < 1) query.page = 1;
      if (query.limit < 1 || query.limit > 100) query.limit = 10;


      const sellerId = req.user.id;


      // 3. 呼叫 Service 層
      const sellerProductService = new SellerProductService();
      const products = await sellerProductService.getSellerProducts(sellerId, query);

      return ApiResponse.success(res, products, "Products retrieved successfully")

    } catch (error: any) {
      console.error("Get seller products error:", error);
      // 處理業務邏輯錯誤
      if (error instanceof BusinessError) {
        return ApiResponse.error(res, error.message, error.statusCode);
      }
      return ApiResponse.error(res, "Failed to retrieve products", 500);
    }
  }
  /**
   * 更新商品狀態（上架/下架）
   * PUT /api/seller/products/:id/status
   */
  static async updateProductStatus(req: Request, res: Response) {
    try {
      if (!req.user) {
        return ApiResponse.error(res, "Authentication required", 401);
      }
      const productId = parseInt(req.params.id);
      
      
      if (isNaN(productId)) {
        return ApiResponse.error(res, "Invalid product ID", 400);
      }

      const { status } = req.body;
      if (!status) {
        return ApiResponse.error(res, "Status is required", 400);
      }

      // 驗證狀態值是否有效
      if (!Object.values(ProductStatus).includes(status)) {
        return ApiResponse.error(res, "Invalid product status", 400);
      }

      const sellerId = req.user.id;
      const sellerProductService = new SellerProductService();
      const updatedProduct = await sellerProductService.updateProductStatus(
        productId,
        sellerId,
        status
      )
      
      return ApiResponse.success(res, updatedProduct, "Product status updated successfully")
    } catch (error) {
      console.error("Update Product Status error:", error);
      if (error instanceof BusinessError) {
        return ApiResponse.error(res, error.message, error.statusCode);
      }
      return ApiResponse.error(res, "Failed to update Product Status", 500);
    }
  }

  /**
   * 更新商品資訊
   * PUT /api/seller/products/:id
   */
  static async updateProduct(req: Request, res: Response)
   {
    try {
      if (!req.user) {
        return ApiResponse.error(res, "Authentication required", 401);
      }
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return ApiResponse.error(res, "Invalid product ID",
      400);
      }
      // 至少一個更新欄位
      const { name, description, price, stock, category } = req.body;
      if (!name && !description && price === undefined && stock === undefined && !category) {
        return ApiResponse.error(res, "At least one field is required for update", 400);
      }
      // 個別欄位驗證
      if (price !== undefined && (typeof price !== 'number' || price < 0)) {
        return ApiResponse.error(res, "Price must be a non-negative number", 400);
      }
      if (stock !== undefined && (!Number.isInteger(stock) || stock < 0)) {
        return ApiResponse.error(res, "Stock must be a non-negative integer", 400);
      }


      // 3. 建立更新資料物件（只包含提供的欄位）
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = price;
      if (stock !== undefined) updateData.stock = stock;
      if (category !== undefined) updateData.category = category;
      
      // 4. 呼叫 Service 層
      const sellerId = req.user.id;
      const sellerProductService = new SellerProductService();
      const updatedProduct = await sellerProductService.updateProduct(
        productId,
        sellerId,
        updateData
      );

      return ApiResponse.success(res, updatedProduct, "Product updated successfully")
    } catch (error) {
      console.error("Update Product error:", error);
      if (error instanceof BusinessError) {
        return ApiResponse.error(res, error.message, error.statusCode);
      }
      return ApiResponse.error(res, "Failed to update Product", 500);
    }
  }

}