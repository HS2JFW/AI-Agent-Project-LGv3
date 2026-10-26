import { Datasource, WorkflowState } from "../Node_Workflow";
import path from "path";
import util from "util";
import { execFile } from "child_process";

const execFileAsync = util.promisify(execFile);

export class DuckDB_Engine extends Datasource {
  constructor(
    node_id: string,
    node_type: string,
    node_data: any,
    log_callback?: any,
    node_complete_callback?: any
  ) {
    super(node_id, node_type, node_data, log_callback, node_complete_callback);
  }

  async connect(): Promise<any> {
    return { connected: true, engine: "duckdb_in_memory" };
  }

  async query(_connection: any, _sql_query?: string): Promise<Record<string, any>[]> {
    return [];
  }

  Show_Result(rows_data: Record<string, any>[]): string {
    return JSON.stringify(rows_data, null, 2);
  }

  async execute(state: WorkflowState): Promise<Record<string, any>> {
    const params = this.node_data.parameters || {};
    const sqlQuery = params.sqlQuery || params.query || state.variables?.dynamic_sql || "SELECT 1;";
    const timeout = params.statementTimeout ? parseInt(params.statementTimeout, 10) : 10;
    const maxRows = params.maxRows ? parseInt(params.maxRows, 10) : 200;

    let parquetFiles: string[] = [];
    if (Array.isArray(params.parquetFiles) && params.parquetFiles.length > 0) {
      parquetFiles = params.parquetFiles;
    } else if (Array.isArray(state.variables?.parquet_files) && state.variables.parquet_files.length > 0) {
      parquetFiles = state.variables.parquet_files;
    }

    await this.log(
      state.current_run_id,
      `[DuckDB Engine] Executing SQL on ${parquetFiles.length} Parquet file(s)...`,
      "INFO"
    );

    const pythonScript = path.join(__dirname, "..", "..", "analytics_engine.py");
    const cliArgs = [
      "--action", "query",
      "--sql", sqlQuery,
      "--timeout", String(timeout),
      "--max_rows", String(maxRows)
    ];

    if (parquetFiles.length > 0) {
      cliArgs.push("--input_files", ...parquetFiles);
    }

    try {
      const { stdout, stderr } = await execFileAsync("python", [pythonScript, ...cliArgs], {
        maxBuffer: 25 * 1024 * 1024,
        encoding: "utf-8"
      });

      if (stderr && stderr.trim().length > 0) {
        await this.log(state.current_run_id, `[DuckDB Warning] ${stderr.trim()}`, "WARNING");
      }

      const result = JSON.parse(stdout.trim());

      if (result.status === "error") {
        await this.log(
          state.current_run_id,
          `[DuckDB Error] Query failed: ${result.error}`,
          "ERROR"
        );
        throw new Error(result.error);
      }

      await this.log(
        state.current_run_id,
        `[DuckDB Success] Query returned ${result.returned_rows || 0} rows in ${result.execution_time_ms} ms.`,
        "INFO"
      );

      this.output_data = {
        query_results: result.data || [],
        columns: result.columns || [],
        total_matched_rows: result.total_matched_rows || 0,
        returned_rows: result.returned_rows || 0,
        execution_time_ms: result.execution_time_ms || 0
      };

      state.variables.query_results = result.data || [];
      state.variables.last_duckdb_result = result.data || [];

      if (this.node_complete_callback) {
        await this.node_complete_callback(this.node_id, this.output_data);
      }

      return this.output_data;
    } catch (err: any) {
      await this.log(
        state.current_run_id,
        `[DuckDB Error] ${err.message}`,
        "ERROR"
      );
      throw err;
    }
  }
}
