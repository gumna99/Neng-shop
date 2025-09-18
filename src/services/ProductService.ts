import { Repository, In } from "typeorm";
import {
  Product,
  ProductCategory,
  ProductStatus,
} from "../entities/Product.entity";
import { AppDataSource } from "../config/typeorm";
import { ApiResponse } from "../utils/apiResponse";
import { CreateProductData, UpdateProductData } from "../types/product.types";

// 分頁
interface PaginatedProducts {
  products: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// 查詢參數介面
interface ProductListParams {
  page: number;
  limit: number;
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "createdAt" | "price" | "name";
  sortOrder?: "ASC" | "DESC";
  keyword?: string;
  status?: ProductStatus;
}

// 
interface CategoryStats {
  key: string;
  name: string;
  description: string;
  totalProducts: number;
  activeProducts: number;
  averagePrice: number;
}

// 分類對應表
const CATEGORY_INFO: Record<ProductCategory, { name: string; description: string
}> = {
  [ProductCategory.FASHION]: {
    name: '時尚服飾',
    description: '服裝、配件等時尚商品'
  },
  [ProductCategory.ELECTRONICS]: {
    name: '電子產品',
    description: '3C產品、家電等電子商品'
  },
  [ProductCategory.HOME]: {
    name: '居家用品',
    description: '家具、裝飾等居家商品'
  },
  [ProductCategory.BEAUTY]: {
    name: '美妝保養',
    description: '化妝品、保養品等美容商品'
  },
  [ProductCategory.SPORTS]: {
    name: '運動休閒',
    description: '運動用品、戶外用品等'
  },
  [ProductCategory.OTHERS]: {
    name: '其他商品',
    description: '其他未分類商品'
  }
};


export class ProductService {
  private productRepository: Repository<Product>;

  constructor() {
    this.productRepository = AppDataSource.getRepository(Product);
  }

  async findAllProducts(params: ProductListParams): Promise<PaginatedProducts> {
    //
    // const page = Math.max(1, params.page || 1);
    // const limit = Math.min(Math.max(1, params.limit || 20), 100);
    // const skip = (page - 1) * limit;
    // const sortBy = params.sortBy || 'createdAt';
    // const sortOrder = params.sortOrder || 'DESC';
    const { page, limit, sortBy, sortOrder } = params
    const skip = (page - 1) * limit;
    //
    const queryBuilder = this.productRepository
      .createQueryBuilder("product")
      .leftJoinAndSelect("product.seller", "seller")
      .select([
        'product.id',
        'product.name',
        'product.slug',
        'product.price',
        'product.imageUrls',
        'product.status',
        'product.category',
        'product.stock',
        'product.createdAt',
        'seller.id',
        'seller.username'
      ]);
    //
    if (params.status) {
      queryBuilder.andWhere('product.status = :status', { status: params.status });
    } else {
      queryBuilder.andWhere('product.status = :status', { status: ProductStatus.ACTIVE }); 
    }
    if (params.category) {
      queryBuilder.andWhere('product.category = :category', {category: params.category});
    }
    if (params.minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', {minPrice: params.minPrice});
    }
    if (params.maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', {maxPrice: params.maxPrice});
    }
    if (params.keyword) {
      queryBuilder.andWhere('(product.name ILIKE :keyword OR product.description ILIKE :keyword OR product.category ILIKE :keyword OR seller.username ILIKE :keyword)',
        { keyword: `%${params.keyword}%` }
      );
    }

    const [products, totalItems] = await queryBuilder
      .orderBy(`product.${sortBy}`, sortOrder)
      .andWhere('product.isDeleted = :isDeleted', { isDeleted: false})
      .take(limit)
      .skip(skip)
      .getManyAndCount()
    
    const totalPages = Math.ceil(totalItems / limit);

    return {
      products,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    }
  }

  async createProduct(productData: CreateProductData): Promise<Product> {

    const {name, description, price, stock, category, imageUrls, sellerId } = productData;
    // 生成slug
    const slug = productData.name.toLowerCase().replace(/\s+/g, '-');
    
    // 建立實體
    const product = this.productRepository.create({
      name: name,
      slug: slug,
      description: description,
      price: price,
      stock: stock,
      category: category,
      imageUrls: imageUrls || [],
      sellerId: sellerId,
      status: ProductStatus.DRAFT  // default
    })

    const savedProduct = await this.productRepository.save(product);
    return savedProduct
  }

  async findProductById(id: number): Promise<Product | null> {
    const product = await this.productRepository.findOne({
      where : { 
        id,
        isDeleted: false,
        status: In([ProductStatus.ACTIVE, ProductStatus.SOLD_OUT])
      },
      relations: ['seller']
    })

    return product
  }

  async findProductByIdForOwner(id: number): Promise<Product | null> {
    return this.productRepository.findOne({
      where: { id },  // 不過濾狀態
      relations: ['seller']
    })
  }
  async updateProduct(id: number, updateData: UpdateProductData): Promise<Product | null> {
    const product = await this.findProductByIdForOwner(id);
        if (!product) {
          return null;
        }
    // 處理slut 
    if (updateData.name && updateData.name !== product.name) {
      updateData.slug = updateData.name.toLowerCase().replace(/\s+/g, '-');
    }

    // 處理庫存
    if (updateData.stock !== undefined) {
      if (updateData.stock === 0 && product.status === ProductStatus.ACTIVE) {
        updateData.status = ProductStatus.SOLD_OUT;
      } else if (updateData.stock > 0 && product.status === ProductStatus.SOLD_OUT) {
        updateData.status = ProductStatus.ACTIVE;
      }
    }
    // 4. 更新商品
    Object.assign(product, updateData);   
    return await this.productRepository.save(product);
  }

  async deleteProduct(id: number) {
    try {
    const product = await this.findProductByIdForOwner(id);
        if (!product) {
          return null;
        }
    if (product.isDeleted) {
      return true;
    }

    product.isDeleted = true;

    await this.productRepository.save(product);
    return true;
  } catch (error) {
    console.error("Delete product service error: ", error);
    return false;
    }
  }

  async getCategoriesWithStats(): Promise<CategoryStats[]> {
    const statsQuery = this.productRepository.createQueryBuilder("product").where("product.isDeleted = :isDeleted", { isDeleted: false });

    const rawResults = await statsQuery.select([
      "product.category",
      "COUNT(*) as totalProducts",
      "COUNT(CASE WHEN product.status = 'active' THEN 1 END) as activeProducts",
      "COALESCE(AVG(product.price), 0) as averagePrice"
    ])
    .groupBy("product.category")
    .getRawMany();
    
    const categoriesWithStats: CategoryStats[] = [];
    for (const categoryKey of Object.values(ProductCategory)) {
      const stats = rawResults.find(result => result.product_category === categoryKey);

      categoriesWithStats.push({
        key: categoryKey,
        name: CATEGORY_INFO[categoryKey].name,
        description: CATEGORY_INFO[categoryKey].description,
        totalProducts: stats ? parseInt(stats.totalproducts) : 0,
        activeProducts: stats ? parseInt(stats.activeproducts) : 0,
        averagePrice: stats? parseFloat(parseFloat(stats.averageprice).toFixed(2)) : 0
      });
    }
    
    return categoriesWithStats;
  }
}
