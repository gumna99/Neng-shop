export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
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
