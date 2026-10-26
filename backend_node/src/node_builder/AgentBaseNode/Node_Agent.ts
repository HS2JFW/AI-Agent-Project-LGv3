import { WorkflowNode, WorkflowState } from '../Node_Workflow'; // Assuming Node_Workflow is two levels up or elsewhere

export interface BaseAgentParams {
    role: string;
    prompt: string;
    model_name: string;
    temperature: number;
    max_tokens: number;
    top_p: number;
    top_k: number;
    params: any;
}

export class AgentBaseNode extends WorkflowNode {
    getBaseParameters(): BaseAgentParams {
        const params = this.nodeData.parameters || {};
        const role = this.nodeData.role || "Data Analyst";
        const prompt = this.nodeData.prompt || "";
        
        let modelName = params.modelName || "gemini-1.5-flash";
        if (!modelName || typeof modelName !== 'string') {
            modelName = "gemini-1.5-flash";
        }
        modelName = modelName.trim();
        
        const temp = params.temperature ?? 0.0;
        const maxTokens = params.maxOutputTokens ?? 2048;
        const topP = params.topP ?? 1.0;
        const topK = params.topK ?? 40;
        
        return {
            role,
            prompt,
            model_name: modelName,
            temperature: temp,
            max_tokens: maxTokens,
            top_p: topP,
            top_k: topK,
            params
        };
    }
    
    async logBaseInfo(state: WorkflowState, baseParams: BaseAgentParams): Promise<string> {
        const role = baseParams.role;
        const modelName = baseParams.model_name;
        const temp = baseParams.temperature;
        
        const outputMsg = `Agent (${role}) initialized API Connection for Model (${modelName}, temp=${temp}).`;
        
        await this.log(state.current_run_id, outputMsg);
        return outputMsg;
    }
}

// Keep old AgentNode name mapping for backward compatibility with existing databases
export class AgentNode extends AgentBaseNode {
    async execute(state: WorkflowState): Promise<any> {
        // Fallback to API Key execution if called directly
        const { AgentAPINode } = await import('./Node_Agent_API');
        const nodeInstance = new AgentAPINode(
            this.nodeId, this.nodeType, this.nodeData, 
            this.logCallback, this.nodeCompleteCallback
        );
        return await nodeInstance.execute(state);
    }
}
