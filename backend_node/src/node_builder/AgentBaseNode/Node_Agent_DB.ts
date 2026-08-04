import fs from 'fs/promises';
import path from 'path';
import { AgentBaseNode } from './Node_Agent';
import { WorkflowState } from '../Node_Workflow';
import { AIModels } from '../../AI_Models';
import { GoogleGenAI } from '@google/genai';
import { getWorkflowOutputDir } from "../../workflow_paths";
import { AppDataSource } from "../../db";
import { DataSource } from "typeorm";

export class AgentDBNode extends AgentBaseNode {
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
        
        let inputDataStr = "";
        
        const incomingEdges = workflowEdges.filter((e: any) => e.target === this.nodeId);
        
        for (const edge of incomingEdges) {
            const srcNode = workflowNodes.find((n: any) => n.id === edge.source);
            if (!srcNode) continue;
            const srcData = srcNode.data || {};
            inputDataStr += `\n\n--- Input from ${srcNode.data?.name || srcNode.type} ---\n`;
            inputDataStr += JSON.stringify(srcData, null, 2);
            
            // Also check dynamic output if available
            const dynamicOut = state.variables[`${edge.source}_output`];
            if (dynamicOut) {
                inputDataStr += `\nOutput: ${typeof dynamicOut === 'object' ? JSON.stringify(dynamicOut, null, 2) : dynamicOut}`;
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
        const currentTimestamp = new Date().getTime();
        const cleanNodeId = this.nodeId.replace('node_', '');
        const filename = `${cleanNodeId}_sql_${currentTimestamp}.md`;
        const agentDir = getWorkflowOutputDir(state.workflow_id || state.variables?.workflow_id || "wf");
        
        await fs.mkdir(agentDir, { recursive: true });
        const filePath = path.join(agentDir, filename);
        await fs.writeFile(filePath, sqlQuery, 'utf-8');
        await this.log(state.current_run_id, `Saved SQL to ${filename}`);

        // Append to agentOutputsTable
        let outputsTable = params.agentOutputsTable || [];
        if (!Array.isArray(outputsTable)) outputsTable = Object.values(outputsTable);
        outputsTable.push(filename);
        
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
        
        const outputs = {
            agentOutput: apiResponse,
            agentOutputsTable: outputsTable,
            agentOutputStatusesMap: statusesMap,
            hasNext: false,
            currentIndex: 0
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
