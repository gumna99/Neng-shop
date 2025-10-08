import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from "typeorm";

import { Cart } from "./Cart.entity";
import { Product } from "./Product.entity";

@Entity("cart_items")
export class CartItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  cartId: number;

  @Column()
  productId: number;

  @Column({ type: "int", default: 1 })
  quantity: number;

  @Column("decimal", { precision: 10, scale: 2} )
  price: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
 
  // 關聯關係
  @ManyToOne(() => Cart, (cart) => cart.items)
  @JoinColumn({ name: "cartId" })
  cart: Cart;

  @ManyToOne(() => Product, (product) => product.cartItems )
  @JoinColumn({ name: "productId" })
  product: Product;
}