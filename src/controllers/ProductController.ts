import e, { Request, Response } from "express";
import { ProductService } from "../services/ProductService";
import { ApiResponse } from "../utils/apiResponse";
import { ProductCategory, ProductStatus } from "../entities/Product.entity";

export class ProductController {
  static async getProducts(req: Request, res: Response) {
    try {
      // 參數驗證
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(
        Math.max(1, parseInt(req.query.limit as string) || 20),
        100
      );
      // const skip = (page - 1) * limit;
      // const sortBy = req.query.sortBy || 'createdAt';
      // const sortOrder = req.query.sortOrder || 'DESC';

      const validCategories = Object.values(ProductCategory);
      const category = validCategories.includes(
        req.query.category as ProductCategory
      )
        ? (req.query.category as ProductCategory)
        : undefined;
      const minPrice =
        req.query.minPrice && !isNaN(parseFloat(req.query.minPrice as string))
          ? Math.max(0, parseFloat(req.query.minPrice as string))
          : undefined;
      const maxPrice =
        req.query.maxPrice && !isNaN(parseFloat(req.query.maxPrice as string))
          ? Math.max(0, parseFloat(req.query.maxPrice as string))
          : undefined;
      const validSortFields = ["createdAt", "price", "name"];
      const sortBy = validSortFields.includes(req.query.sortBy as string)
        ? (req.query.sortBy as "createdAt" | "price" | "name")
        : "createdAt";
      const sortOrder = req.query.sortOrder === "ASC" ? "ASC" : "DESC";
      const keyword = req.query.keyword?.toString().trim();

      //
      const productService = new ProductService();
      const result = await productService.findAllProducts({
        page,
        limit,
        category,
        minPrice,
        maxPrice,
        sortBy,
        sortOrder,
        keyword,
      });
      return ApiResponse.success(
        res,
        result,
        "Products retrieved successfully"
      );
    } catch (error) {
      console.error("Get products error:", error);
      return ApiResponse.error(res, "Failed to get products");
    }
  }

  static async createProduct(req: Request, res: Response) {
    try {
      // 1. 驗證使用者已認證
      if (!req.user) {
        return ApiResponse.error(res, "Authentication");
      }

      // 2. 檢視賣家權限
      if (req.user.role !== "seller" && req.user.role !== "admin") {
        return ApiResponse.error(res, "Seller permission required");
      }

      // 3. 基本資料驗證
      const { name, description, price, stock, category, imageUrls } = req.body;
      if (
        !name ||
        !description ||
        price === undefined ||
        stock === undefined ||
        !category
      ) {
        return ApiResponse.error(
          res,
          "Missing required fields: name, description, price, stock, category"
        );
      }
      if (typeof price !== "number" || price < 0) {
        return ApiResponse.error(res, "Price must be a non-negative number");
      }
      if (typeof stock !== "number" || stock < 0) {
        return ApiResponse.error(res, "Stock must be a non-negative number");
      }
      const validCategories = Object.values(ProductCategory);
      if (!validCategories.includes(category)) {
        return ApiResponse.error(res, "Invalid category");
      }
      // 4. 呼叫Service
      const productService = new ProductService();
      const newProduct = await productService.createProduct({
        name,
        description,
        price,
        stock,
        category,
        imageUrls: imageUrls || [],
        sellerId: req.user.id,
      });
      return ApiResponse.success(
        res,
        newProduct,
        "Product created successfully"
      );
    } catch (error) {
      console.error("Create products error:", error);
      return ApiResponse.error(res, "Failed to get products");
    }
  }

  static async getProductById(req: Request, res: Response) {
    try {
      const productId = parseInt(req.params.id);

      if (isNaN(productId) || productId <= 0){
        return ApiResponse.error(res, "Invalid product ID");
      }

      const productService = new ProductService();
      const product = await productService.findProductById(productId);

      if (!product) {
        return ApiResponse.error(res, "Product not found");
      }

      return ApiResponse.success(res, product, "Product retrieved successfully");

    } catch (error){
      console.error("Get product by ID error:", error);
      return ApiResponse.error(res, "Failed to get product")
    }
  }

  static async updateProduct(req: Request, res: Response) {
    try {
      // 1. 基本參數
      const productId = parseInt(req.params.id);
      if (isNaN(productId) || productId <= 0) {
        return ApiResponse.error(res, "Invalid product ID");
      }

      // 2. 認證檢查
      if (!req.user) {
        return ApiResponse.error(res, "Authentication required");
      }

      // 3. 權限檢查
      if (req.user.role !== "seller" && req.user.role !== "admin") {
        return ApiResponse.error(res, "Seller permission required");
      }

      // 4. 擁有權檢查
      const productService = new ProductService();
      const existingProduct = await productService.findProductByIdForOwner(productId);

      if (!existingProduct) {
        return ApiResponse.error(res, "Product not found")
      };

      if (req.user.role !== "admin" && existingProduct.sellerId !== req.user.id) {
        return ApiResponse.error(res, "You can only update your own products");
      }

      // 5. 資料驗證和更新
      const updateData: any = {};
      if (req.body.name !== undefined) {
        if(!req.body.name.trim()) {
          return ApiResponse.error(res, "Product name cannot be empty")
        }
        updateData.name = req.body.name.trim()
      }

      if (req.body.price !== undefined) {
        if (typeof req.body.price !== "number" || req.body.price < 0) {
          return ApiResponse.error(res, "Price must be a non-negative number")
        }
        updateData.price = req.body.price;
      }

      if (req.body.stock !== undefined) {
        if (typeof req.body.stock !== "number" || req.body.stock < 0) {
          return ApiResponse.error(res, "Stock must be a non-negative number");
        }
        updateData.stock = req.body.stock;
      }

      if (req.body.category !== undefined) {
        const validCategories = Object.values(ProductCategory);
        if (!validCategories.includes(req.body.category)) {
          return ApiResponse.error(res, "Invalid category");
        }
        updateData.category = req.body.category;
      }

      // imageUrls 驗證
      if (req.body.imageUrls !== undefined) {
        if (!Array.isArray(req.body.imageUrls)) {
          return ApiResponse.error(res, "Image URLs must be an array");
        }
        updateData.imageUrls = req.body.imageUrls;
      }

      // status 驗證
      if (req.body.status !== undefined) {
        const validStatuses = Object.values(ProductStatus);
        if (!validStatuses.includes(req.body.status)) {
          return ApiResponse.error(res, "Invalid product status");
        }
        updateData.status = req.body.status;
      }
      // 6. 檢查是否有資料要更新
      if (Object.keys(updateData).length === 0) {
        return ApiResponse.error(res, "No data provided for update");
      }

      // 7. 呼叫 Service 執行更新
      const updatedProduct = await productService.updateProduct(productId, updateData);

      if (!updatedProduct) {
        return ApiResponse.error(res, "Failed to update product");
      }

      // 8. 返回成功結果
      return ApiResponse.success(res, updatedProduct, "Product updated successfully");
    } catch (error) {
      console.error("Update product error:", error);
      return ApiResponse.error(res, "Failed to update product");
    }
  }

  static async deleteProduct(req: Request, res: Response) {
    try {
      const productId = parseInt(req.params.id)
      if (isNaN(productId) || productId <= 0) {
        return ApiResponse.error(res, "Invalid product ID");
      }

      if(!req.user) {
        return ApiResponse.error(res, "Authentication required");
      }
      // 權限檢查
      if (req.user.role !== "seller" && req.user.role !== "admin") {
        return ApiResponse.error(res, "Seller permission required");
      }
      // 擁有權檢查
      const productService = new ProductService();
      const existingProduct = await productService.findProductByIdForOwner(productId);
      if (!existingProduct) {
        return ApiResponse.error(res, "Product not found");
      }
      
      if (req.user.role !== "admin" && existingProduct.sellerId !== req.user.id) {
        return ApiResponse.error(res, "You can only delete your own products");
      }

      const result = await productService.deleteProduct(productId);

      if (!result) {
        return ApiResponse.error(res, "Failed to delete product");
      }

      return ApiResponse.success(res, null, "Product deleted successfully");

    } catch (error) {
      console.error("Delete product error:", error);
      return ApiResponse.error(res, "Failed to delete product");
    }
  }  

  static async getCategories(req: Request, res: Response) {
    try {
      const productService = new ProductService();
      const categories = await productService.getCategoriesWithStats();
      
      return ApiResponse.success(res, categories, "Categories retrieved successfully");
     
    } catch (error) {
      console.error("Get categories error:", error);
      return ApiResponse.error(res, "Failed to get categories");
    }
  }
}
