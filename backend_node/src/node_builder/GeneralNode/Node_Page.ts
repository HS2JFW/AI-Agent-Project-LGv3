import { WorkflowNode, WorkflowState } from '../Node_Workflow';

export class Page extends WorkflowNode {
    incoming_node_ids: string[];
    edges_list: any[];

    constructor(
        node_id: string,
        node_type: string,
        node_data: any,
        log_callback?: (run_id: string, message: string) => Promise<any>,
        node_complete_callback?: (node_id: string, outputs: any) => Promise<any>,
        incoming_node_ids?: string[],
        edges_list?: any[]
    ) {
        super(node_id, node_type, node_data, log_callback, node_complete_callback);
        this.incoming_node_ids = incoming_node_ids || [];
        this.edges_list = edges_list || [];
    }

    async execute(state: WorkflowState): Promise<any> {
        this.resolve_inputs(state);

        await this.log(
            state.current_run_id,
            `Node '${this.label}' (${this.category ? this.category : this.node_type}) started execution.`
        );
        
        await new Promise(resolve => setTimeout(resolve, 1500));

        let received_data: any = {};

        // Check input_data via standard Input() method
        if (this.input_data !== undefined && this.input_data !== null) {
            if (typeof this.input_data === 'object' && !Array.isArray(this.input_data)) {
                Object.assign(received_data, this.input_data);
            } else {
                received_data["input"] = this.input_data;
            }
        }

        // Check direct target node input_data
        let direct_input = state.variables[`${this.node_id}_input_data`];
        if (direct_input && typeof direct_input === 'object' && !Array.isArray(direct_input)) {
            Object.assign(received_data, direct_input);
        }

        // Also check all field-specific variables sent to this node
        let prefix = `_to_${this.node_id}`;
        for (const [key, val] of Object.entries(state.variables)) {
            if (key.endsWith(prefix) && val && typeof val === 'object' && !Array.isArray(val)) {
                Object.assign(received_data, val);
            }
        }

        // If no specific sent fields, gather inputs from incoming nodes directly (fallback)
        if (Object.keys(received_data).length === 0) {
            for (const src_id of this.incoming_node_ids) {
                let db_res = state.variables[`${src_id}_db_result`];
                if (db_res) {
                    received_data[`${src_id}_db_result`] = db_res;
                }
                let api_res = state.variables[`${src_id}_api_result`];
                if (api_res) {
                    received_data[`${src_id}_api_result`] = api_res;
                }
                let gen_res = state.variables[`${src_id}_json_data`];
                if (gen_res) {
                    received_data[`${src_id}_json_data`] = gen_res;
                }
            }
        }

        let formatted_json = JSON.stringify(received_data, null, 2);
        let output_msg = `Page received data:\n${formatted_json}`;

        let outputs = { pageOutput: formatted_json };
        state.variables[`${this.node_id}_page_output`] = received_data;

        this.output_data = received_data;
        state.variables[`${this.node_id}_output`] = this.Output();

        await this.log(state.current_run_id, output_msg);
        await this.log(state.current_run_id, `Node '${this.label}' completed execution.`);

        if (this.node_complete_callback) {
            await this.node_complete_callback(this.node_id, outputs);
        }

        return {
            active_node: this.node_id,
            logs: [...state.logs, `[${this.label}] ${output_msg}`],
            variables: state.variables
        };
    }
}
