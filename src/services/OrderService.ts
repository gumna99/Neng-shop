import { EntityManager, Repository } from "typeorm";
import { Order } from "../entities/Order.entity";
import { OrderItem } from "../entities/OrderItem.entity";
import { Cart } from "../entities/Cart.entity";
import { CartItem } from "../entities/CartItem.entity";
import { Product, ProductStatus } from "../entities/Product.entity";
import { AppDataSource } from "../config/typeorm";
import {
  OrderStatus,
  ShippingAddress,
  OrderResponse,
} from "../types/order.types";

export class BusinessError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "BusinessError";
  }
}

export class EmptyCartError extends BusinessError {
  constructor() {
    super("購物車是空的，無法建立訂單", "EMPTY_CART", 422);
  }
}

export class InsufficientStockError extends BusinessError {
  constructor(productName: string, requested: number, available: number) {
    super(
      `商品 ${productName} 庫存不足。需要： ${requested}, 可用：${available}`,
      "INSUFFICIENT_STOCK",
      422
    );
  }
}

export class ProductNotFoundError extends BusinessError {
  constructor(productId: number) {
    super(`商品不存在或已下架：${productId}`, "PRODUCT_NOT_FOUND", 404);
  }
}

export class OrderService {
  private orderRepository: Repository<Order>;
  private orderItemRepository: Repository<OrderItem>;
  private cartRepository: Repository<Cart>;
  private cartItemRepository: Repository<CartItem>;
  private productRepository: Repository<Product>;

  constructor() {
    this.orderRepository = AppDataSource.getRepository(Order);
    this.orderItemRepository = AppDataSource.getRepository(OrderItem);
    this.cartRepository = AppDataSource.getRepository(Cart);
    this.cartItemRepository = AppDataSource.getRepository(CartItem);
    this.productRepository = AppDataSource.getRepository(Product);
  }

  async createOrderFromCart(
    userId: number,
    shippingAddress: ShippingAddress,
    notes?: string
  ): Promise<OrderResponse> {
    try {
      // 步驟1：驗證
      const cartItems = await this.validateUserCart(userId);
      // 步驟2：準備
      const orderData = await this.prepareOrderData(
        userId,
        shippingAddress,
        notes,
        cartItems
      );
      // 步驟3：執行
      const order = await this.executeOrderTransaction(
        userId,
        orderData,
        cartItems
      );
      // 步驟4：回傳
      return this.formatOrderResponse(order);
    } catch (error) {
      if (error instanceof BusinessError) {
        throw error;
      }

      console.error("Order creation system error:", error);
      throw new Error("Failed to create order due to system error");
    }
  }

  private formatOrderResponse(order: Order): OrderResponse {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      shippingAddress: order.shippingAddress,
      items:
        order.items?.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          productPrice: Number(item.productPrice),
          quantity: item.quantity,
          totalPrice: Number(item.totalPrice),
        })) || [],
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
  private async prepareOrderData(
    userId: number,
    shippingAddress: ShippingAddress,
    notes: string | undefined,
    cartItems: CartItem[]
  ) {
    // 步驟1：生成訂單編號
    const orderNumber = this.generateOrderNumber();

    // 步驟2：計算總金額
    const totalAmount = this.calculateOrderTotal(cartItems);

    // 步驟3：組織訂單資料
    return {
      orderNumber,
      buyerId: userId,
      totalAmount,
      status: OrderStatus.PENDING,
      shippingAddress,
      notes: notes || null,
    };
  }

  private generateOrderNumber(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ""); //YYYYMMDD
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();

    return `ORD-${dateStr}-${randomStr}`;
  }

  private calculateOrderTotal(cartItems: CartItem[]): number {
    return cartItems.reduce((total, item) => {
      const itemPrice = item.price || item.product.price;
      return total + item.quantity * itemPrice;
    }, 0);
  }

  private async validateUserCart(userId: number): Promise<CartItem[]> {
    // 步驟1：取得購物車資料
    const cart = await this.cartRepository.findOne({
      where: { userId },
      relations: ["items", "items.product"],
    });

    // 步驟2：檢查購物車是否存在且不為空
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new EmptyCartError();
    }

    // 步驟3：驗證每個購物車項目
    for (const cartItem of cart.items) {
      await this.validateCartItem(cartItem);
    }

    return cart.items;
  }

  private async validateCartItem(cartItem: CartItem): Promise<void> {
    const product = cartItem.product;
    // 檢查1：商品是否存在
    if (!product) {
      throw new ProductNotFoundError(cartItem.productId);
    }
    // 檢查2：商品是否被軟刪除
    if (product.isDeleted) {
      throw new ProductNotFoundError(cartItem.productId);
    }
    // 檢查3：商品狀態是否可購買
    if (product.status !== ProductStatus.ACTIVE) {
      throw new BusinessError(
        `商品 ${product.name} 目前無法購買`,
        "PRODUCT_UNAVAILABLE",
        422
      );
    }
    // 檢查4：庫存是否足夠
    if (product.stock < cartItem.quantity) {
      throw new InsufficientStockError(
        product.name,
        cartItem.quantity,
        product.stock
      );
    }
  }

  private async executeOrderTransaction(
    userId: number,
    orderData: any,
    cartItems: CartItem[]
  ): Promise<Order> {
    return await AppDataSource.transaction(async (manager) => {
      // 步驟1：建立訂單
      const order = await this.createOrderInTransaction(manager, orderData);
      // 步驟2：建立訂單項目（商品快照）
      await this.createOrderItemsInTransaction(manager, order, cartItems);
      // 步驟3：扣減庫存（使用悲觀鎖）
      await this.updateStockInTransaction(manager, cartItems);
      // 步驟4：清空購物車
      await this.clearCartInTransaction(manager, userId);
      // 步驟5：重新載入訂單（包含關聯資料）
      const orderWithItems = await manager.findOne(Order, {
        where: { id: order.id },
        relations: ["items"],
      });

      if (!orderWithItems) {
        throw new Error("Failed to retrieve created order");
      }

      return orderWithItems;
    });
  }

  private async createOrderInTransaction(
    manager: EntityManager,
    orderData: any
  ): Promise<Order> {
    const order = manager.create(Order, orderData);
    return await manager.save(order);
  }

  private async createOrderItemsInTransaction(
    manager: EntityManager,
    order: Order,
    cartItems: CartItem[]
  ): Promise<void> {
    const orderItems = cartItems.map((item) => {
      return manager.create(OrderItem, {
        orderId: order.id,
        productId: item.productId,
        productName: item.product.name,
        productPrice: item.price,
        quantity: item.quantity,
        totalPrice: item.price * item.quantity,
      });
    });

    await manager.save(orderItems);
  }

  private async updateStockInTransaction(
    manager: EntityManager,
    cartItems: CartItem[]
  ): Promise<void> {
    for (const item of cartItems) {
      // 使用悲觀鎖防止併發問題
      const product = await manager.findOne(Product, {
        where: { id: item.productId },
        lock: { mode: "pessimistic_write" }, //重要：鎖定這筆紀錄
      });

      if (!product) {
        throw new ProductNotFoundError(item.productId);
      }

      if (product.stock < item.quantity) {
        throw new InsufficientStockError(
          product.name,
          item.quantity,
          product.stock
        );
      }

      product.stock -= item.quantity;
      await manager.save(product);
    }
  }

  private async clearCartInTransaction(
    manager: EntityManager,
    userId: number
  ): Promise<void> {
    const cart = await manager.findOne(Cart, { where: { userId } });
    if (cart) {
      await manager.delete(CartItem, { cartId: cart.id });
    }
  }


  async getUserOrders(userId: number): Promise<OrderResponse[]> {
    try {
      const orders = await this.orderRepository.find({
        where: { buyerId: userId },
        relations: ["items"],
        order: { createdAt: "DESC" }
      });

      return orders.map(order => this.formatOrderResponse(order));
    } catch (error) {
      console.error("Get user orders error:", error);
      throw new Error("Failed to retrieve orders");
    }
  }
  
  async getOrderById(orderId: number, userId: number): Promise<OrderResponse | null> {
    try {
      const order = await this.orderRepository.findOne({
        where: { id: orderId, buyerId: userId },
        relations: ['items']
      });

      if (!order) {
        return null;
      }
      return this.formatOrderResponse(order);

    } catch (error) {
      console.error("Get order by ID error: ", error);
      throw new Error("Failed to retrieve order");
    }
  }

  async cancelOrder(orderId: number, userId: number): Promise<OrderResponse> {
    try {
      // 步驟1：驗證訂單
      const order = await this.validateOrderForCancellation(orderId, userId);

      // 步驟2：執行取消邏輯（使用 Transaction）
      const cancelledOrder = await this.executeCancelTransaction(order);
      
      // 步驟3：回傳結果
      return this.formatOrderResponse(cancelledOrder);

    } catch (error) {
      if (error instanceof BusinessError) {
        throw error;
      }
      console.error("Cancel order system error:", error);
      throw new Error("Failed to cancel order due to system error");
    }
  }

  private async validateOrderForCancellation(orderId: number, userId: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, buyerId: userId },
      relations: ['items']
    });
    if (!order) {
      throw new BusinessError("訂單不存在", "ORDER_NOT_FOUND", 404);
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BusinessError("只能取消待處理的訂單", "INVALID_ORDER_STATUS", 422);
    }
    return order;
  }

  private async executeCancelTransaction(order: Order): Promise<Order> {
    return await AppDataSource.transaction(async (manager) => {
      // 1. 回補庫存
      await this.restoreStockInTransaction(manager, order.items);

      // 2. 更新訂單狀態
      order.status = OrderStatus.CANCELLED;
      const cancelledOrder = await manager.save(order);

      return cancelledOrder;
    })
  }

  private async restoreStockInTransaction(
    manager: EntityManager,
    orderItems: OrderItem[]
  ): Promise<void> {
      for (const item of orderItems) {
        const product = await manager.findOne(Product, {
          where: { id: item.productId },
          lock: { mode: "pessimistic_write"}
        });

        if (product) {
          product.stock += item.quantity;
          await manager.save(product);
        }
      }
    }
}
