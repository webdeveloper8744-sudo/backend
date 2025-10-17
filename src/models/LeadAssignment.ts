import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm"

export type AssignmentStatus =
  | "new"
  | "in_progress"
  | "contacted"
  | "qualified"
  | "proposal_sent"
  | "won"
  | "lost"
  | "on_hold"
export type AssignmentPriority = "low" | "medium" | "high" | "urgent"

@Entity("lead_assignment")
@Index(["leadId"])
@Index(["assignedToId"])
@Index(["assignedById"])
@Index(["status"])
@Index(["createdAt"])
export class LeadAssignment {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  // Foreign key references (stored as plain strings, no TypeORM relations to avoid FK constraint issues)
  @Column({ type: "varchar", length: 36, comment: "References leads.id" })
  leadId!: string

  @Column({ type: "varchar", length: 36, comment: "References users.id - assigned to" })
  assignedToId!: string

  @Column({ type: "varchar", length: 255 })
  assignedToName!: string

  @Column({ type: "varchar", length: 36, comment: "References users.id - assigned by" })
  assignedById!: string

  @Column({ type: "varchar", length: 255 })
  assignedByName!: string

  // Denormalized lead data for quick access
  @Column({ type: "varchar", length: 255 })
  leadClientName!: string

  @Column({ type: "varchar", length: 255 })
  leadClientCompany!: string

  @Column({ type: "text", nullable: true })
  leadClientAddress?: string

  @Column({ type: "varchar", length: 255, nullable: true })
  leadProductName?: string

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  leadQuotedPrice!: number

  // Assignment specific fields
  @Column({ type: "varchar", length: 50, default: "new" })
  status!: AssignmentStatus

  @Column({ type: "varchar", length: 50, default: "medium" })
  priority!: AssignmentPriority

  @Column({ type: "date", nullable: true })
  dueDate?: string

  @Column({ type: "int", default: 0 })
  contactAttempts!: number

  @Column({ type: "datetime", nullable: true })
  lastContactedAt?: Date

  @Column({ type: "datetime", nullable: true })
  nextFollowUpAt?: Date

  @Column({ type: "text", nullable: true })
  notes?: string

  @Column({ type: "text", nullable: true })
  internalComments?: string

  // Tracking fields
  @Column({ type: "boolean", default: true })
  isActive!: boolean

  @Column({ type: "datetime", nullable: true })
  completedAt?: Date

  @Column({ type: "varchar", length: 255, nullable: true })
  completedBy?: string

  @Column({ type: "text", nullable: true })
  completionNotes?: string

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}
