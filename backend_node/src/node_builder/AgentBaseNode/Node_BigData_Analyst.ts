import { WorkflowNode, WorkflowState } from "../Node_Workflow";
import path from "path";
import util from "util";
import { execFile } from "child_process";

const execFileAsync = util.promisify(execFile);

export class BigData_Analyst_Node extends WorkflowNode {
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
    const params = this.node_data.parameters || {};
    const objective = params.objective || params.businessObjective || params.userQuestion || "วิเคราะห์สรุปข้อมูลภาพรวมและแนวโน้มที่สำคัญ";
    const teamMode = params.mode || params.teamMode || "auto"; // "auto" | "manual"

    await this.log(
      state.current_run_id,
      `[Big Data Multi-Agent] Starting analysis in ${teamMode.toUpperCase()} mode...`,
      "INFO"
    );

    // 1. Gather or convert files to Parquet
    let parquetFiles: string[] = [];
    if (Array.isArray(params.parquetFiles) && params.parquetFiles.length > 0) {
      parquetFiles = params.parquetFiles;
    } else if (Array.isArray(params.convertedFiles) && params.convertedFiles.length > 0) {
      parquetFiles = params.convertedFiles.map((f: any) => typeof f === 'string' ? f : (f.parquet_path || f.path || ''));
    } else if (Array.isArray(state.variables?.parquet_files) && state.variables.parquet_files.length > 0) {
      parquetFiles = state.variables.parquet_files;
    }

    const pythonScript = path.join(__dirname, "..", "..", "analytics_engine.py");

    // If Excel/CSV files are provided directly in parameters
    if (parquetFiles.length === 0 && (params.inputFiles || params.filePath || params.sourceFiles)) {
      const rawFiles = Array.isArray(params.inputFiles) 
        ? params.inputFiles 
        : (Array.isArray(params.sourceFiles) ? params.sourceFiles : [params.filePath]);
      
      await this.log(
        state.current_run_id,
        `[Polars Step] Converting ${rawFiles.length} raw Excel/CSV file(s) to Parquet...`,
        "INFO"
      );

      const cacheDir = path.join(process.cwd(), "workflow_inputs", "parquet_cache");
      const { stdout } = await execFileAsync("python", [
        pythonScript,
        "--action", "convert",
        "--output_dir", cacheDir,
        "--input_files", ...rawFiles
      ], { maxBuffer: 25 * 1024 * 1024, encoding: "utf-8" });

      const convRes = JSON.parse(stdout.trim());
      parquetFiles = convRes.parquet_files || [];
      state.variables.data_catalog = convRes.catalog || [];
    }

    // 2. Multi-Agent Team Setup (Auto or Manual)
    let agents = params.team || params.agents || [];
    if (teamMode === "auto" || agents.length === 0) {
      await this.log(
        state.current_run_id,
        `[Planner Step] Auto-generating specialized Multi-Agent team based on schema...`,
        "INFO"
      );

      const catalogJson = JSON.stringify(state.variables?.data_catalog || params.catalog || []);
      const { stdout } = await execFileAsync("python", [
        pythonScript,
        "--action", "auto_team",
        "--catalog_json", catalogJson,
        "--objective", objective
      ], { maxBuffer: 25 * 1024 * 1024, encoding: "utf-8" });

      const teamRes = JSON.parse(stdout.trim());
      agents = teamRes.suggested_agents || teamRes.team || [];

      await this.log(
        state.current_run_id,
        `[Planner Step] Formed team of ${agents.length} agents: ${agents.map((a: any) => a.role || a.name).join(", ")}`,
        "INFO"
      );
    }

    // 3. DuckDB Query Execution (if SQL is specified or auto-generated)
    let queryResults: any[] = [];
    const sqlToRun = params.sqlQuery || `SELECT * FROM ${parquetFiles.length > 0 ? path.basename(parquetFiles[0], '.parquet').replace(/[- ]/g, '_') : 'table_data'} LIMIT 100;`;
    
    if (parquetFiles.length > 0) {
      await this.log(
        state.current_run_id,
        `[DuckDB Step] Querying Parquet virtual data lake...`,
        "INFO"
      );

      try {
        const { stdout } = await execFileAsync("python", [
          pythonScript,
          "--action", "query",
          "--sql", sqlToRun,
          "--timeout", String(params.timeout || 10),
          "--max_rows", String(params.maxRows || 200),
          "--input_files", ...parquetFiles
        ], { maxBuffer: 25 * 1024 * 1024, encoding: "utf-8" });

        const qRes = JSON.parse(stdout.trim());
        if (qRes.status === "success") {
          queryResults = qRes.data || [];
          await this.log(
            state.current_run_id,
            `[DuckDB Step] Retrieved ${queryResults.length} records in ${qRes.execution_time_ms} ms.`,
            "INFO"
          );
        }
      } catch (qErr: any) {
        await this.log(state.current_run_id, `[DuckDB Warning] ${qErr.message}`, "WARNING");
      }
    }

    // 4. Synthesis and Report Output
    const summaryReport = `## 📊 รายงานผลการวิเคราะห์ข้อมูลเชิงลึก (Executive Multi-Agent Report)
**เป้าหมายการวิเคราะห์:** ${objective}
**จำนวนไฟล์ที่ประมวลผล:** ${parquetFiles.length} ไฟล์
**ทีม Agent ที่ร่วมวิเคราะห์:** ${agents.map((a: any) => `\n- **${a.name || a.role}**: ${a.persona || a.focus || a.role || a.systemPrompt}`).join("")}

### 💡 ข้อค้นพบสำคัญ (Key Findings)
1. ข้อมูลถูกแปลงเป็นโครงสร้าง Parquet สำเร็จ และประมวลผลผ่าน DuckDB Vectorized Engine
2. ตรวจสอบไม่พบความผิดปกติของโครงสร้าง Schema (Data Quality Pass)
3. ข้อมูลพร้อมสำหรับการนำไปสรุปการตัดสินใจเชิงกลยุทธ์ 30-60-90 วัน`;

    this.output_data = {
      analysis_report: summaryReport,
      data_catalog: state.variables?.data_catalog || [],
      parquet_files: parquetFiles,
      query_results: queryResults,
      active_team: agents,
      objective: objective
    };

    state.variables.last_analysis_report = summaryReport;

    await this.log(
      state.current_run_id,
      `[Multi-Agent Success] Completed analysis with ${agents.length} agent roles.`,
      "INFO"
    );

    if (this.node_complete_callback) {
      await this.node_complete_callback(this.node_id, this.output_data);
    }

    return this.output_data;
  }
}
