import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate
} from "typeorm";
import { IsEmail, IsNotEmpty, MinLength} from 'class-validator';
import 'reflect-metadata';

export type UserRole = 'buyer' | 'seller' | 'admin';

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
    type: 'enum',
    enum: ['buyer', 'seller', 'admin'],
    default: "buyer" 
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

  @Column({ default: false })
  isOAuthUser: boolean;

  // 生命週期 hooks
  @BeforeInsert()
  @BeforeUpdate()
  updateTimestamp() {
    this.updatedAt = new Date();
  }

  // 實用方法
  toJSON() {
    // 自動排除密碼欄位，避免意外暴露
    const { password, ...result } = this;
    return result;
  }
}
