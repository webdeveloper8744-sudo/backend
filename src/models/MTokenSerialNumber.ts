import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm"
import { PurchaseOrder } from "./PurchaseOrder"
import { store } from "./store.model"

@Entity()
export class MTokenSerialNumber {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column({ type: "varchar", unique: true })
  serialNumber!: string // Stored in UPPERCASE

  @Column()
  purchaseOrderId!: string

  @ManyToOne(() => PurchaseOrder)
  purchaseOrder!: PurchaseOrder

  @Column()
  storeId!: string

  @ManyToOne(() => store)
  store!: store

  @Column({ type: "date" })
  purchaseDate!: string

  @Column({ nullable: true })
  usedInLeadId?: string // Reference to lead if used

  @Column({ type: "boolean", default: false })
  isUsed!: boolean

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}
