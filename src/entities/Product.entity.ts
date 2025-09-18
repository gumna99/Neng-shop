import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

import { User } from "./User.entity";
import { IsNotEmpty } from "class-validator";

// 商品狀態
export enum ProductStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  INACTIVE = "inactive",
  SOLD_OUT = "sold_out",
}

// 商品分類
export enum ProductCategory {
  FASHION = "fashion",
  ELECTRONICS = "electronics",
  HOME = "home",
  BEAUTY = "beauty",
  SPORTS = "sports",
  OTHERS = "others"
}

@Entity("products")
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsNotEmpty()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column("text")
  description: string;

  @Column("decimal", { precision: 10, scale: 2 })
  price: number;

  @Column({ default: 0})
  stock: number;

  @Column({
    type: "enum",
    enum: ProductStatus,
    default: ProductStatus.DRAFT
  })
  status: ProductStatus;

  @Column({
    type: "enum",
    enum: ProductCategory
  })
  category: ProductCategory;

  @Column("json", { nullable: true })
  imageUrls: string[];
  
  @ManyToOne(() => User, (user) => user.products )
  @JoinColumn({ name: "sellerId"})
  seller: User;

  @Column()
  sellerId: number;

  @Column({ default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

}
