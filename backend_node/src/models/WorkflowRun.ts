import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { Workflow } from "./Workflow";
import { ExecutionLog } from "./ExecutionLog";

@Entity("workflow_runs")
export class WorkflowRun {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 36 })
  workflow_id!: string;

  @ManyToOne(() => Workflow, (workflow) => workflow.runs, { onDelete: "CASCADE" })
  @JoinColumn({ name: "workflow_id" })
  workflow!: Workflow;

  @Column({ type: "varchar", length: 50, default: "pending" })
  status!: string;

  @Column({ type: "text", nullable: true })
  inputs?: string;

  @Column({ type: "text", nullable: true })
  outputs?: string;

  @Column({ type: "text", nullable: true })
  variables?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  current_node_id?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @OneToMany(() => ExecutionLog, (log) => log.run, { cascade: true })
  logs!: ExecutionLog[];
}
