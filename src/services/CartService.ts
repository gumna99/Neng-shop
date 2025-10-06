import { Repository } from "typeorm";
import { Cart } from "../entities/Cart.entity";
import { CartItem } from "../entities/CartItem.entity";
import { Product, ProductStatus } from "../entities/Product.entity";
import { User } from "../entities/User.entity";
import { AppDataSource } from "../config/typeorm";
import { ApiResponse } from "../utils/apiResponse";
import { isDataURI } from "class-validator";
import { AddToCartResult, CartItemWithProduct } from "../types/cart.types";

export class CartService {
  private cartRepository: Repository<Cart>;
  private cartItemRepository: Repository<CartItem>;
  private productRepository: Repository<Product>;
  // private userRepository: Repository<User>;

  constructor() {
    this.cartRepository = AppDataSource.getRepository(Cart);
    this.cartItemRepository = AppDataSource.getRepository(CartItem);
    this.productRepository = AppDataSource.getRepository(Product);
    // this.userRepository = AppDataSource.getRepository(User);
  }


  async addItemToCart(userId: number, productId: number, quantity: number): Promise<AddToCartResult | null> {
    try {
      // 查商品是否存在且可購買
      const product = await this.productRepository.findOne({
        where: { 
          id: productId,
          isDeleted: false,
          status: ProductStatus.ACTIVE 
        }
      })

      if (!product) {
          return null; // 商品不存在或庫存不足
        }

      const cart = await this.getOrCreateCart(userId);

      // 檢查是否已有該商品
      const existingItem = await this.cartItemRepository.findOne({
        where: { cartId: cart.id, productId: productId }
      })

      return await this.processCartItem(cart, product, quantity, existingItem);

    } catch (error) {
      console.error("Add item to cart service error: ", error);
      return null;
    }
  }

  private async processCartItem(cart: Cart, product: Product, requestedQuantity: number, existingItem: CartItem | null): Promise<AddToCartResult | null> {
    const warnings: AddToCartResult['warnings'] = [];
    let finalQuantity = requestedQuantity;
    let cartItem: CartItem;

    if (existingItem) {
      const totalRequestedQuantity = existingItem.quantity + requestedQuantity
    
      if (totalRequestedQuantity > product.stock ) {
        finalQuantity = product.stock - existingItem.quantity;

        if (finalQuantity <= 0){
          return null;
        }

        warnings.push({
          type: "STOCK_ADJUSTED",
          message: `庫存不足，已調整為最大可加入數量 ${finalQuantity}`,
          originalQuantity: requestedQuantity,
          adjustedQuantity: finalQuantity
        });
      }

      existingItem.quantity += finalQuantity;
      cartItem = await this.cartItemRepository.save(existingItem);
      
    } else {
      // 新項目地庫存檢查
      if (requestedQuantity > product.stock) {
        finalQuantity = product.stock;

        warnings.push({
          type: "STOCK_ADJUSTED",
          message: `庫存不足，已調整為最大可加入數量 ${finalQuantity}`,
          originalQuantity: requestedQuantity,
          adjustedQuantity: finalQuantity
        });
      }

      // 創建新項目
      const newCartItem = this.cartItemRepository.create({
        cartId: cart.id,
        productId: product.id,
        quantity: finalQuantity,
        price: product.price // 價格快照
      });

      cartItem = await this.cartItemRepository.save(newCartItem);
    }
    // 庫存低量警告
    if (product.stock <= 10) {
      warnings.push({
        type: "LOW_STOCK",
        message: `商品庫存不足，僅剩 ${product.stock} 件`
      });
    }

    // 需要取的完整的 CartItem 資料 （包含 product 關臉）
    const itemWithProduct = await this.cartItemRepository.findOne({
      where: { id: cartItem.id },
      relations: ['product']
    });

    if (!itemWithProduct) {
      return null;
    }

    return {
      item: this.formatCartItemResponse(itemWithProduct),
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  private async getOrCreateCart(userId: number): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { userId: userId, isDeleted: false }
    });
    if (!cart) {
      cart = this.cartRepository.create({ userId: userId });
      cart = await this.cartRepository.save(cart);
    }

    return cart;
  }

  private formatCartItemResponse(cartItem: CartItem): CartItemWithProduct {
    if (!cartItem.product) {
      throw new Error('CartItem must include product relation');
    }
    return {
      id: cartItem.id,
      cartId: cartItem.cartId,
      productId: cartItem.productId,
      quantity: cartItem.quantity,
      price: Number(cartItem.price), // 價格快照
      createdAt: cartItem.createdAt,
      updatedAt: cartItem.updatedAt,
      product: {
        id: cartItem.product.id,
        name: cartItem.product.name,
        slug: cartItem.product.slug,
        imageUrls: cartItem.product.imageUrls,
        currentPrice: Number(cartItem.product.price), //目前價格
        stock: Number(cartItem.product.stock),
        status: cartItem.product.status
      }
    };
  }
  
  async updateCartItemQuantity(userId: number, cartItemId: number, newQuantity: number): Promise<CartItemWithProduct | null> {
    try {
      if (newQuantity < 0) {
        return null;
      }
      // 查找購物車項目並驗證權限
      const cartItem = await this.cartItemRepository.findOne({
        where: { id: cartItemId },
        relations: ['cart', 'product']
      });

      if (!cartItem || cartItem.cart.userId !== userId) {
        return null;
      }

      // 如果數量為 0，移除該商品
      if (newQuantity === 0) {
        await this.cartItemRepository.remove(cartItem);
        return null; // 返回 null 表示商品已被移除
      }

      // 檢查商品是否還可購買
      if (cartItem.product.isDeleted || cartItem.product.status !== ProductStatus.ACTIVE){
        return null; // 商品已經下架
      }
      
      if (newQuantity > cartItem.product.stock) {
        return null;
      }

      // 更新
      cartItem.quantity = newQuantity;
      const updatedItem = await this.cartItemRepository.save(cartItem);
      
      //
      const itemWithProduct = await this.cartItemRepository.findOne({
        where: { id: updatedItem.id },
        relations: ['product']
      });

      if (!itemWithProduct){
        return null;
      }

      return this.formatCartItemResponse(itemWithProduct);
      
    } catch (error) {
      console.error("Update cart item quantity error: ", error)
      return null;
    }
  }

  async removeCartItem(userId: number, cartItemId: number): Promise<boolean> {
    try {
      const cartItem = await this.cartItemRepository.findOne({
        where: { id: cartItemId },
        relations: ['cart']
      });
      if (!cartItem || cartItem.cart.userId !== userId) {
        return false; // 項目不存在或不屬於該使用者
      }

      await this.cartItemRepository.remove(cartItem);
      return true;

    } catch (error) {
      console.error("Remove cart item error: ", error);
      return false
    }
  }

  async clearCart(userId: number): Promise<boolean> {
    try {
      const cart = await this.cartRepository.findOne({
        where: { userId: userId, isDeleted: false }
      });

      if (!cart) {
        return true;
      }

      await this.cartItemRepository.delete({ cartId: cart.id })
      return true;

    } catch (error) {
      console.error("Clear cart error: ", error);
      return false;
    }
  }



  async getCartWithItems(userId: number): Promise<{ cart: Cart
    | null, items: CartItem[], totalAmount: number }> {
        try {
          const cart = await this.cartRepository.findOne({
            where: { userId: userId, isDeleted: false },
            relations: ['items', 'items.product']
          });

          if (!cart) {
            return { cart: null, items: [], totalAmount: 0 };
          }

          const totalAmount = cart.items.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
          }, 0);

          return { cart, items: cart.items, totalAmount };

        } catch (error) {
          console.error("Get cart service error:", error);
          return { cart: null, items: [], totalAmount: 0 };
        }
      }
  
}

