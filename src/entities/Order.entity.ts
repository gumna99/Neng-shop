import { 
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

import { User } from "./User.entity"
import { OrderItem } from "./OrderItem.entity";
import { OrderStatus, ShippingAddress } from "../types/order.types";



@Entity("orders")
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  orderNumber: string;

  @Column({})
  buyerId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'json' })
  shippingAddress: ShippingAddress;

  @Column({ nullable: true })
  notes?: string;

  //
  @ManyToOne(() => User)
  @JoinColumn({ name: "buyerId" })
  buyer: User;

  @OneToMany(() => OrderItem, orderItem => orderItem.order)
  items: OrderItem[];
  
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

}