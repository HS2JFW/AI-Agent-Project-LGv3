import { Datasource, WorkflowState } from "../Node_Workflow";
import { DataSource } from "typeorm";

export class SupabaseNode extends Datasource {
    async connect(conn_str?: string): Promise<DataSource> {
        if (!conn_str) {
            const params = this.node_data.parameters || {};
            conn_str = params.connectionString || "";
        }
        if (!conn_str) {
            throw new Error("Supabase connection string is required");
        }
        
        const dataSource = new DataSource({
            type: "postgres",
            url: conn_str,
            synchronize: false,
        });
        
        await dataSource.initialize();
        return dataSource;
    }

    async query(connection: DataSource, sql_query?: string): Promise<Record<string, any>[]> {
        if (!sql_query) {
            const params = this.node_data.parameters || {};
            sql_query = params.sqlQuery || "";
        }
        
        const rawResults = await connection.query(sql_query || "");
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
        
        if (conn_str && sql_query) {
            let engine: DataSource | null = null;
            try {
                engine = await this.connect(conn_str);
                const rows_data = await this.query(engine, sql_query);
                
                const preview_str = rows_data.map((r, idx) => `  Row ${idx+1}: ${JSON.stringify(r)}`).join("\n");
                output_msg = `Supabase database query executed successfully.\nConnection: ${conn_str}\nSQL Query: ${sql_query}\nColumns: ${rows_data.length > 0 ? Object.keys(rows_data[0]) : []}\nReturned ${rows_data.length} rows:\n${preview_str}`;
                
                state.variables[`${this.node_id}_db_result`] = rows_data;
                outputs["dbOutput"] = JSON.stringify(rows_data, null, 2);
                this.output_data = rows_data;
            } catch (e: any) {
                output_msg = `Supabase Connection Error: ${e.message || String(e)}\nConnection String: ${conn_str}\nSQL Query: ${sql_query}`;
                state.variables[`${this.node_id}_db_error`] = e.message || String(e);
                outputs["dbOutput"] = JSON.stringify({
                    status: "error",
                    error: e.message || String(e),
                    hint: "Double check your Supabase connection string and SQL query. Ensure the database is accessible."
                }, null, 2);
                this.output_data = { status: "error", error: e.message || String(e) };
            } finally {
                if (engine && engine.isInitialized) {
                    await engine.destroy();
                }
            }
        } else {
            output_msg = "Supabase Node: Connection or query parameters are missing.";
            outputs["dbOutput"] = JSON.stringify({
                status: "error",
                error: "Missing connectionString or sqlQuery"
            }, null, 2);
            this.output_data = { status: "error", error: "Missing connectionString or sqlQuery" };
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
