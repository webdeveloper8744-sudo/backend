import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm"
import { store } from "./store.model"

@Entity()
export class PurchaseOrder {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column({ default: "MToken" })
  productName!: string

  @Column()
  storeId!: string

  @ManyToOne(() => store)
  store!: store

  @Column({ type: "int" })
  quantity!: number

  @Column({ type: "decimal", precision: 12, scale: 2 })
  amount!: number

  @Column({ type: "date" })
  purchaseDate!: string

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}
