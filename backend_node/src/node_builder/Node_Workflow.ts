import * as fs from 'fs';
import * as path from 'path';
const LOGS_DIR = path.join(__dirname, '..', '..', 'logs');
const AI_LOG_FILE = path.join(LOGS_DIR, 'ai.log');
import { Annotation } from "@langchain/langgraph";
import { create_node_instance } from "../graph_translator";

export const WorkflowState = Annotation.Root({
  current_run_id: Annotation<string>(),
  workflow_id: Annotation<string>({
    reducer: (x, y) => y,
    default: () => "",
  }),
  logs: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  variables: Annotation<Record<string, any>>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
  active_node: Annotation<string>({
    reducer: (x, y) => y,
    default: () => "",
  }),
  messages: Annotation<any[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

export type WorkflowState = typeof WorkflowState.State & { workflow_id?: string; [key: string]: any };
export type StateType = WorkflowState;

function getCallerSourceInfo(): { file: string; func: string } {
  try {
    const err = new Error();
    const stack = (err.stack || "").split('\n');
    for (let i = 2; i < stack.length; i++) {
      const line = stack[i].trim();
      if (line && !line.includes('Node_Workflow.') && !line.includes('WorkflowNode.log') && !line.includes('getCallerSourceInfo')) {
        const matchFunc = line.match(/at\s+([^\s(]+)\s+\(/) || line.match(/at\s+([^\s(]+)/);
        let func = matchFunc ? matchFunc[1].split('.').pop() || matchFunc[1] : 'anonymous';
        if (func === 'Object.<anonymous>' || func.includes('/')) func = 'execute';
        const matchFile = line.match(/([^/\\()\s]+\.(?:ts|js))(?::\d+(?::\d+)?)?/);
        const file = matchFile ? matchFile[1] : 'Node_Workflow.ts';
        return { file, func };
      }
    }
  } catch (e) {
    // fallback
  }
  return { file: 'Node_Workflow.ts', func: 'execute' };
}

export class WorkflowNode {
  [key: string]: any;
  node_id: string;
  node_type: string;
  node_data: any;
  label: string;
  category: string;
  log_callback?: (run_id: string, node_id: string, message: string, level?: string) => Promise<void>;
  node_complete_callback?: (node_id: string, result: any) => Promise<void>;
  input_data: any = null;
  output_data: any = null;

  get nodeId(): string { return this.node_id; }
  set nodeId(val: string) { this.node_id = val; }
  get nodeType(): string { return this.node_type; }
  set nodeType(val: string) { this.node_type = val; }
  get nodeData(): any { return this.node_data; }
  set nodeData(val: any) { this.node_data = val; }
  get data(): any { return this.node_data; }
  set data(val: any) { this.node_data = val; }
  get inputData(): any { return this.input_data; }
  set inputData(val: any) { this.input_data = val; }
  get outputData(): any { return this.output_data; }
  set outputData(val: any) { this.output_data = val; }
  get nodeCompleteCallback() { return this.node_complete_callback; }
  set nodeCompleteCallback(val: any) { this.node_complete_callback = val; }
  get logCallback() { return this.log_callback; }
  set logCallback(val: any) { this.log_callback = val; }

  async log(state_or_run_id: any, message?: string, level?: string): Promise<void> {
    const run_id = typeof state_or_run_id === 'string' ? state_or_run_id : (state_or_run_id?.current_run_id || "");
    const rawMsg = message || (typeof state_or_run_id === 'string' ? state_or_run_id : JSON.stringify(state_or_run_id));
    
    let msg = rawMsg;
    if (!rawMsg.startsWith('[File:')) {
      const source = getCallerSourceInfo();
      const className = this.constructor && this.constructor.name !== 'Object' ? this.constructor.name : (this.nodeType || 'WorkflowNode');
      msg = `[File: ${source.file} | Class: ${className} | Method: ${source.func}] ${rawMsg}`;
    }

    if (this.node_type?.toLowerCase().includes("agent") || this.label?.toLowerCase().includes("agent") || (this.constructor && this.constructor.name.toLowerCase().includes("agent"))) {
      const ts = new Date().toISOString();
      try {
        fs.appendFileSync(AI_LOG_FILE, `[${ts}] [${run_id}] [${this.label || this.node_id}] ${msg}\n`);
      } catch (e) {
        // Ignore file write errors for logs
      }
    }

    if (this.log_callback && run_id) {
      await this.log_callback(run_id, this.node_id, msg, level || 'INFO');
    } else {
      console.log(`[${this.label || this.node_id}]`, msg);
    }
  }

  constructor(
    node_id: string,
    node_type: string,
    node_data: any,
    log_callback?: (run_id: string, node_id: string, message: string, level?: string) => Promise<void>,
    node_complete_callback?: (node_id: string, result: any) => Promise<void>
  ) {
    this.node_id = node_id;
    this.node_type = node_type;
    this.node_data = node_data;
    this.label = node_data?.label || node_type;
    this.category = node_data?.category || "";
    this.log_callback = log_callback;
    this.node_complete_callback = node_complete_callback;
  }

  Input(data: any): void {
    this.input_data = data;
  }

  Output(): any {
    return this.output_data;
  }

  Trigger_Timer(): void {
    this.input_data = "Triggered";
    console.log(`Node '${this.label}' (${this.node_type}) triggered by Timer node.`);
  }

  resolve_inputs(state: StateType): void {
    const wf_nodes = state.variables._workflow_nodes || [];
    const wf_edges = state.variables._workflow_edges || [];

    const incoming_edges = wf_edges.filter((e: any) => e.target === this.node_id);

    for (const edge of incoming_edges) {
      const src_id = edge.source;
      if (!src_id) continue;

      const pred_node = wf_nodes.find((n: any) => n.id === src_id);
      if (!pred_node) continue;

      const pred_type = pred_node.type || "customNode";
      const pred_data = pred_node.data || {};

      const pred_instance = create_node_instance(
        src_id,
        pred_type,
        pred_data,
        this.log_callback,
        this.node_complete_callback
      );

      let output_value = state.variables[src_id + "_output"];
      if (output_value === undefined) output_value = state.variables[src_id + "_db_result"];
      if (output_value === undefined) output_value = state.variables[src_id + "_api_result"];
      if (output_value === undefined) output_value = state.variables[src_id + "_json_data"];
      
      // Fallback
      if (output_value === undefined) {
        output_value = pred_instance.Output();
      }

      this.Input(output_value);
    }
  }

  getOutput(): any {
    return this.output_data;
  }

  async execute(state: StateType): Promise<Partial<StateType>> {
    this.resolve_inputs(state);

    await this.log(
      state.current_run_id,
      `Node '${this.label}' (${this.category || this.node_type}) started execution.`
    );
    
    // Simulate some work
    await new Promise(r => setTimeout(r, 1500));

    const output_msg = `Processed node: ${this.label}`;
    await this.log(state.current_run_id, output_msg);
    await this.log(state.current_run_id, `Node '${this.label}' completed execution.`);

    this.output_data = output_msg;
    
    return {
      active_node: this.node_id,
      logs: [`[${this.label}] ${output_msg}`],
      variables: {
        [this.node_id + "_output"]: this.Output()
      }
    };
  }
}

export class Datasource extends WorkflowNode {}
