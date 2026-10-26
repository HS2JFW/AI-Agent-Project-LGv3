import fs from 'fs/promises';
import path from 'path';
import { getWorkflowInputDir, getWorkflowOutputDir } from '../../workflow_paths';
import { WorkflowNode, WorkflowState } from '../Node_Workflow';
import { globSync } from 'glob';
import { spawn } from 'child_process';

// Helper function to extract text using a python script
async function extractTextWithPython(engine: string, pdfPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const pythonScript = `
import sys
import json
engine = sys.argv[1]
pdf_path = sys.argv[2]
output = ""
try:
    if engine == "pdfplumber":
        import pdfplumber
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages):
                text = page.extract_text() or ""
                output += f"\
\
--- Page {page_num+1} ---\
" + text.strip()
    elif engine == "paddleocr":
        from paddleocr import PaddleOCR
        import fitz
        import numpy as np
        ocr = PaddleOCR(use_angle_cls=True, lang='th', show_log=False)
        doc = fitz.open(pdf_path)
        for page_num, page in enumerate(doc):
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)
            if pix.alpha:
                img = img[:, :, :3]
            result = ocr.ocr(img, cls=True)
            text = ""
            if result and result[0]:
                for line in result[0]:
                    text += line[1][0] + " "
            output += f"\
\
--- Page {page_num+1} ---\
" + text.strip()
        doc.close()
    elif engine == "easyocr":
        import easyocr
        import fitz
        import numpy as np
        reader = easyocr.Reader(['th', 'en'])
        doc = fitz.open(pdf_path)
        for page_num, page in enumerate(doc):
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)
            if pix.alpha:
                img = img[:, :, :3]
            result = reader.readtext(img, detail=0)
            text = " ".join(result)
            output += f"\
\
--- Page {page_num+1} ---\
" + text.strip()
        doc.close()
    else:
        import fitz
        doc = fitz.open(pdf_path)
        for page_num, page in enumerate(doc):
            text = page.get_text() or ""
            output += f"\
\
--- Page {page_num+1} ---\
" + text.strip()
        doc.close()
    print(json.dumps({"status": "success", "text": output}))
except Exception as e:
    print(json.dumps({"status": "error", "message": str(e)}))
        `;
        
        const pythonProcess = spawn('python', ['-c', pythonScript, engine, pdfPath]);
        
        let stdoutData = '';
        let stderrData = '';
        
        pythonProcess.stdout.on('data', (data) => {
            stdoutData += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            stderrData += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            try {
                // Find the JSON object in stdout (ignoring other logs)
                const lines = stdoutData.split('\
');
                let resultObj = null;
                for (const line of lines) {
                    if (line.trim().startsWith('{') && line.trim().endsWith('}')) {
                        try {
                            resultObj = JSON.parse(line.trim());
                            break;
                        } catch(e) {}
                    }
                }
                
                if (resultObj) {
                    if (resultObj.status === 'success') {
                        resolve(resultObj.text);
                    } else {
                        reject(new Error(resultObj.message));
                    }
                } else {
                    if (code !== 0) {
                        reject(new Error(`Python script failed with code ${code}: ${stderrData}`));
                    } else {
                        reject(new Error(`Failed to parse python output: ${stdoutData}`));
                    }
                }
            } catch (err: any) {
                reject(new Error(`Error parsing script output: ${err.message}. stderr: ${stderrData}`));
            }
        });
    });
}

export class OCRPDFsNode extends WorkflowNode {
    async execute(state: WorkflowState): Promise<any> {
        try {
            await this.log(state.current_run_id, `Node '${this.nodeData.label || this.nodeId}' (${this.nodeType}) started execution.`);
            
            const variables = state.variables || {};
            const workflowId = state.workflow_id || variables.workflow_id || "wf";
            const params = this.nodeData.parameters || {};
            let currentIndex = params.currentIndex || 0;
            
            const incomingTables: Record<string, any> = {};
            const wfNodes = variables._workflow_nodes || [];
            const wfEdges = variables._workflow_edges || [];
            const incomingNodeIds = wfEdges.filter((e: any) => e.target === this.nodeId).map((e: any) => e.source);
            
            for (const nId of incomingNodeIds) {
                const srcNode = wfNodes.find((n: any) => n.id === nId);
                if (srcNode) {
                    const nType = (srcNode.type || "").toLowerCase();
                    const nName = (srcNode.data?.name || "").toLowerCase();
                    const isDriver = nType.includes("agent") || nName.includes("agent") || nType.includes("pdf") || nName.includes("pdf") || nType.includes("queue") || nName.includes("queue") || nName.includes("connector");
                    
                    if (isDriver) {
                        const srcData = srcNode.data || {};
                        const isPdfQueue = nType.includes("queue") || nName.includes("queue") || srcData.type === 'PDFQueueNode' || (srcData.parameters && srcData.parameters.pdfQueue);
                        
                        const dynamicOut = state.variables[`${nId}_output`] || {};
                        let table: any[] = [];
                        let previousMax: number | null = null;
                        
                        if (dynamicOut && (dynamicOut.pdfQueue || dynamicOut.agentOutputsTable || dynamicOut.pdfUrls || dynamicOut.table)) {
                            table = dynamicOut.pdfQueue || dynamicOut.agentOutputsTable || dynamicOut.pdfUrls || dynamicOut.table || [];
                            
                            previousMax = dynamicOut.previous_max !== undefined ? dynamicOut.previous_max : null;
                        } else {
                            const srcParams = srcData.parameters || {};
                            table = srcParams.pdfQueue || srcParams.agentOutputsTable || srcParams.pdfUrls || srcParams.table || [];
                            previousMax = srcParams.previous_max !== undefined ? srcParams.previous_max : null;
                        }
                        
                        if (previousMax !== null || (Array.isArray(table) ? table.length : Object.keys(table).length) > 0) {
                            incomingTables[nId] = {
                                table: table,
                                previous_max: previousMax !== null ? previousMax : (Array.isArray(table) ? table.length : Object.keys(table).length)
                            };
                        }
                    }
                }
            }
            
            let targetPreviousMax = 0;
            if (Object.keys(incomingTables).length > 0) {
                const maxes = Object.values(incomingTables).map(val => val.previous_max);
                targetPreviousMax = Math.min(...maxes);
            }
                
            targetPreviousMax = variables[`${this.nodeId}_target_previous_max`] !== undefined ? variables[`${this.nodeId}_target_previous_max`] : targetPreviousMax;
            variables[`${this.nodeId}_target_previous_max`] = targetPreviousMax;
            
            let cachedIncoming = variables[`${this.nodeId}_cached_incoming_tables`] || {};
            if (Object.keys(incomingTables).length > 0) {
                cachedIncoming = incomingTables;
                variables[`${this.nodeId}_cached_incoming_tables`] = cachedIncoming;
            }

            if (Object.keys(cachedIncoming).length === 0) {
                let pdfQueueData = params.pdfUrls || params.pdfQueue || variables.pdfUrls || [];
                if (typeof pdfQueueData === 'string') {
                    try {
                        pdfQueueData = JSON.parse(pdfQueueData);
                    } catch {
                        pdfQueueData = [pdfQueueData];
                    }
                }
                if (!Array.isArray(pdfQueueData)) {
                    pdfQueueData = [pdfQueueData];
                }
                    
                targetPreviousMax = pdfQueueData.length;
                cachedIncoming["self"] = { table: pdfQueueData, previous_max: targetPreviousMax };
            }
                
            const backendDir = path.resolve(__dirname, '..', '..');
            const tempDir = getWorkflowInputDir(state.workflow_id || state.variables?.workflow_id);
            await fs.mkdir(tempDir, { recursive: true });
            
            const agentResultDir = getWorkflowOutputDir(state.workflow_id || state.variables?.workflow_id);
            await fs.mkdir(agentResultDir, { recursive: true });
            
            let savedJsons = params.agentOutputsTable;
            if (typeof savedJsons !== 'object' || Array.isArray(savedJsons) || !savedJsons) {
                const oldArr = Array.isArray(savedJsons) ? savedJsons : [];
                savedJsons = {};
                oldArr.forEach((v, i) => {
                    const match = String(v).match(/^([^_]+)_(\d+)_/);
                    if (match) savedJsons[match[2]] = v;
                    else savedJsons[String(i + 1)] = v;
                });
            }
                
            let targetKeyToProcess = null;
            let targetItem = null;
            if (Object.keys(cachedIncoming).length > 0) {
                const firstParentQueue = (Object.values(cachedIncoming)[0] as any).table;
                const isDict = typeof firstParentQueue === 'object' && !Array.isArray(firstParentQueue);
                const queueKeys = isDict ? Object.keys(firstParentQueue) : Array.from({length: firstParentQueue.length}, (_, i) => String(i + 1));
                    
                const sortedKeys = queueKeys.sort((a, b) => parseInt(a) - parseInt(b));
                for (const k of sortedKeys) {
                    if (!savedJsons[k]) {
                        targetKeyToProcess = k;
                        targetItem = isDict ? firstParentQueue[k] : firstParentQueue[parseInt(k) - 1];
                        break;
                    }
                }
            }
            
            currentIndex = targetKeyToProcess ? parseInt(targetKeyToProcess) : 0;
            let isReady = targetKeyToProcess !== null && targetItem !== null;
                    
            const outputFiles = savedJsons;
            let hasNext = false;
            let driverParentsData = cachedIncoming;

            if (isReady) {
                await this.log(state.current_run_id, `Processing index ${currentIndex} / min_parent_max ${targetPreviousMax}.`);
                
                const combinedFiles: any[] = [];
                for (const [pId, pData] of Object.entries(cachedIncoming)) {
                    const item = (pData as any).table[currentIndex];
                    combinedFiles.push(item);
                }
                    
                const ocrEngine = params.ocrEngine || "PyMuPDF";
                
                driverParentsData = cachedIncoming; // needed for backwards compat check later
                
                for (let fileNameOriginal of combinedFiles) {
                    if (fileNameOriginal && typeof fileNameOriginal === 'object') fileNameOriginal = fileNameOriginal.disk_name || fileNameOriginal.url || fileNameOriginal.filename || '';
                    if (!fileNameOriginal || typeof fileNameOriginal !== 'string') continue;
                        
                    const fileNameClean = fileNameOriginal.replace(/^([^_]+_\\d+_|\\d+-)/, '');
                    await this.log(state.current_run_id, `File to process: ${fileNameOriginal}`);
                    
                    const agentDir = getWorkflowOutputDir(state.workflow_id || state.variables?.workflow_id);
                    let searchPattern = path.join(agentDir, `*${fileNameClean}*`);
                    let matchingFiles = globSync(searchPattern);
                    if (matchingFiles.length === 0) {
                        searchPattern = path.join(tempDir, `*${fileNameClean}*`);
                        matchingFiles = globSync(searchPattern);
                    }
                    
                    const cleanNodeId = this.nodeId.replace("node_", "");
                    const now = new Date();
                    const pad = (n: number) => n.toString().padStart(2, '0');
                    const currentTimestamp = `${pad(now.getDate())}-${pad(now.getMonth()+1)}-${now.getFullYear().toString().substring(2)}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
                    
                    let outFileName = "";
                    const baseName = fileNameOriginal.split('/').pop() || "";
                    const matchFmt = baseName.match(/^([^_]+)_(\d+)_(.+)_((\d{2}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2}))\.pdf$/i);
                    if (matchFmt) {
                        const indexStr = matchFmt[2];
                        const cname = matchFmt[3];
                        outFileName = `${cleanNodeId}_${indexStr}_${cname}_${currentTimestamp}.md`;
                    } else {
                        outFileName = `${cleanNodeId}_${currentIndex + 1}_${fileNameClean}_${currentTimestamp}.md`;
                    }
                    
                    if (matchingFiles.length === 0) {
                        await this.log(state.current_run_id, `❌ Error: Cannot find file '${fileNameOriginal}' in backend storage.`);
                        const errFileName = outFileName;
                        const errPath = path.join(agentResultDir, errFileName);
                        await fs.writeFile(errPath, `Error: File ${fileNameOriginal} not found.`, "utf-8");
                        if (!outputFiles.includes(errFileName)) {
                            outputFiles.push(errFileName);
                        }
                        continue;
                    }
                        
                    const pdfPath = matchingFiles[0];
                    let outputContent = "";
                    
                    try {
                        await this.log(state.current_run_id, `Initializing ${ocrEngine} (via Python process)...`);
                        outputContent = await extractTextWithPython(ocrEngine, pdfPath);
                        await this.log(state.current_run_id, `✅ Successfully extracted text using ${ocrEngine}.`);
                    } catch (e: any) {
                        const errMsg = `❌ Error extracting text from ${fileNameOriginal}: ${e.message}`;
                        await this.log(state.current_run_id, errMsg);
                        outputContent = errMsg;
                    }
                    
                    const outPath = path.join(agentResultDir, outFileName);
                    await fs.writeFile(outPath, outputContent.trim(), "utf-8");
                        
                    await this.log(state.current_run_id, `Completed index ${currentIndex}. Saved to ${outFileName}.`);
                    if (!Object.values(outputFiles).includes(outFileName)) {
                        outputFiles[currentIndex] = outFileName;
                    }
                }
            } else {
                await this.log(state.current_run_id, `Node is not ready or has completed previous rows (isReady = false)`);
            }
                
            hasNext = false;
            driverParentsData = cachedIncoming;
            
            if (Object.keys(cachedIncoming).length > 0) {
                const firstParentQueue = (Object.values(cachedIncoming)[0] as any).table;
                const isDict = typeof firstParentQueue === 'object' && !Array.isArray(firstParentQueue);
                const queueKeys = isDict ? Object.keys(firstParentQueue) : Array.from({length: firstParentQueue.length}, (_, i) => String(i + 1));
                    
                const sortedKeys = queueKeys.sort((a, b) => parseInt(a) - parseInt(b));
                for (const k of sortedKeys) {
                    if (!savedJsons[k]) {
                        hasNext = true;
                        break;
                    }
                }
            }
            
            let pdfQueue: any[] = [];
            if (Object.keys(driverParentsData).length > 0) {
                pdfQueue = (Object.values(driverParentsData)[0] as any).table;
            }
            
            const maxes = Object.values(driverParentsData).map(val => (val as any).previous_max);
            const queueLength = maxes.length > 0 ? Math.max(...maxes) : 0;
            
            const calculatedPreviousMaxList: Record<string, number> = {};
            for (const [pId, pData] of Object.entries(driverParentsData)) {
                calculatedPreviousMaxList[pId] = (pData as any).previous_max;
            }

            const outputs = {
                currentIndex: currentIndex,
                previousMaxList: calculatedPreviousMaxList,
                queueLength: queueLength,
                pdfQueue: pdfQueue,
                agentOutputsTable: savedJsons,
                hasNext: hasNext
            };
            
            state.variables.has_next = hasNext;
            state.variables.hasNext = hasNext;
            
            this.outputData = outputs;
            state.variables[`${this.nodeId}_output`] = outputs;
            state.variables[`${this.nodeId}_previous_max`] = currentIndex;
            
            if (this.nodeCompleteCallback && outputs) {
                await this.nodeCompleteCallback(this.nodeId, outputs);
            }
                
            return {
                active_node: this.nodeId,
                logs: [...(state.logs || []), `[${this.label || this.nodeId}] Processed to index ${currentIndex}. hasNext=${hasNext}`],
                variables: state.variables
            };
        } catch (e: any) {
            await this.log(state.current_run_id, `Error in OCR PDFs Node: ${e.message}`);
            return {
                active_node: this.nodeId,
                logs: [...(state.logs || []), `[${this.nodeId}] Error: ${e.message}`],
                variables: state.variables || {}
            };
        }
    }
}
