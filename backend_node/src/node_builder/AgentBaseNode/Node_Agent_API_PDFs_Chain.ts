// @ts-nocheck 
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { WorkflowNode, WorkflowState } from '../Node_Workflow';
import { AIModels } from '../../AI_Models';
import { GoogleGenAI } from '@google/genai';
import { globSync } from 'glob';
import { getWorkflowInputDir, getWorkflowOutputDir } from "../../workflow_paths";

export class AgentAPIPDFsChainNode extends WorkflowNode {
    async execute(state: WorkflowState): Promise<any> {
        this.resolve_inputs(state);
        await this.log(state.current_run_id, `Node '${this.label}' (${this.nodeType}) started execution.`);
        const params = this.nodeData.parameters || {};
        const workflowId = state.workflow_id || state.variables.workflow_id || "wf";
        const driverParentsData: Record<string, any[]> = {};
        const wfNodes = state.variables._workflow_nodes || [];
        const wfEdges = state.variables._workflow_edges || [];
        const incomingEdges = wfEdges.filter((e: any) => e.target === this.nodeId);
        const previousMaxList = state.variables[`${this.nodeId}_previous_max_list`] || {};
        for (const edge of incomingEdges) {
            const nId = edge.source;
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
                    const isAgentParent = nType.includes("agent") || nName.includes("agent");
                    const isPdfQueueParent = nType.includes("queue") || nName.includes("queue") || nName.includes("connector");
                    const srcParams = srcData.parameters || {};
                    if (isAgentParent) { table = (dynamicOut ? dynamicOut.agentOutputsTable : null) || srcParams.agentOutputsTable || []; }
                    else if (isPdfQueueParent) { 
                        if (nName.includes("connector")) {
                             table = (dynamicOut ? dynamicOut.table : null) || state.variables[`${nId}_json_data`] || srcParams.table || srcParams.agentOutputsTable || srcParams.parsedDataPreview || [];
                        } else {
                             table = (dynamicOut ? dynamicOut.pdfQueue : null) || srcParams.pdfQueue || [];
                             
}
                    }
                    else { table = (dynamicOut ? dynamicOut.table : null) || srcParams.table || []; }
                    if (nName.includes("connector")) {
                        const portName = edge.sourceHandle;
                        table = table.map((row: any) => {
                            if (typeof row === "object" && row !== null) {
                                return (portName && portName in row) ? { [portName]: row[portName] } : row;
                            }
                            // Force string rows (like .md filenames) to be an object so they are ignored by the txtItems file loader loop.
                            // The actual data extraction is handled by do_is_JSON_Connector_List.
                            return { name: row, __is_connector_row: true };
                        });
                    }
                    driverParentsData[nId] = table;
                    previousMaxList[nId] = table.length;
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
            const combinedItems = [];
            for (const [pId, pTable] of Object.entries(driverParentsData)) {
                if (typeof pTable === 'object' && !Array.isArray(pTable)) {
                    if (pTable[targetKeyToProcess]) combinedItems.push(pTable[targetKeyToProcess]);
                } else if (Array.isArray(pTable)) {
                    const idx = parseInt(targetKeyToProcess) - 1;
                    if (idx >= 0 && idx < pTable.length) combinedItems.push(pTable[idx]);
                }
            }
            const now = new Date();
            const pad = (n) => n.toString().padStart(2, '0');
            const currentTimestamp = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear().toString().substring(2)}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
            const extractedNames = [];
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
            }
            else if (extractedNames.length > 1) {
                const idx = extractedNames[0][0];
                const combinedCname = extractedNames.map(x => x[1]).join("_");
                outFilename = `${cleanNodeId}_${idx}_${combinedCname}_${currentTimestamp}.md`;
            }
            else {
                outFilename = `${cleanNodeId}_${targetKeyToProcess}_row_${currentTimestamp}.md`;
            }
            const combinedFilenames = combinedItems.map(x => typeof x !== 'object' ? String(x) : "DataRow").join(" + ");
            await this.log(state.current_run_id, `[STEP 2] Row Data Extracted. Files to process in this row: ${combinedFilenames}`);
            await this.log(state.current_run_id, `[STEP 3] Preparing file for model. Expected output file: ${outFilename}`);
            const queuePdfDir = getWorkflowInputDir(state.workflow_id || state.variables?.workflow_id);
            const modelName = params.modelName || "gemini-1.5-flash";
            const aiModelsData = state.variables.ai_models || [];
            const aiModelsInstance = new AIModels(aiModelsData);
            let provider = params.provider || "Google";
            for (const m of aiModelsData) {
                if (m.modelName === modelName) {
                    provider = m.provider || provider;
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
                            if (apiKey)
                                break;
                        }
                    }
                }
                else {
                    apiKey = aiModelsInstance.getApiKey("gemini-1.5-flash");
                    if (!apiKey) {
                        for (const m of aiModelsData) {
                            if (m.modelName?.toLowerCase().includes("gemini") || m.provider === "Google") {
                                apiKey = (m.apiKey || "").trim();
                                if (apiKey)
                                    break;
                            }
                        }
                    }
                }
            }
            if (!apiKey) {
                if (isOpenrouter) {
                    apiKey = process.env.OPENROUTER_API_KEY || "";
                }
                else {
                    apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
                }
            }
            let promptText = this.nodeData.prompt || "Analyze this document and extract key information.";
            let appendedJsonText = "";
            const incomingNodeIds = [...new Set(incomingEdges.map((e: any) => e.source))];
            
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

            
            // Invoke do_is_JSON_Connector_List if parent is a JSON Connector List
            for (const edge of incomingEdges) {
                const nId = edge.source;
                const srcNode = wfNodes.find((n: any) => n.id === nId);
                if (srcNode && ((srcNode.type || "").toLowerCase().includes("connector") || (srcNode.data?.name || "").toLowerCase().includes("connector"))) {
                    const fieldName = edge.sourceHandle || "introduction";
                    await this.log(state.current_run_id, `[JSON Connector] Detecting JSON Connector List parent (${nId}). Updating previous_max and extracting field '${fieldName}'`);
                    const { rowData } = await this.do_is_JSON_Connector_List(state, srcNode, fieldName, currentIndex);
                    if (rowData) {
                        appendedJsonText += `\n\n--- Extracted Data (${fieldName}) ---\n${rowData}`;
                        await this.log(state.current_run_id, `[JSON Connector] Successfully injected data from field '${fieldName}' into prompt.`);
                    }
                    
                    // We must ensure the item is properly accounted for in combinedFilenames
                    if (!combinedItems.some(item => typeof item === 'object' && item.name === `${fieldName}_${currentIndex}`)) {
                        combinedItems.push({ name: `${fieldName}_${currentIndex}` });
                    }
                }
            }
            promptText += appendedJsonText;
            const pdfItems = [];
            const txtItems = [];
            const agentDir = getWorkflowOutputDir(state.workflow_id || state.variables?.workflow_id);
            for (const item of combinedItems) {
                if (typeof item === 'object')
                    continue;
                const baseName = String(item).split('/').pop() || "";
                if (baseName.toLowerCase().endsWith(".txt") || baseName.toLowerCase().endsWith(".md")) {
                    txtItems.push(baseName);
                }
                else {
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
                }
                catch (e) {
                    await this.log(state.current_run_id, `Error reading text file ${txtFile}: ${e.message}`);
                }
            }
            const parts = [{ text: promptText }];
            const openrouterContent = [{ type: "text", text: promptText }];
            for (const item of pdfItems) {
                let baseName = item;
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
                        let globMatched = (0, globSync)(path.join(agentDir, pattern));
                                    if (globMatched.length === 0) globMatched = (0, globSync)(path.join(queuePdfDir, pattern));
                        if (globMatched.length > 0) {
                            globMatched.sort((a, b) => fsSync.default.statSync(b).mtimeMs - fsSync.default.statSync(a).mtimeMs);
                            pdfPath = globMatched[0];
                            baseName = path.basename(pdfPath);
                        }
                    }
                    else {
                        const prefix = baseName.substring(0, baseName.lastIndexOf('-'));
                        const pattern = `${prefix}-*.pdf`;
                        const globMatched = (0, globSync)(path.join(queuePdfDir, pattern));
                        if (globMatched.length > 0) {
                            globMatched.sort((a, b) => fsSync.default.statSync(b).mtimeMs - fsSync.default.statSync(a).mtimeMs);
                            pdfPath = globMatched[0];
                        }
                    }
                }
                const pdfExists = await fs.access(pdfPath).then(() => true).catch(() => false);
                if (!pdfExists && !(typeof item === 'string' && (item.startsWith("http://") || item.startsWith("https://")))) {
                    const errMsg = `❌ Error: Cannot find file '${baseName}' in backend storage. Please ensure it was uploaded.`;
                    await this.log(state.current_run_id, errMsg);
                    return { status: "error", message: errMsg };
                }
                if (isOpenrouter && typeof item === 'string' && (item.startsWith("http://") || item.startsWith("https://"))) {
                    openrouterContent.push({
                        type: "file",
                        file: {
                            filename: baseName,
                            file_data: item
                        }
                    });
                    await this.log(state.current_run_id, `Attached PDF via URL to OpenRouter payload: ${item}`);
                    continue;
                }
                if (pdfExists) {
                    try {
                        if (isOpenrouter) {
                            const pdfFile = await fs.readFile(pdfPath);
                            const b64Data = pdfFile.toString('base64');
                            openrouterContent.push({
                                type: "file",
                                file: {
                                    file_data: `data:application/pdf;base64,${b64Data}`
                                }
                            });
                            await this.log(state.current_run_id, `Attached PDF via Base64 to OpenRouter payload: ${baseName}`);
                        }
                        else {
                            try {
                                const ai = new GoogleGenAI({ apiKey });
                                const uploadedFile = await ai.files.upload({
                                    file: pdfPath
                                });
                                if (uploadedFile) {
                                    parts.push(uploadedFile);
                                    await this.log(state.current_run_id, `Uploaded raw PDF via Google GenAI SDK: ${baseName} -> ${uploadedFile.name}`);
                                }
                                else {
                                    await this.log(state.current_run_id, `Failed to upload PDF via Google GenAI SDK: ${baseName}`);
                                }
                            }
                            catch (e) {
                                await this.log(state.current_run_id, `Error uploading PDF via Google File API: ${e.message}`);
                            }
                        }
                    }
                    catch (e) {
                        await this.log(state.current_run_id, `Failed to read PDF ${baseName}: ${e.message}`);
                    }
                }
                else {
                    await this.log(state.current_run_id, `PDF file not found for analysis: ${pdfPath}`);
                }
            }
            let outputContent = "";
            if (apiKey) {
                try {
                    const modelInfo = aiModelsInstance.getModelInfo(modelName);
                    if (isOpenrouter) {
                        const url = modelInfo.endpoint || "https://openrouter.ai/api/v1/chat/completions";
                        const orModel = modelName;
                        const messages = [];
                        const systemRole = (params.role || "").trim();
                        if (systemRole) {
                            messages.push({ role: "system", content: systemRole });
                        }
                        messages.push({ role: "user", content: openrouterContent });
                        const resolvedMaxTokens = aiModelsInstance.getMaxTokens(modelName, Number(params.maxOutputTokens || 16384));
                        const headers = {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${apiKey}`,
                            "HTTP-Referer": "http://localhost:5173",
                            "X-Title": "AI Agent"
                        };
                        
                        let isDone = false;
                        let loopCount = 0;
                        const expectMaxToken = Number(params.expectMaxToken || resolvedMaxTokens);
                        const maxLoops = Math.ceil(expectMaxToken / resolvedMaxTokens);
                        
                        while (!isDone && loopCount < maxLoops) {
                            const payload = {
                                model: orModel,
                                messages: messages,
                                temperature: Number(params.temperature || 0.0),
                                max_tokens: resolvedMaxTokens
                            };
                            
                            let retryCount = 0;
                            const maxRetries = 3;
                            let fetchSuccess = false;
                            let result: any = null;
                            let choice: any = null;
                            let textChunk = "";
                            
                            while (retryCount < maxRetries && !fetchSuccess) {
                                try {
                                    const debugReqPath = path.join(agentDir, `DEBUG_OPENROUTER_REQUEST_${loopCount}_retry_${retryCount}.json`);
                                    await fs.writeFile(debugReqPath, JSON.stringify(payload, null, 2), "utf-8");
                                    await this.log(state.current_run_id, `📝 [Loop ${loopCount+1}/${maxLoops}] Sending Prompt (Messages: ${messages.length}) [max_tokens=${resolvedMaxTokens}]${retryCount > 0 ? ` (Retry ${retryCount}/${maxRetries})` : ''}`);
                                    await this.log(state.current_run_id, `🔗 Connecting to OpenRouter (${orModel})...`);
                                    
                                    const response = await fetch(url, {
                                        method: 'POST',
                                        headers,
                                        body: JSON.stringify(payload)
                                    });
                                    
                                    if (!response.ok) {
                                        const errBody = await response.text();
                                        throw new Error(`HTTP Error ${response.status}: ${errBody}`);
                                    }
                                    
                                    result = await response.json();
                                    const debugResPath = path.join(agentDir, `DEBUG_OPENROUTER_RESPONSE_${loopCount}_retry_${retryCount}.json`);
                                    await fs.writeFile(debugResPath, JSON.stringify(result, null, 2), "utf-8");
                                    
                                    if (result.error) {
                                        throw new Error(`OpenRouter API Error: ${result.error.message || JSON.stringify(result.error)}`);
                                    }
                                    
                                    choice = result.choices?.[0] || {};
                                    textChunk = choice.message?.content || "";
                                    
                                    if (!textChunk && choice.finish_reason !== "length" && choice.native_finish_reason !== "MAX_TOKENS") {
                                        throw new Error(`Empty text chunk returned. choices: ${JSON.stringify(result.choices)}`);
                                    }
                                    
                                    fetchSuccess = true;
                                } catch (err) {
                                    retryCount++;
                                    await this.log(state.current_run_id, `⚠️ Request failed: ${err.message}. Retrying in 3 seconds... (${retryCount}/${maxRetries})`);
                                    if (retryCount >= maxRetries) {
                                        outputContent += `\n\nError: API request failed after ${maxRetries} retries. Last error: ${err.message}`;
                                        await this.log(state.current_run_id, `❌ Max retries reached.`);
                                        isDone = true;
                                        break;
                                    }
                                    await new Promise(resolve => setTimeout(resolve, 3000));
                                }
                            }
                            
                            if (!fetchSuccess) {
                                break;
                            }
                            
                            outputContent += textChunk;
                            
                            if (choice.finish_reason === "length" || choice.native_finish_reason === "MAX_TOKENS") {
                                const usedTokens = (loopCount + 1) * resolvedMaxTokens;
                                const remainingTokens = Math.max(0, expectMaxToken - usedTokens);
                                await this.log(state.current_run_id, `⚠️ [Loop ${loopCount+1}/${maxLoops}] MAX_TOKENS reached. Auto-continuing... (Remaining Tokens: ~${remainingTokens}, Max Loop Limit: ${maxLoops})`);
                                messages.push({ role: "assistant", content: [{ type: "text", text: textChunk }] });
                                messages.push({ role: "user", content: [{ type: "text", text: "Please continue exactly where you left off without any introductory text. Do not repeat what was already generated, just continue the exact next word." }] });
                                const previewText = textChunk.length > 50 ? "..." + textChunk.substring(textChunk.length - 50) : textChunk;
                                await this.log(state.current_run_id, `📝 Context appended. Continuing from text: "${previewText}"`);
                                loopCount++;
                            }
                            else {
                                await this.log(state.current_run_id, `✅ API Response received successfully (Length: ${outputContent.length} characters).`);
                                await this.log(state.current_run_id, `Preview: '${outputContent.substring(0, 100)}...'`);
                                isDone = true;
                            }
                        }
                        
                        if (loopCount >= maxLoops && !isDone) {
                            outputContent += "\n\n[⚠️ ข้อความถูกตัดทอนเนื่องจากถึงขีดจำกัดการวนลูป Auto-Continue แล้ว]";
                            await this.log(state.current_run_id, `⚠️ Auto-continue reached max loops (${maxLoops}). Output truncated.`);
                        }
                    }
                    else {
                        let modelEndpoint = modelName;
                        if (modelEndpoint === "gemini-1.5-flash") {
                            modelEndpoint = "gemini-1.5-flash-latest";
                        }
                        else if (modelEndpoint === "gemini-1.5-pro") {
                            modelEndpoint = "gemini-1.5-pro-latest";
                        }
                        const resolvedMaxTokens = aiModelsInstance.getMaxTokens(modelName, Number(params.maxOutputTokens || 16384));
                        await this.log(state.current_run_id, `📝 Sending Prompt (Parts: ${parts.length}) [max_tokens=${resolvedMaxTokens}]`);
                        await this.log(state.current_run_id, `🔗 Connecting to Google GenAI SDK (${modelEndpoint})...`);
                        const ai = new GoogleGenAI({ apiKey });
                        const systemRole = (params.role || "").trim();
                        const config = {
                            temperature: Number(params.temperature || 0.0),
                            maxOutputTokens: resolvedMaxTokens
                        };
                        if (systemRole) {
                            config.systemInstruction = systemRole;
                        }
                        let isDone = false;
                        let loopCount = 0;
                        const expectMaxToken = Number(params.expectMaxToken || resolvedMaxTokens);
                        const maxLoops = Math.ceil(expectMaxToken / resolvedMaxTokens);
                        
                        let chatContents: any[] = [
                            { role: "user", parts: parts }
                        ];
                        
                        while (!isDone && loopCount < maxLoops) {
                            const responseObj = await ai.models.generateContent({
                                model: modelEndpoint,
                                contents: chatContents,
                                config: config
                            });
                            
                            const candidate = responseObj.candidates?.[0] || null;
                            const finishReason = candidate?.finishReason;
                            const finishMessage = candidate?.finishMessage;
                            const textChunk = responseObj.text || "";
                            
                            outputContent += textChunk;
                            
                            if (finishReason && finishReason !== "STOP") {
                                if (finishReason === "MAX_TOKENS") {
                                    const usedTokens = (loopCount + 1) * resolvedMaxTokens;
                                    const remainingTokens = Math.max(0, expectMaxToken - usedTokens);
                                    await this.log(state.current_run_id, `⚠️ [Loop ${loopCount+1}/${maxLoops}] MAX_TOKENS reached. Auto-continuing... (Remaining Tokens: ~${remainingTokens}, Max Loop Limit: ${maxLoops})`);
                                    chatContents.push({ role: "model", parts: [{ text: textChunk }] });
                                    chatContents.push({ role: "user", parts: [{ text: "Please continue exactly where you left off without any introductory text. Do not repeat what was already generated, just continue the exact next word." }] });
                                    const previewText = textChunk.length > 50 ? "..." + textChunk.substring(textChunk.length - 50) : textChunk;
                                    await this.log(state.current_run_id, `📝 Context appended. Continuing from text: "${previewText}"`);
                                    loopCount++;
                                }
                                else {
                                    outputContent += `\n\nError: เนื้อหาถูกกรองเนื่องจาก ${finishReason} - ${finishMessage || 'No additional message provided.'}`;
                                    await this.log(state.current_run_id, `⚠️ Error: ${finishReason} - ${finishMessage}`);
                                    await this.log(state.current_run_id, `Raw Response JSON: ${JSON.stringify(responseObj)}`);
                                    isDone = true;
                                }
                            }
                            else {
                                await this.log(state.current_run_id, `✅ API Response received successfully (Length: ${outputContent.length} characters).`);
                                await this.log(state.current_run_id, `Preview: '${outputContent.substring(0, 100)}...'`);
                                isDone = true;
                            }
                        }
                        
                        if (loopCount >= maxLoops && !isDone) {
                            outputContent += "\n\n[⚠️ ข้อความถูกตัดทอนเนื่องจากถึงขีดจำกัดการวนลูป Auto-Continue แล้ว]";
                            await this.log(state.current_run_id, `⚠️ Auto-continue reached max loops (${maxLoops}). Output truncated.`);
                        }
                    }
                }
                catch (e) {
                    const errMsg = `❌ API request failed: ${e.message}`;
                    await this.log(state.current_run_id, errMsg);
                    outputContent = `Error executing API: ${errMsg}`;
                }
            }
            else {
                await this.log(state.current_run_id, "Error: No API Key provided. Cannot analyze PDF.");
                outputContent = "Error: No API Key provided in Agent parameters. Please set the API Key.";
            }
            const outPath = path.join(agentDir, outFilename);
            
            let fileStatus = "Complete";
            if (outputContent.includes("Error:") || outputContent.includes("API request failed")) {
                fileStatus = "Error";
            } else if (outputContent.includes("ข้อความถูกตัดทอนเนื่องจากถึงขีดจำกัดการวนลูป") || outputContent.includes("MAX_TOKENS")) {
                fileStatus = "Max Token limit";
            }
            agentOutputStatusesMap[outFilename] = fileStatus;
            
            await fs.writeFile(outPath, outputContent, "utf-8");
            savedJsons[targetKeyToProcess] = outFilename;
            
            await this.log(state.current_run_id, `[STEP 4] Completed index ${currentIndex - 1}. Saved to ${outFilename}.`);
            await this.log(state.current_run_id, `[STEP 5] Saved Output file ${outFilename} to Path: ${outPath} (Status: ${fileStatus})`);
        }
        else {
            await this.log(state.current_run_id, `[STEP 5] โหนดยังไม่พร้อมประมวลผลหรือทำครบจำนวนแถวเดิมแล้ว (isReady = false)`);
        }
        
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
        let pdfQueue = [];
        if (Object.keys(driverParentsData).length > 0) {
            pdfQueue = Object.values(driverParentsData)[0];
        }
        const maxPrev = Object.values(previousMaxList).length > 0 ? Math.max(...Object.values(previousMaxList)) : 0;
        const queueLength = maxPrev;
        const allOutputFiles = [];
        const agentDirHist = getWorkflowOutputDir(state.workflow_id || state.variables?.workflow_id);
        const cleanNodeIdHist = this.nodeId.replace('node_', '');
        try {
            const histFiles = await fs.readdir(agentDirHist);
            for (const fname of histFiles) {
                if (fname.startsWith(cleanNodeIdHist) && (fname.endsWith('.txt') || fname.endsWith('.md'))) {
                    allOutputFiles.push(fname);
                }
            }
        }
        catch (e) { }
        allOutputFiles.sort((a, b) => {
            try {
                return parseInt(a.split('_')[1]) - parseInt(b.split('_')[1]);
            }
            catch {
                return 0;
            }
        });
        await this.log(state.current_run_id, `[STEP 6] Previous Max List: ${JSON.stringify(previousMaxList)}, Current Index: ${currentIndex}, Queue Length: ${queueLength}`);
        const outputs = {
            currentIndex: currentIndex,
            previousMaxList: previousMaxList || {},
            queueLength: queueLength,
            pdfQueue: pdfQueue,
            agentOutputsTable: savedJsons,
            agentOutputStatusesMap: agentOutputStatusesMap,
            hasNext: hasNext,
            previous_max: currentIndex
        };
        state.variables["has_next"] = hasNext;
        state.variables["hasNext"] = hasNext;
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
    }

    async do_is_JSON_Connector_List(state: any, parentNode: any, fieldName: string, currentIndex: number) {
        const parentNodeId = parentNode.id;
        let parentMax = state.variables[`${parentNodeId}_previous_max`] || 0;
        const fieldArray = state.variables[`${parentNodeId}_${fieldName}`];
        let rowData = "";
        
        if (fieldArray && Array.isArray(fieldArray) && fieldArray.length > 0) {
            parentMax = fieldArray.length;
            if (fieldArray.length > currentIndex) {
                rowData = fieldArray[currentIndex];
            }
        } else {
            let jsonTable = state.variables[`${parentNodeId}_json_data`];
            
            // Fallback: if jsonTable is empty or missing, read directly from node parameters (UI state)
            if (!jsonTable || !Array.isArray(jsonTable) || jsonTable.length === 0) {
                if (parentNode.data && parentNode.data.parameters) {
                    const fallbackParams = parentNode.data.parameters;
                    if (Array.isArray(fallbackParams.table) && fallbackParams.table.length > 0) {
                        jsonTable = fallbackParams.table;
                        await this.log(state.current_run_id, `[do_is_JSON_Connector_List] state.variables missing, falling back to parameters.table (length: ${jsonTable.length})`);
                    } else if (Array.isArray(fallbackParams.agentOutputsTable) && fallbackParams.agentOutputsTable.length > 0) {
                        jsonTable = fallbackParams.agentOutputsTable;
                        await this.log(state.current_run_id, `[do_is_JSON_Connector_List] state.variables missing, falling back to parameters.agentOutputsTable (length: ${jsonTable.length})`);
                    } else if (Array.isArray(fallbackParams.parsedDataPreview) && fallbackParams.parsedDataPreview.length > 0) {
                        jsonTable = fallbackParams.parsedDataPreview;
                        await this.log(state.current_run_id, `[do_is_JSON_Connector_List] state.variables missing, falling back to parameters.parsedDataPreview (length: ${jsonTable.length})`);
                    } else {
                        jsonTable = [];
                    }
                } else {
                    jsonTable = [];
                }
            }
            
            if (Array.isArray(jsonTable)) {
                parentMax = jsonTable.length;
                if (jsonTable.length > currentIndex) {
                    let row = jsonTable[currentIndex];
                    
                    // If row is our wrapper object { name: "file.md", __is_connector_row: true }, extract the name.
                    let rowFileName = (row && typeof row === 'object' && row.__is_connector_row) ? row.name : row;
                    
                    // If row is a filename (e.g. .md file containing JSON), fetch and parse it
                    if (typeof rowFileName === 'string' && (rowFileName.endsWith('.md') || rowFileName.endsWith('.txt') || rowFileName.endsWith('.json'))) {
                        const agentDir = getWorkflowOutputDir(state.workflow_id || state.variables?.workflow_id);
                        const queuePdfDir = getWorkflowInputDir(state.workflow_id || state.variables?.workflow_id);
                        let filePath = path.join(agentDir, rowFileName);
                        
                        try {
                            const exists = await fs.access(filePath).then(() => true).catch(() => false);
                            if (!exists) {
                                filePath = path.join(queuePdfDir, rowFileName);
                            }
                            const fileContent = await fs.readFile(filePath, "utf-8");
                            
                            let parsed = null;
                            try {
                                parsed = JSON.parse(fileContent);
                            } catch (e) {
                                const match = fileContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                                if (match) {
                                    try { parsed = JSON.parse(match[1]); } catch(err) {}
                                }
                            }
                            
                            if (parsed && typeof parsed === 'object') {
                                row = parsed;
                                await this.log(state.current_run_id, `[do_is_JSON_Connector_List] Parsed JSON from file '${rowFileName}' successfully.`);
                            }
                        } catch (err) {
                            await this.log(state.current_run_id, `[do_is_JSON_Connector_List] WARNING: Failed to parse file '${rowFileName}'. Error: ${err.message}`);
                        }
                    }

                    if (row && typeof row === 'object') {
                        // Check if we are connected to the main 'output' or another unmapped port
                        if (fieldName && fieldName !== 'output' && fieldName in row) {
                            const val = row[fieldName];
                            rowData = typeof val === 'string' ? val : JSON.stringify(val);
                            await this.log(state.current_run_id, `[do_is_JSON_Connector_List] Extracted specifically field '${fieldName}' from row ${currentIndex}. Value preview: ${String(rowData).substring(0, 50)}...`);
                        } else if (fieldName === 'output') {
                            // If user connected the 'output' port (which is the default main handle), they usually mean the entire row.
                            // But since the user specifically requested field isolation (and complained about full JSON), 
                            // we log a warning and return the full JSON just in case they meant to connect the whole row.
                            rowData = JSON.stringify(row);
                            await this.log(state.current_run_id, `[do_is_JSON_Connector_List] WARNING: Connected via 'output' handle instead of a specific field! Extracting entire row ${currentIndex} as JSON string.`);
                        } else {
                            await this.log(state.current_run_id, `[do_is_JSON_Connector_List] ERROR: Field '${fieldName}' not found in row ${currentIndex}!`);
                        }
                    } else {
                        await this.log(state.current_run_id, `[do_is_JSON_Connector_List] ERROR: Row ${currentIndex} is not an object. Found type: ${typeof row}`);
                    }
                }
            }
        }
        
        // 1. Update previous_max of parent node
        state.variables[`${parentNodeId}_previous_max`] = parentMax;
        const previousMaxList = state.variables[`${this.nodeId}_previous_max_list`] || {};
        previousMaxList[parentNodeId] = parentMax;
        state.variables[`${this.nodeId}_previous_max_list`] = previousMaxList;
        
        await this.log(state.current_run_id, `[do_is_JSON_Connector_List] Updated previous_max for parent '${parentNodeId}' to ${parentMax}. Extracting index ${currentIndex}.`);
        
        return { rowData, previousMax: parentMax };
    }
}
