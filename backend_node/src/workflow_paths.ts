import * as path from 'path';
import * as fs from 'fs';

// __dirname here resolves to backend_node/src (or backend_node/dist/src)
// Resolving ".." brings us to the root of backend_node/
export const BACKEND_ROOT = path.resolve(__dirname, "..");

/**
 * ดึงเส้นทางโฟลเดอร์ Input (สำหรับเก็บไฟล์ดาวน์โหลดจาก Queue PDF) ของ Workflow ปัจจุบัน
 * (แทนที่ queue_pdf_temp เดิม โดยแยกเก็บใน backend_node/WF/<workflow_id>/Input)
 */
export function getWorkflowInputDir(workflowId?: string): string {
  const wfId = (workflowId && typeof workflowId === 'string' && workflowId.trim()) ? workflowId.trim() : "wf_default";
  const cleanId = wfId.replace(/[<>:"/\\|?*]+/g, '_');
  const targetDir = path.join(BACKEND_ROOT, "WF", cleanId, "Input");
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  return targetDir;
}

/**
 * ดึงเส้นทางโฟลเดอร์ Output (สำหรับเก็บผลลัพธ์จาก agent nodes) ของ Workflow ปัจจุบัน
 * (แทนที่ agent_result เดิม โดยแยกเก็บใน backend_node/WF/<workflow_id>/Output)
 */
export function getWorkflowOutputDir(workflowId?: string): string {
  const wfId = (workflowId && typeof workflowId === 'string' && workflowId.trim()) ? workflowId.trim() : "wf_default";
  const cleanId = wfId.replace(/[<>:"/\\|?*]+/g, '_');
  const targetDir = path.join(BACKEND_ROOT, "WF", cleanId, "Output");
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  return targetDir;
}
