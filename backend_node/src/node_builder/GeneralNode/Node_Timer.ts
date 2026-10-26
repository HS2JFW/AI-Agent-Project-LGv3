import { WorkflowNode, StateType } from '../Node_Workflow';

export class Timer extends WorkflowNode {
    async execute(state: StateType): Promise<Partial<StateType>> {
        this.resolve_inputs(state);

        await this.log(
            state.current_run_id,
            `Node '${this.label}' (${this.node_type}) started execution.`
        );
        await new Promise(r => setTimeout(r, 500));
        
        const run_count = state.variables["run_count"];
        let output_msg: string;
        if (run_count !== undefined && run_count !== null) {
            output_msg = `Timer trigger fired (Round ${run_count}). Propagating execution to successor path.`;
        } else {
            output_msg = `Timer trigger fired. Propagating execution to successor path.`;
        }
            
        await this.log(state.current_run_id, output_msg);
        await this.log(state.current_run_id, `Node '${this.label}' completed execution.`);
        
        this.output_data = "Triggered";
        
        // We no longer manually execute successor nodes here.
        // LangGraph will natively traverse the edges and execute the next nodes,
        // ensuring they only run once per cycle and state is properly maintained.
        
        if (this.node_complete_callback) {
            await this.node_complete_callback(this.node_id, { status: "success", trigger: "fired" });
        }
            
        return {
            active_node: this.node_id,
            logs: [`[${this.label}] ${output_msg}`],
            variables: {
                [this.node_id + "_output"]: this.Output()
            }
        };
    }
}

export class Workflow_Timer extends Timer {}

export { Timer as TimerNode };
