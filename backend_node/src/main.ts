import fs from "fs";
import path from "path";
import "reflect-metadata";
import express from "express";
import cors from "cors";
import multer from "multer";
import { AppDataSource, initializeDatabase } from "./db";
import { Workflow } from "./models/Workflow";
import { WorkflowRun } from "./models/WorkflowRun";
import { ExecutionLog } from "./models/ExecutionLog";
import { create_node_instance } from "./graph_translator";
import { WorkflowState } from "./node_builder/Node_Workflow";
import { getWorkflowInputDir, getWorkflowOutputDir } from "./workflow_paths";
import util from "util";

// SYSTEM LOGGING SETUP
const LOGS_DIR = path.join(__dirname, "..", "logs");
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}
const SYSTEM_LOG_FILE = path.join(LOGS_DIR, "system.log");

function writeSystemLog(level: string, ...args: any[]) {
  const timestamp = new Date().toISOString();
  const message = util.format(...args);
  const logLine = `[${timestamp}] [${level}] ${message}\n`;
  fs.appendFileSync(SYSTEM_LOG_FILE, logLine);
}

const originalConsoleLog = console.log;
console.log = function (...args: any[]) {
  writeSystemLog("INFO", ...args);
  originalConsoleLog.apply(console, args);
};

const originalConsoleError = console.error;
console.error = function (...args: any[]) {
  writeSystemLog("ERROR", ...args);
  originalConsoleError.apply(console, args);
};

const originalConsoleWarn = console.warn;
console.warn = function (...args: any[]) {
  writeSystemLog("WARN", ...args);
  originalConsoleWarn.apply(console, args);
};

const originalConsoleInfo = console.info;
console.info = function (...args: any[]) {
  writeSystemLog("INFO", ...args);
  originalConsoleInfo.apply(console, args);
};

const app = express();
const port = process.env.PORT || 8001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Set up Multer for file uploads
const upload = multer({ dest: "queue_pdf_temp/" });

// In-memory run tracking (similar to Python's active_runs)
const activeRuns = new Map<string, any>();


// ==========================================
// AUDIT LOGGING ROUTE
// ==========================================
app.post("/api/audit-log", (req, res) => {
  try {
    const { action, details, tab, source } = req.body;
    const timestamp = new Date().toISOString();
    const srcFile = source?.file || 'main.ts';
    const srcClass = source?.class || (tab === 'process' ? 'ProcessMonitor' : 'LogicWorkspace');
    const srcFunc = source?.function || 'auditLogHandler';
    const sourceTag = `[File: ${srcFile} | Class: ${srcClass} | Function: ${srcFunc}]`;
    const logLine = `[${timestamp}] ${sourceTag} [${tab?.toUpperCase() || 'UNKNOWN'}] ACTION: ${action} | DETAILS: ${JSON.stringify(details || {})}\n`;
    const logPath = path.join(__dirname, '..', 'user_activity.log');
    fs.appendFileSync(logPath, logLine);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to write audit log:', error);
    res.status(500).json({ detail: 'Failed to write audit log' });
  }
});

// ==========================================
// WORKFLOW CRUD ROUTES
// ==========================================

app.get("/api/init-process", async (req, res) => {
  try {
    const wfDir = path.join(__dirname, "..", "WF");
    let count = 0;
    const processes: string[] = [];
    
    if (fs.existsSync(wfDir)) {
      const entries = fs.readdirSync(wfDir, { withFileTypes: true });
      entries.forEach((entry) => {
        if (entry.isDirectory() || entry.name.endsWith('.wf')) {
          processes.push(entry.name);
        }
      });
    }
    
    const uniqueProcesses = Array.from(new Set(processes.map(p => p.replace('.wf', ''))));
    count = uniqueProcesses.length;
    
    if (count > 0) {
      console.log(`[INIT] Found ${count} processes in WF folder: ${uniqueProcesses.join(', ')}`);
    } else {
      console.log(`[INIT] Found 0 processes in WF folder.`);
    }
    
    res.json({ count, processes: uniqueProcesses });
  } catch (error) {
    console.error("Failed to init process check:", error);
    res.status(500).json({ detail: "Failed to init process check" });
  }
});

app.get("/api/system-logs", async (req, res) => {
  try {
    if (!fs.existsSync(SYSTEM_LOG_FILE)) {
      return res.json({ logs: "No system logs available yet.\n" });
    }
    
    // Read the file. If it gets too large, we should only read the tail, but for now we'll read the whole thing
    // or limit to last N bytes. We will read the whole file as a string.
    let content = fs.readFileSync(SYSTEM_LOG_FILE, "utf-8");
    
    // Keep only the last 2000 lines if it's very large
    const lines = content.split('\n');
    if (lines.length > 2000) {
      content = lines.slice(lines.length - 2000).join('\n');
    }
    
    res.json({ logs: content });
  } catch (error) {
    console.error("Failed to read system logs:", error);
    res.status(500).json({ detail: "Failed to read system logs" });
  }
});

const AI_LOG_FILE = path.join(LOGS_DIR, "ai.log");
app.get("/api/ai-logs", async (req, res) => {
  try {
    if (!fs.existsSync(AI_LOG_FILE)) {
      return res.json({ logs: "No AI logs available yet.\n" });
    }
    
    let content = fs.readFileSync(AI_LOG_FILE, "utf-8");
    
    const lines = content.split('\n');
    if (lines.length > 2000) {
      content = lines.slice(lines.length - 2000).join('\n');
    }
    
    res.json({ logs: content });
  } catch (error) {
    console.error("Failed to read AI logs:", error);
    res.status(500).json({ detail: "Failed to read AI logs" });
  }
});

app.get("/api/processes/active-state", async (req, res) => {
  try {
    const states: Record<string, any> = {};
    const workflows = await AppDataSource.getRepository(Workflow).find();
    for (const wf of workflows) {
      const lastRun = await AppDataSource.getRepository(WorkflowRun).findOne({
        where: { workflow_id: wf.id },
        order: { created_at: "DESC" }
      });
      
      let timerActive = false;
      if (wf.nodes) {
        try {
          const nodes = JSON.parse(wf.nodes);
          const timerNode = nodes.find((n: any) => 
            (n.type?.toLowerCase().includes('timer') || n.data?.name?.toLowerCase().includes('timer') || n.data?.label?.toLowerCase().includes('timer')) 
            && n.data?.parameters?.schedulerActive === true
          );
          if (timerNode) timerActive = true;
        } catch (e) {}
      }

      if (lastRun) {
        states[wf.id] = {
          status: lastRun.status,
          current_node_id: lastRun.current_node_id,
          run_id: lastRun.id,
          timerActive
        };
      } else {
        states[wf.id] = { status: "idle", timerActive };
      }
    }
    res.json(states);
  } catch (error) {
    console.error("Error fetching active states:", error);
    res.status(500).json({ error: "Failed to fetch states" });
  }
});

app.get("/api/workflows", async (req, res) => {
  try {
    const wfRoot = path.join(__dirname, "..", "WF");
    const formatted = [];
    const seenIds = new Set();
    
    // 1. Read from WF folder first (priority)
    if (fs.existsSync(wfRoot)) {
      const dirs = fs.readdirSync(wfRoot, { withFileTypes: true });
      for (const dir of dirs) {
        if (dir.isDirectory()) {
          const targetWfDir = path.join(wfRoot, dir.name);
          try {
            const files = fs.readdirSync(targetWfDir);
            for (const f of files) {
              if (f.endsWith('.wf')) {
                const content = fs.readFileSync(path.join(targetWfDir, f), 'utf-8');
                try {
                  const wfData = JSON.parse(content);
                  const id = wfData.id || dir.name;
                  if (!seenIds.has(id)) {
                    // Ensure naming conventions match frontend expectations
                    const transformed = {
                      ...wfData,
                      agent_nodes: wfData.agentNodes || wfData.agent_nodes || [],
                      agent_edges: wfData.agentEdges || wfData.agent_edges || []
                    };
                    formatted.push(transformed);
                    seenIds.add(id);
                  }
                } catch(e){}
              }
            }
          } catch(e) {}
        }
      }
    }

    // 2. Read from Database
    const dbWorkflows = await AppDataSource.getRepository(Workflow).find({
      order: { created_at: "DESC" },
    });
    
    // Transform and merge
    dbWorkflows.forEach((wf) => {
      if (!seenIds.has(wf.id)) {
        formatted.push({
          ...wf,
          nodes: typeof wf.nodes === 'string' ? JSON.parse(wf.nodes || "[]") : wf.nodes,
          edges: typeof wf.edges === 'string' ? JSON.parse(wf.edges || "[]") : wf.edges,
          agent_nodes: typeof wf.agent_nodes === 'string' ? JSON.parse(wf.agent_nodes || "[]") : wf.agent_nodes,
          agent_edges: typeof wf.agent_edges === 'string' ? JSON.parse(wf.agent_edges || "[]") : wf.agent_edges,
          aiModels: typeof wf.ai_models === 'string' ? JSON.parse(wf.ai_models || "[]") : wf.ai_models,
        });
        seenIds.add(wf.id);
      }
    });
    
    res.json(formatted);
  } catch (error) {
    console.error("Failed to fetch workflows", error);
    res.status(500).json({ detail: "Failed to fetch workflows" });
  }
});

app.get("/api/workflows/:wf_id", async (req, res) => {
  const { wf_id } = req.params;
  try {
    const wf = await AppDataSource.getRepository(Workflow).findOne({ where: { id: wf_id } });
    if (!wf) {
      return res.status(404).json({ detail: "Workflow not found" });
    }
    res.json({
      ...wf,
      nodes: JSON.parse(wf.nodes || "[]"),
      edges: JSON.parse(wf.edges || "[]"),
      agentNodes: JSON.parse(wf.agent_nodes || "[]"),
      agentEdges: JSON.parse(wf.agent_edges || "[]"),
      aiModels: JSON.parse(wf.ai_models || "[]"),
    });
  } catch (error) {
    res.status(500).json({ detail: "Failed to get workflow" });
  }
});

import { v4 as uuidv4 } from "uuid";

app.post("/api/workflows", async (req, res) => {
  const wf_data = req.body;
  const wf_id = wf_data.id || uuidv4();
  
  try {
    writeWorkflowBackupFile(wf_id, wf_data);

    let wf = await AppDataSource.getRepository(Workflow).findOne({ where: { id: wf_id } });
    if (!wf) {
      wf = new Workflow();
      wf.id = wf_id;
    }
    
    wf.name = wf_data.name;
    wf.description = wf_data.description;
    wf.nodes = JSON.stringify(wf_data.nodes || []);
    wf.edges = JSON.stringify(wf_data.edges || []);
    wf.agent_nodes = JSON.stringify(wf_data.agentNodes || []);
    wf.agent_edges = JSON.stringify(wf_data.agentEdges || []);
    wf.ai_models = JSON.stringify(wf_data.aiModels || []);
    
    await AppDataSource.getRepository(Workflow).save(wf);
    
    res.json({
      ...wf,
      nodes: JSON.parse(wf.nodes),
      edges: JSON.parse(wf.edges),
      agentNodes: JSON.parse(wf.agent_nodes || "[]"),
      agentEdges: JSON.parse(wf.agent_edges || "[]"),
      aiModels: JSON.parse(wf.ai_models || "[]"),
    });
  } catch (error) {
    res.status(500).json({ detail: "Failed to create workflow" });
  }
});

/**
 * เขียนไฟล์ JSON ตัวกลาง .wf (Write Workflow Backup File)
 * ทำหน้าที่เขียนข้อมูลลงโฟลเดอร์ WF เพื่อใช้เป็นไฟล์แบ็คอัปหรือใช้งานร่วมกับระบบอื่น
 */
function writeWorkflowBackupFile(wf_id: string, wf_data: any) {
  const wfRoot = path.join(__dirname, "..", "WF");
  const targetWfDir = path.join(wfRoot, wf_id);
  const inputDir = path.join(targetWfDir, "Input");
  const outputDir = path.join(targetWfDir, "Output");

  if (!fs.existsSync(targetWfDir)) fs.mkdirSync(targetWfDir, { recursive: true });
  if (!fs.existsSync(inputDir)) fs.mkdirSync(inputDir, { recursive: true });
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  
  const wf_dict = {
    id: wf_id,
    name: wf_data.name,
    description: wf_data.description,
    nodes: wf_data.nodes,
    edges: wf_data.edges,
    agentNodes: wf_data.agentNodes || [],
    agentEdges: wf_data.agentEdges || [],
    aiModels: wf_data.aiModels || []
  };
  
  // Clean up legacy flat file in root WF if it exists
  const legacyIdFilePath = path.join(wfRoot, `${wf_id}.wf`);
  if (fs.existsSync(legacyIdFilePath)) {
    try { fs.unlinkSync(legacyIdFilePath); } catch (e) {}
  }

  const fileName = (wf_data.name && typeof wf_data.name === 'string' && wf_data.name.trim())
    ? `${wf_data.name.trim().replace(/[<>:"/\\|?*]+/g, '_')}.wf`
    : `${wf_id}.wf`;
  
  // Remove older .wf files in targetWfDir if workflow name changed
  try {
    const existingFiles = fs.readdirSync(targetWfDir);
    for (const f of existingFiles) {
      if (f.endsWith('.wf') && f !== fileName) {
        fs.unlinkSync(path.join(targetWfDir, f));
      }
    }
  } catch (e) {}

  fs.writeFileSync(path.join(targetWfDir, fileName), JSON.stringify(wf_dict, null, 2));
}

/**
 * บันทึกประวัติ Workflow ลง SQLite (Save Workflow Record to DB)
 * ทำหน้าที่นำข้อมูล Workflow มาบันทึกหรืออัปเดตลงในฐานข้อมูล
 */
async function saveWorkflowRecordToDB(wf_id: string, wf_data: any) {
  let wf = await AppDataSource.getRepository(Workflow).findOne({ where: { id: wf_id } });
  if (!wf) {
    wf = new Workflow();
    wf.id = wf_id;
  }
  
  wf.name = wf_data.name;
  wf.description = wf_data.description;
  wf.nodes = JSON.stringify(wf_data.nodes || []);
  wf.edges = JSON.stringify(wf_data.edges || []);
  wf.agent_nodes = JSON.stringify(wf_data.agentNodes || []);
  wf.agent_edges = JSON.stringify(wf_data.agentEdges || []);
  wf.ai_models = JSON.stringify(wf_data.aiModels || []);
  
  await AppDataSource.getRepository(Workflow).save(wf);
  return wf;
}

app.put("/api/workflows/:wf_id", async (req, res) => {
  const { wf_id } = req.params;
  const wf_data = req.body;
  
  try {
    // 1. เขียนไฟล์แบ็คอัป (Phase 1)
    writeWorkflowBackupFile(wf_id, wf_data);

    // 2. บันทึกลงฐานข้อมูล (Phase 1)
    const wf = await saveWorkflowRecordToDB(wf_id, wf_data);
    
    res.json({
      ...wf,
      nodes: JSON.parse(wf.nodes),
      edges: JSON.parse(wf.edges),
      agentNodes: JSON.parse(wf.agent_nodes || "[]"),
      agentEdges: JSON.parse(wf.agent_edges || "[]"),
      aiModels: JSON.parse(wf.ai_models || "[]"),
    });
  } catch (error) {
    res.status(500).json({ detail: "Failed to update workflow" });
  }
});

app.delete("/api/workflows/:wf_id", async (req, res) => {
  const { wf_id } = req.params;
  try {
    const wf = await AppDataSource.getRepository(Workflow).findOne({ where: { id: wf_id } });
    const wfName = wf ? wf.name : null;

    const wfDir = path.join(__dirname, "..", "WF");
    const targetFolder = path.join(wfDir, wf_id);
    if (fs.existsSync(targetFolder)) {
      try {
        fs.rmSync(targetFolder, { recursive: true, force: true });
        console.log(`[Delete] Removed entire workflow folder: ${targetFolder}`);
      } catch (e) {
        console.error(`[Delete Error] Failed to remove folder ${targetFolder}:`, e);
      }
    }
    
    // Legacy cleanup: remove any leftover flat .wf file in root WF directory
    if (fs.existsSync(wfDir)) {
      try {
        const files = fs.readdirSync(wfDir);
        files.forEach((file) => {
          if (!file.endsWith('.wf')) return;
          try {
            const filePath = path.join(wfDir, file);
            const isMatchById = file === `${wf_id}.wf`;
            const isMatchByName = wfName ? (file === `${wfName.trim().replace(/[<>:"/\\|?*]+/g, '_')}.wf` || file === `${wfName}.wf`) : false;
            let isMatchByContent = false;
            try {
              const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
              if (content.id === wf_id || (wfName && content.name === wfName)) {
                isMatchByContent = true;
              }
            } catch (e) {}

            if (isMatchById || isMatchByName || isMatchByContent) {
              fs.unlinkSync(filePath);
            }
          } catch (e) {}
        });
      } catch (e) {}
    }
    
    const runRepo = AppDataSource.getRepository(WorkflowRun);
    const logRepo = AppDataSource.getRepository(ExecutionLog);
    const runs = await runRepo.find({ where: { workflow_id: wf_id } });
    for (const run of runs) {
      await logRepo.delete({ run_id: run.id });
    }
    await runRepo.delete({ workflow_id: wf_id });
    
    if (wf) {
      await AppDataSource.getRepository(Workflow).remove(wf);
    }
    res.json({ message: "Workflow and all associated analytical/run data completely deleted from system" });
  } catch (error: any) {
    console.error("Delete error:", error);
    res.status(500).json({ detail: "Failed to delete workflow" });
  }
});

// ==========================================
// WORKFLOW EXECUTION ROUTES
// ==========================================

app.post("/api/nodes/execute", async (req, res) => {
  try {
    const { node_id, node_type, node_data, variables, current_run_id, workflow_id, workflow_nodes, workflow_edges, incoming_node_ids } = req.body;
    console.log("=== PLAY SUB PAYLOAD ===");
    console.log("workflow_nodes length:", workflow_nodes?.length || 0);
    console.log("workflow_edges length:", workflow_edges?.length || 0);
    console.log("incoming_node_ids:", incoming_node_ids);
    console.log("variables._workflow_edges:", variables?._workflow_edges?.length || 0);
    console.log("========================");
    
    if (!node_id || !node_type) {
      return res.status(400).json({ status: "error", message: "Missing node_id or node_type" });
    }

    const logs: Array<{message: string, level: string, timestamp: string}> = [];
    const log_callback = async (run_id: string, node_id: string, message: string, level: string = "INFO") => {
      logs.push({
        message,
        level,
        timestamp: new Date().toISOString()
      });
    };

    let collected_outputs: Record<string, any> = {};
    const node_complete_callback = async (nid: string, outputs: any) => {
      if (outputs && typeof outputs === 'object') {
        collected_outputs = { ...collected_outputs, ...outputs };
      }
    };

    const instance = create_node_instance(node_id, node_type, node_data || {}, log_callback, node_complete_callback);
    
    const targetWfId = workflow_id || variables?.workflow_id || "wf_default";
    const state: any = {
      current_run_id: current_run_id || "stateless-run",
      workflow_id: targetWfId,
      variables: {
        ...(variables || {}),
        workflow_id: targetWfId,
        _workflow_nodes: workflow_nodes || variables?._workflow_nodes || [],
        _workflow_edges: workflow_edges || variables?._workflow_edges || [],
        _incoming_node_ids: incoming_node_ids || []
      },
      logs: [] // We use our own log_callback to collect logs to send back
    };

    await instance.execute(state);

    const final_outputs = {
      ...(typeof instance.output_data === 'object' && instance.output_data !== null ? instance.output_data : { raw_output: instance.output_data }),
      ...collected_outputs
    };

    res.json({
      status: "success",
      logs: logs,
      outputs: final_outputs,
      updated_variables: state.variables
    });

  } catch (error: any) {
    console.error("Error executing node:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Internal Server Error",
      logs: [{
        message: `Execution failed: ${error.message}`,
        level: "ERROR",
        timestamp: new Date().toISOString()
      }]
    });
  }
});

import { EventEmitter } from "events";
import { translate_to_langgraph } from "./graph_translator";

const runEmitter = new EventEmitter();

/**
 * สร้างประวัติรอบการทำงาน (Create Workflow Run Record)
 * ทำหน้าที่บันทึกข้อมูลการรันรอบใหม่ลงฐานข้อมูลและตั้งสถานะเป็น running
 */
async function createWorkflowRunRecord(wf: Workflow, inputs: any) {
  const run = new WorkflowRun();
  run.workflow = wf;
  run.status = "running";
  run.inputs = JSON.stringify(inputs || {});
  await AppDataSource.getRepository(WorkflowRun).save(run);
  return run;
}

/**
 * สั่ง LangGraph ให้เริ่มประมวลผล (Execute LangGraph Workflow Async)
 * ทำหน้าที่สั่งประมวลผลกราฟแบบ Asynchronous และพ่น Event กลับไปยัง Frontend ผ่าน SSE
 */
function executeLangGraphWorkflowAsync(wf: Workflow, run: WorkflowRun, variables: any) {
  let nodes = JSON.parse(wf.nodes || "[]");
  let edges = JSON.parse(wf.edges || "[]");

  // Force _workflow_nodes and _workflow_edges to be fresh from the database
  if (variables) {
    variables._workflow_nodes = JSON.parse(wf.nodes || "[]");
    variables._workflow_edges = JSON.parse(wf.edges || "[]");
  }

  // Filter nodes and edges if running a Sub-flow
  // We no longer filter nodes and edges here because unselected nodes must still exist in the graph 
  // so that their cached Table outputs can be fetched by selected nodes. 
  // The skip-logic is handled in graph_translator.ts instead.
  // if (variables && variables.selected_node_ids && Array.isArray(variables.selected_node_ids) && variables.selected_node_ids.length > 0) {
  //   const selectedIds = variables.selected_node_ids;
  //   nodes = nodes.filter((n: any) => selectedIds.includes(n.id));
  //   edges = edges.filter((e: any) => selectedIds.includes(e.source) && selectedIds.includes(e.target));
  // }

  const log_callback = async (run_id: string, node_id: string, message: string, level: string = "INFO") => {
    runEmitter.emit(`log-${run_id}`, { type: "log", message, level, timestamp: new Date().toISOString() });
  };

  const node_complete_callback = async (node_id: string, outputs: any) => {
    runEmitter.emit(`node-complete-${run.id}`, { type: "node-complete", node_id, outputs });
  };

  // Run graph in background
  setImmediate(async () => {
    try {
      const langgraph = translate_to_langgraph(nodes, edges, log_callback, node_complete_callback);
      const app = langgraph.compile();
      
      const initialState = {
        workflow_id: wf.id,
        current_run_id: run.id,
        logs: [],
        variables: { workflow_id: wf.id, ...(variables || {}) },
      };
      console.log(`[DEBUG] Received variables for run ${run.id}:`, variables);

      const result = await app.invoke(initialState);

      run.status = "completed";
      run.variables = JSON.stringify(result.variables || {});
      await AppDataSource.getRepository(WorkflowRun).save(run);
      
      // Save outputs of background tasks (e.g. API Incremental) to the Workflow database
      try {
        const wfToUpdate = await AppDataSource.getRepository(Workflow).findOne({ where: { id: wf.id } });
        if (wfToUpdate && wfToUpdate.nodes) {
          const nodesArray = JSON.parse(wfToUpdate.nodes);
          let updated = false;
          for (let n of nodesArray) {
            const outKey = n.id + "_output";
            if (result.variables && result.variables[outKey] !== undefined) {
              const nType = (n.type || "").toLowerCase();
              const nName = (n.data?.name || n.data?.label || "").toLowerCase();
              if (nType.includes("incremental") || nName.includes("incremental")) {
                if (!n.data) n.data = {};
                if (!n.data.parameters) n.data.parameters = {};
                n.data.parameters.apiOutput = result.variables[outKey];
                updated = true;
              }
            }
          }
          if (updated) {
            wfToUpdate.nodes = JSON.stringify(nodesArray);
            await AppDataSource.getRepository(Workflow).save(wfToUpdate);
            console.log(`[Scheduler] Updated API Output for Workflow ${wf.id} in DB.`);
          }
        }
      } catch (dbErr) {
        console.error("Failed to save background outputs to Workflow DB:", dbErr);
      }

      runEmitter.emit(`run-complete-${run.id}`, { type: "run-complete", status: "completed", variables: result.variables });
    } catch (err: any) {
      console.error("Graph execution error:", err);
      run.status = "failed";
      await AppDataSource.getRepository(WorkflowRun).save(run);
      runEmitter.emit(`run-complete-${run.id}`, { type: "run-complete", status: "failed", error: err.message });
    }
  });
}

app.post("/api/workflows/:wf_id/run", async (req, res) => {
  const { wf_id } = req.params;
  
  try {
    const wf = await AppDataSource.getRepository(Workflow).findOne({ where: { id: wf_id } });
    if (!wf) return res.status(404).json({ error: "Workflow not found" });

    // 1. สร้างประวัติการรัน (Phase 2)
    const run = await createWorkflowRunRecord(wf, req.body?.inputs || {});

    // 2. สั่งเริ่มประมวลผลเบื้องหลัง (Phase 2)
    executeLangGraphWorkflowAsync(wf, run, req.body?.variables || {});

    // 3. ตอบกลับทันที (คืนค่า run_id)
    res.json({ run_id: run.id, status: "started" });
  } catch (err: any) {
    console.error("Error in /run:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/workflows/runs/:run_id/stream", (req, res) => {
  const { run_id } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ status: "connected" })}\n\n`);

  const onLog = (data: any) => res.write(`event: log\ndata: ${JSON.stringify(data)}\n\n`);
  const onNodeComplete = (data: any) => res.write(`event: node_complete\ndata: ${JSON.stringify(data)}\n\n`);
  const onRunComplete = (data: any) => {
    res.write(`event: complete\ndata: ${JSON.stringify(data)}\n\n`);
    res.end();
  };

  runEmitter.on(`log-${run_id}`, onLog);
  runEmitter.on(`node-complete-${run_id}`, onNodeComplete);
  runEmitter.on(`run-complete-${run_id}`, onRunComplete);

  req.on("close", () => {
    runEmitter.off(`log-${run_id}`, onLog);
    runEmitter.off(`node-complete-${run_id}`, onNodeComplete);
    runEmitter.off(`run-complete-${run_id}`, onRunComplete);
  });
});

/**
 * ดึงเส้นทางไฟล์ log ของ Work flow ตาม id (WF/<wf_id>/log/<wf_id>.log)
 */
function getWorkflowLogFilePath(wf_id: string): string {
  const wfRoot = path.join(__dirname, "..", "WF");
  const targetLogDir = path.join(wfRoot, wf_id, "log");
  if (!fs.existsSync(targetLogDir)) {
    fs.mkdirSync(targetLogDir, { recursive: true });
  }
  return path.join(targetLogDir, `${wf_id}.log`);
}

/**
 * บันทึก log ลงไฟล์ .log ของแต่ละ Work flow (WF/<wf_id>/log/<wf_id>.log)
 */
function appendToWorkflowLogFile(wf_id: string, log: { timestamp?: string; level?: string; message?: string }) {
  try {
    const logFilePath = getWorkflowLogFilePath(wf_id);
    const ts = log.timestamp || new Date().toISOString();
    const lvl = log.level || 'INFO';
    const msg = log.message || '';
    const logLine = `[${ts}] [${lvl}]: ${msg}\n`;
    fs.appendFileSync(logFilePath, logLine, 'utf8');
  } catch (e) {
    console.error(`[Log Persistence] Failed to append log for ${wf_id}:`, e);
  }
}

/**
 * อ่านและแยกโครงสร้าง log ย้อนหลัง จากไฟล์ <wf_id>.log
 */
function readWorkflowLogsFromFile(wf_id: string): Array<{ timestamp: string; level: string; message: string }> {
  try {
    const logFilePath = getWorkflowLogFilePath(wf_id);
    if (!fs.existsSync(logFilePath)) return [];
    const content = fs.readFileSync(logFilePath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    return lines.map(line => {
      const match = line.match(/^\[(.*?)\] \[(.*?)\]:\s*(.*)$/);
      if (match) {
        return {
          timestamp: match[1],
          level: match[2],
          message: match[3]
        };
      }
      return {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: line
      };
    });
  } catch (e) {
    console.error(`[Log Persistence] Failed to read logs for ${wf_id}:`, e);
    return [];
  }
}

/**
 * ล้างข้อมูลในไฟล์ .log ของ Work flow (WF/<wf_id>/log/<wf_id>.log)
 */
function clearWorkflowLogFile(wf_id: string) {
  try {
    const logFilePath = getWorkflowLogFilePath(wf_id);
    if (fs.existsSync(logFilePath)) {
      fs.writeFileSync(logFilePath, '', 'utf8');
    }
  } catch (e) {
    console.error(`[Log Persistence] Failed to clear log for ${wf_id}:`, e);
  }
}

app.get("/api/workflows/:wf_id/runs", async (req, res) => {
  res.json({ message: "Not implemented yet" });
});

// GET endpoints for per-workflow isolated logs (historical log viewing)
app.get("/api/workflows/:wf_id/logs", async (req, res) => {
  const { wf_id } = req.params;
  const logs = readWorkflowLogsFromFile(wf_id);
  res.json({ logs });
});
app.get("/api/workflows/runs/:run_id/logs", async (req, res) => {
  const { run_id } = req.params;
  const logs = readWorkflowLogsFromFile(run_id);
  res.json({ logs });
});

// POST endpoints for persisting real-time client log execution stream
app.post("/api/workflows/:wf_id/logs", async (req, res) => {
  const { wf_id } = req.params;
  const body = req.body;
  if (body?.log) {
    appendToWorkflowLogFile(wf_id, body.log);
  } else if (Array.isArray(body?.logs)) {
    for (const l of body.logs) {
      appendToWorkflowLogFile(wf_id, l);
    }
  } else if (typeof body?.message === 'string') {
    appendToWorkflowLogFile(wf_id, { timestamp: body.timestamp, level: body.level, message: body.message });
  }
  res.json({ success: true });
});
app.post("/api/workflows/runs/:run_id/logs", async (req, res) => {
  const { run_id } = req.params;
  const body = req.body;
  if (body?.log) {
    appendToWorkflowLogFile(run_id, body.log);
  } else if (Array.isArray(body?.logs)) {
    for (const l of body.logs) {
      appendToWorkflowLogFile(run_id, l);
    }
  } else if (typeof body?.message === 'string') {
    appendToWorkflowLogFile(run_id, { timestamp: body.timestamp, level: body.level, message: body.message });
  }
  res.json({ success: true });
});

// DELETE endpoints for wiping isolated disk log files
app.delete("/api/workflows/:wf_id/logs", async (req, res) => {
  const { wf_id } = req.params;
  clearWorkflowLogFile(wf_id);
  res.json({ success: true });
});
app.delete("/api/workflows/runs/:run_id/logs", async (req, res) => {
  const { run_id } = req.params;
  clearWorkflowLogFile(run_id);
  res.json({ success: true });
});

app.post("/api/workflows/runs/:run_id/stop", async (req, res) => {
  res.json({ message: "Not implemented yet" });
});

// ==========================================
// FILE AND QUEUE ROUTES
// ==========================================

app.post("/api/upload-pdf-queue", upload.array("files"), async (req, res) => {
  try {
    const workflowId = (req.body?.workflow_id || req.query.workflow_id || "wf_default") as string;
    const nodeIdRaw = (req.body.node_id || req.query.node_id || "node_queue") as string;
    const startIndex = parseInt((req.body.start_index || req.query.start_index || "1") as string, 10);
    const inputDir = getWorkflowInputDir(workflowId);
    const files = req.files as Express.Multer.File[];
    const filenames: string[] = [];

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear().toString().slice(-2)}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let original = file.originalname;
        const clean_node_id = nodeIdRaw.replace("node_", "");
        
        const match = original.match(/^([^_]+)_(\d+)_(.+)_((\d{2}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2}))\.(pdf|txt|png|json)$/i);
        
        let index_str = (startIndex + i).toString();
        let clean_name = "";

        if (match) {
            index_str = match[2];
            clean_name = match[3];
        } else {
            let cleanBase = original;
            const l = cleanBase.toLowerCase();
            if (l.endsWith('.pdf') || l.endsWith('.txt') || l.endsWith('.png') || l.endsWith('.json')) {
                cleanBase = l.endsWith('.json') ? cleanBase.slice(0, -5) : cleanBase.slice(0, -4);
            }
            cleanBase = cleanBase.replace(/^([^_]+)_(\d+)_/, '');
            cleanBase = cleanBase.replace(/_\d{2}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/, '');
            cleanBase = cleanBase.replace(/-\d{10}$/, '');
            clean_name = cleanBase.replace(/[^a-zA-Z0-9-_]/g, '').trim();
            if (!clean_name) clean_name = "document";
        }

        const newDiskName = `${clean_node_id}_${index_str}_${clean_name}_${timestamp}.pdf`;
        const destPath = path.join(inputDir, newDiskName);
        fs.renameSync(file.path, destPath);
        filenames.push(newDiskName);
      }
    }
    res.json({ status: "success", message: `อัปโหลด PDF สำเร็จ (${filenames.length} ไฟล์)`, filenames });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message || String(error), filenames: [] });
  }
});

app.post("/api/upload-txt-queue", upload.array("files"), async (req, res) => {
  try {
    const workflowId = (req.body?.workflow_id || req.query.workflow_id || "wf_default") as string;
    const nodeIdRaw = (req.body.node_id || req.query.node_id || "node_queue") as string;
    const startIndex = parseInt((req.body.start_index || req.query.start_index || "1") as string, 10);
    const inputDir = getWorkflowInputDir(workflowId);
    const files = req.files as Express.Multer.File[];
    const filenames: string[] = [];

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear().toString().slice(-2)}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let original = file.originalname;
        const clean_node_id = nodeIdRaw.replace("node_", "");
        
        const match = original.match(/^([^_]+)_(\d+)_(.+)_((\d{2}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2}))\.(txt|md)$/i);
        
        let index_str = (startIndex + i).toString();
        let clean_name = "";
        
        let ext = ".txt";
        if (original.toLowerCase().endsWith('.md')) { ext = ".md"; }

        if (match) {
            index_str = match[2];
            clean_name = match[3];
        } else {
            let cleanBase = original;
            const l = cleanBase.toLowerCase();
            if (l.endsWith('.txt')) {
                cleanBase = cleanBase.slice(0, -4);
            } else if (l.endsWith('.md')) {
                cleanBase = cleanBase.slice(0, -3);
            }
            cleanBase = cleanBase.replace(/^([^_]+)_(\d+)_/, '');
            cleanBase = cleanBase.replace(/_\d{2}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/, '');
            cleanBase = cleanBase.replace(/-\d{10}$/, '');
            clean_name = cleanBase.replace(/[^a-zA-Z0-9-_]/g, '').trim();
            if (!clean_name) clean_name = "document";
        }

        const newDiskName = `${clean_node_id}_${index_str}_${clean_name}_${timestamp}${ext}`;
        const destPath = path.join(inputDir, newDiskName);
        fs.renameSync(file.path, destPath);
        filenames.push(newDiskName);
      }
    }
    res.json({ status: "success", message: `อัปโหลด TXT สำเร็จ (${filenames.length} ไฟล์)`, filenames });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message || String(error), filenames: [] });
  }
});

app.get("/api/list-pdf-queue", async (req, res) => {
  try {
    const workflowId = (req.query.workflow_id || "wf_default") as string;
    const nodeId = (req.query.node_id) as string || null;
      const clean_node_id = nodeId ? nodeId.replace("node_", "") : null;
      const inputDir = getWorkflowInputDir(workflowId);
    if (!fs.existsSync(inputDir)) {
      return res.json({ status: "success", files: [] });
    }
    const entries = fs.readdirSync(inputDir, { withFileTypes: true });
    const files = entries
      .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith('.pdf'))
        .filter(entry => !clean_node_id || entry.name.startsWith(`${clean_node_id}_`))
      .map(entry => {
        const filePath = path.join(inputDir, entry.name);
        const stats = fs.statSync(filePath);
        return {
          filename: entry.name,
          size: stats.size,
          modified: stats.mtime.toISOString(),
          created: stats.birthtime ? stats.birthtime.toISOString() : stats.mtime.toISOString()
        };
      })
      // เรียงตามลำดับเวลาที่ดาวน์โหลดเสร็จสิ้นก่อน-หลัง (Ascending order) เพื่อให้ไฟล์แรกอยู่ Index 1 และไฟล์ที่สองอยู่ Index 2 เสมอ
      .sort((a, b) => new Date(a.created || a.modified).getTime() - new Date(b.created || b.modified).getTime() || a.filename.localeCompare(b.filename));

    res.json({ status: "success", files });
  } catch (error: any) {
    console.error("Error listing PDF queue:", error);
    res.status(500).json({ status: "error", message: error.message || String(error), files: [] });
  }
});

app.get("/api/list-txt-queue", async (req, res) => {
  try {
    const workflowId = (req.query.workflow_id || "wf_default") as string;
    const nodeId = (req.query.node_id) as string || null;
      const clean_node_id = nodeId ? nodeId.replace("node_", "") : null;
      const inputDir = getWorkflowInputDir(workflowId);
    if (!fs.existsSync(inputDir)) {
      return res.json({ status: "success", files: [] });
    }
    const entries = fs.readdirSync(inputDir, { withFileTypes: true });
    const files = entries
      .filter(entry => entry.isFile() && (entry.name.toLowerCase().endsWith('.txt') || entry.name.toLowerCase().endsWith('.md')))
        .filter(entry => !clean_node_id || entry.name.startsWith(`${clean_node_id}_`))
      .map(entry => {
        const filePath = path.join(inputDir, entry.name);
        const stats = fs.statSync(filePath);
        return {
          filename: entry.name,
          size: stats.size,
          modified: stats.mtime.toISOString(),
          created: stats.birthtime ? stats.birthtime.toISOString() : stats.mtime.toISOString()
        };
      })
      // เรียงตามลำดับเวลาที่ดาวน์โหลดเสร็จสิ้นก่อน-หลัง (Ascending order) เพื่อให้ไฟล์แรกอยู่ Index 1 และไฟล์ที่สองอยู่ Index 2 เสมอ
      .sort((a, b) => new Date(a.created || a.modified).getTime() - new Date(b.created || b.modified).getTime() || a.filename.localeCompare(b.filename));

    res.json({ status: "success", files });
  } catch (error: any) {
    console.error("Error listing TXT queue:", error);
    res.status(500).json({ status: "error", message: error.message || String(error), files: [] });
  }
});

app.delete("/api/clear-pdf-queue", async (req, res) => {
  try {
    const workflowId = (req.body?.workflow_id || req.query.workflow_id || "wf_default") as string;
      const nodeId = (req.body?.node_id || req.query.node_id) as string;
      const clean_node_id = nodeId ? nodeId.replace("node_", "") : null;
      const inputDir = getWorkflowInputDir(workflowId);
      if (fs.existsSync(inputDir)) {
        const entries = fs.readdirSync(inputDir);
        for (const entry of entries) {
          if (!entry.toLowerCase().endsWith(".pdf")) continue;
          if (clean_node_id && !entry.startsWith(`${clean_node_id}_`)) continue;
          const filePath = path.join(inputDir, entry);
          try {
            fs.unlinkSync(filePath);
          } catch (e: any) {
            console.warn(`Failed to delete ${filePath}: ${e.message}`);
          }
        }
      }
    res.json({ status: "success", message: "Cleared PDF Queue Table and Server files" });
  } catch (error: any) {
    console.error("Error clearing PDF queue:", error);
    res.status(500).json({ status: "error", message: error.message || String(error) });
  }
});

app.delete("/api/clear-txt-queue", async (req, res) => {
  try {
    const workflowId = (req.body?.workflow_id || req.query.workflow_id || "wf_default") as string;
      const nodeId = (req.body?.node_id || req.query.node_id) as string;
      const clean_node_id = nodeId ? nodeId.replace("node_", "") : null;
      const inputDir = getWorkflowInputDir(workflowId);
      if (fs.existsSync(inputDir)) {
        const entries = fs.readdirSync(inputDir);
        for (const entry of entries) {
          if (!(entry.toLowerCase().endsWith(".txt") || entry.toLowerCase().endsWith(".md"))) continue;
          if (clean_node_id && !entry.startsWith(`${clean_node_id}_`)) continue;
          const filePath = path.join(inputDir, entry);
          try {
            fs.unlinkSync(filePath);
          } catch (e: any) {
            console.warn(`Failed to delete ${filePath}: ${e.message}`);
          }
        }
      }
    res.json({ status: "success", message: "Cleared TXT Queue Table and Server files" });
  } catch (error: any) {
    console.error("Error clearing TXT queue:", error);
    res.status(500).json({ status: "error", message: error.message || String(error) });
  }
});

app.post("/api/upload-zip-queue", upload.array("files"), async (req, res) => {
  try {
    const workflowId = (req.body?.workflow_id || req.query.workflow_id || "wf_default") as string;
    const nodeIdRaw = (req.body.node_id || req.query.node_id || "node_queue") as string;
    const startIndex = parseInt((req.body.start_index || req.query.start_index || "1") as string, 10);
    const inputDir = getWorkflowInputDir(workflowId);
    const files = req.files as Express.Multer.File[];
    const filenames: string[] = [];

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear().toString().slice(-2)}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let original = file.originalname;
        const clean_node_id = nodeIdRaw.replace("node_", "");
        
        let index_str = (startIndex + i).toString();
        let cleanBase = original;
        const l = cleanBase.toLowerCase();
        if (l.endsWith('.zip')) {
            cleanBase = cleanBase.slice(0, -4);
        }
        let clean_name = cleanBase.replace(/[^a-zA-Z0-9-_]/g, '').trim();
        if (!clean_name) clean_name = "archive";

        const newDiskName = `${clean_node_id}_${index_str}_${clean_name}_${timestamp}.zip`;
        const destPath = path.join(inputDir, newDiskName);
        fs.renameSync(file.path, destPath);
        filenames.push(newDiskName);
      }
    }
    res.json({ status: "success", message: `Uploaded ${filenames.length} ZIP files`, filenames });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message || String(error), filenames: [] });
  }
});

app.get("/api/list-zip-queue", async (req, res) => {
  try {
    const workflowId = (req.query.workflow_id || "wf_default") as string;
    const nodeId = (req.query.node_id) as string || null;
      const clean_node_id = nodeId ? nodeId.replace("node_", "") : null;
      const inputDir = getWorkflowInputDir(workflowId);
    if (!fs.existsSync(inputDir)) {
      return res.json({ status: "success", files: [] });
    }
    const entries = fs.readdirSync(inputDir, { withFileTypes: true });
    const files = entries
      .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith('.zip'))
        .filter(entry => !clean_node_id || entry.name.startsWith(`${clean_node_id}_`))
      .map(entry => {
        const filePath = path.join(inputDir, entry.name);
        const stats = fs.statSync(filePath);
        return {
          filename: entry.name,
          size: stats.size,
          modified: stats.mtime.toISOString(),
          created: stats.birthtime ? stats.birthtime.toISOString() : stats.mtime.toISOString()
        };
      })
      .sort((a, b) => new Date(a.created || a.modified).getTime() - new Date(b.created || b.modified).getTime() || a.filename.localeCompare(b.filename));

    res.json({ status: "success", files });
  } catch (error: any) {
    console.error("Error listing ZIP queue:", error);
    res.status(500).json({ status: "error", message: error.message || String(error), files: [] });
  }
});

app.delete("/api/clear-zip-queue", async (req, res) => {
    try {
      const workflowId = (req.body?.workflow_id || req.query.workflow_id || "wf_default") as string;
      const nodeId = (req.body?.node_id || req.query.node_id) as string;
      const clean_node_id = nodeId ? nodeId.replace("node_", "") : null;
      const inputDir = getWorkflowInputDir(workflowId);
      if (fs.existsSync(inputDir)) {
        const entries = fs.readdirSync(inputDir);
        for (const entry of entries) {
          if (!entry.toLowerCase().endsWith(".zip")) continue;
          if (clean_node_id && !entry.startsWith(`${clean_node_id}_`)) continue;
          const filePath = path.join(inputDir, entry);
          try {
            fs.unlinkSync(filePath);
          } catch (e) {
            // Ignore
          }
        }
      }
    res.json({ status: "success", message: "Cleared ZIP Queue" });
  } catch (error: any) {
    console.error("Error clearing ZIP queue:", error);
    res.status(500).json({ status: "error", message: error.message || String(error) });
  }
});

app.get("/api/queue-pdf/:filename", async (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename || "");
    const workflowId = (req.query.workflow_id || "wf_default") as string;
    console.log(`
=============================================================`);
    console.log(`[PDF Queue API] GET /api/queue-pdf/${filename}?workflow_id=${workflowId}`);
    const inputDir = getWorkflowInputDir(workflowId);
    let filePath = path.join(inputDir, filename);
    console.log(`[PDF Queue API] 1. Checking primary input dir: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      console.log(`[PDF Queue API] -> NOT FOUND in Input dir`);
      const outputDir = getWorkflowOutputDir(workflowId);
      console.log(`[PDF Queue API] 2. Checking primary output dir: ${path.join(outputDir, filename)}`);
      if (fs.existsSync(path.join(outputDir, filename))) {
        filePath = path.join(outputDir, filename);
        console.log(`[PDF Queue API] -> FOUND in Output dir: ${filePath}`);
      } else {
        console.log(`[PDF Queue API] -> NOT FOUND in Output dir`);
        const defaultPath = path.join(getWorkflowInputDir("wf_default"), filename);
        console.log(`[PDF Queue API] 3. Checking wf_default input dir: ${defaultPath}`);
        if (fs.existsSync(defaultPath)) {
          filePath = defaultPath;
          console.log(`[PDF Queue API] -> FOUND in wf_default Input dir: ${filePath}`);
        } else {
          console.log(`[PDF Queue API] -> NOT FOUND in wf_default Input dir`);
          const wfBase = path.resolve("WF");
          let foundGlobal = false;
          if (fs.existsSync(wfBase)) {
            const wfDirs = fs.readdirSync(wfBase, { withFileTypes: true });
            for (const dir of wfDirs) {
              if (dir.isDirectory()) {
                const candidate = path.join(wfBase, dir.name, "Input", filename);
                if (fs.existsSync(candidate)) {
                  filePath = candidate;
                  foundGlobal = true;
                  break;
                }
                const candidateOut = path.join(wfBase, dir.name, "Output", filename);
                if (fs.existsSync(candidateOut)) {
                  filePath = candidateOut;
                  foundGlobal = true;
                  break;
                }
              }
            }
          }
          if (!foundGlobal) {
            console.log(`[PDF Queue API] 4. ERROR: PDF file NOT FOUND anywhere on the server!`);
            return res.status(404).send("PDF file not found on server.");
          } else {
            console.log(`[PDF Queue API] -> FOUND in fallback search: ${filePath}`);
          }
        }
      }
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error: any) {
    console.error("Error serving PDF file:", error);
    res.status(500).send("Error reading PDF file.");
  }
});

app.get("/api/queue-txt/:filename", async (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename || "");
    const workflowId = (req.query.workflow_id || "wf_default") as string;
    console.log(`
=============================================================`);
    console.log(`[TXT Queue API] GET /api/queue-txt/${filename}?workflow_id=${workflowId}`);
    const inputDir = getWorkflowInputDir(workflowId);
    let filePath = path.join(inputDir, filename);
    console.log(`[TXT Queue API] 1. Checking primary input dir: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      console.log(`[TXT Queue API] -> NOT FOUND in Input dir`);
      const outputDir = getWorkflowOutputDir(workflowId);
      console.log(`[TXT Queue API] 2. Checking primary output dir: ${path.join(outputDir, filename)}`);
      if (fs.existsSync(path.join(outputDir, filename))) {
        filePath = path.join(outputDir, filename);
        console.log(`[TXT Queue API] -> FOUND in Output dir: ${filePath}`);
      } else {
        console.log(`[TXT Queue API] -> NOT FOUND in Output dir`);
        const defaultPath = path.join(getWorkflowInputDir("wf_default"), filename);
        console.log(`[TXT Queue API] 3. Checking wf_default input dir: ${defaultPath}`);
        if (fs.existsSync(defaultPath)) {
          filePath = defaultPath;
          console.log(`[TXT Queue API] -> FOUND in wf_default Input dir: ${filePath}`);
        } else {
          console.log(`[TXT Queue API] -> NOT FOUND in wf_default Input dir`);
          const wfBase = path.resolve("WF");
          let foundGlobal = false;
          if (fs.existsSync(wfBase)) {
            const wfDirs = fs.readdirSync(wfBase, { withFileTypes: true });
            for (const dir of wfDirs) {
              if (dir.isDirectory()) {
                const candidate = path.join(wfBase, dir.name, "Input", filename);
                if (fs.existsSync(candidate)) {
                  filePath = candidate;
                  foundGlobal = true;
                  break;
                }
                const candidateOut = path.join(wfBase, dir.name, "Output", filename);
                if (fs.existsSync(candidateOut)) {
                  filePath = candidateOut;
                  foundGlobal = true;
                  break;
                }
              }
            }
          }
          if (!foundGlobal) {
            console.log(`[TXT Queue API] 4. ERROR: TXT file NOT FOUND anywhere on the server!`);
            return res.status(404).send("TXT file not found on server.");
          } else {
            console.log(`[TXT Queue API] -> FOUND in fallback search: ${filePath}`);
          }
        }
      }
    }

    res.setHeader("Content-Type", "application/txt");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error: any) {
    console.error("Error serving TXT file:", error);
    res.status(500).send("Error reading TXT file.");
  }
});

app.get("/api/agent-result/:filename", async (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename || "");
    const workflowId = (req.query.workflow_id || "wf_default") as string;
    const outputDir = getWorkflowOutputDir(workflowId);
    let filePath = path.join(outputDir, filename);

    if (!fs.existsSync(filePath)) {
      const defaultPath = path.join(getWorkflowOutputDir("wf_default"), filename);
      if (fs.existsSync(defaultPath)) {
        filePath = defaultPath;
      } else {
        const wfBase = path.resolve("WF");
        let foundGlobal = false;
        if (fs.existsSync(wfBase)) {
          const wfDirs = fs.readdirSync(wfBase, { withFileTypes: true });
          for (const dir of wfDirs) {
            if (dir.isDirectory()) {
              const candidate = path.join(wfBase, dir.name, "Output", filename);
              if (fs.existsSync(candidate)) {
                filePath = candidate;
                foundGlobal = true;
                break;
              }
            }
          }
        }
        if (!foundGlobal) {
          return res.status(404).send("Result file not found on server.");
        }
      }
    }

    const ext = path.extname(filename).toLowerCase();
    if (ext === '.pdf') res.setHeader("Content-Type", "application/pdf");
    else if (ext === '.json') res.setHeader("Content-Type", "application/json");
    else res.setHeader("Content-Type", "text/plain");

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error: any) {
    console.error("Error serving Agent result file:", error);
    res.status(500).send("Error reading result file.");
  }
});


// ==========================================
// SCHEDULER SERVICE
// ==========================================

const activeSchedulers = new Map<string, NodeJS.Timeout>();

app.post("/api/workflows/:wf_id/scheduler", async (req, res) => {
  const { wf_id } = req.params;
  const { action } = req.body; // Removed variables and interval_seconds dependency from client
  
  if (action === "start") {
    if (activeSchedulers.has(wf_id)) {
      clearInterval(activeSchedulers.get(wf_id));
    }
    
    try {
      const wf = await AppDataSource.getRepository(Workflow).findOne({ where: { id: wf_id } });
      if (!wf) return res.status(404).json({ error: "Workflow not found" });

      // Determine interval and variables from workflow configuration
      let ms = 60000;
      let variables: any = undefined;
      
      if (wf.nodes) {
        const nodes = JSON.parse(wf.nodes);
        const timerNode = nodes.find((n: any) => 
          (n.type?.toLowerCase().includes('timer') || n.data?.name?.toLowerCase().includes('timer') || n.data?.label?.toLowerCase().includes('timer')) 
          && n.data?.parameters?.schedulerActive === true
        );
        
        if (timerNode) {
          const params = timerNode.data.parameters;
          if (params.timerMode === 'interval') {
            const h = parseInt(params.intervalHours || 0);
            const m = parseInt(params.intervalMinutes || 0);
            const s = parseInt(params.intervalSeconds || 0);
            ms = (h*3600 + m*60 + s) * 1000;
            if (ms <= 0) ms = 60000;
          }
          if (params.runMode === 'subflow') {
            const activeNodeIds = nodes
              .filter((n: any) => n.data?.parameters?.activeSubflow === true)
              .map((n: any) => n.id);
            if (!activeNodeIds.includes(timerNode.id)) activeNodeIds.push(timerNode.id);
            variables = { selected_node_ids: activeNodeIds };
          }
        }
      }

      console.log(`[Scheduler] Starting scheduler for ${wf_id} every ${ms}ms...`);
      let runCount = 1;
      
      const intervalId = setInterval(async () => {
        try {
          const freshWf = await AppDataSource.getRepository(Workflow).findOne({ where: { id: wf_id } });
          if (freshWf) {
             console.log(`[Scheduler] Auto-triggering workflow ${wf_id}...`);
             const run = await createWorkflowRunRecord(freshWf, {});
             
             // Dynamically evaluate subflow variables and increment runCount
             let currentVars: any = { run_count: runCount++ };
             if (freshWf.nodes) {
               const freshNodes = JSON.parse(freshWf.nodes);
               const freshTimerNode = freshNodes.find((n: any) => 
                 (n.type?.toLowerCase().includes('timer') || n.data?.name?.toLowerCase().includes('timer') || n.data?.label?.toLowerCase().includes('timer')) 
               );
               if (freshTimerNode && freshTimerNode.data?.parameters?.runMode === 'subflow') {
                 let activeNodeIds: string[] = [];
                 if (freshTimerNode.data?.parameters?.subflowNodeIds && Array.isArray(freshTimerNode.data.parameters.subflowNodeIds)) {
                   activeNodeIds = [...freshTimerNode.data.parameters.subflowNodeIds];
                 } else {
                   activeNodeIds = freshNodes
                     .filter((n: any) => n.data?.parameters?.activeSubflow === true)
                     .map((n: any) => n.id);
                 }
                 if (!activeNodeIds.includes(freshTimerNode.id)) activeNodeIds.push(freshTimerNode.id);
                 currentVars.selected_node_ids = activeNodeIds;
               }
             }
             
             executeLangGraphWorkflowAsync(freshWf, run, currentVars);
          }
        } catch(e) {
          console.error(`[Scheduler] Error running workflow ${wf_id}:`, e);
        }
      }, ms);
      
      activeSchedulers.set(wf_id, intervalId);
      res.json({ message: "Scheduler started", wf_id, interval: ms });
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  } else if (action === "stop") {
    if (activeSchedulers.has(wf_id)) {
      clearInterval(activeSchedulers.get(wf_id));
      activeSchedulers.delete(wf_id);
    }
    res.json({ message: "Scheduler stopped", wf_id });
  } else {
    res.status(400).json({ error: "Invalid action" });
  }
});

const autoResumeSchedulers = async () => {
  try {
    const workflows = await AppDataSource.getRepository(Workflow).find();
    for (const wf of workflows) {
      if (wf.nodes) {
        const nodes = JSON.parse(wf.nodes);
        const timerNode = nodes.find((n: any) => 
          (n.type?.toLowerCase().includes('timer') || n.data?.name?.toLowerCase().includes('timer') || n.data?.label?.toLowerCase().includes('timer')) 
          && n.data?.parameters?.schedulerActive === true
        );
        if (timerNode) {
          const params = timerNode.data.parameters;
          // compute interval logic
          let ms = 60000;
          if (params.timerMode === 'interval') {
            const h = parseInt(params.intervalHours || 0);
            const m = parseInt(params.intervalMinutes || 0);
            const s = parseInt(params.intervalSeconds || 0);
            ms = (h*3600 + m*60 + s) * 1000;
            if (ms <= 0) ms = 60000;
          } else {
            // For calendar logic fallback to 1 min checking or default interval
            ms = 60000; 
          }
          
          let variables: any = undefined;
          if (params.runMode === 'subflow') {
            let activeNodeIds: string[] = [];
            if (params.subflowNodeIds && Array.isArray(params.subflowNodeIds)) {
              activeNodeIds = [...params.subflowNodeIds];
            } else {
              activeNodeIds = nodes
                .filter((n: any) => n.data?.parameters?.activeSubflow === true)
                .map((n: any) => n.id);
            }
            if (!activeNodeIds.includes(timerNode.id)) activeNodeIds.push(timerNode.id);
            variables = { selected_node_ids: activeNodeIds };
          }
          
          console.log(`[AutoResume] Resuming workflow ${wf.id} every ${ms}ms...`);
          let runCount = 1;
          
          const intervalId = setInterval(async () => {
            try {
              const freshWf = await AppDataSource.getRepository(Workflow).findOne({ where: { id: wf.id } });
              if (freshWf) {
                 console.log(`[Scheduler] Auto-triggering workflow ${wf.id}...`);
                 const run = await createWorkflowRunRecord(freshWf, {});
                 
                 // Dynamically evaluate subflow variables and increment runCount
                 let currentVars: any = { run_count: runCount++ };
                 if (freshWf.nodes) {
                   const freshNodes = JSON.parse(freshWf.nodes);
                   const freshTimerNode = freshNodes.find((n: any) => 
                     (n.type?.toLowerCase().includes('timer') || n.data?.name?.toLowerCase().includes('timer') || n.data?.label?.toLowerCase().includes('timer')) 
                   );
                   if (freshTimerNode && freshTimerNode.data?.parameters?.runMode === 'subflow') {
                     let activeNodeIds: string[] = [];
                     if (freshTimerNode.data?.parameters?.subflowNodeIds && Array.isArray(freshTimerNode.data.parameters.subflowNodeIds)) {
                       activeNodeIds = [...freshTimerNode.data.parameters.subflowNodeIds];
                     } else {
                       activeNodeIds = freshNodes
                         .filter((n: any) => n.data?.parameters?.activeSubflow === true)
                         .map((n: any) => n.id);
                     }
                     if (!activeNodeIds.includes(freshTimerNode.id)) activeNodeIds.push(freshTimerNode.id);
                     currentVars.selected_node_ids = activeNodeIds;
                   }
                 }
                 
                 executeLangGraphWorkflowAsync(freshWf, run, currentVars);
              }
            } catch(e) {
              console.error(`[Scheduler] Error running workflow ${wf.id}:`, e);
            }
          }, ms);
          activeSchedulers.set(wf.id, intervalId);
        }
      }
    }
  } catch (e) {
    console.error("Failed to auto resume schedulers:", e);
  }
};

app.post("/api/workflows/:wf_id/node/:node_id/run_query_loop", async (req, res) => {
  const { wf_id, node_id } = req.params;
  try {
    let wf = await AppDataSource.getRepository(Workflow).findOne({ where: { id: wf_id } });
    if (!wf) return res.status(404).json({ error: "Workflow not found" });

    let nodes = JSON.parse(wf.nodes || "[]");
    let targetNode = nodes.find((n: any) => n.id === node_id);
    if (!targetNode) return res.status(404).json({ error: "Node not found" });

    let params = targetNode.data?.parameters || {};
    let outputsTable = params.agentOutputsTable || [];
    if (!Array.isArray(outputsTable)) outputsTable = Object.values(outputsTable);
    
    let statusesMap = params.agentOutputStatusesMap || {};
    let connectionString = params.connectionString || "";

    const agentDir = path.join(__dirname, "..", "WF", wf_id, "output");

    let engine: any = null;
    if (connectionString && connectionString.trim() !== '') {
        let type = "postgres";
        if (connectionString.startsWith("mysql")) type = "mysql";
        else if (connectionString.startsWith("sqlite")) type = "sqlite";
        else if (connectionString.startsWith("mssql")) type = "mssql";
        
        const { DataSource } = require("typeorm");
        engine = new DataSource({
            type: type as any,
            url: connectionString,
            synchronize: false,
            logging: false
        });
        await engine.initialize();
    } else {
        engine = AppDataSource;
    }

    let executedCount = 0;
    let errorCount = 0;

    for (const filename of outputsTable) {
        if (statusesMap[filename] === 'keep' || statusesMap[filename] === 'query') {
            statusesMap[filename] = 'query';
            try {
                const fsPromises = require('fs').promises;
                const filePath = path.join(agentDir, filename);
                const sqlQuery = await fsPromises.readFile(filePath, 'utf-8');
                
                await engine.query(sqlQuery);
                statusesMap[filename] = 'complete';
                executedCount++;
            } catch (err: any) {
                console.error(`Error executing SQL for ${filename}:`, err);
                statusesMap[filename] = 'error';
                errorCount++;
            }
        }
    }
    
    if (connectionString && connectionString.trim() !== '' && engine) {
        await engine.destroy();
    }

    // Save updated node back to DB
    targetNode.data.parameters.agentOutputStatusesMap = statusesMap;
    wf.nodes = JSON.stringify(nodes);
    await AppDataSource.getRepository(Workflow).save(wf);
    
    res.json({ status: "success", executedCount, errorCount, node: targetNode });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/clear-agent-results', async (req, res) => {
  try {
    const { filenames, workflow_id } = req.body;
    const wfId = workflow_id || 'wf_default';
    
    const dirsToCheck = [
      getWorkflowOutputDir(wfId),
      getWorkflowInputDir(wfId),
      getWorkflowOutputDir('wf_default'),
      getWorkflowInputDir('wf_default')
    ];

    if (Array.isArray(filenames)) {
      for (const file of filenames) {
        const folderName = file.replace(/\.[^/.]+$/, "");
        
        for (const dir of dirsToCheck) {
          if (!fs.existsSync(dir)) continue;

          // Delete the file itself
          const filePath = path.join(dir, file);
          if (fs.existsSync(filePath)) {
            try {
              fs.unlinkSync(filePath);
              console.log(`[Clear API] Deleted agent file: ${filePath}`);
            } catch(e){}
          }
          
          // Delete the chunk folder
          const folderPath = path.join(dir, folderName);
          if (fs.existsSync(folderPath)) {
            try {
              fs.rmSync(folderPath, { recursive: true, force: true });
              console.log(`[Clear API] Deleted agent chunk folder: ${folderPath}`);
            } catch(e){}
          }
        }
      }
    }
    res.json({ status: 'success', message: 'Cleared agent files and chunk folders across input and output directories' });
  } catch (error) {
    console.error('Error clearing agent results:', error);
    res.status(500).json({ status: 'error', message: 'Failed to clear agent results' });
  }
});

app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
  });

const startServer = async () => {
  await initializeDatabase();
  await autoResumeSchedulers();
};
startServer();
