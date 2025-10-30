import { Repository } from "typeorm";
import { Product } from "../entities/Product.entity";
import { AppDataSource } from "../config/typeorm";
import { ProductStatus } from "../entities/Product.entity";
import { SellerProductQuery } from "../types/product.types";
import { BusinessError } from "./OrderService";

export class SellerProductService {
  private productRepository: Repository<Product>;
  constructor() {
    this.productRepository = AppDataSource.getRepository(Product);
  }
  
  async getSellerProducts(sellerId: number, query: SellerProductQuery): Promise<Product[]> {
    try {
      let queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .where('product.sellerId = :sellerId', { sellerId })

      if (query.status) {
        queryBuilder = queryBuilder.andWhere('product.status = :status', {
          status: query.status 
        });
      }
      // 排序
      const sortBy = query.sortBy || 'createdAt';
      const sortOrder = query.sortOrder || 'DESC';
      queryBuilder = queryBuilder.orderBy(`product.${sortBy}`, sortOrder);
      
      // 分頁
      if (query.page && query.limit) {
        const skip = (query.page - 1) * query.limit;
        queryBuilder = queryBuilder.skip(skip).take(query.limit);
      }

      return await queryBuilder.getMany();

    } catch (error) {
      console.error('Get seller products error:', error);
      throw new Error('Failed to retrieve seller products');
    }
  }

  async updateProductStatus(productId: number, sellerId: number, status: ProductStatus): Promise<Product> {
    try {
      const product = await this.productRepository.findOne({
        where: {
          id: productId,
          sellerId: sellerId
        }
      })

      if (!product) {
        throw new BusinessError("Product not found or access denied", "PRODUCT_NOT_FOUND", 404);
      }

      product.status = status;
      await this.productRepository.save(product);
      return product
    } catch (error) {
      if (error instanceof BusinessError) {
        throw error;  // 重新拋出業務邏輯錯誤
      }
      console.error('Update product status error:', error);
      throw new Error('Failed to update product status');
    }
  }

  async updateProduct(productId: number, sellerId: number, updateData: any): Promise<Product> {
    try {
      const product = await this.productRepository.findOne({
        where: {
          id: productId,
          sellerId: sellerId
        }
      })
      
      if (!product) {
        throw new BusinessError("Product not found or access denied", "PRODUCT_NOT_FOUND", 404);
      }
      // 特殊處理：如果更新名稱，需要重新生成 slug
      if (updateData.name) {
          updateData.slug = this.generateSlug(updateData.name);
        }
      // 3. 更新商品資料
      Object.assign(product, updateData);
      await this.productRepository.save(product);

      return product;
    } catch (error) {
      if (error instanceof BusinessError) {
        throw error;
      }
      console.error('Update product error:', error);
      throw new Error('Failed to update product');
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // 移除特殊字符
      .replace(/\s+/g, '-')         // 空格替換為連字號
      .replace(/-+/g, '-')          // 多個連字號合併為一個
      .trim();
  }
}
