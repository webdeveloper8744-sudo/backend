import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm"

export type Source = "Survey" | "Facebook" | "Website" | "Other"
export type Stage = "Lead" | "Contacted" | "Qualified" | "Proposal Made" | "Won" | "Lost" | "Fridge"
export type DownloadStatus = "completed" | "not_complete" | "process"
export type PaymentStatus = "paid" | "failed" | "pending" | "other"
export type BillingSentStatus = "sent" | "not_sent" | "process"

@Entity()
export class Leads {
  @PrimaryGeneratedColumn("uuid")
  id!: string
  // Step 1 - Employee
  @Column()
  employeeName!: string

  @Column({ type: "varchar" })
  source!: Source

  @Column({ type: "varchar", nullable: true })
  otherSource?: string

  @Column({ type: "date" })
  leadCreatedAt!: string

  @Column({ type: "date", nullable: true })
  expectedCloseDate?: string

  @Column({ type: "date", nullable: true })
  lastContactedAt?: string

  @Column({ type: "varchar", default: "Lead" })
  stage!: Stage

  @Column({ type: "text", nullable: true })
  comment?: string

  @Column({ type: "text", nullable: true })
  remarks?: string

  // Step 2 - Order/Client
  @Column()
  clientName!: string

  @Column()
  clientCompanyName!: string

  @Column()
  productName!: string

  @Column()
  assignTeamMember!: string

  @Column()
  email!: string

  @Column()
  phone!: string

  @Column()
  orderId!: string

  @Column({ type: "date" })
  orderDate!: string

  @Column({ type: "text" })
  clientAddress!: string

  @Column()
  clientKycId!: string

  @Column()
  kycPin!: string

  @Column({ type: "varchar", default: "process" })
  downloadStatus!: DownloadStatus

  @Column()
  processedBy!: string

  @Column({ type: "date" })
  processedAt!: string

  // File URLs
  @Column({ type: "text", nullable: true })
  aadhaarPdfUrl?: string

  @Column({ type: "text", nullable: true })
  panPdfUrl?: string

  @Column({ type: "text", nullable: true })
  optionalPdfUrl?: string

  @Column({ type: "text", nullable: true })
  clientImageUrl?: string

  @Column({ type: "varchar", length: 50, nullable: true })
  referredByType?: "fresh" | "existing" | "other"

  @Column({ type: "varchar", length: 255, nullable: true })
  referredBy?: string

  @Column({ type: "varchar", length: 36, nullable: true })
  referredByClientId?: string

  // Step 3 - Billing
  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  quotedPrice!: number

  @Column({ nullable: true })
  companyName?: string

  @Column({ type: "text" })
  companyNameAddress!: string

  @Column({ type: "varchar", default: "pending" })
  paymentStatus!: PaymentStatus

  @Column({ nullable: true })
  paymentStatusNote?: string

  @Column({ nullable: true })
  invoiceNumber?: string

  @Column({ type: "date", nullable: true })
  invoiceDate?: string

  @Column({ type: "varchar", default: "not_sent" })
  billingSentStatus!: BillingSentStatus

  @Column({ type: "date", nullable: true })
  billingDate?: string

  @Column({ type: "text", nullable: true })
  billDocUrl?: string

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  discountAmount!: number

  @Column({ type: "varchar", length: 50, default: "amount", nullable: true })
  discountType?: "amount" | "percentage"

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  discountedPrice!: number

  @Column({ type: "varchar", default: "new" })
  assignmentStatus!: string

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}
