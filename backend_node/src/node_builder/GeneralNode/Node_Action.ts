import { WorkflowNode, StateType } from '../Node_Workflow';

export class ActionNode extends WorkflowNode {
    async execute(state: StateType): Promise<Partial<StateType>> {
        this.resolve_inputs(state);
        
        await this.log(
            state.current_run_id,
            `Node '${this.label}' (${this.category ? this.category : this.node_type}) started execution.`
        );
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const action_name = this.node_data.name ?? this.label;
        const output_msg = `Action '${action_name}' executed. Data transformation complete.`;
        state.variables[`${this.node_id}_result`] = "Done";
        
        this.output_data = "Done";
        state.variables[`${this.node_id}_output`] = this.Output();
        
        await this.log(state.current_run_id, output_msg);
        await this.log(state.current_run_id, `Node '${this.label}' completed execution.`);
        
        return {
            active_node: this.node_id,
            logs: [...state.logs, `[${this.label}] ${output_msg}`],
            variables: state.variables
        };
    }
}
