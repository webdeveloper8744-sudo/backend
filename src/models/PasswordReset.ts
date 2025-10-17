import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm"

@Entity("password_resets")
export class PasswordReset {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column()
  email!: string

  @Column()
  code!: string

  @Column({ default: false })
  isUsed!: boolean

  @CreateDateColumn()
  createdAt!: Date

  @Column()
  expiresAt!: Date
}
