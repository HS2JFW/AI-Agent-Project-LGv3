import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { WorkflowNode, WorkflowState } from '../Node_Workflow';
import { getWorkflowInputDir, getWorkflowOutputDir } from '../../workflow_paths';

export class Node_MarkItDown extends WorkflowNode {
    async execute(state: WorkflowState): Promise<WorkflowState> {
        this.resolve_inputs(state);

        await this.log(
            state.current_run_id,
            `⚙️ Node '${this.label}' (Mark It Down) started execution.`
        );

        const params = this.nodeData.parameters || {};
        const cleanNodeId = this.node_id.replace("node_", "");
        const agentDir = getWorkflowOutputDir(state.workflow_id || state.variables?.workflow_id);
        const queuePdfDir = getWorkflowInputDir(state.workflow_id || state.variables?.workflow_id);
        
        if (!fs.existsSync(agentDir)) fs.mkdirSync(agentDir, { recursive: true });
        if (!fs.existsSync(queuePdfDir)) fs.mkdirSync(queuePdfDir, { recursive: true });

        const wfNodes = state.variables._workflow_nodes || [];
        const wfEdges = state.variables._workflow_edges || [];
        const incomingNodeIds = wfEdges
            .filter((e: any) => e.target === this.node_id)
            .map((e: any) => e.source);

        const driverParentsData: Record<string, any[]> = {};
        const previousMaxList: Record<string, number> = {};

        for (const nId of incomingNodeIds) {
            const srcNode = wfNodes.find((n: any) => n.id === nId);
            if (srcNode) {
                const nType = (srcNode.type || "").toLowerCase();
                const nName = ((srcNode.data || {}).name || "").toLowerCase();
                const isDriver = nType.includes("agent") || nName.includes("agent") || 
                                  nType.includes("pdf") || nName.includes("pdf") || 
                                  nType.includes("queue") || nName.includes("queue") ||
                                  nType.includes("ocr") || nName.includes("ocr");

                if (isDriver) {
                    const dynamicOut = state.variables?.[`${nId}_output`] || {};
                    let parentTable: any[] = [];
                    if (dynamicOut && (dynamicOut.pdfQueue || dynamicOut.agentOutputsTable || dynamicOut.table)) {
                        parentTable = dynamicOut.pdfQueue || dynamicOut.agentOutputsTable || dynamicOut.table || [];
                        
} else {
                        const srcParams = (srcNode.data || {}).parameters || {};
                        parentTable = srcParams.agentOutputsTable || srcParams.pdfUrls || [];
                    }

                    if (typeof parentTable === 'string') {
                        try {
                            parentTable = JSON.parse(parentTable);
                        } catch {
                            parentTable = [];
                        }
                    }

                    if (Array.isArray(parentTable) && parentTable.length > 0) {
                        driverParentsData[nId] = parentTable;
                        previousMaxList[nId] = parentTable.length;
                    }
                }
            }
        }

        await this.log(state.current_run_id, `[STEP 1] Detected parent nodes tables: ${JSON.stringify(previousMaxList)}`);

        let savedOutputs = params.agentOutputsTable || [];
        if (!Array.isArray(savedOutputs)) {
            savedOutputs = [];
        }

        let currentIndex = params.currentIndex !== undefined ? params.currentIndex : savedOutputs.length;

        let isReady = true;
        if (Object.keys(driverParentsData).length === 0) {
            isReady = false;
        }

        for (const [pId, pTable] of Object.entries(driverParentsData)) {
            const pMax = previousMaxList[pId] || 0;
            if (currentIndex >= pMax) {
                isReady = false;
                break;
            }
        }

        let outFilename = "";

        if (isReady) {
            await this.log(state.current_run_id, `[STEP 1.5] Current Index คือ ${currentIndex} (ยังน้อยกว่า Max) เริ่มต้นดึงไฟล์มาแปลงด้วย MarkItDown...`);

            const combinedItems: any[] = [];
            for (const [pId, pTable] of Object.entries(driverParentsData)) {
                if (currentIndex < pTable.length) {
                    combinedItems.push(pTable[currentIndex]);
                }
            }

            const now = new Date();
            const pad = (n: number) => n.toString().padStart(2, '0');
            const currentTimestamp = `${pad(now.getDate())}-${pad(now.getMonth()+1)}-${now.getFullYear().toString().substring(2)}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

            const extractedNames: [string, string][] = [];
            for (const item of combinedItems) {
                if (typeof item === 'object') {
                    const nameVal = item.name || item.criterion?.name || "row";
                    const cleanBase = String(nameVal).replace(/[^a-zA-Z0-9\-_]/g, '').substring(0, 20) || "row";
                    extractedNames.push([String(currentIndex + 1), cleanBase]);
                    continue;
                }

                const partsStr = String(item).split('/');
                const baseName = partsStr[partsStr.length - 1];
                const match = baseName.match(/^([^_]+)_(\d+)_(.+)_((\d{2}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2}))\.(pdf|txt|png|json|md)$/i);
                if (match) {
                    const indexStr = match[2];
                    const cleanName = match[3];
                    extractedNames.push([indexStr, cleanName]);
                } else {
                    let cleanBase = baseName;
                    const l = cleanBase.toLowerCase();
                    if (l.endsWith('.pdf') || l.endsWith('.txt') || l.endsWith('.png') || l.endsWith('.json') || l.endsWith('.md')) {
                        cleanBase = cleanBase.replace(/\.[^/.]+$/, "");
                    }
                    cleanBase = cleanBase.replace(/^([^_]+)_(\d+)_/, '');
                    cleanBase = cleanBase.replace(/_\d{2}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/, '');
                    cleanBase = cleanBase.replace(/-\d{10}$/, '');
                    extractedNames.push([String(currentIndex + 1), cleanBase]);
                }
            }

            if (extractedNames.length === 1) {
                const [idx, cname] = extractedNames[0];
                outFilename = `${cleanNodeId}_${idx}_${cname}_${currentTimestamp}.md`;
            } else if (extractedNames.length > 1) {
                const idx = extractedNames[0][0];
                const combinedCname = extractedNames.map(x => x[1]).join("_");
                outFilename = `${cleanNodeId}_${idx}_${combinedCname}_${currentTimestamp}.md`;
            } else {
                outFilename = `${cleanNodeId}_${currentIndex + 1}_row_${currentTimestamp}.md`;
            }

            await this.log(state.current_run_id, `[STEP 2] Processing row index ${currentIndex}. Target file: ${outFilename}`);

            // Find input file paths to convert
            const inputFilesToConvert: string[] = [];
            for (const item of combinedItems) {
                if (typeof item === 'object') {
                    for (const val of Object.values(item)) {
                        if (typeof val === 'string' && (val.toLowerCase().endsWith('.txt') || val.toLowerCase().endsWith('.pdf') || val.toLowerCase().endsWith('.docx') || val.toLowerCase().endsWith('.md'))) {
                            inputFilesToConvert.push(val);
                        }
                    }
                    continue;
                }
                inputFilesToConvert.push(String(item));
            }

            let markdownContent = "";
            let convertedCount = 0;

            for (const fileItem of inputFilesToConvert) {
                const fileName = fileItem.split('/').pop() || "";
                let targetPath = path.join(agentDir, fileName);
                let exists = fs.existsSync(targetPath);

                if (!exists) {
                    targetPath = path.join(queuePdfDir, fileName);
                    exists = fs.existsSync(targetPath);
                }

                if (exists) {
                    await this.log(state.current_run_id, `[STEP 3] Converting file with Microsoft MarkItDown: ${targetPath}`);
                    try {
                        // Call Microsoft MarkItDown Python library, write to temp file to bypass Windows cp1252 encoding issues
                        const tempOutPath = path.join(agentDir, `temp_markitdown_out_${Date.now()}.txt`);
                        const pyScript = `import sys, traceback; from markitdown import MarkItDown
try:
    md = MarkItDown()
    res = md.convert(sys.argv[2])
    f = open(sys.argv[3], 'w', encoding='utf-8')
    f.write(res.text_content or '')
    f.close()
except Exception as e:
    f = open(sys.argv[3], 'w', encoding='utf-8')
    f.write('MARKITDOWN_ERROR:\\n')
    traceback.print_exc(file=f)
    f.close()`;
                        
                        const b64Script = Buffer.from(pyScript).toString('base64');
                        execSync(`python -c "import base64, sys; exec(base64.b64decode(sys.argv[1]).decode('utf-8'))" "${b64Script}" "${targetPath}" "${tempOutPath}"`, {
                            encoding: 'utf-8',
                            maxBuffer: 20 * 1024 * 1024,
                            env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' }
                        });
                        
                        let result = "";
                        if (fs.existsSync(tempOutPath)) {
                            result = fs.readFileSync(tempOutPath, 'utf-8');
                            fs.unlinkSync(tempOutPath); // Cleanup
                        }

                        if (result.trim() === "") {
                            await this.log(state.current_run_id, `⚠️ MarkItDown คืนค่าข้อความว่างเปล่าสำหรับ ${fileName} (อาจเป็นรูปภาพสแกนหรือ PDF ที่ไม่มี Text Layer)`);
                        } else {
                            markdownContent += (markdownContent ? "\n\n---\n\n" : "") + result;
                            convertedCount++;
                            await this.log(state.current_run_id, `✅ MarkItDown successfully converted ${fileName}`);
                        }
                    } catch (e: any) {
                        await this.log(state.current_run_id, `⚠️ MarkItDown error for ${fileName}: ${e.message}`);
                        
                        // ONLY fallback to raw read if the file is NOT a binary file type (like PDF, DOCX, PNG, etc)
                        const lowerName = fileName.toLowerCase();
                        if (lowerName.endsWith('.md') || lowerName.endsWith('.txt') || lowerName.endsWith('.csv') || lowerName.endsWith('.json')) {
                            await this.log(state.current_run_id, `Falling back to raw text read for ${fileName}.`);
                            try {
                                const rawText = fs.readFileSync(targetPath, 'utf-8');
                                markdownContent += (markdownContent ? "\n\n---\n\n" : "") + rawText;
                                convertedCount++;
                            } catch (err: any) {
                                await this.log(state.current_run_id, `❌ Failed to read file ${fileName}: ${err.message}`);
                            }
                        } else {
                            await this.log(state.current_run_id, `❌ Skipping fallback read for binary file ${fileName} to prevent database corruption.`);
                        }
                    }
                } else {
                    await this.log(state.current_run_id, `❌ File not found: ${fileName} in both agentDir and queuePdfDir. (Looked at: ${targetPath})`);
                }
            }

            if (!markdownContent) {
                markdownContent = `# Mark It Down Result\n\nNo text or documents could be converted for row ${currentIndex + 1}.`;
            }

            const outPath = path.join(agentDir, outFilename);
            fs.writeFileSync(outPath, markdownContent, "utf-8");

            savedOutputs.push(outFilename);
            currentIndex += 1;

            await this.log(state.current_run_id, `[STEP 4] Completed index ${currentIndex - 1}. Saved markdown to ${outFilename}`);
            await this.log(state.current_run_id, `[STEP 5] บันทึกผลลัพธ์ Markdown ทั้งหมดลงไฟล์ ${outFilename} เก็บไว้ที่ Path: ${outPath} สำเร็จ (Status: Complete)`);
        } else {
            await this.log(state.current_run_id, `[STEP 5] โหนดยังไม่พร้อมประมวลผลหรือทำครบจำนวนแถวเดิมแล้ว (isReady = false)`);
        }

        // Loop control logic
        let hasNext = true;
        for (const [pId, pTable] of Object.entries(driverParentsData)) {
            const pMax = previousMaxList[pId] || 0;
            if (currentIndex >= pMax) {
                hasNext = false;
                await this.log(state.current_run_id, `[DEBUG-LOOP] pId: ${pId} -> currentIndex (${currentIndex}) >= pMax (${pMax}). Stopping loop.`);
                break;
            } else {
                await this.log(state.current_run_id, `[DEBUG-LOOP] pId: ${pId} -> currentIndex (${currentIndex}) < pMax (${pMax}). Continuing loop.`);
            }
        }
        if (!isReady) hasNext = false;

        if (hasNext) {
            await this.log(state.current_run_id, `[STEP 6] ตรวจสอบพบว่า previous_max มากกว่า current_index ปัจจุบัน (${currentIndex}) จึงตั้งค่า hasNext = true เพื่อวนลูปทำไฟล์ต่อไป...`);
        } else {
            await this.log(state.current_run_id, `[STEP 6] ตรวจสอบพบว่า current_index (${currentIndex}) ถึงค่า previous_max แล้ว จึงตั้งค่า hasNext = false เพื่อจบการทำงานของ Node นี้`);
        }

        state.variables["hasNext"] = hasNext;
        state.variables["has_next"] = hasNext;

        // Build output table data
        let pdfQueue: any[] = [];
        if (Object.keys(driverParentsData).length > 0) {
            pdfQueue = Object.values(driverParentsData)[0];
        }

        const maxPrev = Object.values(previousMaxList).length > 0 ? Math.max(...Object.values(previousMaxList) as number[]) : 0;
        const queueLength = maxPrev;

        const updatedTable: any[] = [];
        for (let i = 0; i < queueLength; i++) {
            const parentRow = pdfQueue[i] || {};
            let isDone = i < currentIndex;
            let fileLink = "";
            
            if (i < savedOutputs.length) {
                fileLink = `http://localhost:8000/api/agent_result/${savedOutputs[i]}`;
            } else if (parentRow["MarkItDown File"] || parentRow["File Link"]) {
                fileLink = parentRow["MarkItDown File"] || parentRow["File Link"];
            }

            const rowItem: any = {
                ...parentRow,
                "MarkItDown File": fileLink,
                "Status": isDone ? "Complete" : "Pending"
            };
            updatedTable.push(rowItem);
        }

        this.nodeData.parameters = {
            ...params,
            agentOutputsTable: savedOutputs,
            markitdownTable: updatedTable,
            currentIndex,
            previous_max: queueLength
        };

        const outputData = {
            agentOutputsTable: savedOutputs,
            markitdownTable: updatedTable,
            markitdownOutputs: savedOutputs,
            currentIndex,
            previousMaxList: previousMaxList || {},
            previous_max: queueLength,
            hasNext
        };

        this.output_data = outputData;
        state.variables[`${this.node_id}_output`] = outputData;

        if (this.node_complete_callback) {
            await this.node_complete_callback(this.node_id, outputData);
        }

        return state;
    }
}
