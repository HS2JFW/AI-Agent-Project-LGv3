import "reflect-metadata";
import { DataSource } from "typeorm";
import { Workflow } from "./models/Workflow";
import { WorkflowRun } from "./models/WorkflowRun";
import { ExecutionLog } from "./models/ExecutionLog";

export const AppDataSource = new DataSource({
  type: "better-sqlite3",
  database: "workflow_app.db",
  synchronize: true, // Auto create tables
  logging: false,
  entities: [Workflow, WorkflowRun, ExecutionLog],
  subscribers: [],
  migrations: [],
});

export const initializeDatabase = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("Data Source has been initialized!");
    }
  } catch (err) {
    console.error("Error during Data Source initialization", err);
  }
};
