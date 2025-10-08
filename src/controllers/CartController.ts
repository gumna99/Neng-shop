import { Request, Response } from "express";
import { CartService } from "../services/CartService";
import { ApiResponse } from "../utils/apiResponse";

export class CartController {
  static async getCart(req: Request, res: Response) {
    try {
      if (!req.user) {
        return ApiResponse.error(res, "Authentication required");
      }

      const cartService = new CartService();
      const result = await cartService.getCartWithItems(req.user.id);
      
      return ApiResponse.success(res, result , "Cart retrieved successfully");

    } catch (error){
      console.error("Get cart error: ", error);
      return ApiResponse.error(res, "Failed to get cart");

    }
  }

  static async addItemToCart(req: Request, res: Response) {
    try {
      const { productId, quantity } = req.body;
      if (!productId || !quantity) {
        return ApiResponse.error(res, "Product ID and quantity are required", 400);
      }
      // 驗證數量
      if (typeof quantity !== 'number' || quantity <= 0) {
        return ApiResponse.error(res, "Quantity must be a positive number", 400);
      }

      const cartService = new CartService();
      const result = await cartService.addItemToCart(req.user!.id, productId, quantity);

      if (!result) {
        return ApiResponse.error(res, "Failed to add item to cart", 400);
      }

      return ApiResponse.success(res, result, "Item added to cart successfully", 201);

      
  } catch (error){
      console.error("Add item to cart error:", error);
      return ApiResponse.error(res, "Failed to add item to cart", 500 ); 
    }
  }

  static async updateItemQuantity(req: Request, res: Response) {
    try {
      const { cartItemId } = req.params;
      const { quantity } = req.body;

      if (!cartItemId) {
        return ApiResponse.error(res, "Cart item ID is required", 400);
      }

      if (quantity === undefined || quantity === null) {
        return ApiResponse.error(res, "Quantity is require", 400);
      }

      if (typeof quantity !== 'number' || quantity < 0){
        return ApiResponse.error(res, "Quantity must be a non-negative number", 400)
      };
      
      //
      const cartService = new CartService();
      const result = await cartService.updateCartItemQuantity(
        req.user!.id,
        parseInt(cartItemId),
        quantity
      );

      if (!result) {
        if (quantity === 0) {
          return ApiResponse.success(res, null, "Item removed from cart successfully");
        } else {
          return  ApiResponse.success(res, "Failed to update item");
        }
      }
      return ApiResponse.success(res, result, "Item quantity updated successfully");
    } catch (error) {
      console.error("Update item quantity error:", error);
      return ApiResponse.error(res, "Failed to update item quantity", 500);
    }
  }

  static async removeItem(req: Request, res: Response) {
    try {
      const { cartItemId } = req.params;

      if (!cartItemId) {
        return ApiResponse.error(res, "Cart item ID is required", 400);
      }
      const cartService = new CartService();
      const success = await cartService.removeCartItem(
        req.user!.id,
        parseInt(cartItemId)
      );

      if (!success) {
        return ApiResponse.error(res, "Failed to remove item from cart", 400);
      }

      return ApiResponse.success(res, null, "Item removed from cart successfully");
    } catch (error) {
      console.error("Remove item error:", error);
      return ApiResponse.error(res, "Failed to remove item from cart", 500);
    }
  }

  static async clearCart(req: Request, res: Response) {
    try {
      const cartService = new CartService();
      const success = await cartService.clearCart(req.user!.id);

      if (!success) {
        return ApiResponse.error(res, "Failed to clear cart", 400);
      }

      return ApiResponse.success(res, null, "Cart cleared successfully");

    } catch (error) {
      console.error("Clear cart error", error);
      return ApiResponse.error(res, "Failed to clear cart", 500);
      
    }
  }


}