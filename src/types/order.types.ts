import { OrderItem } from "../entities/OrderItem.entity";

export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
  SHIPPED = "shipped"
}

// export type OrderStatus = 'pending' | 'confirmed' | 'cancelled';

export interface CreateOrderInput {
  shippingAddress: ShippingAddress;
  notes?: string;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  address: string;
}

export interface OrderResponse {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  shippingAddress: ShippingAddress;
  items: OrderItemResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BaseOrder {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: Date;
}

export interface OrderListItem extends BaseOrder {
  itemCount: number;
}

export interface OrderDetailResponse extends BaseOrder {
  shippingAddress: ShippingAddress;
  items: OrderItemResponse[];
  notes?: string;
  updatedAt: Date;
}

// 訂單項目
export interface OrderItemResponse {
  id: number;
  productId: number;
  productName: string;
  productPrice: number;
  quantity: number;
  totalPrice: number;
}



// 1. 賣家訂單項目（只包含自己的商品）
export interface SellerOrderItem extends OrderItemResponse {
  // 賣家特有：可能需要知道這是不是自己的商品
}

// 2. 賣家看到的買家資訊（發貨用）
export interface OrderBuyerInfo {
  name: string;
  phone: string;
  address: string;
  // 注意：不包含買家的敏感資訊如email
}

// 3. 賣家訂單回應
export interface SellerOrderResponse {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  buyerInfo: OrderBuyerInfo;     // 收貨人資訊
  myItems: SellerOrderItem[];    // 只有我的商品
  myTotal: number;               // 我的商品總金額
  createdAt: Date;
  updatedAt: Date;
}

// 4. 賣家訂單查詢參數
export interface SellerOrderQuery {
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'myTotal' | 'status';
  sortOrder?: 'ASC' | 'DESC';
}

export interface UpdateOrderStatusInput {
  status: OrderStatus
}

// 狀態轉換規則配置
export type AllowedStatusTransitions = {
  [currentStatus in OrderStatus]: OrderStatus[];
};

export const ALLOWED_STATUS_TRANSITIONS: AllowedStatusTransitions = {
  pending: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  confirmed: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  shipped: [], // 賣家不能再變更已發貨訂單
  cancelled: [], // 最終狀態
}
export type StatusTransitionValidator = (
    currentStatus: OrderStatus,
    newStatus: OrderStatus
  ) => boolean;


// 狀態轉換驗證函數
export const isValidStatusTransition = (
    currentStatus: OrderStatus,
    newStatus: OrderStatus
  ): boolean => {
    return ALLOWED_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
  };

