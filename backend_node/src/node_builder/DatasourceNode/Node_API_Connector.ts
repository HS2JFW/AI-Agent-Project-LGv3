import { Datasource, WorkflowState } from "../Node_Workflow";

export class ApiConnectorNode extends Datasource {
    async call_api(url?: string, params_str?: string, auth_header?: string, anon_key_header?: string): Promise<string> {
        if (!url) {
            const params = this.node_data.parameters || {};
            url = params.apiUrl || "";
        }
        if (!params_str) {
            const params = this.node_data.parameters || {};
            params_str = params.apiParameters || "";
        }
        if (!auth_header) {
            const params = this.node_data.parameters || {};
            auth_header = params.authHeader || "";
        }
        if (!anon_key_header) {
            const params = this.node_data.parameters || {};
            anon_key_header = params.anonKeyHeader || "";
        }
        
        const params = this.node_data.parameters || {};
        const func = (params.functionName || "").trim().toLowerCase();
        
        if (url && url.includes("supabase.co")) {
            if (!url.includes("pdf_table") && func.includes("getpdf")) {
                url = url.replace(/\/+$/, "") + "/rest/v1/pdf_table";
            }
            if (url.includes("pdf_table") && !params_str && func.includes("getpdf")) {
                params_str = "select=number,date,file_url";
            }
        }

        let full_url = url || "";
        if (params_str) {
            if (params_str.startsWith('{') && params_str.endsWith('}')) {
                try {
                    const p_dict = JSON.parse(params_str);
                    const queryParams = new URLSearchParams(p_dict).toString();
                    full_url = `${full_url}?${queryParams}`;
                } catch {
                    full_url = `${full_url}?${params_str}`;
                }
            } else {
                const separator = full_url.includes("?") ? "&" : "?";
                full_url = `${full_url}${separator}${params_str}`;
            }
        }
        
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
            `Node '${this.label}' (${this.category ? this.category : this.node_type}) started execution.`
        );
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const params = this.node_data.parameters || {};
        const api_url = params.apiUrl || "";
        const api_params = params.apiParameters || "";
        const auth_header = params.authHeader || "";
        const anon_key_header = params.anonKeyHeader || "";
        const outputs: Record<string, any> = {};
        
        let output_msg = "";
        
        if (api_url) {
            try {
                const res_data = await this.call_api(api_url, api_params, auth_header, anon_key_header);
                
                try {
                    const parsed_json = JSON.parse(res_data);
                    output_msg = `API request executed successfully.\nEndpoint: ${api_url}\nResponse JSON:\n${JSON.stringify(parsed_json, null, 2)}`;
                    state.variables[`${this.node_id}_api_result`] = parsed_json;
                    outputs["apiOutput"] = JSON.stringify(parsed_json, null, 2);
                    this.output_data = parsed_json;
                } catch (e) {
                    const preview = res_data.length > 300 ? res_data.substring(0, 300) + "..." : res_data;
                    output_msg = `API request executed successfully.\nEndpoint: ${api_url}\nResponse (Plain text):\n${preview}`;
                    state.variables[`${this.node_id}_api_result`] = res_data;
                    outputs["apiOutput"] = res_data;
                    this.output_data = res_data;
                }
            } catch (e: any) {
                output_msg = `API request failed.\nEndpoint: ${api_url}\nError: ${e.message || String(e)}`;
                state.variables[`${this.node_id}_api_error`] = e.message || String(e);
                outputs["apiOutput"] = JSON.stringify({
                    status: "error",
                    error: e.message || String(e),
                    hint: "Double check your URL, headers, and parameters. Ensure the backend server has outbound network access to the target endpoint."
                }, null, 2);
                this.output_data = { status: "error", error: e.message || String(e) };
            }
        } else {
            output_msg = "API request failed: API Endpoint URL is empty.";
            outputs["apiOutput"] = JSON.stringify({
                status: "error",
                error: "Empty API Endpoint URL",
                hint: "Please configure a valid API Endpoint URL in the Properties Inspector."
            }, null, 2);
            this.output_data = { status: "error", error: "Empty API Endpoint URL" };
        }

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
