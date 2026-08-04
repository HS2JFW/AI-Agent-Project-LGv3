import { WorkflowNode, StateType } from '../Node_Workflow';

export class StateNode extends WorkflowNode {
    async execute(state: StateType): Promise<Partial<StateType>> {
        this.resolve_inputs(state);
        
        await this.log(
            state.current_run_id,
            `Node '${this.label}' (State Viewer) started execution.`
        );
        
        // Pull interesting variables
        const vars_dict: Record<string, any> = {};
        const keys_to_pull = ["pdf_queue", "queue_length", "current_index", "current_url", "has_next", "extracted_text", "deduplicated_text", "structured_json"];
        
        for (const k of keys_to_pull) {
            if (state.variables && k in state.variables) {
                vars_dict[k] = state.variables[k];
            }
        }
                
        // Format a clean representation
        let summary = "=== LANGGRAPH ACTIVE STATE VARIABLE SUMMARY ===\n\n";
        summary += `1. Total files in Queue: ${vars_dict['queue_length'] || 0}\n`;
        summary += `2. Current Index: ${vars_dict['current_index'] || 0}\n`;
        summary += `3. Current URL: '${vars_dict['current_url'] || ''}'\n`;
        summary += `4. Has Next File: ${vars_dict['has_next'] || false}\n`;
        
        if ("pdf_queue" in vars_dict && Array.isArray(vars_dict["pdf_queue"])) {
            summary += "\nQueue URLs:\n";
            vars_dict["pdf_queue"].forEach((url: string, i: number) => {
                const prefix = (i + 1 === (vars_dict['current_index'] || 0)) ? "-> " : "   ";
                summary += `${prefix}[${i + 1}] ${url}\n`;
            });
        }
                
        if ("extracted_text" in vars_dict) {
            summary += `\n5. Last Extracted Text (Core Assertions Preview):\n${String(vars_dict['extracted_text']).substring(0, 300)}...\n`;
        }
        if ("deduplicated_text" in vars_dict) {
            summary += `\n6. Last De-duplicated Text Preview:\n${String(vars_dict['deduplicated_text']).substring(0, 300)}...\n`;
        }
        if ("structured_json" in vars_dict) {
            let jsonStr = typeof vars_dict['structured_json'] === 'string' 
                ? vars_dict['structured_json'] 
                : JSON.stringify(vars_dict['structured_json']);
            summary += `\n7. Last Structured JSON Parse Preview:\n${jsonStr.substring(0, 300)}...\n`;
        }
            
        await this.log(state.current_run_id, "Loaded current LangGraph workflow state details.");
        
        this.output_data = summary;
        
        const outputs = {
            stateOutput: summary
        };
        
        await this.log(state.current_run_id, `Node '${this.label}' completed.`);
        if (this.node_complete_callback && outputs) {
            await this.node_complete_callback(this.node_id, outputs);
        }
            
        return {
            active_node: this.node_id,
            logs: [`[${this.label}] Loaded active state summary`],
            variables: {
                [this.node_id + "_output"]: this.Output()
            }
        };
    }
}
