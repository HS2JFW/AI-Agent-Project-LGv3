import { AgentZipNode } from './node_builder/AgentBaseNode/Node_Agent_Zip';
import { StateGraph, START, END } from "@langchain/langgraph";
import { WorkflowNode, WorkflowState, StateType } from "./node_builder/Node_Workflow";

import { DB } from "./node_builder/DatasourceNode/Node_DB";
import { API_Incremental } from "./node_builder/DatasourceNode/Node_API_Incremental";
import { Graph_RAG } from "./node_builder/DatasourceNode/Node_Graph_RAG";
import { Page } from "./node_builder/GeneralNode/Node_Page";
import { Storage } from "./node_builder/GeneralNode/Node_Storage";
import { Timer, Workflow_Timer } from "./node_builder/GeneralNode/Node_Timer";
import { PDF_Queue } from "./node_builder/GeneralNode/Node_PDF_Queue";
import { TXT_Queue } from "./node_builder/GeneralNode/Node_TXT_Queue";
import { Zip_Queue } from "./node_builder/GeneralNode/Node_ZIP_Queue";

import { Agent, PDF_to_Image_Agent } from "./node_builder/AgentBaseNode/Node_Agent_PDFs";
import { Agent_DB } from "./node_builder/AgentBaseNode/Node_Agent_DB";
import { Agent_Audit } from "./node_builder/AgentBaseNode/Node_Agent_PDFs_Audit";
import { PDF_to_Base64_Agent } from "./node_builder/AgentBaseNode/Node_Agent_PDFs_Base64";
import { OCRPDFsNode } from "./node_builder/AgentBaseNode/Node_OCR_PDFs";
import { AgentPDFsRawNode } from "./node_builder/AgentBaseNode/Node_Agent_PDFs_Raw";
import { AgentAPIPDFsNode } from "./node_builder/AgentBaseNode/Node_Agent_API_PDFs";
import { AgentAPIPDFsChainNode } from "./node_builder/AgentBaseNode/Node_Agent_API_PDFs_Chain";
import { AgentAPIPDFsLoopNode } from "./node_builder/AgentBaseNode/Node_Agent_API_PDFs_Loop";
import { Node_MarkItDown } from "./node_builder/ActionNode/Node_MarkItDown";
import { JSON_Connector } from "./node_builder/GeneralNode/Node_JSON_Connector";
import { JSON_Connector_List } from "./node_builder/ActionNode/Node_JSON_Connector_List";
import { Gmail, Line, Mobile_Message } from "./node_builder/GeneralNode/Node_Notification";
import { Rubric, Multi_Criteria_Analysis, Sample, Table } from "./node_builder/GeneralNode/Node_Criteria";
import { Polars_Converter } from "./node_builder/ActionNode/Node_Polars_Converter";
import { DuckDB_Engine } from "./node_builder/DatasourceNode/Node_DuckDB";
import { BigData_Analyst_Node } from "./node_builder/AgentBaseNode/Node_BigData_Analyst";

export function create_node_instance(
  node_id: string,
  node_type: string,
  node_data: any,
  log_callback?: any,
  node_complete_callback?: any
): WorkflowNode {
  // Check nodeClass / nodeType / node_type first as primary source of truth, fallback to originalName / name / label
  const rawKey = (
    node_data?.nodeClass ||
    node_data?.nodeType ||
    node_type ||
    node_data?.originalName ||
    node_data?.name ||
    node_data?.label ||
    ""
  ).toLowerCase().trim();

  const keyWithSpace = rawKey.replace(/[_-]+/g, " ");
  const keyWithUnderscore = rawKey.replace(/[\s-]+/g, "_");

  // 1. Data Sources
  if (keyWithUnderscore === "db" || keyWithSpace === "database" || keyWithSpace === "db") {
    return new DB(node_id, node_type, node_data, log_callback, node_complete_callback);
  }

  if (
    keyWithSpace.includes("api incremental") ||
    keyWithUnderscore.includes("api_incremental") ||
    node_type.toLowerCase().includes("incremental")
  ) {
    return new API_Incremental(node_id, node_type, node_data, log_callback, node_complete_callback);
  }

  if (
    keyWithSpace.includes("graph rag") ||
    keyWithUnderscore.includes("graph_rag")
  ) {
    return new Graph_RAG(node_id, node_type, node_data, log_callback, node_complete_callback);
  }

  // Big Data & Analytics Nodes
  if (
    keyWithSpace.includes("polars") ||
    keyWithUnderscore.includes("polars") ||
    keyWithSpace.includes("parquet converter")
  ) {
    return new Polars_Converter(node_id, node_type, node_data, log_callback, node_complete_callback);
  }

  if (
    keyWithSpace.includes("duckdb") ||
    keyWithUnderscore.includes("duckdb")
  ) {
    return new DuckDB_Engine(node_id, node_type, node_data, log_callback, node_complete_callback);
  }

  if (
    keyWithSpace.includes("big data") ||
    keyWithUnderscore.includes("big_data") ||
    keyWithSpace.includes("bigdata") ||
    keyWithSpace.includes("multi agent pipeline") ||
    keyWithSpace.includes("autonomous big data")
  ) {
    return new BigData_Analyst_Node(node_id, node_type, node_data, log_callback, node_complete_callback);
  }

  // 2. Actions
  if (keyWithSpace === "page" || keyWithUnderscore === "page") {
    return new Page(node_id, node_type, node_data, log_callback, node_complete_callback);
  }

  if (keyWithSpace === "storage" || keyWithUnderscore === "storage") {
    return new Storage(node_id, node_type, node_data, log_callback, node_complete_callback);
  }

  if (keyWithSpace.includes("workflow timer") || keyWithUnderscore.includes("workflow_timer")) {
    return new Workflow_Timer(node_id, node_type, node_data, log_callback, node_complete_callback);
  }

  if (keyWithSpace === "timer" || keyWithUnderscore === "timer") {
    return new Timer(node_id, node_type, node_data, log_callback, node_complete_callback);
  }

  if (keyWithSpace.includes("zip queue") || keyWithUnderscore.includes("zip_queue") || keyWithSpace.includes("queue zip")) {
    return new Zip_Queue(node_id, node_type, node_data, log_callback, node_complete_callback);
  }

  if (keyWithSpace.includes("txt queue") || keyWithUnderscore.includes("txt_queue") || keyWithSpace.includes("queue txt")) {
    return new TXT_Queue(node_id, node_type, node_data, log_callback, node_complete_callback);
  }

  if (keyWithSpace.includes("pdf queue") || keyWithUnderscore.includes("pdf_queue") || keyWithSpace.includes("queue pdf") || keyWithSpace === "queue") {
    return new PDF_Queue(node_id, node_type, node_data, log_callback, node_complete_callback);
  }

  // 3. Agents
  if (keyWithSpace.includes("agent db") || keyWithUnderscore.includes("agent_db")) {
    return new Agent_DB(node_id, node_type, node_data, log_callback, node_complete_callback);
  }

  if (
    keyWithSpace.includes("agent audit") ||
    keyWithUnderscore.includes("agent_audit") ||
    keyWithSpace.includes("agent pdfs audit")
  ) {
    return new Agent_Audit(node_id, node_type, node_data, log_callback, node_complete_callback);
  }

  // 4. OCR
  if (
    keyWithSpace.includes("pdf to base64 agent") ||
    keyWithUnderscore.includes("pdf_to_base64_agent") ||
    keyWithSpace.includes("agent pdfs base64") ||
    keyWithSpace.includes("pdf to base64")
  ) {
    return new PDF_to_Base64_Agent(node_id, node_type, node_data, log_callback, node_complete_callback);
  }

  if (
    keyWithSpace.includes("pdf to image agent") ||
    keyWithUnderscore.includes("pdf_to_image_agent") ||
    keyWithSpace.includes("agent pdfs image") ||
    keyWithSpace.includes("pdf to image")
  ) {
    return new PDF_to_Image_Agent(node_id, node_type, node_data, log_callback, node_complete_callback);
  }

  if (
    keyWithSpace.includes("planner") ||
    keyWithSpace.includes("sql engineer") ||
    keyWithSpace.includes("critic") ||
    keyWithSpace.includes("domain specialist") ||
    keyWithSpace.includes("synthesizer") ||
    keyWithSpace === "agent" || 
    keyWithUnderscore === "agent" || 
    keyWithSpace.includes("ai agent pdf")
  ) {
    return new Agent(node_id, node_type, node_data, log_callback, node_complete_callback);
  }

  // 5. Notifications
  if (keyWithSpace === "gmail" || keyWithUnderscore === "gmail") {
    return new Gmail(node_id, node_type, node_data, log_callback, node_complete_callback);
  }

  if (keyWithSpace === "line" || keyWithUnderscore === "line") {
    return new Line(node_id, node_type, node_data, log_callback, node_complete_callback);
  }

  if (keyWithSpace.includes("mobile message") || keyWithUnderscore.includes("mobile_message")) {
    return new Mobile_Message(node_id, node_type, node_data, log_callback, node_complete_callback);
  }

  // 6. Criteria
  if (keyWithSpace === "rubric" || keyWithUnderscore === "rubric") {
    return new Rubric(node_id, node_type, node_data, log_callback, node_complete_callback);
  }

  if (
    keyWithSpace.includes("multi criteria") ||
    keyWithUnderscore.includes("multi_criteria") ||
    keyWithSpace === "mca"
  ) {
    return new Multi_Criteria_Analysis(node_id, node_type, node_data, log_callback, node_complete_callback);
  }

  if (keyWithSpace === "sample" || keyWithUnderscore === "sample") {
    return new Sample(node_id, node_type, node_data, log_callback, node_complete_callback);
  }

  if (keyWithSpace === "table" || keyWithUnderscore === "table") {
    return new Table(node_id, node_type, node_data, log_callback, node_complete_callback);
  }

  // Legacy / Action / Other tools
  if (keyWithSpace.includes("json connector list") || keyWithUnderscore.includes("json_connector_list")) {
    return new JSON_Connector_List(node_id, node_type, node_data, log_callback, node_complete_callback);
  }

  if (keyWithSpace.includes("json connector") || keyWithUnderscore.includes("json_connector")) {
    return new JSON_Connector(node_id, node_type, node_data, log_callback, node_complete_callback);
  }

  if (keyWithSpace.includes("mark it down") || keyWithSpace.includes("markitdown") || node_type.toLowerCase().includes("markitdown")) {
    return new Node_MarkItDown(node_id, node_type, node_data, log_callback, node_complete_callback);
  }

  if (keyWithSpace.includes("ocr pdfs raw")) {
    return new OCRPDFsNode(node_id, node_type, node_data, log_callback, node_complete_callback);
  }

  if (keyWithSpace.includes("ai agent pdfs raw")) {
    return new AgentPDFsRawNode(node_id, node_type, node_data, log_callback, node_complete_callback);
  }

  if (keyWithSpace === "ai agent zip") {
    return new AgentZipNode(node_id, node_type, node_data, log_callback, node_complete_callback);
  }

  if (keyWithSpace === "ai agent api pdfs") {
    return new AgentAPIPDFsNode(node_id, node_type, node_data, log_callback, node_complete_callback);
  }

  if (keyWithSpace === "ai agent pdfs chain") {
    return new AgentAPIPDFsChainNode(node_id, node_type, node_data, log_callback, node_complete_callback);
  }
  
  if (keyWithSpace === "ai agent pdfs loop") {
    return new AgentAPIPDFsLoopNode(node_id, node_type, node_data, log_callback, node_complete_callback);
  }
  
  return new WorkflowNode(node_id, node_type, node_data, log_callback, node_complete_callback);
}

function create_node_executor(
  node_id: string,
  node_type: string,
  node_data: any,
  log_callback?: any,
  node_complete_callback?: any
) {
  const instance = create_node_instance(node_id, node_type, node_data, log_callback, node_complete_callback);
  const label = node_data?.label || node_data?.name || node_id;
  const category = node_data?.category || node_type;
  
  return async (state: StateType) => {
    // 1. Log Start with Payload
    let inputPreview = "{}";
    try {
      const inputs = Object.assign({}, node_data?.parameters || {}, state.variables || {});
      const str = JSON.stringify(inputs);
      inputPreview = str.length > 200 ? str.substring(0, 200) + "... (truncated)" : str;
    } catch (e) {}
    
    // --- NEW LOGIC: Bypass execution if not selected, but provide cached data ---
    if (state.variables?.selected_node_ids && Array.isArray(state.variables.selected_node_ids)) {
      if (!state.variables.selected_node_ids.includes(node_id)) {
        if (log_callback) {
          await log_callback(state.current_run_id, node_id, `[Skip] โหนด '${label}' ข้ามการทำงาน (ไม่อยู่ใน Process Node) แต่ส่งต่อข้อมูลเดิมจาก Table ให้โหนดถัดไป`, "INFO");
        }
        
        // Extract cached output from database
        const params = node_data?.parameters || {};
        const previousOutput = params.apiOutput || params.agentResult || params.jsonOutput || params.txtOutput || params.zipOutput || params.pdfOutput || params.output || null;
        
        instance.output_data = previousOutput;

        return {
          active_node: node_id,
          logs: [`[${label}] Skipped execution but restored previous output.`],
          variables: {
            [node_id + "_output"]: previousOutput
          }
        };
      }
    }
    // -------------------------------------------------------------------------

    if (log_callback) {
      await log_callback(state.current_run_id, node_id, `[Start] โหนด '${label}' (${category}) เริ่มทำงาน | Input: ${inputPreview}`, "INFO");
    }

    try {
      // 2. Execute Node
      const result = await instance.execute(state);
      
      // 3. Log Success with Output
      let outputPreview = "{}";
      try {
        const outData = instance.output_data || result;
        const str = JSON.stringify(outData);
        outputPreview = str.length > 200 ? str.substring(0, 200) + "... (truncated)" : str;
      } catch (e) {}

      if (log_callback) {
        await log_callback(state.current_run_id, node_id, `[Success] โหนด '${label}' ทำงานเสร็จสิ้น | Output: ${outputPreview}`, "INFO");
      }
      return result;
    } catch (error: any) {
      // 4. Catch and Log Error robustly
      const errMsg = error.message || String(error);
      if (log_callback) {
        await log_callback(state.current_run_id, node_id, `[Error] ข้อผิดพลาดที่โหนด '${label}' (${category}) | ปัญหา: ${errMsg}`, "ERROR");
      }
      console.error(`[Error] Node '${label}' execution failed:`, error);
      
      // You can either throw the error to halt LangGraph or return a fail state
      throw error; 
    }
  };
}

export function translate_to_langgraph(
  nodes_list: any[],
  edges_list: any[],
  log_callback?: any,
  node_complete_callback?: any
) {
  const workflow: any = new StateGraph(WorkflowState);

  if (!nodes_list || nodes_list.length === 0) {
    workflow.addNode("empty", async (state: any) => state);
    workflow.addEdge(START, "empty");
    workflow.addEdge("empty", END);
    return workflow;
  }

  // 1. Add all nodes
  for (const node of nodes_list) {
    const executor = create_node_executor(
      node.id,
      node.type || "customNode",
      node.data || {},
      log_callback,
      node_complete_callback
    );
    workflow.addNode(node.id, executor);
  }

  // 2. Find start nodes
  const incomingCounts: Record<string, number> = {};
  for (const node of nodes_list) {
    incomingCounts[node.id] = 0;
  }
  for (const edge of edges_list) {
    if (incomingCounts[edge.target] !== undefined) {
      incomingCounts[edge.target]++;
    }
  }

  const startNodes = Object.keys(incomingCounts).filter((id) => incomingCounts[id] === 0);
  if (startNodes.length === 0 && nodes_list.length > 0) {
    startNodes.push(nodes_list[0].id);
  }

  for (const start of startNodes) {
    workflow.addEdge(START, start);
  }

  // 3. Add edges with support for looping
  const outgoingEdgesBySource: Record<string, any[]> = {};
  for (const node of nodes_list) {
    outgoingEdgesBySource[node.id] = [];
  }
  for (const edge of edges_list) {
    if (outgoingEdgesBySource[edge.source] !== undefined) {
      outgoingEdgesBySource[edge.source].push(edge);
    }
  }

  for (const node of nodes_list) {
    const rawTargets = outgoingEdgesBySource[node.id] || [];
    const targets = rawTargets.map(e => e.target);
    const validTargets = rawTargets.filter(e => e.sourceHandle !== "invalid").map(e => e.target);
    const invalidTargets = rawTargets.filter(e => e.sourceHandle === "invalid").map(e => e.target);
    const nName = (node.data?.name || node.data?.label || node.type || "").toLowerCase();
    const isAgent = nName.includes("agent") || nName.includes("ocr pdfs") || nName.includes("mark it down") || nName.includes("markitdown");
    const isApiIncremental = nName.includes("api incremental") || node.type?.toLowerCase().includes("incremental");

    if (isAgent) {
      // Use conditional edges for loop support
      workflow.addConditionalEdges(
        node.id,
        (state: any) => {
          if (state.variables?.hasNext || state.variables?.has_next) {
            return [node.id];
          } else {
            if (nName.includes("audit")) {
              const auditValid = state.variables[`${node.id}_audit_valid`];
              if (auditValid === true) {
                return validTargets.length > 0 ? validTargets : [END];
              } else if (auditValid === false) {
                return invalidTargets.length > 0 ? invalidTargets : [END];
              }
            }
            return targets.length > 0 ? targets : [END];
          }
        }
      );
    } else if (isApiIncremental) {
      // For API Incremental, if there is no data, stop the flow (go to END) to avoid waking up downstream nodes
      workflow.addConditionalEdges(
        node.id,
        (state: any) => {
          if (state.variables?.hasNext === false) {
            return [END];
          } else {
            return targets.length > 0 ? targets : [END];
          }
        }
      );
    } else {
      // Standard edges
      if (targets.length === 0) {
        workflow.addEdge(node.id, END);
      } else {
        for (const target of targets) {
          workflow.addEdge(node.id, target);
        }
      }
    }
  }

  return workflow;
}
