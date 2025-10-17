import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm"

@Entity("lead_assignment_history")
@Index(["assignmentId"])
@Index(["createdAt"])
export class LeadAssignmentHistory {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column({ type: "varchar", length: 36, comment: "References lead_assignment.id" })
  assignmentId!: string

  @Column({ type: "varchar", length: 36, comment: "References users.id - who made the change" })
  changedById!: string

  @Column({ type: "varchar", length: 255 })
  changedByName!: string

  @Column({ type: "varchar", length: 100 })
  action!: string // "status_changed", "priority_changed", "comment_added", "contacted", etc.

  @Column({ type: "varchar", length: 100, nullable: true })
  fieldName?: string // Which field was changed

  @Column({ type: "text", nullable: true })
  oldValue?: string

  @Column({ type: "text", nullable: true })
  newValue?: string

  @Column({ type: "text", nullable: true })
  comment?: string

  @CreateDateColumn()
  createdAt!: Date
}
