import { WorkflowNode, StateType } from '../Node_Workflow';

export class ModelNode extends WorkflowNode {
    async execute(state: StateType): Promise<Partial<StateType>> {
        this.resolve_inputs(state);
        
        await this.log(
            state.current_run_id,
            `Node '${this.label}' (${this.category ? this.category : this.node_type}) started execution.`
        );
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const prompt = this.node_data.prompt ?? "No prompt set";
        const promptStr = String(prompt);
        const output_msg = `Model generated response using system prompt guideline: '${promptStr.substring(0, 40)}...'.`;
        state.variables[`${this.node_id}_response`] = "LLM Success Response";
        
        this.output_data = "LLM Success Response";
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
