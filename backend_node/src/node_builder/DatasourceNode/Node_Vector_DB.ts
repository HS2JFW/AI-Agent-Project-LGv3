import { Datasource, WorkflowState } from "../Node_Workflow";
import { DataSource } from "typeorm";

export class VectorDBNode extends Datasource {
    async connect(conn_str?: string): Promise<DataSource | string> {
        if (!conn_str) {
            const params = this.node_data.parameters || {};
            conn_str = params.connectionString || "";
        }
        if (conn_str) {
            let type: any = "postgres";
            if (conn_str.startsWith("mysql")) type = "mysql";
            else if (conn_str.startsWith("sqlite")) type = "sqlite";
            else if (conn_str.startsWith("mssql")) type = "mssql";

            const dataSource = new DataSource({
                type: type,
                url: conn_str,
                synchronize: false,
            });
            await dataSource.initialize();
            return dataSource;
        }
        return "mock_vector_db_connection";
    }

    async query(connection: DataSource | string, sql_query?: string): Promise<Record<string, any>[]> {
        if (!sql_query) {
            const params = this.node_data.parameters || {};
            sql_query = params.sqlQuery || "";
        }
            
        if (connection === "mock_vector_db_connection" || !sql_query) {
            return [
                { id: 1, document: "Semantic search result: Advanced AI agent workflows", similarity: 0.92 },
                { id: 2, document: "Semantic search result: Graph-based task orchestrators", similarity: 0.85 },
                { id: 3, document: "Semantic search result: Sub-workflow isolation logic", similarity: 0.78 }
            ];
        }
        
        const dbConnection = connection as DataSource;
        const rawResults = await dbConnection.query(sql_query);
        const rows = Array.isArray(rawResults) ? rawResults.slice(0, 10) : [];
        
        const rows_data = rows.map(row => {
            const row_dict: Record<string, any> = {};
            for (const key of Object.keys(row)) {
                let val = row[key];
                if (Buffer.isBuffer(val)) {
                    val = val.toString('utf-8');
                } else if (typeof val !== 'number' && typeof val !== 'string' && typeof val !== 'boolean' && val !== null) {
                    val = String(val);
                }
                row_dict[key] = val;
            }
            return row_dict;
        });
        
        return rows_data;
    }

    async execute(state: WorkflowState): Promise<Record<string, any>> {
        this.resolve_inputs(state);
        
        await this.log(
            state.current_run_id,
            `Node '${this.label}' (${this.category ? this.category : this.node_type}) started execution.`
        );
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const params = this.node_data.parameters || {};
        const sql_query = params.sqlQuery || "";
        const conn_str = params.connectionString || "";
        const outputs: Record<string, any> = {};
        
        let output_msg = "";
        let engine: DataSource | string | null = null;
        
        try {
            engine = await this.connect(conn_str);
            const rows_data = await this.query(engine, sql_query);
            
            const preview_str = rows_data.map((r, idx) => `  Row ${idx+1}: ${JSON.stringify(r)}`).join("\n");
            output_msg = `Vector database query executed successfully.\nSQL Query: ${sql_query ? sql_query : 'Semantic Vector Query'}\nReturned ${rows_data.length} matches:\n${preview_str}`;
            
            state.variables[`${this.node_id}_db_result`] = rows_data;
            outputs["dbOutput"] = JSON.stringify(rows_data, null, 2);
            this.output_data = rows_data;
        } catch (e: any) {
            output_msg = `Vector DB Connection Error: ${e.message || String(e)}\nSQL Query: ${sql_query}`;
            state.variables[`${this.node_id}_db_error`] = e.message || String(e);
            outputs["dbOutput"] = JSON.stringify({
                status: "error",
                error: e.message || String(e),
                hint: "Double check your Vector DB parameters."
            }, null, 2);
            this.output_data = { status: "error", error: e.message || String(e) };
        } finally {
            if (engine && typeof engine !== "string" && (engine as DataSource).isInitialized) {
                await (engine as DataSource).destroy();
            }
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
