import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { WorkflowNode, WorkflowState } from '../Node_Workflow';
import { AIModels } from '../../AI_Models';
import { GoogleGenAI } from '@google/genai';
import glob from 'glob';
import { PDFDocument } from 'pdf-lib';
import { getWorkflowInputDir, getWorkflowOutputDir } from "../../workflow_paths";
import { execFile } from 'child_process';
import util from 'util';
import { updateNodeProgress } from '../../node_progress';

const execFileAsync = util.promisify(execFile);

export class Agent extends WorkflowNode {
    async execute(state: WorkflowState): Promise<any> {
        this.resolve_inputs(state);
        
        await this.log(
            state.current_run_id,
            `Node '${this.label}' (${this.nodeType}) started execution.`
        );
        
        const params = this.nodeData.parameters || {};
        const workflowId = state.workflow_id || state.variables.workflow_id || "wf";
        
        const driverParentsData: Record<string, any[]> = {};
        const wfNodes = state.variables._workflow_nodes || [];
        const wfEdges = state.variables._workflow_edges || [];
        const incomingEdges = wfEdges.filter((e: any) => e.target === this.nodeId);
        const incomingNodeIds = [...new Set(incomingEdges.map((e: any) => e.source))];
        
        const previousMaxList: Record<string, number> = {};
        
        await this.log(state.current_run_id, "[STEP 1] Waking up. Fetching max file counts from parent nodes...");
        for (const edge of incomingEdges) {
            const nId = edge.source;
            const srcNode = wfNodes.find((n: any) => n.id === nId);
            if (srcNode) {
                const nType = (srcNode.type || "").toLowerCase();
                const nName = (srcNode.data?.name || "").toLowerCase();
                const isDriver = nType.includes("agent") || nName.includes("agent") || nType.includes("pdf") || nName.includes("pdf") || nType.includes("queue") || nName.includes("queue") || nName.includes("connector");
                
                if (isDriver) {
                    const srcData = srcNode.data || {};
                    const srcParams = srcData.parameters || {};
                    const dynamicOut = state.variables[`${nId}_output`] || {};
                    const isAgentParent = nType.includes("agent") || nName.includes("agent");
                    let table: any[] = [];
                    
                    const sourceHandle = edge.sourceHandle;
                    let specificFieldData = null;
                    const isJsonConnector = nName.includes("json") && nName.includes("connector");

                    if (sourceHandle && sourceHandle !== "output" && sourceHandle !== "bottom-source") {
                        specificFieldData = state.variables[`${nId}_field_${sourceHandle}_to_${this.nodeId}`];
                        if (!specificFieldData && state.variables[`${this.nodeId}_input_data`]) {
                             const inData = state.variables[`${this.nodeId}_input_data`];
                             if (inData[sourceHandle]) {
                                 specificFieldData = { [sourceHandle]: inData[sourceHandle] };
                             } else if (Array.isArray(inData)) {
                                 const fieldArr = inData.map(row => typeof row === 'object' && row !== null ? row[sourceHandle] : undefined).filter(x => x !== undefined);
                                 if (fieldArr.length > 0) {
                                     specificFieldData = { [sourceHandle]: fieldArr };
                                 }
                             }
                        }
                    }
                    
                    if (specificFieldData && specificFieldData[sourceHandle]) {
                        const fieldArr = specificFieldData[sourceHandle];
                        if (Array.isArray(fieldArr)) {
                             table = fieldArr.map((val: any) => ({ [sourceHandle]: val }));
                        } else {
                             table = [{ [sourceHandle]: fieldArr }];
                        }
                    } else if (isJsonConnector && sourceHandle === "output") {
                        const inData = state.variables[`${this.nodeId}_input_data`];
                        if (Array.isArray(inData)) {
                            table = inData;
                        } else if (inData) {
                            table = [inData];
                        }
                    } else {
                        const isPdfQueue = nType.includes("queue") || nName.includes("queue") || nName.includes("connector");
                        const srcParams = srcData.parameters || {};
                        if (isAgentParent) {
                            table = (dynamicOut ? dynamicOut.agentOutputsTable : null) || srcParams.agentOutputsTable || [];
                        } else if (isPdfQueue) {
                            let t1 = (dynamicOut ? dynamicOut.pdfQueue : null) || srcParams.pdfQueue || (dynamicOut ? dynamicOut.txtQueue : null) || srcParams.txtQueue;
                            
const t2 = (dynamicOut ? dynamicOut.agentOutputsTable : null) || srcParams.agentOutputsTable;
                            table = (Array.isArray(t1) && t1.length > 0) ? t1 : ((Array.isArray(t2) && t2.length > 0) ? t2 : (t1 || t2 || []));
                        } else {
                            table = (dynamicOut ? dynamicOut.table : null) || srcParams.table || [];
                        }
                    }
                    
                    const parentKey = (sourceHandle && sourceHandle !== "output" && sourceHandle !== "bottom-source")
                        ? `${nId}_${sourceHandle}`
                        : nId;
                    driverParentsData[parentKey] = table;
                    let parentCount = Array.isArray(table) ? table.length : (typeof table === 'object' && table !== null ? Object.keys(table).length : 0);
                    if (parentCount === 0 && srcParams.previous_max) {
                        parentCount = Number(srcParams.previous_max) || 0;
                    } else if (parentCount === 0 && srcParams.queueLength) {
                        parentCount = Number(srcParams.queueLength) || 0;
                    }
                    previousMaxList[parentKey] = parentCount;
                    
                    if (isJsonConnector && sourceHandle && sourceHandle !== "output") {
                        await this.log(state.current_run_id, `[STEP 1] พบ JSON Connector List ส่ง field '${sourceHandle}' มีข้อมูลทั้งหมด ${parentCount} รายการ จัดเก็บเข้า previous_max สำเร็จ`);
                    } else {
                        await this.log(state.current_run_id, `[STEP 1] พบโหนดพ่อแม่ ${nName} (Queue/Agent) มีไฟล์รอดำเนินการสูงสุด (Max) คือ ${parentCount} ไฟล์ ทำการอัปเดต previous_max เป็น ${parentCount}`);
                    }
                }
            }
        }
                    
        state.variables[`${this.nodeId}_previous_max_list`] = previousMaxList;

        const backendDir = path.resolve(__dirname, '..', '..');
        const agentDir = getWorkflowOutputDir(state.workflow_id || state.variables?.workflow_id);
        await fs.mkdir(agentDir, { recursive: true });
        
        const completedFiles: string[] = [];
        const cleanNodeId = this.nodeId.replace("node_", "");
        try {
            const files = await fs.readdir(agentDir);
            for (const f of files) {
                if (f.startsWith(`${cleanNodeId}_`) && (f.endsWith(".txt") || f.endsWith(".md"))) {
                    completedFiles.push(f);
                }
            }
        } catch (e) {}
                
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
        // Populate existing files on disk into savedJsons to prevent re-processing
        for (const f of completedFiles) {
            const match = f.match(/^([^_]+)_(\d+)_/);
            if (match && !savedJsons[match[2]]) {
                savedJsons[match[2]] = f;
            }
        }
        let agentOutputStatusesMap = params.agentOutputStatusesMap || {};
        
        let targetKeyToProcess = null;
        let isReady = false;
        
        if (Object.keys(driverParentsData).length > 0) {
            let allKeys = new Set<string>();
            for (const pTable of Object.values(driverParentsData)) {
                 if (typeof pTable === 'object' && !Array.isArray(pTable)) {
                     Object.keys(pTable).forEach(k => allKeys.add(k));
                 } else if (Array.isArray(pTable)) {
                     pTable.forEach((_, i) => allKeys.add(String(i + 1)));
                 }
            }
            
            const sortedKeys = Array.from(allKeys).sort((a, b) => parseInt(a) - parseInt(b));
            for (const k of sortedKeys) {
                 if (!savedJsons[k]) {
                      targetKeyToProcess = k;
                      isReady = true;
                      break;
                 }
            }
        }
        
        await this.log(state.current_run_id, `[STEP 0] Wake up. Target Key to process: ${targetKeyToProcess || 'none'}`);
        let outFilename = "";
        let baseFolderAndFileName = "";
        let resolvedPdfName = "";
        let currentIndex = targetKeyToProcess ? parseInt(targetKeyToProcess) : 0;
        
        if (isReady && targetKeyToProcess !== null) {
            await this.log(state.current_run_id, `[STEP 1] Found unprocessed key: ${targetKeyToProcess}`);
            updateNodeProgress(this.nodeId, {
                workflowId: state.workflow_id,
                currentIndex: currentIndex,
                percent: 10,
                status: 'Active',
                stepMessage: `กำลังเตรียมข้อมูลสำหรับแถวที่ ${currentIndex}...`
            });
            const combinedItems: any[] = [];
            for (const [pId, pTable] of Object.entries(driverParentsData)) {
                if (typeof pTable === 'object' && !Array.isArray(pTable)) {
                    if (pTable[targetKeyToProcess]) combinedItems.push(pTable[targetKeyToProcess]);
                } else if (Array.isArray(pTable)) {
                    const idx = parseInt(targetKeyToProcess) - 1;
                    if (idx >= 0 && idx < pTable.length) combinedItems.push(pTable[idx]);
                }
            }
            
            const now = new Date();
            const pad = (n: number) => n.toString().padStart(2, '0');
            const yy = now.getFullYear().toString().slice(-2);
            const MM = pad(now.getMonth() + 1);
            const dd = pad(now.getDate());
            const hh = pad(now.getHours());
            const mm = pad(now.getMinutes());
            const ss = pad(now.getSeconds());
            const currentTimestamp = `${yy}${MM}${dd}_${hh}${mm}${ss}`;

            // Helper to extract the actual PDF file name
            const extractPdfName = (item: any): string => {
                let name = "";
                if (typeof item === 'object' && item !== null) {
                    if (item.disk_name && typeof item.disk_name === 'string') {
                        name = item.disk_name;
                    } else if (item.filename && typeof item.filename === 'string') {
                        name = item.filename;
                    } else if (item.url && typeof item.url === 'string') {
                        name = item.url.split('/').pop() || "";
                    } else if (item.name && typeof item.name === 'string') {
                        name = item.name;
                    } else if (item.criterion?.name) {
                        name = String(item.criterion.name);
                    }
                } else if (typeof item === 'string') {
                    name = item.split('/').pop() || item;
                }

                if (name.includes('?')) {
                    name = name.split('?')[0];
                }

                name = name.replace(/\.(pdf|txt|png|json|md)$/i, '');
                // Strip queue node prefix if present (e.g. 1783066561941_1_)
                name = name.replace(/^([^_]+)_(\d+)_/, '');
                // Strip timestamps if present (e.g. _09-09-26_16-03-03 or _260909_160303)
                name = name.replace(/_\d{2}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/, '');
                name = name.replace(/_\d{6}_\d{6}$/, '');
                name = name.replace(/_\d{8}_\d{6}$/, '');
                name = name.replace(/-\d{10}$/, '');

                name = name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim();
                return name || "document";
            };

            const pdfNames = combinedItems.map(item => extractPdfName(item)).filter(Boolean);
            resolvedPdfName = pdfNames.length > 0 ? pdfNames.join("_") : "document";

            // Naming convention: "รหัส id ของ node + id row ของ Table + ชื่อของ file pdf + datetime stamp อย่างย่อ"
            const rowId = targetKeyToProcess || String(currentIndex || 1);
            baseFolderAndFileName = `${cleanNodeId}_${rowId}_${resolvedPdfName}_${currentTimestamp}`;
            outFilename = `${baseFolderAndFileName}.md`;
            
            const combinedFilenames = combinedItems.map(x => typeof x !== 'object' ? String(x) : "DataRow").join(" + ");
            await this.log(state.current_run_id, `[STEP 2] Row Data Extracted. Files to process in this row: ${combinedFilenames}`);
            await this.log(state.current_run_id, `[STEP 4 PREP] Planned output file for this row: ${outFilename}`);
            
            const queuePdfDir = getWorkflowInputDir(state.workflow_id || state.variables?.workflow_id);
            const modelName = params.modelName || "gemini-1.5-flash";
            
            const aiModelsData = state.variables.ai_models || [];
            const aiModelsInstance = new AIModels(aiModelsData);
            const modelInfo = aiModelsInstance.getModelInfo(modelName);
            let provider = aiModelsInstance.getProvider(modelName);
            let modelMaxTokens = aiModelsInstance.getMaxTokens(modelName, Number(params.maxOutputTokens || 16384));
            let modelTemp = 0.0;
            if (modelInfo.temperature !== undefined && modelInfo.temperature !== null) {
                modelTemp = Number(modelInfo.temperature);
            }
            
            // 1. Direct parameter API Key check
            let apiKey = (params.googleApiKey || params.apiKey || "").trim();

            // 2. Query AIModels instance
            if (!apiKey) {
                apiKey = (aiModelsInstance.getApiKey(modelName) || "").trim();
            }

            // 3. Determine if OpenRouter
            let isOpenrouter = provider.toLowerCase() === "openrouter" || provider.toLowerCase() === "openrouter.ai";
            if (!isOpenrouter && modelName.includes("/") && !modelName.startsWith("google/")) {
                isOpenrouter = true;
            }

            // If marked as OpenRouter, check if we have an OpenRouter key
            if (isOpenrouter) {
                let openrouterKey = "";
                for (const m of aiModelsData) {
                    if (m.provider === "OpenRouter.ai" || m.provider?.toLowerCase().includes("openrouter")) {
                        openrouterKey = (m.apiKey || "").trim();
                        if (openrouterKey) break;
                    }
                }
                if (!openrouterKey) {
                    openrouterKey = (process.env.OPENROUTER_API_KEY || "").trim();
                }
                if (openrouterKey) {
                    apiKey = openrouterKey;
                } else if (apiKey.startsWith("AQ.") || modelName.startsWith("google/") || modelName.includes("gemini")) {
                    // OpenRouter key not found, but Google Gemini key or model is present -> fallback to Google GenAI
                    isOpenrouter = false;
                }
            }

            // 4. Fallback to any Google Gemini key if apiKey is still missing
            if (!apiKey) {
                for (const m of aiModelsData) {
                    if (m.modelName?.toLowerCase().includes("gemini") || m.provider === "Google" || (m.apiKey && m.apiKey.startsWith("AQ."))) {
                        apiKey = (m.apiKey || "").trim();
                        if (apiKey) break;
                    }
                }
            }
            if (!apiKey) {
                apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
            }
                
            let promptText = this.nodeData.prompt || "Analyze this document and extract key information.";
            
            let appendedJsonText = "";
            
          const incomingEdgesForJson = wfEdges.filter((e: any) => e.target === this.nodeId);
          const processedSrcHandles = new Set<string>();

          for (const edge of incomingEdgesForJson) {
              const srcNode = wfNodes.find((n: any) => n.id === edge.source);
              if (!srcNode) continue;
              
              const srcKey = `${edge.source}-${edge.sourceHandle || 'default'}`;
              if (processedSrcHandles.has(srcKey)) continue;
              processedSrcHandles.add(srcKey);

              const srcType = srcNode.type;
              const srcData = srcNode.data || {};
              
              if ((srcType === "rubric" || srcType === "mca") && srcData.rubricData) {
                  let finalData = srcData.rubricData;
                  if (edge.sourceHandle && edge.sourceHandle.startsWith("criterion-")) {
                      const critId = edge.sourceHandle.replace("criterion-", "");
                      const selectedCrit = srcData.rubricData.criteria?.find((c: any) => c.id === critId);
                      if (selectedCrit) {
                          finalData = {
                              ...srcData.rubricData,
                              criteria: [selectedCrit]
                          };
                      }
                  }
                  appendedJsonText += "\n\n" + srcType.toUpperCase() + " JSON:\n" + JSON.stringify(finalData, null, 2);
              } else if (srcType === "sample" && srcData.sampleData) {
                  let finalData = srcData.sampleData;
                  if (edge.sourceHandle && edge.sourceHandle.startsWith("sample-") && edge.sourceHandle !== "sample-all") {
                      const sampleId = edge.sourceHandle.replace("sample-", "");
                      const selectedSample = srcData.sampleData.samples?.find((s: any) => s.id === sampleId);
                      if (selectedSample) {
                          finalData = {
                              ...srcData.sampleData,
                              samples: [selectedSample]
                          };
                      }
                  }
                  appendedJsonText += "\n\nSample JSON:\n" + JSON.stringify(finalData, null, 2);
              } else if (srcType === "table" && srcData.tableData) {
                  let finalData = srcData.tableData;
                  if (edge.sourceHandle && edge.sourceHandle.startsWith("table-row-")) {
                      const rowId = edge.sourceHandle.replace("table-row-", "");
                      const selectedRow = srcData.tableData.rows?.find((r: any) => r.id === rowId);
                      if (selectedRow) {
                          finalData = {
                              ...srcData.tableData,
                              rows: [selectedRow]
                          };
                      }
                  }
                  appendedJsonText += "\n\nTable JSON:\n" + JSON.stringify(finalData, null, 2);
              }
          }

            const get_field_info = async (currIndex: number, fName: string, parentId: string) => {
                const fieldData = state.variables[`${parentId}_field_${fName}_to_${this.nodeId}`];
                if (fieldData && Array.isArray(fieldData[fName]) && fieldData[fName].length > currIndex) {
                    return fieldData[fName][currIndex];
                }
                const inData = state.variables[`${this.nodeId}_input_data`];
                if (inData && Array.isArray(inData) && inData.length > currIndex) {
                    const row = inData[currIndex];
                    if (row && typeof row === 'object' && fName in row) return row[fName];
                }
                return null;
            };

            promptText += appendedJsonText;
            let rowDataText = "";
            
            for (const edge of incomingEdges) {
                const nId = edge.source;
                const sourceHandle = edge.sourceHandle;
                const srcNode = wfNodes.find((n: any) => n.id === nId);
                const nName = (srcNode?.data?.name || "").toLowerCase();
                const isJsonConnector = nName.includes("json") && nName.includes("connector");

                if (isJsonConnector && sourceHandle && sourceHandle !== "output" && sourceHandle !== "bottom-source") {
                    const textInfo = await get_field_info(currentIndex, sourceHandle, nId);
                    if (textInfo) {
                        await this.log(state.current_run_id, `[STEP 2] get_field_info: ดึงข้อมูล field '${sourceHandle}' ที่ index ${currentIndex} สำเร็จ ได้ text ความยาว ${String(textInfo).length} ตัวอักษร นำไปแนบ Prompt ส่งให้ AI`);
                        // Avoid duplication if the field is also in combinedItems
                        for (const item of combinedItems) {
                            if (typeof item === 'object' && sourceHandle in item) {
                                delete item[sourceHandle];
                            }
                        }
                        
                        const regex = new RegExp(`\\{\$\{sourceHandle\}\\}`, 'g');
                        if (promptText.match(regex)) {
                             promptText = promptText.replace(regex, String(textInfo));
                        } else {
                             rowDataText += `\n\n--- Data: ${sourceHandle} ---\n${textInfo}`;
                        }
                    }
                }
            }

            for (const item of combinedItems) {
                if (typeof item === 'object') {
                    for (const key in item) {
                        const regex = new RegExp(`\\{\$\{key\}\\}`, 'g');
                        if (promptText.match(regex)) {
                             promptText = promptText.replace(regex, item[key]);
                        } else {
                             if (key !== 'file' && key !== 'pdf' && key !== 'txt' && key !== 'name' && key !== 'criterion') {
                                 rowDataText += `\n\n--- Data: ${key} ---\n${item[key]}`;
                             }
                        }
                    }
                }
            }
            promptText += rowDataText;
            updateNodeProgress(this.nodeId, {
                workflowId: state.workflow_id,
                currentIndex: currentIndex,
                percent: 25,
                status: 'Active',
                stepMessage: `จัดเตรียม Prompt และบริบทเอกสารสำหรับแถวที่ ${currentIndex} เรียบร้อย...`
            });

            // 1. Extract input files (txt/md and pdf) from combinedItems before LLM call
            const pdfItems: string[] = [];
            const txtItems: string[] = [];
            for (const item of combinedItems) {
                let extractedItem = item;
                if (typeof item === 'object') extractedItem = item.disk_name || item.url || item.filename || '';
                if (!extractedItem || typeof extractedItem !== 'string') continue;
                const baseName = extractedItem.split('/').pop() || "";
                if (baseName.toLowerCase().endsWith(".txt") || baseName.toLowerCase().endsWith(".md")) {
                    txtItems.push(baseName);
                } else {
                    pdfItems.push(baseName);
                }
            }
            
            for (const txtFile of txtItems) {
                let txtPath = path.join(agentDir, txtFile);
                const ex1 = await fs.access(txtPath).then(() => true).catch(() => false);
                if (!ex1) {
                    txtPath = path.join(queuePdfDir, txtFile);
                }
                try {
                    const extractedText = await fs.readFile(txtPath, "utf-8");
                    promptText += `\n\n--- Text from ${txtFile} ---\n${extractedText}`;
                    await this.log(state.current_run_id, `[STEP 2.1] อ่านไฟล์อินพุต '${txtFile}' สำเร็จ (${extractedText.length} ตัวอักษร) แนบเข้ากับ Prompt เรียบร้อย`);
                } catch (e: any) {
                    await this.log(state.current_run_id, `Error reading text file ${txtFile}: ${e.message}`);
                }
            }
            await this.log(state.current_run_id, `[STEP 2.2] ข้อมูลนำเข้าสำหรับแถวที่ ${currentIndex}: ${txtItems.length} text/md files, ${pdfItems.length} pdf files. Prompt รวมความยาว: ${promptText.length} ตัวอักษร`);

            // 2. Validate API key
            if (!apiKey) {
                const errMsg = "❌ Error: No API Key provided in Agent parameters or AI Models configuration. Please set the API Key.";
                await this.log(state.current_run_id, errMsg);
                updateNodeProgress(this.nodeId, {
                    workflowId: state.workflow_id,
                    currentIndex: currentIndex,
                    percent: 0,
                    status: 'Error',
                    stepMessage: errMsg
                });
                return {
                    status: "error",
                    error: errMsg,
                    updated_variables: state.variables,
                    outputs: {
                        agentOutputsTable: savedJsons,
                        currentIndex: currentIndex > 1 ? currentIndex - 1 : 0
                    }
                };
            }

            let outputContent = "";
            const outPath = path.join(agentDir, outFilename);
            try {
                let modelEndpoint = modelName;
                if (!isOpenrouter) {
                    if (modelEndpoint.startsWith("google/")) {
                        modelEndpoint = modelEndpoint.replace(/^google\//, "");
                    }
                    if (modelEndpoint === "gemini-1.5-flash") {
                        modelEndpoint = "gemini-1.5-flash-latest";
                    } else if (modelEndpoint === "gemini-1.5-pro") {
                        modelEndpoint = "gemini-1.5-pro-latest";
                    }
                }
                const ai = new GoogleGenAI({ apiKey });
                    
                    if (pdfItems.length === 0) {
                        if (txtItems.length > 0) {
                            await this.log(state.current_run_id, `[STEP 3] Preparing to send prompt by attaching .txt file(s). txt_items=${txtItems}`);
                            await this.log(state.current_run_id, `Processing ${txtItems.length} text files directly without chunking...`);
                        } else {
                            await this.log(state.current_run_id, `[STEP 3] Processing JSON row data directly (no files attached)...`);
                        }
                        
                        updateNodeProgress(this.nodeId, {
                            workflowId: state.workflow_id,
                            currentIndex: currentIndex,
                            percent: 45,
                            status: 'Active',
                            filename: outFilename,
                            stepMessage: `กำลังส่ง Prompt ให้ AI (${modelName}) ทำการวิเคราะห์แถวที่ ${currentIndex}...`
                        });

                        if (isOpenrouter) {
                            const url = "https://openrouter.ai/api/v1/chat/completions";
                            const payload = {
                                model: modelEndpoint,
                                messages: [{ role: "user", content: promptText }],
                                temperature: modelTemp,
                                max_tokens: modelMaxTokens || 16384
                            };
                            const headers = {
                                "Authorization": `Bearer ${apiKey}`,
                                "Content-Type": "application/json",
                                "HTTP-Referer": "http://localhost:3000",
                                "X-Title": "AI Agent PDFs"
                            };
                            const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
                            const resData = await res.json();
                            outputContent = resData.choices?.[0]?.message?.content || "";
                        } else {
                            const config: any = {
                                temperature: modelTemp,
                                maxOutputTokens: modelMaxTokens || 16384
                            };
                            let responseObj: any = null;
                            const candidateModels = [modelEndpoint];
                            if (modelEndpoint !== 'gemini-3.6-flash' && !candidateModels.includes('gemini-3.6-flash')) {
                                candidateModels.push('gemini-3.6-flash');
                            }
                            if (modelEndpoint !== 'gemini-3.1-flash-lite' && !candidateModels.includes('gemini-3.1-flash-lite')) {
                                candidateModels.push('gemini-3.1-flash-lite');
                            }
                            let lastError: any = null;
                            for (const currentModel of candidateModels) {
                                try {
                                    if (currentModel !== modelEndpoint) {
                                        await this.log(state.current_run_id, `⚠️ Model '${modelEndpoint}' เกิดปัญหา/หนาแน่น สลับมาใช้ '${currentModel}' สำรอง...`);
                                    }
                                    responseObj = await ai.models.generateContent({
                                        model: currentModel,
                                        contents: [promptText],
                                        config: config
                                    });
                                    if (responseObj) break;
                                } catch (genErr: any) {
                                    lastError = genErr;
                                    await this.log(state.current_run_id, `⚠️ โมเดล ${currentModel} พบข้อผิดพลาด: ${genErr.message}`);
                                    const errMsg = (genErr.message || '').toLowerCase();
                                    if (errMsg.includes('503') || errMsg.includes('404') || errMsg.includes('not found') || errMsg.includes('high demand') || errMsg.includes('unavailable')) {
                                        continue;
                                    } else {
                                        throw genErr;
                                    }
                                }
                            }
                            if (!responseObj && lastError) {
                                throw lastError;
                            }
                            
                            const candidate = responseObj.candidates?.[0] || null;
                            const finishReason = candidate?.finishReason;
                            if (finishReason && finishReason !== "STOP") {
                                if (finishReason === "MAX_TOKENS" && responseObj.text) {
                                    outputContent = responseObj.text + "\n\n[MAX_TOKENS]";
                                } else {
                                    outputContent = `Error: ${finishReason}`;
                                }
                            } else if (responseObj.text) {
                                outputContent = responseObj.text;
                            }
                        }

                        updateNodeProgress(this.nodeId, {
                            workflowId: state.workflow_id,
                            currentIndex: currentIndex,
                            percent: 85,
                            status: 'Active',
                            filename: outFilename,
                            stepMessage: `AI วิเคราะห์ผลลัพธ์สำเร็จ กำลังจัดรูปแบบและบันทึกผลลัพธ์แถวที่ ${currentIndex}...`
                        });

                        await this.log(state.current_run_id, `✅ Successfully processed text files.`);
                    } else if (pdfItems.length > 0) {
                        await this.log(state.current_run_id, `[STEP 3 (PDF)] Processing as raw PDFs (no text file). pdf_items=${pdfItems}`);
                        for (let baseName of pdfItems) {
                            let pdfPath = path.join(agentDir, baseName);
                            let exists = await fs.access(pdfPath).then(() => true).catch(() => false);
                            if (!exists) {
                                pdfPath = path.join(queuePdfDir, baseName);
                                exists = await fs.access(pdfPath).then(() => true).catch(() => false);
                            }
                            if (!exists) {
                                const prefixMatch = baseName.match(/^([^_]+)_(\d+)_/);
                                if (prefixMatch) {
                                    const prefix = `${prefixMatch[1]}_${prefixMatch[2]}`;
                                    const pattern = `${prefix}_*.pdf`;
                                    let globMatched = glob.sync(path.join(agentDir, pattern));
                                    if (globMatched.length === 0) globMatched = glob.sync(path.join(queuePdfDir, pattern));
                                    if (globMatched.length > 0) {
                                        globMatched.sort((a, b) => fsSync.statSync(b).mtimeMs - fsSync.statSync(a).mtimeMs);
                                        pdfPath = globMatched[0];
                                        baseName = path.basename(pdfPath);
                                    }
                                }
                            }
                            
                            const pdfExists = await fs.access(pdfPath).then(() => true).catch(() => false);
                            if (!pdfExists) {
                                const errMsg = `❌ Error: Cannot find file '${baseName}' in backend storage. Please ensure it was uploaded.`;
                                await this.log(state.current_run_id, errMsg);
                                return { status: "error", message: errMsg };
                            }
                            
                            const pdfBuffer = await fs.readFile(pdfPath);
                            const pdfDoc = await PDFDocument.load(pdfBuffer);
                            const maxPage = pdfDoc.getPageCount();
                            
                            await this.log(state.current_run_id, `[STEP 2] ทำการดึงไฟล์ PDF ชื่อ ${baseName} จาก Path: ${pdfPath}`);
                            await this.log(state.current_run_id, `[STEP 3] เริ่มทำการ Chunking ไฟล์ ${baseName} จำนวนทั้งหมด ${maxPage} หน้า`);
                            
                            updateNodeProgress(this.nodeId, {
                                workflowId: state.workflow_id,
                                currentIndex: currentIndex,
                                currentPage: 1,
                                totalPages: maxPage,
                                percent: 5,
                                status: 'Active',
                                filename: outFilename,
                                stepMessage: `กำลังเริ่มประมวลผล ${baseName} (${maxPage} หน้า)`
                            });
                            
                            try {
                                await fs.writeFile(outPath, "", "utf-8");
                            } catch(e) {}
                            
                            const outputFolderName = baseFolderAndFileName || (outFilename.endsWith('.md') ? outFilename.slice(0, -3) : (outFilename.endsWith('.txt') ? outFilename.slice(0, -4) : outFilename));
                            const chunkDir = path.join(agentDir, outputFolderName);
                            await fs.mkdir(chunkDir, { recursive: true });

                            for (let startPage = 0; startPage < maxPage; startPage++) {
                                const filePureName = resolvedPdfName || baseName.substring(0, baseName.lastIndexOf('.pdf')) || outputFolderName;
                                const chunkName = `${filePureName}_page_${startPage+1}.png`;
                                const chunkPath = path.join(chunkDir, chunkName);
                                
                                const pageNum = startPage + 1;
                                const convertPercent = Math.max(5, Math.round(((startPage) / maxPage) * 90));
                                updateNodeProgress(this.nodeId, {
                                    currentIndex,
                                    currentPage: pageNum,
                                    totalPages: maxPage,
                                    percent: convertPercent,
                                    status: 'Active',
                                    stepMessage: `แปลง PDF หน้า ${pageNum}/${maxPage} เป็นรูปภาพ...`
                                });
                                
                                await this.log(state.current_run_id, `[STEP 3.1] Converting page ${startPage+1} to PNG: ${chunkName} at ${chunkPath}`);
                                
                                try {
                                    await execFileAsync('python', [
                                        path.join(backendDir, 'pdf2png.py'), 
                                        pdfPath, 
                                        String(startPage), 
                                        chunkPath
                                    ]);
                                } catch (pythonErr: any) {
                                    throw new Error(`Failed to convert PDF page ${startPage+1} to image. Is python and PyMuPDF installed? Error: ${pythonErr.message}`);
                                }
                                
                                const ocrPercent = Math.max(5, Math.round(((startPage + 0.3) / maxPage) * 90));
                                updateNodeProgress(this.nodeId, {
                                    currentIndex,
                                    currentPage: pageNum,
                                    totalPages: maxPage,
                                    percent: ocrPercent,
                                    status: 'Active',
                                    stepMessage: `กำลัง OCR หน้า ${pageNum}/${maxPage} ผ่าน AI...`
                                });
                                
                                await this.log(state.current_run_id, `[STEP 4] กำลังประมวลผล OCR หน้าที่ ${startPage+1} จาก ${maxPage} หน้า โดยส่งรูปไปยัง AI...`);
                                
                                let parts: any[] = [];
                                
                                if (isOpenrouter) {
                                    const imgBuffer = await fs.readFile(chunkPath);
                                    const base64Img = imgBuffer.toString('base64');
                                    parts = [
                                        { type: "text", text: promptText },
                                        { type: "image_url", image_url: { url: `data:image/png;base64,${base64Img}` } }
                                    ];
                                } else {
                                    const uploadedChunk = await ai.files.upload({ file: chunkPath, mimeType: "image/png" } as any);
                                    parts = [
                                        { text: promptText },
                                        { fileData: { fileUri: uploadedChunk.uri, mimeType: uploadedChunk.mimeType } }
                                    ];
                                }
                                
                                await this.log(state.current_run_id, `Processing chunk ${chunkName} (Page ${startPage+1})...`);
                                
                                const maxRetries = 3;
                                let chunkRes = "";
                                for (let attempt = 0; attempt < maxRetries; attempt++) {
                                    try {
                                        if (isOpenrouter) {
                                            const url = "https://openrouter.ai/api/v1/chat/completions";
                                            const payload = {
                                                model: modelEndpoint,
                                                messages: [{ role: "user", content: parts }],
                                                temperature: modelTemp,
                                                max_tokens: modelMaxTokens || 16384
                                            };
                                            const headers = {
                                                "Authorization": `Bearer ${apiKey}`,
                                                "Content-Type": "application/json",
                                                "HTTP-Referer": "http://localhost:3000",
                                                "X-Title": "AI Agent PDFs"
                                            };
                                            const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
                                            const resData = await res.json();
                                            chunkRes = resData.choices?.[0]?.message?.content || "";
                                        } else {
                                            const config: any = {
                                                temperature: modelTemp,
                                                maxOutputTokens: modelMaxTokens || 16384
                                            };
                                            const result = await ai.models.generateContent({
                                                model: modelEndpoint,
                                                contents: parts,
                                                config: config
                                            });
                                            
                                            const candidate = result.candidates?.[0] || null;
                                            const finishReason = candidate?.finishReason;
                                            if (finishReason && finishReason !== "STOP") {
                                                if (finishReason === "MAX_TOKENS" && result.text) {
                                                    chunkRes = result.text + "\n\n[MAX_TOKENS]";
                                                } else {
                                                    chunkRes = `Error: ${finishReason}`;
                                                }
                                            } else if (result.text) {
                                                chunkRes = result.text;
                                            }
                                        }
                                        break; // Success, break out of retry loop
                                    } catch (chunkE: any) {
                                        const errStr = chunkE.message.toLowerCase();
                                        if (errStr.includes("429") || errStr.includes("too many requests") || errStr.includes("quota") || errStr.includes("503")) {
                                            if (attempt < maxRetries - 1) {
                                                const waitTime = 15 * (attempt + 1);
                                                await this.log(state.current_run_id, `⏳ Rate limit hit! Retrying chunk ${chunkName} in ${waitTime}s... (Attempt ${attempt+1}/${maxRetries})`);
                                                await new Promise(r => setTimeout(r, waitTime * 1000));
                                            } else {
                                                throw chunkE;
                                            }
                                        } else {
                                            throw chunkE;
                                        }
                                    }
                                }
                                
                                const appendText = `\n\n--- Page ${startPage+1} ---\n${chunkRes}`;
                                outputContent += appendText;
                                try {
                                    await fs.appendFile(outPath, appendText, "utf-8");
                                } catch(e) {}
                                
                                const donePagePercent = Math.min(95, Math.round(((startPage + 1) / maxPage) * 90) + 5);
                                updateNodeProgress(this.nodeId, {
                                    currentIndex,
                                    currentPage: pageNum,
                                    totalPages: maxPage,
                                    percent: donePagePercent,
                                    status: 'Active',
                                    stepMessage: `ประมวลผลหน้า ${pageNum}/${maxPage} เสร็จสมบูรณ์`
                                });
                                
                                await this.log(state.current_run_id, `✅ [STEP 4.1] ทำการ OCR/ประมวลผล หน้าที่ ${startPage+1}/${maxPage} เสร็จสมบูรณ์ (Complete)`);
                                await new Promise(r => setTimeout(r, 4000));
                            }
                        }
                        await this.log(state.current_run_id, `✅ Successfully completed processing all chunks.`);
                    }
                } catch (e: any) {
                    const errMsg = `❌ API request failed: ${e.message}`;
                    await this.log(state.current_run_id, errMsg);
                    updateNodeProgress(this.nodeId, {
                        workflowId: state.workflow_id,
                        currentIndex,
                        status: 'Error',
                        stepMessage: errMsg
                    });
                    return {
                        status: "error",
                        error: errMsg,
                        updated_variables: state.variables,
                        outputs: {
                            agentOutputsTable: savedJsons,
                            currentIndex: currentIndex > 1 ? currentIndex - 1 : 0
                        }
                    };
                }

                if (!outputContent || outputContent.trim() === "" || outputContent.startsWith("Error:")) {
                    const errMsg = `❌ AI Model produced empty or error result: ${outputContent || 'No output'}`;
                    await this.log(state.current_run_id, errMsg);
                    updateNodeProgress(this.nodeId, {
                        workflowId: state.workflow_id,
                        currentIndex,
                        status: 'Error',
                        stepMessage: errMsg
                    });
                    return {
                        status: "error",
                        error: errMsg,
                        updated_variables: state.variables,
                        outputs: {
                            agentOutputsTable: savedJsons,
                            currentIndex: currentIndex > 1 ? currentIndex - 1 : 0
                        }
                    };
                }

                await fs.writeFile(outPath, outputContent, "utf-8");
                    
                savedJsons[targetKeyToProcess] = outFilename;
                currentIndex = parseInt(targetKeyToProcess) || currentIndex;
            
            updateNodeProgress(this.nodeId, {
                workflowId: state.workflow_id,
                currentIndex: currentIndex,
                percent: 100,
                status: 'Complete',
                stepMessage: `บันทึกแถวที่ ${currentIndex} สำเร็จ (Complete)`
            });
            
            await this.log(state.current_run_id, `[STEP 5] บันทึกผลลัพธ์ Output ทั้งหมดลงไฟล์ ${outFilename} เก็บไว้ที่ Path: ${outPath} สำเร็จ (Status: Complete)`);
            await this.log(state.current_run_id, `[STEP 5.1] ระบบบันทึกแถวที่ ${currentIndex} สำเร็จ เตรียมเปรียบเทียบ current_index กับ previous_max ของคิวพ่อแม่`);
            
            let hasNext = false;
            let nextKeyToProcess: string | null = null;
            if (Object.keys(driverParentsData).length > 0) {
                let allKeys = new Set<string>();
                for (const pTable of Object.values(driverParentsData)) {
                     if (typeof pTable === 'object' && !Array.isArray(pTable) && pTable !== null) {
                         Object.keys(pTable).forEach(k => allKeys.add(k));
                     } else if (Array.isArray(pTable)) {
                         pTable.forEach((_, i) => allKeys.add(String(i + 1)));
                     }
                }
                const sortedKeys = Array.from(allKeys).sort((a, b) => parseInt(a) - parseInt(b));
                for (const k of sortedKeys) {
                     if (!savedJsons[k]) {
                          hasNext = true;
                          nextKeyToProcess = k;
                          break;
                     }
                }
            }
            
            const validMaxVals = Object.values(previousMaxList).map(Number).filter(n => !isNaN(n) && n > 0);
            const queueLength = validMaxVals.length > 0 ? Math.max(...validMaxVals) : currentIndex;

            if (hasNext) {
                await this.log(state.current_run_id, `[STEP 6] ตรวจสอบพบว่า previous_max (${queueLength}) มากกว่า current_index ปัจจุบัน (${currentIndex}) โดยมีไฟล์คิวถัดไป (แถวที่: ${nextKeyToProcess}) จึงตั้งค่า hasNext = true เพื่อวนลูปทำไฟล์ต่อไป...`);
            } else {
                await this.log(state.current_run_id, `[STEP 6] ตรวจสอบพบว่า current_index (${currentIndex}) ทำครบตามจำนวน previous_max (${queueLength}) ในคิวแล้ว จึงตั้งค่า hasNext = false เพื่อจบการทำงานของ Node นี้`);
            }
            
            state.variables["hasNext"] = hasNext;
            state.variables["has_next"] = hasNext;
            
            let pdfQueue: any[] = [];
            if (Object.keys(driverParentsData).length > 0) {
                pdfQueue = Object.values(driverParentsData)[0];
            }
                
            const allOutputFiles: string[] = [];
            try {
                const histFiles = await fs.readdir(agentDir);
                for (const fname of histFiles) {
                    if (fname.startsWith(cleanNodeId) && (fname.endsWith('.txt') || fname.endsWith('.md'))) {
                        allOutputFiles.push(fname);
                    }
                }
            } catch (e) {}
            
            allOutputFiles.sort((a, b) => {
                try {
                    return parseInt(a.split('_')[1]) - parseInt(b.split('_')[1]);
                } catch {
                    return 0;
                }
            });

            const outputs = {
                currentIndex: currentIndex,
                previousMaxList: previousMaxList,
                queueLength: queueLength,
                pdfQueue: pdfQueue,
                agentOutputsTable: savedJsons,
                hasNext: hasNext
            };
            
            if (isReady) {
                if (hasNext) {
                    await this.log(state.current_run_id, `[STEP 5] เมื่อทำเสร็จสิ้นกระบวนการแถวที่ ${currentIndex} จะเริ่มทำแถวถัดไป (แถวที่ ${nextKeyToProcess})...`);
                } else {
                    await this.log(state.current_run_id, `[STEP 5] ทำครบทุกไฟล์ในคิวเรียบร้อยแล้ว (${currentIndex}/${queueLength}).`);
                }
            }
            
            this.outputData = outputs;
            state.variables[this.nodeId + "_output"] = outputs;
            state.variables[this.nodeId + "_previous_max"] = currentIndex;

            // Also persist state to this.nodeData.parameters for subsequent cycles and database
            if (!this.nodeData.parameters) this.nodeData.parameters = {};
            this.nodeData.parameters.agentOutputsTable = savedJsons;
            this.nodeData.parameters.currentIndex = currentIndex;
            this.nodeData.parameters.hasNext = hasNext;
            this.nodeData.parameters.previous_max = queueLength;
            
            if (this.nodeCompleteCallback && outputs) {
                await this.nodeCompleteCallback(this.nodeId, outputs);
            }
                
            return {
                active_node: this.nodeId,
                logs: [...state.logs, `[${this.label}] Processed to index ${currentIndex}. hasNext=${hasNext}`],
                variables: state.variables
            };
        } else {
            await this.log(state.current_run_id, `Waiting for parents. current_index ${currentIndex} is not less than all parents' previous_max.`);
            
            let pdfQueue: any[] = [];
            if (Object.keys(driverParentsData).length > 0) {
                pdfQueue = Object.values(driverParentsData)[0];
            }
            const validMaxVals = Object.values(previousMaxList).map(Number).filter(n => !isNaN(n) && n > 0);
            const queueLength = validMaxVals.length > 0 ? Math.max(...validMaxVals) : 0;
            
            const allOutputFiles: string[] = [];
            try {
                const histFiles = await fs.readdir(agentDir);
                for (const fname of histFiles) {
                    if (fname.startsWith(cleanNodeId) && (fname.endsWith('.txt') || fname.endsWith('.md'))) {
                        allOutputFiles.push(fname);
                    }
                }
            } catch (e) {}
            
            allOutputFiles.sort((a, b) => {
                try {
                    return parseInt(a.split('_')[1]) - parseInt(b.split('_')[1]);
                } catch {
                    return 0;
                }
            });
            
            const outputs = {
                currentIndex: currentIndex,
                previousMaxList: previousMaxList,
                queueLength: queueLength,
                pdfQueue: pdfQueue,
                agentOutputsTable: savedJsons,
                hasNext: false
            };
            
            state.variables["hasNext"] = false;
            state.variables["has_next"] = false;
            
            this.outputData = outputs;
            state.variables[this.nodeId + "_output"] = outputs;
            state.variables[this.nodeId + "_previous_max"] = currentIndex;
            
            if (this.nodeCompleteCallback && outputs) {
                await this.nodeCompleteCallback(this.nodeId, outputs);
            }
                
            return {
                active_node: this.nodeId,
                logs: [...state.logs, `[${this.label}] Waiting for parents.`],
                variables: state.variables
            };
        }
    }
}

export class PDF_to_Image_Agent extends Agent {}
export { Agent as AgentPDFsNode, Agent as Agent_PDFs };
