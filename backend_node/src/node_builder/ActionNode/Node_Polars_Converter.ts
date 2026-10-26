import { WorkflowNode, WorkflowState } from "../Node_Workflow";
import path from "path";
import util from "util";
import { execFile } from "child_process";

const execFileAsync = util.promisify(execFile);

export class Polars_Converter extends WorkflowNode {
  constructor(
    node_id: string,
    node_type: string,
    node_data: any,
    log_callback?: any,
    node_complete_callback?: any
  ) {
    super(node_id, node_type, node_data, log_callback, node_complete_callback);
  }

  async execute(state: WorkflowState): Promise<Record<string, any>> {
    await this.log(
      state.current_run_id,
      `[Polars Converter] Starting Excel/CSV to Parquet optimization...`,
      "INFO"
    );

    const params = this.node_data.parameters || {};
    let inputFiles: string[] = [];

    if (Array.isArray(params.inputFiles) && params.inputFiles.length > 0) {
      inputFiles = params.inputFiles;
    } else if (params.filePath) {
      inputFiles = [params.filePath];
    } else if (Array.isArray(state.variables?.parquet_files) && state.variables.parquet_files.length > 0) {
      inputFiles = state.variables.parquet_files;
    }

    const outputDir = params.outputDir || path.join(process.cwd(), "workflow_inputs", "parquet_cache");
    const compression = params.compression || "snappy";
    const sheetName = params.sheetName || "";

    const pythonScript = path.join(__dirname, "..", "..", "analytics_engine.py");
    const cliArgs = [
      "--action", "convert",
      "--output_dir", outputDir,
      "--compression", compression
    ];

    if (sheetName) {
      cliArgs.push("--sheet_name", sheetName);
    }

    if (inputFiles.length > 0) {
      cliArgs.push("--input_files", ...inputFiles);
    }

    try {
      const { stdout, stderr } = await execFileAsync("python", [pythonScript, ...cliArgs], {
        maxBuffer: 25 * 1024 * 1024,
        encoding: "utf-8"
      });

      if (stderr && stderr.trim().length > 0) {
        await this.log(state.current_run_id, `[Polars Warning] ${stderr.trim()}`, "WARNING");
      }

      const result = JSON.parse(stdout.trim());

      await this.log(
        state.current_run_id,
        `[Polars Success] Converted ${result.total_files || 0} files (${result.total_rows || 0} rows) to Parquet.`,
        "INFO"
      );

      this.output_data = {
        parquet_files: result.parquet_files || [],
        data_catalog: result.catalog || [],
        total_files: result.total_files || 0,
        total_rows: result.total_rows || 0
      };

      state.variables.parquet_files = result.parquet_files || [];
      state.variables.data_catalog = result.catalog || [];

      if (this.node_complete_callback) {
        await this.node_complete_callback(this.node_id, this.output_data);
      }

      return this.output_data;
    } catch (err: any) {
      await this.log(
        state.current_run_id,
        `[Polars Error] Conversion failed: ${err.message}`,
        "ERROR"
      );
      throw err;
    }
  }
}
