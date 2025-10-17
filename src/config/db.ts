
import "reflect-metadata";
import { DataSource } from "typeorm";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { User } from "../models/User";
import { Product } from "../models/Product";
import { Leads } from "../models/Lead";
import { LeadAssignment } from "../models/LeadAssignment"
import { LeadAssignmentHistory } from "../models/LeadAssignmentHistory"
import { LeadNotification } from "../models/LeadNotification"

dotenv.config();

const DB_NAME = process.env.DB_NAME || "newdb2";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: 3306,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: DB_NAME,
  synchronize: true, // auto-create tables
  entities: [User, Product, Leads, LeadAssignment, LeadAssignmentHistory, LeadNotification],
});

export async function initializeDatabase() {
  // ✅ Just initialize directly
  await AppDataSource.initialize();
  console.log("✅ Database & tables ready");
}

