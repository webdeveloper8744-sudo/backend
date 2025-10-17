import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm"

@Entity("lead_notifications")
@Index(["userId"])
@Index(["assignmentId"])
@Index(["isViewed"])
export class LeadNotification {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column({ type: "varchar", length: 36, comment: "References lead_assignment.id" })
  assignmentId!: string

  @Column({ type: "varchar", length: 36, comment: "References users.id - who received the notification" })
  userId!: string

  @Column({ type: "varchar", length: 255 })
  userName!: string

  @Column({ type: "varchar", length: 255 })
  leadClientName!: string

  @Column({ type: "varchar", length: 255 })
  leadClientCompany!: string

  @Column({ type: "varchar", length: 100, default: "assignment_created" })
  notificationType!: string // "assignment_created", "assignment_updated", "assignment_reassigned"

  @Column({ type: "text", nullable: true })
  message?: string

  @Column({ type: "boolean", default: false })
  isViewed!: boolean

  @Column({ type: "datetime", nullable: true })
  viewedAt?: Date

  @CreateDateColumn()
  createdAt!: Date
}
