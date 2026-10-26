import { WorkflowNode, WorkflowState } from '../Node_Workflow';

export class JSON_Connector extends WorkflowNode {
    incoming_node_ids: string[];
    edges_list: any[];

    constructor(
        node_id: string,
        node_type: string,
        node_data: any,
        log_callback?: (runId: string, msg: string) => any,
        node_complete_callback?: (nodeId: string, outputs: any) => any,
        incoming_node_ids: string[] = [],
        edges_list: any[] = []
    ) {
        super(node_id, node_type, node_data, log_callback, node_complete_callback);
        this.incoming_node_ids = incoming_node_ids || [];
        this.edges_list = edges_list || [];
        
        if (!this.node_data.parameters) {
            this.node_data.parameters = {};
        }
        if (!this.node_data.parameters.fields) {
            this.node_data.parameters.fields = [];
        }
    }

    GetJSON(state: WorkflowState): string {
        if (this.input_data !== undefined && this.input_data !== null) {
            if (typeof this.input_data === 'string') {
                return this.input_data;
            }
            return JSON.stringify(this.input_data);
        }
        
        // Fallback to legacy variables
        for (const src_id of this.incoming_node_ids) {
            const db_res = state.variables[`${src_id}_db_result`];
            if (db_res) return JSON.stringify(db_res);
            
            const api_res = state.variables[`${src_id}_api_result`];
            if (api_res) return JSON.stringify(api_res);
            
            const gen_res = state.variables[`${src_id}_json_data`];
            if (gen_res) return JSON.stringify(gen_res);
            
            const notif_res = state.variables[`${src_id}_notification`];
            if (notif_res) return JSON.stringify({ notification: notif_res });
        }
        return "{}";
    }

    AddField(field_name: string): void {
        const fields: string[] = this.node_data.parameters.fields || [];
        if (!fields.includes(field_name)) {
            fields.push(field_name);
        }
        this.node_data.parameters.fields = fields;
    }

    DeleteField(field_name: string): void {
        let fields: string[] = this.node_data.parameters.fields || [];
        if (fields.includes(field_name)) {
            fields = fields.filter(f => f !== field_name);
        }
        this.node_data.parameters.fields = fields;
    }

    SendField(state: WorkflowState, field_name: string, field_value: any, target_node_id: string): void {
        const payload: Record<string, any> = {};
        payload[field_name] = field_value;
        state.variables[`${this.node_id}_field_${field_name}_to_${target_node_id}`] = payload;
        state.variables[`${target_node_id}_input_data`] = payload;
    }

    async execute(state: WorkflowState): Promise<any> {
        this.resolve_inputs(state);
        
        await this.log(
            state.current_run_id,
            `Node '${this.label}' (${this.category ? this.category : this.node_type}) started execution.`
        );
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const json_text = this.GetJSON(state);
        
        let parsed_data: any = {};
        try {
            parsed_data = JSON.parse(json_text);
        } catch (e: any) {
            await this.log(state.current_run_id, `Error parsing received JSON payload: ${e.message}`);
        }
        
        const fields = this.node_data.parameters?.fields || [];
        await this.log(state.current_run_id, `Extracting and filtering JSON fields: ${JSON.stringify(fields)}`);
        
        let filtered_data: any = null;
        if (Array.isArray(parsed_data)) {
            filtered_data = [];
            for (const row of parsed_data) {
                if (typeof row === 'object' && row !== null) {
                    const filtered_row: Record<string, any> = {};
                    for (const f of fields) {
                        if (f in row) {
                            filtered_row[f] = row[f];
                        }
                    }
                    filtered_data.push(filtered_row);
                } else {
                    filtered_data.push(row);
                }
            }
        } else if (typeof parsed_data === 'object' && parsed_data !== null) {
            filtered_data = {};
            for (const f of fields) {
                if (f in parsed_data) {
                    filtered_data[f] = parsed_data[f];
                }
            }
        } else {
            filtered_data = {};
        }
        
        const sent_logs: string[] = [];
        for (const edge of this.edges_list) {
            if (edge.source === this.node_id) {
                const target_node_id = edge.target;
                state.variables[`${target_node_id}_input_data`] = filtered_data;
                sent_logs.push(`Filtered JSON forwarded to target node '${target_node_id}' as JSON: ${JSON.stringify(filtered_data)}`);
            }
        }

        let output_msg = "";
        if (sent_logs.length > 0) {
            output_msg = sent_logs.join("\n");
        } else {
            output_msg = `JSON Connector executed. Filtered: ${JSON.stringify(filtered_data)}`;
        }
            
        state.variables[`${this.node_id}_json_data`] = filtered_data;
        
        await this.log(state.current_run_id, output_msg);
        await this.log(state.current_run_id, `Node '${this.label}' completed execution.`);
        
        this.output_data = filtered_data;
        state.variables[`${this.node_id}_output`] = this.Output();
        
        if (this.node_complete_callback) {
            const outputs = { jsonOutput: JSON.stringify(filtered_data, null, 2) };
            await this.node_complete_callback(this.node_id, outputs);
        }
            
        return {
            active_node: this.node_id,
            logs: [...(state.logs || []), `[${this.label}] ${output_msg}`],
            variables: state.variables
        };
    }
}

export { JSON_Connector as JSONConnectorNode, JSON_Connector as JSONConnector };
