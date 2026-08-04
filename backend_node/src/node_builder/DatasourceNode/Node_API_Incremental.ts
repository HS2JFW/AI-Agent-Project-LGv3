import { Datasource, WorkflowState } from "../Node_Workflow";

export class ApiIncrementalNode extends Datasource {
    async call_api(url: string, params_str: string, auth_header: string, anon_key_header: string, round_val: number, row_val: number): Promise<string> {
        const params = this.node_data.parameters || {};
        const func = (params.functionName || "").trim().toLowerCase();
        
        if (url && url.includes("supabase.co") && !url.includes("pdf_table")) {
            if (func.includes("getpdf")) {
                url = url.replace(/\/+$/, "") + "/rest/v1/pdf_table";
            }
        }
        
        const limit = row_val;
        const offset = (round_val - 1) * row_val;
        
        if (!params_str) {
            params_str = "select=number,date,file_url";
        } else {
            const searchParams = new URLSearchParams(params_str);
            searchParams.delete("limit");
            searchParams.delete("offset");
            params_str = searchParams.toString();
        }
        
        let incremental_key = (params.incrementalKey || "number").trim();
        if (!incremental_key) {
            incremental_key = "number";
        }
        
        let full_url = url;
        if (params_str) {
            if (!full_url.includes("?")) {
                full_url = `${full_url}?${params_str}`;
            } else {
                full_url = `${full_url}&${params_str}`;
            }
        }
        
        const separator = full_url.includes("?") ? "&" : "?";
        full_url = `${full_url}${separator}limit=${limit}&offset=${offset}&order=${incremental_key}.asc`;
        
        const headers: Record<string, string> = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        };
        if (auth_header) {
            headers['Authorization'] = auth_header;
        }
        if (anon_key_header) {
            headers['apikey'] = anon_key_header;
            if (!auth_header) {
                headers['Authorization'] = `Bearer ${anon_key_header}`;
            }
        }
        
        const response = await fetch(full_url, {
            method: 'GET',
            headers: headers
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - ${await response.text()}`);
        }
        
        return await response.text();
    }

    async execute(state: WorkflowState): Promise<Record<string, any>> {
        this.resolve_inputs(state);
        
        await this.log(
            state.current_run_id,
            `Node '${this.label}' (${this.node_type}) started execution.`
        );
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const params = this.node_data.parameters || {};
        const api_url = params.apiUrl || "";
        const api_params = params.apiParameters || "";
        const auth_header = params.authHeader || "";
        const anon_key_header = params.anonKeyHeader || "";
        
        let round_val = state.variables["run_count"] !== undefined 
            ? Number(state.variables["run_count"]) 
            : (params.round !== undefined ? Number(params.round) : 1);
            
        if (isNaN(round_val) || round_val < 1) {
            round_val = 1;
        }
        
        let row_val = params.row !== undefined ? Number(params.row) : 5;
        if (isNaN(row_val)) {
            row_val = 5;
        }
        
        const outputs: Record<string, any> = {};
        let output_msg = "";
        
        if (api_url) {
            try {
                const res_data = await this.call_api(api_url, api_params, auth_header, anon_key_header, round_val, row_val);
                
                try {
                    const parsed_json = JSON.parse(res_data);
                    output_msg = `API Incremental request executed successfully (Round ${round_val}, Row ${row_val}, Offset ${(round_val-1)*row_val}).\nResponse JSON:\n${JSON.stringify(parsed_json, null, 2)}`;
                    state.variables[`${this.node_id}_api_result`] = parsed_json;
                    outputs["apiOutput"] = JSON.stringify(parsed_json, null, 2);
                    
                    if (Array.isArray(parsed_json)) {
                        outputs["hasNext"] = parsed_json.length > 0;
                    } else if (parsed_json !== null && typeof parsed_json === 'object') {
                        outputs["hasNext"] = Object.keys(parsed_json).length > 0;
                    } else {
                        outputs["hasNext"] = false;
                    }
                    
                    state.variables.hasNext = outputs["hasNext"];
                    this.output_data = parsed_json;
                } catch (e) {
                    const preview = res_data.length > 300 ? res_data.substring(0, 300) + "..." : res_data;
                    output_msg = `API Incremental request executed successfully (Round ${round_val}, Row ${row_val}, Offset ${(round_val-1)*row_val}).\nResponse (Plain text):\n${preview}`;
                    state.variables[`${this.node_id}_api_result`] = res_data;
                    outputs["apiOutput"] = res_data;
                    outputs["hasNext"] = res_data.trim().length > 0;
                    state.variables.hasNext = outputs["hasNext"];
                    this.output_data = res_data;
                }
            } catch (e: any) {
                output_msg = `API Incremental request failed (Round ${round_val}, Row ${row_val}, Offset ${(round_val-1)*row_val}).\nError: ${e.message || String(e)}`;
                state.variables[`${this.node_id}_api_error`] = e.message || String(e);
                outputs["apiOutput"] = JSON.stringify({
                    status: "error",
                    error: e.message || String(e),
                    hint: "Double check your URL, headers, and parameters. Ensure the backend server has outbound network access."
                }, null, 2);
                outputs["hasNext"] = false;
                state.variables.hasNext = false;
                this.output_data = { status: "error", error: e.message || String(e) };
            }
        } else {
            output_msg = "API Incremental request failed: API Endpoint URL is empty.";
            outputs["apiOutput"] = JSON.stringify({
                status: "error",
                error: "Empty API Endpoint URL",
                hint: "Please configure a valid API Endpoint URL in the Properties Inspector."
            }, null, 2);
            this.output_data = { status: "error", error: "Empty API Endpoint URL" };
        }
        
        const new_round = round_val + 1;
        outputs["round"] = new_round;
        
        await this.log(state.current_run_id, output_msg);
        await this.log(state.current_run_id, `Node '${this.label}' completed execution.`);
        
        state.variables[`${this.node_id}_output`] = this.Output();
        
        if (this.node_complete_callback && Object.keys(outputs).length > 0) {
            await this.node_complete_callback(this.node_id, outputs);
        }
        
        return {
            active_node: this.node_id,
            logs: [...(state.logs || []), `[${this.label}] ${output_msg}`],
            variables: state.variables
        };
    }
}
