import fs from 'fs/promises';
import path from 'path';
import { AgentBaseNode } from './Node_Agent';
import { WorkflowState } from '../Node_Workflow';
import { AIModels } from '../../AI_Models';
import { GoogleGenAI } from '@google/genai';
import { getWorkflowOutputDir } from "../../workflow_paths";
import { AppDataSource } from "../../db";
import { DataSource } from "typeorm";

export class Agent_DB extends AgentBaseNode {
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
        
        const mode = params.mode || 'auto';
        const connectionString = params.connectionString || '';

        const rolePart = role && role !== "Agent Role" ? role.trim() : "";
        const promptPart = prompt ? prompt.trim() : "";
        
        let finalPrompt = "";
        if (rolePart && promptPart) {
            finalPrompt = `System Role:\n${rolePart}\n\nTask:\n${promptPart}`;
        } else if (rolePart) {
            finalPrompt = rolePart;
        } else if (promptPart) {
            finalPrompt = promptPart;
        }
            
        finalPrompt += "\n\nCRITICAL: You MUST output ONLY the raw SQL query. Do NOT include Markdown formatting (like ```sql). Do NOT include any explanations.";

        const workflowEdges = state.variables._workflow_edges || [];
        const workflowNodes = state.variables._workflow_nodes || [];
        const agentDir = getWorkflowOutputDir(state.workflow_id || state.variables?.workflow_id || "wf");
        await fs.mkdir(agentDir, { recursive: true });

        const incomingEdges = workflowEdges.filter((e: any) => e.target === this.nodeId);
        const previousMaxList: Record<string, number> = {};
        const driverParentsData: Record<string, any> = {};

        for (const edge of incomingEdges) {
            const srcNode = workflowNodes.find((n: any) => n.id === edge.source);
            if (srcNode) {
                const nType = (srcNode.type || "").toLowerCase();
                const nName = (srcNode.data?.name || srcNode.data?.label || "").toLowerCase();
                const nId = srcNode.id;
                const srcData = srcNode.data || {};
                const isAgentParent = nType.includes("agent") || nName.includes("agent");
                const isCriteriaNode = nType.includes("criteria") || nName.includes("criteria") || nName.includes("table");
                
                if (isAgentParent || !isCriteriaNode) {
                    const dynamicOut = state.variables[`${nId}_output`];
                    let table: any[] = [];
                    const srcParams = srcData.parameters || {};
                    if (isAgentParent) {
                        table = (dynamicOut ? dynamicOut.agentOutputsTable : null) || srcParams.agentOutputsTable || [];
                    } else if (nType.includes("queue") || nName.includes("queue")) {
                        let t1 = (dynamicOut ? dynamicOut.pdfQueue : null) || srcParams.pdfQueue || (dynamicOut ? dynamicOut.txtQueue : null) || srcParams.txtQueue;
                        const t2 = (dynamicOut ? dynamicOut.agentOutputsTable : null) || srcParams.agentOutputsTable;
                        table = (Array.isArray(t1) && t1.length > 0) ? t1 : ((Array.isArray(t2) && t2.length > 0) ? t2 : (t1 || t2 || []));
                    } else {
                        table = (dynamicOut ? dynamicOut.table : null) || srcParams.table || [];
                    }
                    const parentKey = nId;
                    driverParentsData[parentKey] = table;
                    let parentCount = Array.isArray(table) ? table.length : (typeof table === 'object' && table !== null ? Object.keys(table).length : 0);
                    if (parentCount === 0 && srcParams.previous_max) {
                        parentCount = Number(srcParams.previous_max) || 0;
                    } else if (parentCount === 0 && srcParams.queueLength) {
                        parentCount = Number(srcParams.queueLength) || 0;
                    }
                    previousMaxList[parentKey] = parentCount;
                }
            }
        }
        state.variables[`${this.nodeId}_previous_max_list`] = previousMaxList;

        let savedJsons: Record<string, any> = {};
        const rawOutputs = params.agentOutputsTable || [];
        if (typeof rawOutputs === 'object' && !Array.isArray(rawOutputs) && rawOutputs !== null) {
            savedJsons = { ...rawOutputs };
        } else if (Array.isArray(rawOutputs)) {
            rawOutputs.forEach((v, i) => {
                const match = String(v).match(/^([^_]+)_(\d+)_/);
                if (match) savedJsons[match[2]] = v;
                else savedJsons[String(i + 1)] = v;
            });
        }

        let targetKeyToProcess: string | null = null;
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
                      break;
                 }
            }
        }

        let inputDataStr = "";
        if (targetKeyToProcess !== null) {
            await this.log(state.current_run_id, `[AI Agent DB] Processing target row index: ${targetKeyToProcess}`);
            for (const [pId, pTable] of Object.entries(driverParentsData)) {
                let rowItem: any = null;
                if (typeof pTable === 'object' && !Array.isArray(pTable)) {
                    rowItem = pTable[targetKeyToProcess];
                } else if (Array.isArray(pTable)) {
                    const idx = parseInt(targetKeyToProcess) - 1;
                    if (idx >= 0 && idx < pTable.length) rowItem = pTable[idx];
                }

                if (rowItem) {
                    inputDataStr += `\n\n--- Row Data from Parent (${pId}) ---\n`;
                    if (typeof rowItem === 'string' && (rowItem.endsWith('.md') || rowItem.endsWith('.txt'))) {
                        try {
                            const parentFilePath = path.join(agentDir, rowItem);
                            const fileContent = await fs.readFile(parentFilePath, 'utf-8');
                            inputDataStr += fileContent;
                        } catch (e: any) {
                            inputDataStr += String(rowItem);
                        }
                    } else if (typeof rowItem === 'object') {
                        inputDataStr += JSON.stringify(rowItem, null, 2);
                    } else {
                        inputDataStr += String(rowItem);
                    }
                }
            }
        } else {
            // Fallback to reading all incoming dynamic outputs if no specific targetKeyToProcess
            for (const edge of incomingEdges) {
                const srcNode = workflowNodes.find((n: any) => n.id === edge.source);
                if (!srcNode) continue;
                const srcData = srcNode.data || {};
                inputDataStr += `\n\n--- Input from ${srcNode.data?.name || srcNode.type} ---\n`;
                inputDataStr += JSON.stringify(srcData, null, 2);
                const dynamicOut = state.variables[`${edge.source}_output`];
                if (dynamicOut) {
                    inputDataStr += `\nOutput: ${typeof dynamicOut === 'object' ? JSON.stringify(dynamicOut, null, 2) : dynamicOut}`;
                }
            }
        }
        
        if (inputDataStr) {
            finalPrompt += `\n\n--- INPUT DATA ---\n${inputDataStr}`;
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
            
        let sqlQuery = "";
        const isOpenrouter = provider.toLowerCase() === "openrouter" || modelName.includes("/");
        
        if (apiKey) {
            try {
                if (isOpenrouter) {
                    const url = modelInfo.endpoint || "https://openrouter.ai/api/v1/chat/completions";
                    
                    const orModel = modelName;
                    const messages = [{ role: "user", content: finalPrompt }];
                    
                    const payload: any = {
                        model: orModel,
                        messages: messages,
                        temperature: Number(temp),
                        top_p: Number(topP)
                    };
                    
                    const headers = {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${apiKey}`,
                        "HTTP-Referer": "http://localhost:3000",
                        "X-Title": "AI Agent DB"
                    };
                    await this.log(state.current_run_id, `Generating SQL with OpenRouter (${orModel})...`);
                    
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
                        sqlQuery = responseJson.choices[0]?.message?.content || "";
                    }
                } else {
                    let modelEndpoint = modelName;
                    if (modelEndpoint === "gemini-1.5-flash") modelEndpoint = "gemini-1.5-flash-latest";
                    else if (modelEndpoint === "gemini-1.5-pro") modelEndpoint = "gemini-1.5-pro-latest";
                    else if (modelEndpoint === "gemini-2.5-flash") modelEndpoint = "gemini-2.5-flash";
                        
                    await this.log(state.current_run_id, `Generating SQL with Google GenAI SDK (${modelEndpoint})...`);
                
                    const ai = new GoogleGenAI({ apiKey });
                    const config: any = {
                        temperature: Number(temp),
                        topP: Number(topP),
                    };
                    
                    const responseObj = await ai.models.generateContent({
                        model: modelEndpoint,
                        contents: finalPrompt,
                        config: config
                    });
                    
                    if (responseObj.text) {
                        sqlQuery = responseObj.text;
                    }
                }
            } catch (e: any) {
                await this.log(state.current_run_id, `❌ AI request failed: ${e.message}`);
                sqlQuery = `Error: ${e.message}`;
            }
        }
        
        // Clean up markdown block if AI still generated it
        sqlQuery = sqlQuery.trim();
        if (sqlQuery.startsWith("```sql")) sqlQuery = sqlQuery.substring(6);
        else if (sqlQuery.startsWith("```")) sqlQuery = sqlQuery.substring(3);
        if (sqlQuery.endsWith("```")) sqlQuery = sqlQuery.substring(0, sqlQuery.length - 3);
        sqlQuery = sqlQuery.trim();

        await this.log(state.current_run_id, `Generated SQL:\n${sqlQuery}`);

        // Save to .md
        const rowIdx = targetKeyToProcess ? parseInt(targetKeyToProcess) : (Object.keys(savedJsons).length + 1);
        const currentTimestamp = new Date().getTime();
        const cleanNodeId = this.nodeId.replace('node_', '');
        const filename = `${cleanNodeId}_${rowIdx}_sql_${currentTimestamp}.md`;
        
        await fs.mkdir(agentDir, { recursive: true });
        const filePath = path.join(agentDir, filename);
        await fs.writeFile(filePath, sqlQuery, 'utf-8');
        await this.log(state.current_run_id, `Saved SQL to ${filename}`);

        savedJsons[String(rowIdx)] = filename;
        
        // Append to status map
        let statusesMap = params.agentOutputStatusesMap || {};
        statusesMap[filename] = 'keep';

        let apiResponse = `Generated SQL saved to ${filename}.`;

        if (mode === 'auto') {
            await this.log(state.current_run_id, `Mode is AUTO. Executing SQL query...`);
            statusesMap[filename] = 'query';
            
            try {
                let engine: DataSource | null = null;
                
                if (connectionString && connectionString.trim() !== '') {
                    // Connect to external DB
                    let type = "postgres";
                    if (connectionString.startsWith("mysql")) type = "mysql";
                    else if (connectionString.startsWith("sqlite")) type = "sqlite";
                    else if (connectionString.startsWith("mssql")) type = "mssql";
                    
                    engine = new DataSource({
                        type: type as any,
                        url: connectionString,
                        synchronize: false,
                        logging: false
                    });
                    await engine.initialize();
                } else {
                    // Use internal SQLite
                    engine = AppDataSource;
                }
                
                await engine.query(sqlQuery);
                statusesMap[filename] = 'complete';
                apiResponse += `\nSQL executed successfully.`;
                await this.log(state.current_run_id, `✅ SQL executed successfully.`);
                
                if (connectionString && connectionString.trim() !== '' && engine) {
                    await engine.destroy();
                }
            } catch (err: any) {
                await this.log(state.current_run_id, `❌ Database Error: ${err.message}`);
                apiResponse += `\nDatabase Error: ${err.message}`;
            }
        } else {
            await this.log(state.current_run_id, `Mode is MANUAL. Waiting for user to run query loop.`);
        }
        
        this.outputData = apiResponse;
        state.variables[this.nodeId + "_output"] = this.outputData;
        
        let maxParentCount = 0;
        if (Object.keys(previousMaxList).length > 0) {
            maxParentCount = Math.max(...Object.values(previousMaxList));
        }
        const hasNext = maxParentCount > 0 ? (rowIdx < maxParentCount) : false;

        const outputs = {
            agentOutput: apiResponse,
            agentOutputsTable: savedJsons,
            agentOutputStatusesMap: statusesMap,
            previousMaxList: previousMaxList,
            hasNext: hasNext,
            currentIndex: rowIdx
        };
        
        if (this.nodeCompleteCallback) {
            await this.nodeCompleteCallback(this.nodeId, outputs);
        }
            
        return {
            active_node: this.nodeId,
            logs: [...state.logs, `[${this.label}] Completed`],
            variables: state.variables
        };
    }
}

export { Agent_DB as AgentDBNode };
