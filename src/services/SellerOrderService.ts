import { Repository } from "typeorm";
import { Order } from "../entities/Order.entity";
import { AppDataSource } from "../config/typeorm";
import { 
  SellerOrderQuery, 
  SellerOrderResponse,
  OrderBuyerInfo, 
  isValidStatusTransition,
  OrderStatus
} from "../types/order.types";
import { BusinessError } from "./OrderService";

// 基本錯誤訊息
export const STATUS_ERRORS = {
  INVALID_TRANSITION: "訂單狀態轉換無效",
  ORDER_NOT_FOUND: "訂單不存在或無權限操作",
  INVALID_STATUS: "無效的訂單狀態"
} as const;

export class SellerOrderService {
  private orderRepository: Repository<Order>;

  constructor() {
    this.orderRepository = AppDataSource.getRepository(Order);
  }

  async getSellerOrders(
    sellerId: number,
    query: SellerOrderQuery = {}
  ): Promise<SellerOrderResponse[]> {
    try {
      // 步驟1：建立基礎查詢
      let queryBuilder = this.orderRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.items', 'items')
        .leftJoinAndSelect('items.product', 'product')
        .where('product.sellerId = :sellerId', { sellerId });

      // 步驟2：加入篩選條件
      if (query.status) {
        queryBuilder = queryBuilder.andWhere('order.status = :status', {
          status: query.status
        });
      }

      if (query.startDate) {
        queryBuilder = queryBuilder.andWhere('order.createdAt >= :startDate', {
          startDate: query.startDate
        });
      }

      if (query.endDate) {
        queryBuilder = queryBuilder.andWhere('order.createdAt <= :endDate', {
          endDate: query.endDate
        });
      }

      // 步驟3：排序
      const sortBy = query.sortBy || 'createdAt';
      const sortOrder = query.sortOrder || 'DESC';
      queryBuilder = queryBuilder.orderBy(`order.${sortBy}`, sortOrder);

      // 步驟4：分頁
      if (query.page && query.limit) {
        const skip = (query.page - 1) * query.limit;
        queryBuilder = queryBuilder.skip(skip).take(query.limit);
      }

      // 步驟5：執行查詢
      const orders = await queryBuilder.getMany();

      // 步驟6：轉換資料格式
      return this.formatSellerOrderResponse(orders, sellerId);

    } catch (error) {
      console.error('Get seller orders error:', error);
      throw new Error('Failed to retrieve seller orders');
    }
  }

  private formatSellerOrderResponse(orders: Order[], sellerId: number): SellerOrderResponse[] {
    // 使用 Map 來處理重複訂單問題
    const orderMap = new Map<number, SellerOrderResponse>();

    for (const order of orders) {
      // 篩選出屬於該賣家的訂單項目
      const sellerItems = order.items?.filter(item => {
        // 檢查商品是否屬於該賣家
        return item.product && item.product.sellerId === sellerId;
      }) || [];

      // 如果沒有屬於該賣家的商品，跳過這個訂單
      if (sellerItems.length === 0) {
        continue;
      }

      // 計算該賣家商品的總金額
      const myTotal = sellerItems.reduce((total, item) => {
        return total + Number(item.totalPrice);
      }, 0);

      // 轉換買家資訊（從 shippingAddress 提取）
      const buyerInfo: OrderBuyerInfo = {
        name: order.shippingAddress.name,
        phone: order.shippingAddress.phone,
        address: order.shippingAddress.address
      };

      // 轉換商品項目格式
      const myItems = sellerItems.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productPrice: Number(item.productPrice),
        quantity: item.quantity,
        totalPrice: Number(item.totalPrice),
      }));

      // 建立或更新訂單回應
      const sellerOrderResponse: SellerOrderResponse = {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        buyerInfo,
        myItems,
        myTotal,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };

      // 使用 Map 去重（同一個訂單只會出現一次）
      orderMap.set(order.id, sellerOrderResponse);
    }

    // 轉換 Map 為陣列並回傳
    return Array.from(orderMap.values());
  }

  private async checkOrderPermission(orderId: number, sellerId: number): Promise<boolean> {
    try {
      const count = await this.orderRepository.createQueryBuilder('order')
        .leftJoin('order.items', 'items')
        .leftJoin('items.product', 'product')
        .where('order.id = :orderId', { orderId })
        .andWhere('product.sellerId = :sellerId', { sellerId } )
        .getCount();

      return count > 0;
    } catch (error) {
      console.error('Check order permission error:', error);
      return false;
    }
  }

  async updateOrderStatus(orderId: number, sellerId: number, newStatus: OrderStatus): Promise<SellerOrderResponse> {
    try {
      // 1. 權限檢查
      const hasPermission = await this.checkOrderPermission(orderId, sellerId);
      if (!hasPermission) {
        throw new BusinessError(STATUS_ERRORS.ORDER_NOT_FOUND, "ORDER_NOT_FOUND", 404)
      }
      // 2. 取當前訂單狀態
      const currentOrder = await this.orderRepository.findOne({
        where: { id: orderId }
      })
      if (!currentOrder) {
        throw new BusinessError(STATUS_ERRORS.ORDER_NOT_FOUND, "ORDER_NOT_FOUND", 404)
      }
      // 3. 驗證狀態轉換
      if (!isValidStatusTransition(currentOrder.status, newStatus)) {
        throw new BusinessError(STATUS_ERRORS.INVALID_TRANSITION, "INVALID_TRANSITION", 422);
      }
  
      // 步驟4：更新狀態
      currentOrder.status = newStatus;
      await this.orderRepository.save(currentOrder);

      // 步驟5：回傳更新後的訂單資訊
      const updatedOrders = await this.getSellerOrders(sellerId, { /* 可以加入篩選 */ });
      const updatedOrder = updatedOrders.find(order => order.id === orderId);

      if (!updatedOrder) {
        throw new Error("Failed to retrieve updated order");
      }

      return updatedOrder;
    } catch (error) {
      if (error instanceof BusinessError) {
        throw error;
      }
      console.error('Update order status error:', error);
      throw new Error('Failed to update order status');
    }
  }
}