import { IsNotEmpty, IsNumber, IsPositive, Min } from "class-validator";

export interface AddToCartInput {
  productId: number;
  quantity: number;
}

export interface UpdateCartItemInput {
  quantity: number;
}

export interface UserCartResponse {
  cart: {
    id: number;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  items: CartItemWithProduct[];
  totalItems: number;
  totalAmount: number;
}

export interface CartItemWithProduct {
  id: number;
  cartId: number;
  productId: number;
  quantity: number;
  price: number;
  createdAt: Date;
  updatedAt: Date;
  product: {
    id: number;
    name: string;
    slug: string;
    imageUrls: string[];
    currentPrice: number;
    stock: number;
    status: string;
  }
}

export interface AddToCartData {
  productId: number;
  quantity: number;
  userId: number;
  priceSnapshot: number;
}

// 加入商品到購物車的回應
export interface AddToCartResult {
  item: CartItemWithProduct;
  warnings?: {
    type: 'STOCK_ADJUSTED' | 'PRICE_CHANGED' | 'LOW_STOCK';
    message: string;
    originalQuantity?: number;  // 原本要求的數量
    adjustedQuantity?: number;  // 實際加入的數量
    originalPrice?: number;     // 原本的價格
    currentPrice?: number;      // 目前的價格
  }[];
}

// Service 內部使用
export interface CartItemCreateData {
  cartId: number;
  productId: number;
  quantity: number;
  priceSnapshot: number;
}