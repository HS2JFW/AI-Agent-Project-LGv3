import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { WorkflowRun } from "./WorkflowRun";

@Entity("workflows")
export class Workflow {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "text", default: "[]" })
  nodes!: string;

  @Column({ type: "text", default: "[]" })
  edges!: string;

  @Column({ type: "text", default: "[]", nullable: true })
  agent_nodes?: string;

  @Column({ type: "text", default: "[]", nullable: true })
  agent_edges?: string;

  @Column({ type: "text", default: "[]", nullable: true })
  ai_models?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @OneToMany(() => WorkflowRun, (run) => run.workflow, { cascade: true })
  runs!: WorkflowRun[];
}
