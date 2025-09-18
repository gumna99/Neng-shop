import { IsNotEmpty, IsString, IsNumber, IsEnum, IsArray, IsOptional, Min } from "class-validator";
import { ProductCategory, ProductStatus } from '../entities/Product.entity';

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsEnum(ProductCategory)
  category: ProductCategory;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

}

export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: ProductCategory;
  imageUrls?: string[];
  sellerId: number;
}

export interface UpdateProductData {
  name?: string;
  slug?: string;  // Service層會自動處理
  description?: string;
  price?: number;
  stock?: number;
  category?: ProductCategory;
  imageUrls?: string[];
  status?: ProductStatus;
}