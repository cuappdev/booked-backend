import "reflect-metadata";
import { DataSource } from "typeorm";

const dbConfig = require("../ormconfig");

export const AppDataSource = new DataSource(dbConfig);
