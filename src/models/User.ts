import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique } from "typeorm";

export type UserRole = "admin" | "manager" | "employee" | "guest";

@Entity()
@Unique(["email"])
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  fullName!: string;

  @Column()
  email!: string;

  @Column()
  phone!: string;

  @Column()
  password!: string;

  @Column({ type: "varchar", default: "employee" })
  role!: UserRole;

  @Column({ type: "text", nullable: true })
  imageUrl?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}