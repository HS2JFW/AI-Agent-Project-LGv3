import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { WorkflowNode, WorkflowState } from '../Node_Workflow';
import { AIModels } from '../../AI_Models';
import { GoogleGenAI } from '@google/genai';
import glob from 'glob';
import { PDFDocument } from 'pdf-lib';
import { execFile } from 'child_process';
import { promisify } from 'util';
const execFileAsync = promisify(execFile);
import { getWorkflowInputDir, getWorkflowOutputDir } from "../../workflow_paths";

export class AgentPDFsRawNode extends WorkflowNode {
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
        const incomingNodeIds = wfEdges.filter((e: any) => e.target === this.nodeId).map((e: any) => e.source);
        
        const previousMaxList = state.variables[`${this.nodeId}_previous_max_list`] || {};
        
        await this.log(state.current_run_id, "[STEP 1] Waking up. Fetching max file counts from parent nodes...");

        const incomingEdges = wfEdges.filter((e: any) => e.target === this.nodeId);
        for (const edge of incomingEdges) {
            const nId = edge.source;
            const srcNode = wfNodes.find((n: any) => n.id === nId);
            if (srcNode) {
                const nType = (srcNode.type || "").toLowerCase();
                const nName = (srcNode.data?.name || "").toLowerCase();
                const isDriver = nType.includes("agent") || nName.includes("agent") || nType.includes("pdf") || nName.includes("pdf") || nType.includes("queue") || nName.includes("queue") || nName.includes("connector");
                
                if (isDriver) {
                    const srcData = srcNode.data || {};
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
                                 const fieldArr = inData.map((row: any) => typeof row === 'object' && row !== null ? row[sourceHandle] : undefined).filter((x: any) => x !== undefined);
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
                    
                    const edgeKey = edge.id || `${nId}_${sourceHandle || 'output'}`;
                    driverParentsData[edgeKey] = table;
                    previousMaxList[edgeKey] = table.length;
                    
                    if (isJsonConnector && sourceHandle && sourceHandle !== "output") {
                        await this.log(state.current_run_id, `[STEP 1] พบ JSON Connector List ส่ง field '${sourceHandle}' มีข้อมูลทั้งหมด ${table.length} รายการ จัดเก็บเข้า previous_max สำเร็จ`);
                    } else {
                        await this.log(state.current_run_id, `[STEP 1] พบโหนดพ่อแม่ ${nName} (Queue/Agent) ผ่านขา ${sourceHandle || 'output'} มีไฟล์รอดำเนินการสูงสุด (Max) คือ ${table.length} ไฟล์ ทำการอัปเดต previous_max เป็น ${table.length}`);
                    }
                }
            }
        }

        
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
        let currentIndex = targetKeyToProcess ? parseInt(targetKeyToProcess) : 0;
        
        if (isReady && targetKeyToProcess !== null) {
            await this.log(state.current_run_id, `[STEP 1] Found unprocessed key: ${targetKeyToProcess}`);
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
            const currentTimestamp = `${pad(now.getDate())}-${pad(now.getMonth()+1)}-${now.getFullYear().toString().substring(2)}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
            
            const extractedNames: [string, string][] = [];
            for (const item of combinedItems) {
                let coreId = "row";
                const itemStr = typeof item === 'object' ? JSON.stringify(item) : String(item);
                const coreMatch = itemStr.match(/\d{13}_[a-zA-Z0-9]{6}/);
                
                if (coreMatch) {
                    coreId = coreMatch[0];
                } else if (typeof item === 'object') {
                    const nameVal = item.name || item.criterion?.name || "row";
                    coreId = String(nameVal).replace(/[^a-zA-Z0-9\-_]/g, '').substring(0, 20) || "row";
                } else {
                    let cleanBase = String(item).split('/').pop() || "row";
                    const l = cleanBase.toLowerCase();
                    if (l.endsWith('.pdf') || l.endsWith('.txt') || l.endsWith('.png') || l.endsWith('.json') || l.endsWith('.md')) {
                        cleanBase = l.endsWith('.json') ? cleanBase.slice(0, -5) : (l.endsWith('.md') ? cleanBase.slice(0, -3) : cleanBase.slice(0, -4));
                    }
                    cleanBase = cleanBase.replace(/^([^_]+)_(\d+)_/, '');
                    cleanBase = cleanBase.replace(/_\d{2}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/, '');
                    coreId = cleanBase.replace(/-\d{10}$/, '');
                }
                extractedNames.push([targetKeyToProcess, coreId]);
            }
            if (extractedNames.length === 1) {
                const [idx, cname] = extractedNames[0];
                outFilename = `${cleanNodeId}_${idx}_${cname}_${currentTimestamp}.md`;
            } else if (extractedNames.length > 1) {
                const idx = extractedNames[0][0];
                const combinedCname = extractedNames.map(x => x[1]).join("_");
                outFilename = `${cleanNodeId}_${idx}_${combinedCname}_${currentTimestamp}.md`;
            } else {
                outFilename = `${cleanNodeId}_${targetKeyToProcess}_row_${currentTimestamp}.md`;
            }
            
            const combinedFilenames = combinedItems.map(x => typeof x !== 'object' ? String(x) : "DataRow").join(" + ");
            await this.log(state.current_run_id, `[STEP 2] Row Data Extracted. Files to process in this row: ${combinedFilenames}`);
            await this.log(state.current_run_id, `[STEP 4 PREP] Planned output file for this row: ${outFilename}`);
            
            const queuePdfDir = getWorkflowInputDir(state.workflow_id || state.variables?.workflow_id);
            const modelName = params.modelName || "gemini-1.5-flash";
            
            const aiModelsData = state.variables.ai_models || [];
            const aiModelsInstance = new AIModels(aiModelsData);
            
            let modelTemp = 0.0;
            let modelMaxTokens: number | null = null;
            let provider = params.provider || "Google";
            for (const m of aiModelsData) {
                if (m.modelName === modelName) {
                    provider = m.provider || provider;
                    modelTemp = Number(m.temperature || 0.0);
                    modelMaxTokens = m.maxTokens ? Number(m.maxTokens) : null;
                    break;
                }
            }
            const isOpenrouter = provider.toLowerCase() === "openrouter" || provider.toLowerCase() === "openrouter.ai" || modelName.includes("/");
            
            let apiKey = aiModelsInstance.getApiKey(modelName);
            
            if (!apiKey) {
                if (isOpenrouter) {
                    for (const m of aiModelsData) {
                        if (m.provider === "OpenRouter.ai") {
                            apiKey = (m.apiKey || "").trim();
                            if (apiKey) break;
                        }
                    }
                } else {
                    apiKey = aiModelsInstance.getApiKey("gemini-1.5-flash");
                    if (!apiKey) {
                        for (const m of aiModelsData) {
                            if (m.modelName?.toLowerCase().includes("gemini") || m.provider === "Google") {
                                apiKey = (m.apiKey || "").trim();
                                if (apiKey) break;
                            }
                        }
                    }
                }
            }
            
            if (!apiKey) {
                if (isOpenrouter) {
                    apiKey = process.env.OPENROUTER_API_KEY || "";
                } else {
                    apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
                }
            }
                
            let promptText = this.nodeData.prompt || "Analyze this document and extract key information.";
            
            let appendedJsonText = "";
            for (const nId of incomingNodeIds) {
                const srcNode = wfNodes.find((n: any) => n.id === nId);
                if (srcNode) {
                    const srcType = srcNode.type;
                    const srcData = srcNode.data || {};
                    
                    if ((srcType === "rubric" || srcType === "mca") && srcData.rubricData) {
                        appendedJsonText += "\n\n" + srcType.toUpperCase() + " JSON:\n" + JSON.stringify(srcData.rubricData, null, 2);
                    } else if (srcType === "sample" && srcData.sampleData) {
                        appendedJsonText += "\n\nSample JSON:\n" + JSON.stringify(srcData.sampleData, null, 2);
                    } else if (srcType === "table" && srcData.tableData) {
                        appendedJsonText += "\n\nTable JSON:\n" + JSON.stringify(srcData.tableData, null, 2);
                    }
                }
            }
            
            promptText += appendedJsonText;
            let rowDataText = "";
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

            
            let outputContent = "";
            const outPath = path.join(agentDir, outFilename);
            if (!apiKey) {
                await this.log(state.current_run_id, "Error: No API Key provided. Cannot analyze PDF.");
                outputContent = "Error: No API Key provided in Agent parameters. Please set the API Key.";
            } else {
                try {
                    let modelEndpoint = modelName;
                    if (modelEndpoint === "gemini-1.5-flash") {
                        modelEndpoint = "gemini-1.5-flash-latest";
                    } else if (modelEndpoint === "gemini-1.5-pro") {
                        modelEndpoint = "gemini-1.5-pro-latest";
                    }
                    const ai = new GoogleGenAI({ apiKey });
                    
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
                        } catch (e: any) {
                            await this.log(state.current_run_id, `Error reading text file ${txtFile}: ${e.message}`);
                        }
                    }
                    
                    if (pdfItems.length === 0 && txtItems.length > 0) {
                        await this.log(state.current_run_id, `[STEP 3] Preparing to send prompt by attaching .txt file(s). txt_items=${txtItems}`);
                        await this.log(state.current_run_id, `Processing ${txtItems.length} text files directly without chunking...`);
                        
                        if (isOpenrouter) {
                            const url = "https://openrouter.ai/api/v1/chat/completions";
                            const payload = {
                                model: modelEndpoint,
                                messages: [{ role: "user", content: promptText }],
                                temperature: modelTemp,
                                max_tokens: modelMaxTokens || 8192
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
                                maxOutputTokens: modelMaxTokens || 8192
                            };
                            const responseObj = await ai.models.generateContent({
                                model: modelEndpoint,
                                contents: [promptText],
                                config: config
                            });
                            
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
                            
                            await this.log(state.current_run_id, `Found ${maxPage} pages in ${baseName}. Splitting into 1-page chunks...`);
                            
                            try {
                                await fs.writeFile(outPath, "", "utf-8");
                            } catch(e) {}
                            
                            for (let startPage = 0; startPage < maxPage; startPage++) {
                                const outputFolderName = outFilename.endsWith('.md') ? outFilename.slice(0, -3) : (outFilename.endsWith('.txt') ? outFilename.slice(0, -4) : outFilename);
                                const chunkDir = path.join(agentDir, outputFolderName);
                                await fs.mkdir(chunkDir, { recursive: true });
                                const filePureName = baseName.substring(0, baseName.lastIndexOf('.pdf')) || outputFolderName;
                                const uniqueId = Math.random().toString(36).substring(2, 9);
                                const chunkName = `${filePureName}_page_${startPage+1}_${uniqueId}.pdf`;
                                const chunkPath = path.join(chunkDir, chunkName);
                                
                                const chunkDoc = await PDFDocument.create();
                                const [copiedPage] = await chunkDoc.copyPages(pdfDoc, [startPage]);
                                chunkDoc.addPage(copiedPage);
                                const chunkBytes = await chunkDoc.save();
                                await fs.writeFile(chunkPath, chunkBytes);
                                
                                await this.log(state.current_run_id, `Uploading chunk ${chunkName} to Gemini...`);
                                
                                if (isOpenrouter) {
                                    throw new Error("OpenRouter does not support raw PDF file uploads in this node. Please use the AI Agent Image or Base64 node instead, or use a native Google API key.");
                                }
                                
                                const uploadedChunk = await ai.files.upload({ file: chunkPath, mimeType: "application/pdf" } as any);
                                const parts: any[] = [
                                    { text: promptText },
                                    { fileData: { fileUri: uploadedChunk.uri, mimeType: uploadedChunk.mimeType } }
                                ];
                                
                                await this.log(state.current_run_id, `Processing chunk ${chunkName} (Page ${startPage+1})...`);
                                
                                const maxRetries = 3;
                                let result: any = null;
                                for (let attempt = 0; attempt < maxRetries; attempt++) {
                                    try {
                                        const config: any = {
                                            temperature: modelTemp,
                                            maxOutputTokens: modelMaxTokens || 8192
                                        };
                                        result = await ai.models.generateContent({
                                            model: modelEndpoint,
                                            contents: parts,
                                            config: config
                                        });
                                        break;
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
                                
                                if (!result) throw new Error("No response returned from the model.");
                                
                                const candidate = result.candidates?.[0] || null;
                                const finishReason = candidate?.finishReason;
                                
                                let chunkRes = "";
                                if (finishReason && finishReason !== "STOP") {
                                    if (finishReason === "MAX_TOKENS" && result.text) {
                                        chunkRes = result.text + "\n\n[MAX_TOKENS]";
                                    } else {
                                        chunkRes = `Error: ${finishReason}`;
                                    }
                                } else if (result.text) {
                                    chunkRes = result.text;
                                }
                                
                                const appendText = `\n\n--- Page ${startPage+1} ---\n${chunkRes}`;
                                outputContent += appendText;
                                try {
                                    await fs.appendFile(outPath, appendText, "utf-8");
                                } catch(e) {}
                                
                                await this.log(state.current_run_id, `✅ Successfully processed chunk ${chunkName} (Page ${startPage+1})`);
                                await new Promise(r => setTimeout(r, 4000));
                            }
                        }
                        await this.log(state.current_run_id, `✅ Successfully completed processing all chunks.`);
                    }
                } catch (e: any) {
                    const errMsg = `❌ API request failed: ${e.message}`;
                    await this.log(state.current_run_id, errMsg);
                    if (outputContent) {
                        outputContent += `\n\nError executing API: ${errMsg}`;
                    } else {
                        outputContent = `Error executing API: ${errMsg}`;
                    }
                }
            }
            
            await fs.writeFile(outPath, outputContent, "utf-8");
                
            savedJsons[targetKeyToProcess] = outFilename;
            
            
            await this.log(state.current_run_id, `Completed index ${currentIndex-1}. Saved to ${outFilename}.`);
            
            
        let hasNext = false;
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
                      hasNext = true;
                      break;
                 }
            }
        }
            
            state.variables["hasNext"] = hasNext;
            state.variables["has_next"] = hasNext;
            
            let pdfQueue: any[] = [];
            if (Object.keys(driverParentsData).length > 0) {
                pdfQueue = Object.values(driverParentsData)[0];
            }
                
            const queueLength = Object.values(previousMaxList).length > 0 ? Math.max(...Object.values(previousMaxList) as number[]) : 0;
                
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
                previousMaxList: previousMaxList || {},
                previous_max: currentIndex,
                queueLength: queueLength,
                pdfQueue: pdfQueue,
                agentOutputsTable: savedJsons,
                hasNext: hasNext
            };
            
            if (isReady) {
                await this.log(state.current_run_id, `[STEP 4] Analysis result saved into file: ${outFilename}`);
                if (hasNext) {
                    await this.log(state.current_run_id, `[STEP 5] Process complete for this row. Preparing to pull data from next row (index ${currentIndex})...`);
                } else {
                    await this.log(state.current_run_id, `[STEP 5] No next rows available or queue empty.`);
                }
            }
            
            this.outputData = outputs;
            state.variables[this.nodeId + "_output"] = outputs;
            state.variables[this.nodeId + "_previous_max"] = currentIndex;
            
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
            const queueLength = Object.values(previousMaxList).length > 0 ? Math.max(...Object.values(previousMaxList) as number[]) : 0;
            
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
                previousMaxList: previousMaxList || {},
                previous_max: currentIndex,
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
