import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { WorkflowRun } from "./WorkflowRun";

@Entity("execution_logs")
export class ExecutionLog {
  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Column({ type: "varchar", length: 36 })
  run_id!: string;

  @ManyToOne(() => WorkflowRun, (run) => run.logs, { onDelete: "CASCADE" })
  @JoinColumn({ name: "run_id" })
  run!: WorkflowRun;

  @Column({ type: "varchar", length: 255, nullable: true })
  node_id?: string;

  @Column({ type: "text" })
  message!: string;

  @Column({ type: "varchar", length: 50, default: "INFO" })
  level!: string;

  @CreateDateColumn()
  timestamp!: Date;
}
