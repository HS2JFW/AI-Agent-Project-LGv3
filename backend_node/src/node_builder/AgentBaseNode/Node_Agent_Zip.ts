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

const execFileAsync = util.promisify(execFile);

import AdmZip from "adm-zip";
export class AgentZipNode extends WorkflowNode {
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
        
        const previousMaxList = state.variables[`${this.nodeId}_previous_max_list`] || {};
        
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
                            let t1 = (dynamicOut ? dynamicOut.pdfQueue : null) || srcParams.pdfQueue;
                            
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
            const modelInfo = aiModelsInstance.getModelInfo(modelName);
            let provider = aiModelsInstance.getProvider(modelName);
            let modelMaxTokens = aiModelsInstance.getMaxTokens(modelName, Number(params.maxOutputTokens || 16384));
            let modelTemp = 0.0;
            if (modelInfo.temperature !== undefined && modelInfo.temperature !== null) {
                modelTemp = Number(modelInfo.temperature);
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

            
            let outputContent = "";
            let foundPdfName: string | null = null;
            if (!apiKey) {
                await this.log(state.current_run_id, "Error: No API Key provided. Cannot analyze ZIP.");
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
                    
                    let zipFilePath = "";
                    for (const item of combinedItems) {
                        let extractedItem = item;
                        if (typeof item === 'object') extractedItem = item.disk_name || item.url || item.filename || '';
                        if (!extractedItem || typeof extractedItem !== 'string') continue;
                        const baseName = extractedItem.split('/').pop() || "";
                        if (baseName.toLowerCase().endsWith(".zip")) {
                            zipFilePath = path.join(getWorkflowInputDir(workflowId), baseName);
                            break;
                        }
                    }
                    
                    if (!zipFilePath || !(await fs.access(zipFilePath).then(() => true).catch(() => false))) {
                        await this.log(state.current_run_id, `❌ Error: Cannot find ZIP file at ${zipFilePath}`);
                        outputContent = "Error: Cannot find ZIP file.";
                    } else {
                        await this.log(state.current_run_id, `[STEP 3] Extracting and inspecting ZIP: ${zipFilePath}`);
                        const zip = new AdmZip(zipFilePath);
                        const zipEntries = zip.getEntries();
                        let foundMatch = false;
                        
                        for (const entry of zipEntries) {
                            if (entry.isDirectory) continue;
                            const lowerName = entry.entryName.toLowerCase();
                            if (lowerName.endsWith('.pdf')) {
                                await this.log(state.current_run_id, `[STEP 3.1] Inspecting PDF in ZIP: ${entry.entryName}`);
                                const buffer = entry.getData();
                                let pdfText = "";
                                try {
                                    // Parse PDF in memory
                                    const pdfParse = require('pdf-parse');
                                    const pdfData = await pdfParse(buffer);
                                    pdfText = pdfData.text || "";
                                } catch (e: any) {
                                    await this.log(state.current_run_id, `Failed to parse PDF ${entry.entryName}: ${e.message}`);
                                    continue;
                                }
                                
                                const textSnippet = pdfText.substring(0, 30000);
                                const tempPrompt = `[PDF Content: ${entry.entryName}]\n${textSnippet}\n\n[END OF FILE CONTENT]\n\n[INSTRUCTIONS]\n${promptText}`;
                                
                                await this.log(state.current_run_id, `[STEP 4] Querying AI Model for ${entry.entryName}...`);
                                let chunkRes = "";
                                
                                if (isOpenrouter) {
                                    const url = "https://openrouter.ai/api/v1/chat/completions";
                                    const payload = {
                                        model: modelEndpoint,
                                        messages: [{ role: "user", content: tempPrompt }],
                                        temperature: modelTemp,
                                        max_tokens: modelMaxTokens || 16384
                                    };
                                    const headers = {
                                        "Authorization": `Bearer ${apiKey}`,
                                        "Content-Type": "application/json",
                                        "HTTP-Referer": "http://localhost:3000",
                                        "X-Title": "AI Agent Zip"
                                    };
                                    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
                                    const resData = await res.json();
                                    chunkRes = resData.choices?.[0]?.message?.content || "";
                                } else {
                                    const config: any = { temperature: modelTemp, maxOutputTokens: modelMaxTokens || 16384 };
                                    const result = await ai.models.generateContent({
                                        model: modelEndpoint,
                                        contents: [tempPrompt],
                                        config: config
                                    });
                                    chunkRes = result.text || "";
                                }
                                
                                if (chunkRes.includes("มี") || chunkRes.toLowerCase().includes("yes")) {
                                    await this.log(state.current_run_id, `[STEP 5] Match found in ${entry.entryName}! Extracting file...`);
                                    const baseFilename = entry.entryName.split('/').pop() || 'extracted.pdf';
                                    const cleanFilename = baseFilename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
                                    const finalPdfName = `extracted_${Date.now()}_${cleanFilename}`;
                                    const extractPath = path.join(getWorkflowInputDir(workflowId), finalPdfName);
                                    await fs.writeFile(extractPath, buffer);
                                    
                                    foundPdfName = finalPdfName;
                                    outputContent = `พบเอกสารที่เกี่ยวข้อง: ${entry.entryName}\n\nรายละเอียดจาก AI:\n${chunkRes}`;
                                    foundMatch = true;
                                    break; 
                                }
                            }
                        }
                        
                        if (!foundMatch) {
                            outputContent = "ไม่มีเอกสารที่เกี่ยวข้อง (No related documents found in this ZIP)";
                        }
                    }
                } catch (e: any) {
                    const errMsg = `❌ API request/ZIP extraction failed: ${e.message}`;
                    await this.log(state.current_run_id, errMsg);
                    outputContent = `Error: ${errMsg}`;
                }
            }
            
            if (foundPdfName) {
                outFilename = outFilename.replace('.md', `_pdf_${foundPdfName}.md`).replace('.txt', `_pdf_${foundPdfName}.txt`);
            }
            const outPath = path.join(agentDir, outFilename);
            await fs.writeFile(outPath, outputContent, "utf-8");
                
            savedJsons[targetKeyToProcess] = outFilename;
            
            
            await this.log(state.current_run_id, `[STEP 5] บันทึกผลลัพธ์ Output ทั้งหมดลงไฟล์ ${outFilename} เก็บไว้ที่ Path: ${outPath} สำเร็จ (Status: Complete)`);
            await this.log(state.current_run_id, `[STEP 5.1] ระบบเตรียมเพิ่ม current index เป็น ${currentIndex} เพื่อนำไปเปรียบเทียบในรอบต่อไปและดึงข้อมูลจนจบทุกแถว`);
            
            
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
            
            if (hasNext) {
                await this.log(state.current_run_id, `[STEP 6] ตรวจสอบพบว่า previous_max มากกว่า current_index ปัจจุบัน (${currentIndex}) จึงตั้งค่า hasNext = true เพื่อวนลูปทำไฟล์ต่อไป...`);
            } else {
                await this.log(state.current_run_id, `[STEP 6] ตรวจสอบพบว่า current_index (${currentIndex}) ถึงค่า previous_max แล้ว จึงตั้งค่า hasNext = false เพื่อจบการทำงานของ Node นี้`);
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
                previousMaxList: previousMaxList,
                queueLength: queueLength,
                pdfQueue: pdfQueue,
                agentOutputsTable: savedJsons,
                hasNext: hasNext
            };
            
            if (isReady) {
                // Removed redundant STEP 4 log since we have STEP 5 path log
                if (hasNext) {
                    await this.log(state.current_run_id, `[STEP 5] เมื่อทำเสร็จสิ้นกระบวนการ จะเริ่มทำอันถัดไปตาม current_index ของเราคือ ${currentIndex}...`);
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
