import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

import { User } from "./User.entity";
import { CartItem } from "./CartItem.entity";

@Entity("carts")
export class Cart {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
 
  @OneToOne(() => User, (user) => user.cart)
  @JoinColumn({ name: "userId" })
  user: User;

  @OneToMany(() => CartItem, (cartItem) => cartItem.cart)
  items: CartItem[];

}

