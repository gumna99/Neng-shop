import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

import { Order } from "./Order.entity";
import { Product } from "./Product.entity";


@Entity("order_items")
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orderId: number;

  @Column()
  productId: number;

  // 商品快照
  @Column()
  productName: string;

  @Column( { type: 'decimal', precision:10, scale: 2 })
  productPrice: number;

  // 訂單
  @Column()
  quantity: number;

  @Column({ type: 'decimal', precision:10, scale: 2 })
  totalPrice: number;

  // 關聯
  @ManyToOne(() => Order, order => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: "orderId" })
  order: Order;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: "productId" })
  product?: Product;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}