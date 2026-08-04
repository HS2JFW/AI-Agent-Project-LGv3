import { WorkflowNode, WorkflowState } from '../Node_Workflow';
import { getWorkflowInputDir, getWorkflowOutputDir } from '../../workflow_paths';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class PdfExtractorNode extends WorkflowNode {
    async execute(state: WorkflowState): Promise<any> {
        this.resolve_inputs(state);

        await this.log(
            state.current_run_id,
            `Node '${this.label}' started execution.`
        );

        const current_url = state.variables["current_url"] || null;

        if (!current_url) {
            await this.log(state.current_run_id, "Error: No current_url found in state. Make sure PDF Queue is upstream.");
            this.output_data = "Error: No PDF to extract";
            return {
                active_node: this.node_id,
                logs: [...state.logs, `[${this.label}] Error: No current_url`],
                variables: state.variables
            };
        }

        const backend_dir = path.resolve(__dirname, '..', '..', '..', '..', 'backend'); // Assuming backend is parallel to backend_node
        // Adjust backend_dir based on standard layout (backend_node/src/node_builder/GeneralNode vs backend/queue_pdf_temp)
        const pdf_path = path.join(getWorkflowInputDir(state.workflow_id || state.variables?.workflow_id), current_url);
        
        if (!fs.existsSync(pdf_path)) {
            await this.log(state.current_run_id, `Error: File not found at ${pdf_path}`);
            this.output_data = `Error: File not found ${current_url}`;
            return {
                active_node: this.node_id,
                logs: [...state.logs, `[${this.label}] Error: File not found ${current_url}`],
                variables: state.variables
            };
        }

        await this.log(state.current_run_id, `Extracting text from: ${current_url}`);

        let extracted_text = "";
        let method_used = "";

        try {
            await this.log(state.current_run_id, "Attempting native extraction with PyMuPDF4LLM...");
            
            // Running pymupdf4llm via child process
            const { stdout } = await execAsync(`python -c "import pymupdf4llm; print(pymupdf4llm.to_markdown('${pdf_path.replace(/\\/g, '\\\\')}'))"`, { maxBuffer: 1024 * 1024 * 50 });
            extracted_text = stdout;
            method_used = "PyMuPDF4LLM (Native)";

            // Check for garbage
            let is_garbage = false;
            const clean_text = extracted_text.trim();
            if (clean_text.length < 50) {
                is_garbage = true;
                await this.log(state.current_run_id, "Output too short, flagging as garbage.");
            } else {
                const unknown_count = (clean_text.match(/\ufffd/g) || []).length;
                const unknown_ratio = unknown_count / Math.max(clean_text.length, 1);
                
                if (unknown_ratio > 0.02) {
                    is_garbage = true;
                    await this.log(state.current_run_id, `High unknown char ratio (${unknown_ratio.toFixed(2)}), flagging as garbage.`);
                } else {
                    const alphanumeric_match = clean_text.match(/[a-zA-Z0-9ก-๛]/g) || [];
                    const thai_eng_num = alphanumeric_match.length;
                    if (thai_eng_num / Math.max(clean_text.length, 1) < 0.3) {
                        is_garbage = true;
                        await this.log(state.current_run_id, "Low alphanumeric ratio, flagging as garbage.");
                    }
                }
            }

            if (is_garbage) {
                await this.log(state.current_run_id, "Native extraction yielded garbage text. Falling back to PaddleOCR (PP-Structure)...");
                method_used = "PaddleOCR (Fallback)";
                extracted_text = await this._run_paddle_ocr(pdf_path, state);
            }

        } catch (e: any) {
            await this.log(state.current_run_id, `Error during PyMuPDF4LLM extraction: ${e.message}`);
            await this.log(state.current_run_id, "Falling back to PaddleOCR...");
            try {
                method_used = "PaddleOCR (Fallback)";
                extracted_text = await this._run_paddle_ocr(pdf_path, state);
            } catch (e2: any) {
                await this.log(state.current_run_id, `Error during PaddleOCR fallback: ${e2.message}`);
                extracted_text = `Failed to extract text: ${e.message}\n${e2.message}`;
                method_used = "Failed";
            }
        }

        const agent_result_dir = getWorkflowOutputDir(state.workflow_id || state.variables?.workflow_id);
        if (!fs.existsSync(agent_result_dir)) {
            fs.mkdirSync(agent_result_dir, { recursive: true });
        }

        const pdf_name_no_ext = path.parse(current_url).name;
        const output_filename = `${pdf_name_no_ext}.txt`;
        const output_filepath = path.join(agent_result_dir, output_filename);

        fs.writeFileSync(output_filepath, extracted_text, "utf-8");

        await this.log(state.current_run_id, `Saved extraction results to ${output_filename}`);

        // Prepare state variable updates
        state.variables["extracted_text"] = extracted_text;
        this.output_data = extracted_text;

        // Update the agentOutputsTable array for the frontend UI Table
        const parameters = this.data?.parameters || {};
        const results: string[] = parameters.agentOutputsTable || [];
        const statuses: { [key: string]: string } = parameters.agentOutputStatusesMap || {};

        if (!results.includes(output_filename)) {
            results.push(output_filename);
        }
        statuses[output_filename] = "Completed";

        const outputs = {
            agentOutputsTable: results,
            agentOutputStatusesMap: statuses
        };

        if (this.node_complete_callback && Object.keys(outputs).length > 0) {
            await this.node_complete_callback(this.node_id, outputs);
        }

        return {
            active_node: this.node_id,
            logs: [...state.logs, `[${this.label}] Extracted ${current_url} using ${method_used}`],
            variables: state.variables
        };
    }

    async _run_paddle_ocr(pdf_path: string, state: WorkflowState): Promise<string> {
        // Run PaddleOCR in a separate Python process since it's heavy and blocking
        const pythonScript = `
import fitz
from paddleocr import PPStructure
import os
import { getWorkflowInputDir, getWorkflowOutputDir } from "../../workflow_paths";

table_engine = PPStructure(lang='th', layout=True, show_log=False)
doc = fitz.open('${pdf_path.replace(/\\/g, '\\\\')}')
full_text = []

for page_num in range(len(doc)):
    page = doc.load_page(page_num)
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
    temp_img_path = os.path.join(os.path.dirname('${pdf_path.replace(/\\/g, '\\\\')}'), f"temp_ocr_page_{page_num}.png")
    
    try:
        pix.save(temp_img_path)
        result = table_engine(temp_img_path)
        
        page_text = []
        for region in result:
            region_type = region.get('type', '')
            res_data = region.get('res', [])
            
            if region_type in ['text', 'title', 'figure_text']:
                if isinstance(res_data, list):
                    for item in res_data:
                        if isinstance(item, dict) and 'text' in item:
                            page_text.append(item['text'])
                        elif isinstance(item, tuple) and len(item) > 1:
                            text_tuple = item[1]
                            if isinstance(text_tuple, tuple) and len(text_tuple) > 0:
                                page_text.append(str(text_tuple[0]))
                        elif isinstance(item, str):
                            page_text.append(item)
            elif region_type == 'table':
                if isinstance(res_data, dict) and 'html' in res_data:
                    page_text.append(res_data['html'])
                    
        full_text.append("\\n".join(page_text))
    finally:
        if os.path.exists(temp_img_path):
            os.remove(temp_img_path)
            
print("\\n\\n---\\n\\n".join(full_text))
        `;
        
        const tempScriptPath = path.join(path.dirname(pdf_path), 'temp_paddleocr.py');
        fs.writeFileSync(tempScriptPath, pythonScript, 'utf-8');
        
        try {
            const { stdout } = await execAsync(`python "${tempScriptPath}"`, { maxBuffer: 1024 * 1024 * 50 });
            return stdout;
        } finally {
            if (fs.existsSync(tempScriptPath)) {
                fs.unlinkSync(tempScriptPath);
            }
        }
    }
}
