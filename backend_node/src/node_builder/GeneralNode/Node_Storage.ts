import { WorkflowNode, StateType } from '../Node_Workflow';

export class Storage extends WorkflowNode {
    incoming_node_ids: string[];
    edges_list: any[];

    constructor(
        node_id: string,
        node_type: string,
        node_data: any,
        log_callback?: (run_id: string, node_id: string, message: string, level?: string) => Promise<void>,
        node_complete_callback?: (node_id: string, result: any) => Promise<void>,
        incoming_node_ids?: string[],
        edges_list?: any[]
    ) {
        super(node_id, node_type, node_data, log_callback, node_complete_callback);
        this.incoming_node_ids = incoming_node_ids || [];
        this.edges_list = edges_list || [];
    }

    async execute(state: StateType): Promise<Partial<StateType>> {
        this.resolve_inputs(state);
        
        await this.log(
            state.current_run_id,
            `Node '${this.label}' (Storage Credentials) started execution.`
        );
        await new Promise(r => setTimeout(r, 500));
        
        const params = this.node_data?.parameters || {};
        const supabase_url = (params.supabaseUrl || "").trim();
        const supabase_key = (params.supabaseKey || "").trim();
        const bucket_name = (params.bucketName || "").trim();
        
        // Save credentials in global state variables for downstream nodes (e.g. PDF Queue) to pick up
        const outputs = {
            supabaseUrl: supabase_url,
            supabaseKey: supabase_key,
            bucketName: bucket_name
        };
        this.output_data = outputs;
        
        await this.log(
            state.current_run_id,
            `Configured Storage credentials: URL=${supabase_url}, Bucket=${bucket_name}.`
        );
        await this.log(state.current_run_id, `Node '${this.label}' completed execution.`);
        
        if (this.node_complete_callback) {
            await this.node_complete_callback(this.node_id, outputs);
        }
            
        return {
            active_node: this.node_id,
            logs: [`[${this.label}] Configured Storage credentials for Supabase.`],
            variables: {
                "supabase_project_url": supabase_url,
                "supabase_service_role_key": supabase_key,
                "supabase_storage_bucket": bucket_name,
                [this.node_id + "_output"]: outputs
            }
        };
    }
}
