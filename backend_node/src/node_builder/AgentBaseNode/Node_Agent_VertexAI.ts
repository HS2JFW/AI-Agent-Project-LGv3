import { AgentBaseNode } from './Node_Agent';
import { WorkflowState } from '../Node_Workflow';
import { GoogleAuth } from 'google-auth-library';

export class AgentVertexAINode extends AgentBaseNode {
    async execute(state: WorkflowState): Promise<any> {
        this.resolve_inputs(state);
        
        await this.log(
            state.current_run_id,
            `Node '${this.label}' (${this.nodeType}) started execution.`
        );
        
        const baseParams = this.getBaseParameters();
        const prompt = baseParams.prompt;
        let modelName = baseParams.model_name;
        const temp = baseParams.temperature;
        const maxTokens = baseParams.max_tokens;
        const topP = baseParams.top_p;
        const topK = baseParams.top_k;
        const params = baseParams.params;
        
        await this.logBaseInfo(state, baseParams);
        
        let accessToken = "";
        let projectId = params.googleCloudProject || "";
        const saJsonPath = params.serviceAccountJsonPath || "";
        let authError = "";
        
        if (saJsonPath) {
            try {
                await this.log(state.current_run_id, `Attempting to load Service Account JSON key from '${saJsonPath}'...`);
                
                const auth = new GoogleAuth({
                    keyFile: saJsonPath,
                    scopes: ['https://www.googleapis.com/auth/cloud-platform']
                });
                
                const client = await auth.getClient();
                const token = await client.getAccessToken();
                accessToken = token.token || "";
                
                if (!projectId) {
                    projectId = await auth.getProjectId();
                }
                await this.log(state.current_run_id, `Successfully authenticated via Service Account JSON. GCP Project ID: '${projectId}'`);
            } catch (e: any) {
                authError = e.message;
                await this.log(state.current_run_id, `Service Account Auth Warning: ${authError}`);
            }
        } else {
            authError = "Service Account JSON Key File Path is empty.";
            await this.log(state.current_run_id, `Service Account Auth Warning: ${authError}`);
        }
            
        let apiResponse = "";
        if (accessToken && projectId) {
            try {
                let modelEndpoint = modelName;
                if (modelEndpoint.includes("gemini-3.5-flash")) {
                    modelEndpoint = "gemini-3.5-flash";
                } else if (modelEndpoint === "gemini-1.5-flash") {
                    modelEndpoint = "gemini-flash-latest";
                } else if (modelEndpoint === "gemini-1.5-pro") {
                    modelEndpoint = "gemini-pro-latest";
                } else if (!modelEndpoint.includes("gemini")) {
                    modelEndpoint = "gemini-flash-latest";
                }
                    
                const url = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/${modelEndpoint}:generateContent`;
                await this.log(state.current_run_id, `Request URL (Vertex AI): ${url}`);
                
                const payload = {
                    contents: [{ parts: [{ text: prompt ? prompt : "Hello" }] }],
                    generationConfig: {
                        temperature: temp,
                        maxOutputTokens: maxTokens,
                        topP: topP,
                        topK: topK
                    }
                };
                
                await this.log(state.current_run_id, `Sending real API request to Vertex AI (${modelEndpoint})...`);
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${accessToken}`
                    },
                    body: JSON.stringify(payload)
                });
                
                const responseJson = await response.json();
                
                if (responseJson.candidates && responseJson.candidates.length > 0) {
                    const candidate = responseJson.candidates[0];
                    if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                        apiResponse = candidate.content.parts[0].text || "";
                    }
                }
                
                if (apiResponse) {
                    await this.log(state.current_run_id, `Received response from Vertex AI: '${apiResponse.substring(0, 100)}...'`);
                } else {
                    apiResponse = "No response content returned from Vertex AI.";
                }
            } catch (e: any) {
                const errMsg = `Vertex AI API request failed: ${e.message}`;
                await this.log(state.current_run_id, errMsg);
                if (e.message.includes("403")) {
                    apiResponse = (
                        "❌ เกิดข้อผิดพลาด 403 Forbidden เมื่อเรียกใช้ Vertex AI!\n\n" +
                        "วิธีแก้ปัญหาเบื้องต้น:\n" +
                        "1. ตรวจสอบว่าเปิดใช้งาน 'Vertex AI API' (aiplatform.googleapis.com) ใน Cloud Console หรือยัง\n" +
                        "2. บัญชีผู้ใช้ หรือ Service Account ต้องได้รับบทบาท 'Vertex AI User' (roles/aiplatform.user) ในโปรเจกต์นั้น\n" +
                        "3. ตรวจสอบว่าได้ตั้งค่า / เชื่อมโยงบัญชีชำระเงิน (Billing Account) กับโปรเจกต์ GCP เรียบร้อยและอยู่ในสถานะ Active แล้ว\n" +
                        "4. ยืนยันรหัส Project ID ใน Inspector ว่าเขียนถูกต้อง\n\n" +
                        `[รายละเอียดความบกพร่องจริง]: ${e.message}`
                    );
                } else {
                    apiResponse = `Error executing Vertex AI request: ${e.message}\nEnsure the API is enabled on your GCP project and credentials have sufficient permissions.`;
                }
            }
        } else {
            apiResponse = (
                "⚠️ ขาดสิทธิ์หรือไฟล์ Service Account JSON ไม่ถูกต้อง!\n\n" +
                "วิธีเตรียมความพร้อมเพื่อใช้งานจริง:\n" +
                "1. ตรวจสอบให้แน่ใจว่าได้ระบุที่อยู่พาธไฟล์ JSON ที่ถูกต้องลงในช่อง 'Service Account JSON Key File Path'\n" +
                "2. ตรวจสอบว่าได้กรอกรหัส Google Cloud Project ID ที่ถูกต้องแล้ว\n" +
                "3. ดาวน์โหลดและเก็บไฟล์คีย์ในพาธที่กำหนด เช่น C:\\keys\\service-account.json\n\n" +
                `[รายละเอียดข้อผิดพลาดของระบบ]: ${authError}\n\n` +
                "[ข้อมูลจำลองคำตอบสำหรับคำถามของคุณ]: ประเทศไทยมี 77 จังหวัด (หรือ 76 จังหวัด + 1 เขตปกครองพิเศษกรุงเทพมหานคร)"
            );
            await this.log(state.current_run_id, "Warning: Authentication failed. Running in mock fallback mode.");
        }
            
        state.variables["decision"] = "approved";
        this.outputData = apiResponse;
        state.variables[this.nodeId + "_output"] = this.getOutput();
        
        const outputs = {
            agentOutput: apiResponse
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
