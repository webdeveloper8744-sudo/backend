import { DataSource } from "typeorm";
// import { Product } from "./models/Product";
// import { Employee } from "./models/Employee";
// import { Users } from "./models/Users";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: 3306,
  username: process.env.DB_USER || "admin",
  password: process.env.DB_PASSWORD || "admin#123",
  database: process.env.DB_NAME || "crm",
  synchronize: true, // ⚡ auto-create DB schema
  // entities: [Product, Employee, Users],
});