import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
  OneToOne,
  ValueTransformer
} from "typeorm";
import { IsEmail, IsNotEmpty, MinLength} from 'class-validator';
import 'reflect-metadata';
import { Product } from "./Product.entity";
import { Cart } from "./Cart.entity";

// 角色位運算常量
export const USER_ROLES = {
  BUYER: 1,   // 001
  SELLER: 2,  // 010  
  ADMIN: 4    // 100
} as const;

export type UserRole = 'buyer' | 'seller' | 'admin';

// Value Transformer 實現
const userRoleTransformer: ValueTransformer = {
  to: (role: UserRole): number => {
    // 將字串角色轉換為數字位
    switch (role) {
      case 'buyer': return USER_ROLES.BUYER;
      case 'seller': return USER_ROLES.SELLER;
      case 'admin': return USER_ROLES.ADMIN;
      default: return USER_ROLES.BUYER; // 默認值
    }
  },
  from: (roleBit: number): UserRole => {
    // 將數字位轉換回字串角色
    switch (roleBit) {
      case USER_ROLES.BUYER: return 'buyer';
      case USER_ROLES.SELLER: return 'seller';
      case USER_ROLES.ADMIN: return 'admin';
      default: return 'buyer'; // 默認值
    }
  }
};

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @IsEmail()
  email: string;

  @Column()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @Column({ unique: true })
  @IsNotEmpty()
  @MinLength(4)
  username: string;

  @Column({ nullable: true })
  fullname: string;

  @Column({ 
    type: 'smallint',
    default: USER_ROLES.BUYER,
    transformer: userRoleTransformer
  })
  role: UserRole; 
  // 帳號狀態
  @Column({ default: false })
  isDeleted: boolean;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;


  // 略：isVerified, avatarUrl, phone, address
  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;


  // OAuth 相關欄位
  @Column({ nullable: true })
  googleId: string;

  @OneToMany(() => Product, (product) => product.seller)
  products: Product[];

  // 生命週期 hooks
  @BeforeInsert()
  @BeforeUpdate()
  updateTimestamp() {
    this.updatedAt = new Date();
  }

  @OneToOne(() => Cart, (cart) => cart.user)
  cart: Cart;
  
  // 動態屬性
  get isOAuthUser(): boolean {
    return !!this.googleId;
  }

  // 角色檢查方法
  hasRole(role: UserRole): boolean {
    const roleBit = userRoleTransformer.to(role);
    const currentRoleBit = userRoleTransformer.to(this.role);
    return currentRoleBit === roleBit;
  }

  isBuyer(): boolean {
    return this.hasRole('buyer');
  }

  isSeller(): boolean {
    return this.hasRole('seller');
  }

  isAdmin(): boolean {
    return this.hasRole('admin');
  }


  // 實用方法
  toJSON() {
    // 自動排除密碼欄位，避免意外暴露
    const { password, ...result } = this;
    return result;
  }
}
