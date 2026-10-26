import fs from 'fs/promises';
import path from 'path';
import { AgentBaseNode } from './Node_Agent';
import { WorkflowState } from '../Node_Workflow';
import { AIModels } from '../../AI_Models';
import { GoogleGenAI } from '@google/genai';
import { getWorkflowInputDir, getWorkflowOutputDir } from "../../workflow_paths";

export class AgentAPINode extends AgentBaseNode {
    async execute(state: WorkflowState): Promise<any> {
        this.resolve_inputs(state);
        
        await this.log(
            state.current_run_id,
            `Node '${this.label}' (${this.nodeType}) started execution.`
        );
        
        const baseParams = this.getBaseParameters();
        const role = baseParams.role;
        const prompt = baseParams.prompt;
        const modelName = baseParams.model_name;
        const temp = baseParams.temperature;
        const maxTokens = baseParams.max_tokens;
        const topP = baseParams.top_p;
        const topK = baseParams.top_k;
        const params = baseParams.params;
        
        const rolePart = role && role !== "Agent Role" ? role.trim() : "";
        const promptPart = prompt ? prompt.trim() : "";
        
        let finalPrompt = "";
        if (rolePart && promptPart) {
            finalPrompt = `System Role / Persona:\n${rolePart}\n\nTask Instructions:\n${promptPart}`;
        } else if (rolePart) {
            finalPrompt = rolePart;
        } else if (promptPart) {
            finalPrompt = promptPart;
        } else {
            finalPrompt = "Hello";
        }
            
        const incomingNodeIds: string[] = [];
        const workflowEdges = state.variables._workflow_edges || [];
        const workflowNodes = state.variables._workflow_nodes || [];
        
        for (const e of workflowEdges) {
            if (e.target === this.nodeId) {
                incomingNodeIds.push(e.source);
            }
        }
                
        const currentIndex = state.variables[`${this.nodeId}_current_index`] || 0;
        
        const incomingTables: Record<string, any> = {};
        const waitingForNodes: string[] = [];
        
        
          let appendedJsonText = "";
          const incomingEdgesForJson = workflowEdges.filter((e: any) => e.target === this.nodeId);
          const processedSrcHandles = new Set<string>();

          for (const edge of incomingEdgesForJson) {
              const srcNode = workflowNodes.find((n: any) => n.id === edge.source);
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

          for (const e of workflowEdges) {
              if (e.target === this.nodeId && e.sourceHandle && e.sourceHandle.startsWith("table-")) {
                  const srcNode = workflowNodes.find((n: any) => n.id === e.source);
                  if (srcNode && srcNode.type === "table") {
                      incomingTables[e.source] = {
                          label: srcNode.data.label || "Table",
                          handle: e.sourceHandle,
                          fieldId: e.sourceHandle.replace("table-", "")
                      };
                  }
              }
          }
                    
        if (incomingNodeIds.length === 0) {
            const pdfUrlsParam = params.pdfUrls || "";
            let pdfUrls: string[] = [];
            if (pdfUrlsParam) {
                try {
                    const parsed = JSON.parse(pdfUrlsParam);
                    if (Array.isArray(parsed)) {
                        pdfUrls = parsed;
                    }
                } catch (e) {
                    pdfUrls = pdfUrlsParam.replace(/\n/g, ",").split(",").map((u: string) => u.trim()).filter((u: string) => u);
                }
            }
            
            incomingTables["manual"] = {
                label: "Manual Input",
                table: pdfUrls,
                hasNext: false
            };
        }

        const previousMaxList_early: Record<string, number> = {};
        for (const [nId, info] of Object.entries(incomingTables)) {
            previousMaxList_early[nId] = info.table.length;
        }

        if (waitingForNodes.length > 0) {
            const msg = `⏳ Waiting for sync data at index ${currentIndex} from nodes: ${waitingForNodes.join(', ')}`;
            await this.log(state.current_run_id, msg);
            const outputs = {
                agentOutput: state.variables[`${this.nodeId}_output`] || "",
                previousMaxList: previousMaxList_early || {},
                hasNext: true,
                currentIndex: currentIndex
            };
            this.outputData = outputs.agentOutput;
            return {
                active_node: this.nodeId,
                logs: [...state.logs, `[${this.label}] ${msg}`],
                variables: state.variables
            };
        }

        const previousMaxList: Record<string, number> = {};
        for (const [nId, info] of Object.entries(incomingTables)) {
            previousMaxList[nId] = info.table.length;
        }

        const dataToProcess: any[] = [];
        for (const [nId, info] of Object.entries(incomingTables)) {
            if (currentIndex < info.table.length) {
                dataToProcess.push({
                    label: info.label,
                    url: info.table[currentIndex]
                });
            }
        }

        if (dataToProcess.length === 0 && currentIndex > 0) {
            const msg = `🎉 All files processed up to index ${currentIndex}`;
            await this.log(state.current_run_id, msg);
            const outputs = {
                agentOutput: state.variables[`${this.nodeId}_output`] || "",
                previousMaxList: previousMaxList || {},
                hasNext: false,
                currentIndex: currentIndex
            };
            this.outputData = outputs.agentOutput;
            state.variables["hasNext"] = false;
            state.variables["has_next"] = false;
            return {
                active_node: this.nodeId,
                logs: [...state.logs, `[${this.label}] ${msg}`],
                variables: state.variables
            };
        }

        await this.logBaseInfo(state, baseParams);
        
        const aiModelsData = state.variables.ai_models || [];
        const aiModelsInstance = new AIModels(aiModelsData);
        let apiKey = aiModelsInstance.getApiKey(modelName);
        const modelInfo = aiModelsInstance.getModelInfo(modelName);
        const provider = modelInfo.provider || "";
        
        if (!apiKey) {
            apiKey = params.googleApiKey || process.env.GOOGLE_API_KEY || "";
        }
            
        let apiResponse = "";
        const isOpenrouter = provider.toLowerCase() === "openrouter" || modelName.includes("/");
        
        let combinedPromptText = "--- 📥 ข้อมูลจากคิว (Data from incoming nodes) ---\n";
        const pdfInlineParts: any[] = [];
        
        const backendDir = path.resolve(__dirname, '..', '..');
        const agentDir = getWorkflowOutputDir(state.workflow_id || state.variables?.workflow_id);
        const queueDir = getWorkflowInputDir(state.workflow_id || state.variables?.workflow_id);
        
        for (const item of dataToProcess) {
            const url = item.url;
            const label = item.label;
            let fileText = "";
            
            if (url.startsWith("http://") || url.startsWith("https://")) {
                try {
                    const resp = await fetch(url);
                    if (resp.ok) {
                        const fileData = Buffer.from(await resp.arrayBuffer());
                        if (url.toLowerCase().endsWith(".pdf")) {
                            if (isOpenrouter) {
                                const b64Data = fileData.toString('base64');
                                pdfInlineParts.push({
                                    type: "file",
                                    file: {
                                        file_data: `data:application/pdf;base64,${b64Data}`
                                    }
                                });
                                fileText = `[PDF file attached via Base64 to OpenRouter]`;
                            } else {
                                try {
                                    const ai = new GoogleGenAI({ apiKey });
                                    const uploadResp = await (ai.files.upload as any)({
                                        file: {
                                            path: url, 
                                            // Ideally download to temp file and pass path, assuming handled
                                        },
                                        mimeType: "application/pdf"
                                    });
                                    if (uploadResp) {
                                        pdfInlineParts.push(uploadResp);
                                        fileText = `[PDF file attached via Google GenAI SDK]`;
                                    } else {
                                        fileText = `[Failed to upload PDF via Google GenAI SDK]`;
                                    }
                                } catch (e: any) {
                                    fileText = `[Error uploading PDF: ${e.message}]`;
                                }
                            }
                        } else {
                            fileText = fileData.toString('utf-8');
                        }
                    } else {
                        fileText = `[Error downloading file from URL: HTTP ${resp.status}]`;
                    }
                } catch (e: any) {
                    fileText = `[Error processing URL: ${e.message}]`;
                }
            } else {
                const agentPath = path.join(agentDir, url);
                const queuePath = path.join(queueDir, url);
                
                let filePath = null;
                
                const agentExists = await fs.access(agentPath).then(() => true).catch(() => false);
                const queueExists = await fs.access(queuePath).then(() => true).catch(() => false);
                
                if (agentExists) {
                    filePath = agentPath;
                } else if (queueExists) {
                    filePath = queuePath;
                }
                    
                if (filePath) {
                    const logMsg = `📎 Attached file: '${url}' (from ${path.basename(path.dirname(filePath))}) for Model processing.`;
                    await this.log(state.current_run_id, logMsg);
                    state.logs.push(logMsg);
                    try {
                        if (filePath.toLowerCase().endsWith(".pdf")) {
                            if (isOpenrouter) {
                                const fData = await fs.readFile(filePath);
                                const b64Data = fData.toString('base64');
                                pdfInlineParts.push({
                                    type: "file",
                                    file: {
                                        file_data: `data:application/pdf;base64,${b64Data}`
                                    }
                                });
                                fileText = `[PDF file attached via Base64 to OpenRouter]`;
                            } else {
                                try {
                                    const ai = new GoogleGenAI({ apiKey });
                                    const uploadedFile = await ai.files.upload({
                                        file: filePath
                                    });
                                    
                                    if (uploadedFile) {
                                        pdfInlineParts.push(uploadedFile);
                                        fileText = `[PDF file attached via Google GenAI SDK]`;
                                    } else {
                                        fileText = `[Failed to upload PDF via Google GenAI SDK]`;
                                    }
                                } catch (e: any) {
                                    fileText = `[Error uploading PDF: ${e.message}]`;
                                }
                            }
                        } else {
                            fileText = await fs.readFile(filePath, "utf-8");
                        }
                    } catch (e: any) {
                        fileText = `[Error reading file: ${e.message}]`;
                    }
                } else {
                    fileText = url;
                }
            }
            combinedPromptText += `\nFile: ${label}\n${fileText}\n`;
        }
                
        if (dataToProcess.length > 0) {
            finalPrompt += `\n\n${combinedPromptText}`;
        }
            
        finalPrompt += appendedJsonText;
        // Old loop removed, JSON appending is now handled at the top
            let rowDataText = "";
            for (const item of dataToProcess) {
                if (typeof item === 'object') {
                    for (const key in item) {
                        const regex = new RegExp(`\\{\$\{key\}\\}`, 'g');
                        if (finalPrompt.match(regex)) {
                             finalPrompt = finalPrompt.replace(regex, item[key]);
                        } else {
                             if (key !== 'file' && key !== 'pdf' && key !== 'txt' && key !== 'name' && key !== 'criterion') {
                                 rowDataText += `\n\n--- Data: ${key} ---\n${item[key]}`;
                             }
                        }
                    }
                }
            }
            finalPrompt += rowDataText;

        
        if (apiKey) {
            try {
                if (isOpenrouter) {
                    const url = modelInfo.endpoint || "https://openrouter.ai/api/v1/chat/completions";
                    await this.log(state.current_run_id, `Request URL: ${url}`);
                    
                    const orModel = modelName;
                    const messages = [];
                    const systemRole = (params.role || "").trim();
                    if (systemRole) {
                        messages.push({ role: "system", content: systemRole });
                    }
                        
                    if (pdfInlineParts.length > 0) {
                        const contentList: any[] = [{ type: "text", text: finalPrompt }];
                        contentList.push(...pdfInlineParts);
                        messages.push({ role: "user", content: contentList });
                    } else {
                        messages.push({ role: "user", content: finalPrompt });
                    }
                    
                    const payload: any = {
                        model: orModel,
                        messages: messages,
                        temperature: Number(temp),
                        top_p: Number(topP)
                    };
                    if (topK) payload.top_k = Number(topK);
                    if (maxTokens) payload.max_tokens = Number(maxTokens);
                        
                    const headers = {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${apiKey}`,
                        "HTTP-Referer": "http://localhost:3000",
                        "X-Title": "AI Agent"
                    };
                    await this.log(state.current_run_id, `📝 Sending Prompt (Length: ${finalPrompt.length} characters)`);
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
                    
                    const responseJson = await response.json();
                    if (responseJson.choices && responseJson.choices.length > 0) {
                        apiResponse = responseJson.choices[0]?.message?.content || "";
                        if (apiResponse) {
                            await this.log(state.current_run_id, `✅ API Response received successfully (Length: ${apiResponse.length} characters).`);
                            await this.log(state.current_run_id, `Preview: '${apiResponse.substring(0, 100)}...'`);
                        } else {
                            apiResponse = "No response content returned.";
                            await this.log(state.current_run_id, "⚠️ API Response was empty. Please check the model name or prompt.");
                            await this.log(state.current_run_id, `Raw Response JSON: ${JSON.stringify(responseJson)}`);
                        }
                    }
                } else {
                    let modelEndpoint = modelName;
                    if (modelEndpoint === "gemini-1.5-flash") {
                        modelEndpoint = "gemini-1.5-flash-latest";
                    } else if (modelEndpoint === "gemini-1.5-pro") {
                        modelEndpoint = "gemini-1.5-pro-latest";
                    }
                        
                    await this.log(state.current_run_id, `Request via: Google GenAI SDK (Model: ${modelEndpoint})`);
                    await this.log(state.current_run_id, `📝 Sending Prompt (Length: ${finalPrompt.length} characters)`);
                    await this.log(state.current_run_id, `🔗 Connecting to Google AI Studio (${modelEndpoint})...`);
                
                    const ai = new GoogleGenAI({ apiKey });
                    const systemRole = (params.role || "").trim();
                    const config: any = {
                        temperature: Number(temp),
                        maxOutputTokens: maxTokens ? Number(maxTokens) : 8192,
                        topP: Number(topP),
                        topK: topK ? Number(topK) : 40
                    };
                    if (systemRole) {
                        config.systemInstruction = systemRole;
                    }
                        
                    const contents = [];
                    if (pdfInlineParts.length > 0) {
                        contents.push(...pdfInlineParts);
                    }
                    contents.push(finalPrompt);
                    
                    const responseObj = await ai.models.generateContent({
                        model: modelEndpoint,
                        contents: contents,
                        config: config
                    });
                    
                    const candidate = responseObj.candidates?.[0] || null;
                    const finishReason = candidate?.finishReason;
                    const finishMessage = candidate?.finishMessage;
                    
                    if (finishReason && finishReason !== "STOP") {
                        if (finishReason === "MAX_TOKENS" && responseObj.text) {
                            apiResponse = responseObj.text + "\n\n[⚠️ ข้อความถูกตัดทอนเนื่องจากความยาวเกินกำหนด (MAX_TOKENS)]";
                            await this.log(state.current_run_id, `⚠️ ข้อความถูกตัดทอนเนื่องจาก MAX_TOKENS (Length: ${apiResponse.length} characters).`);
                        } else {
                            apiResponse = `Error: เนื้อหาถูกกรองเนื่องจาก ${finishReason} - ${finishMessage || 'No additional message provided.'}`;
                            await this.log(state.current_run_id, `⚠️ ${apiResponse}`);
                            await this.log(state.current_run_id, `Raw Response JSON: ${JSON.stringify(responseObj)}`);
                        }
                    } else if (responseObj.text) {
                        apiResponse = responseObj.text;
                        await this.log(state.current_run_id, `✅ API Response received successfully (Length: ${apiResponse.length} characters).`);
                        await this.log(state.current_run_id, `Preview: '${apiResponse.substring(0, 100)}...'`);
                    } else {
                        apiResponse = "No response content returned.";
                        await this.log(state.current_run_id, "⚠️ API Response was empty. Please check the model name or prompt.");
                        await this.log(state.current_run_id, `Raw Response JSON: ${JSON.stringify(responseObj)}`);
                    }
                }
            } catch (e: any) {
                const errMsg = `❌ API request failed: ${e.message}`;
                await this.log(state.current_run_id, errMsg);
                apiResponse = `Error executing request: ${e.message}\nMake sure your API Key is valid and you have network connection.`;
            }
        } else {
            apiResponse = (
                "⚠️ ขาด Google API Key ในการเรียกใช้งานโมเดลของจริง!\n\n" +
                "วิธีแก้ไขให้สามารถทำงานได้จริง:\n" +
                "1. กรอกรหัส GOOGLE_API_KEY ของคุณในช่อง 'Google API Key' ในหน้าต่าง Inspector ของโหนดนี้\n" +
                "2. หรือตั้งค่าตัวแปรสภาพแวดล้อม (Environment Variable) ชื่อ GOOGLE_API_KEY บนเซิร์ฟเวอร์\n\n" +
                "[ข้อมูลจำลองคำตอบสำหรับคำถามของคุณ]: ประเทศไทยมี 77 จังหวัด (หรือ 76 จังหวัด + 1 เขตปกครองพิเศษกรุงเทพมหานคร)"
            );
            await this.log(state.current_run_id, "Warning: GOOGLE_API_KEY not found. Running in mock fallback mode.");
        }
            
        state.variables["decision"] = "approved";
        
        state.variables[`${this.nodeId}_current_index`] = currentIndex + 1;
        
        let hasMore = false;
        for (const [nId, info] of Object.entries(incomingTables)) {
            if (currentIndex + 1 < info.table.length) {
                hasMore = true;
                break;
            }
            if (info.hasNext) {
                hasMore = true;
                break;
            }
        }
                
        state.variables["hasNext"] = hasMore;
        state.variables["has_next"] = hasMore;
        
        this.outputData = apiResponse;
        state.variables[this.nodeId + "_output"] = this.getOutput();
        
        const outputs = {
                agentOutput: apiResponse,
                previousMaxList: previousMaxList || {},
                hasNext: hasMore,
                currentIndex: currentIndex
            };
        
        await this.log(state.current_run_id, `Node '${this.label}' completed execution.`);
        
        if (this.nodeCompleteCallback && outputs) {
            await this.nodeCompleteCallback(this.nodeId, outputs);
        }
            
        return {
            active_node: this.nodeId,
            logs: [...state.logs, `[${this.label}] Completed`],
            variables: state.variables
        };
    }
}
