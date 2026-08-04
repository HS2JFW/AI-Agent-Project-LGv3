import { AgentBaseNode } from './Node_Agent';
import { WorkflowState } from '../Node_Workflow';
import { GoogleAuth } from 'google-auth-library';

export class AgentAccountNode extends AgentBaseNode {
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
        let authError = "";
        
        try {
            await this.log(state.current_run_id, "Attempting to load Google OAuth 2.0 credentials via Application Default Credentials (gcloud CLI)...");
            
            const auth = new GoogleAuth({
                scopes: ['https://www.googleapis.com/auth/cloud-platform']
            });
            
            const client = await auth.getClient();
            const token = await client.getAccessToken();
            accessToken = token.token || "";
            
            if (!projectId) {
                projectId = await auth.getProjectId();
            }
            await this.log(state.current_run_id, `Successfully authenticated via OAuth 2.0. GCP Project ID: '${projectId}'`);
        } catch (e: any) {
            authError = e.message;
            await this.log(state.current_run_id, `OAuth 2.0 Auth Warning: ${authError}`);
        }
            
        let apiResponse = "";
        if (accessToken) {
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
                    
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelEndpoint}:generateContent`;
                await this.log(state.current_run_id, `Request URL (OAuth): ${url}`);
                
                const payload = {
                    contents: [{ parts: [{ text: prompt ? prompt : "Hello" }] }],
                    generationConfig: {
                        temperature: temp,
                        maxOutputTokens: maxTokens,
                        topP: topP,
                        topK: topK
                    }
                };
                
                const headers: Record<string, string> = {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                };
                if (projectId) {
                    headers["x-goog-user-project"] = projectId;
                }
                    
                await this.log(state.current_run_id, `Sending real API request via OAuth to Generative Language API (${modelEndpoint})...`);
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers,
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
                    await this.log(state.current_run_id, `Received response: '${apiResponse.substring(0, 100)}...'`);
                } else {
                    apiResponse = "No response content returned.";
                }
            } catch (e: any) {
                const errMsg = `Generative Language API request failed: ${e.message}`;
                await this.log(state.current_run_id, errMsg);
                if (e.message.includes("403")) {
                    apiResponse = (
                        "❌ เกิดข้อผิดพลาด 403 Forbidden ในการเรียกใช้ Generative Language API!\n\n" +
                        "วิธีแก้ปัญหาเบื้องต้น:\n" +
                        "1. ตรวจสอบว่าบัญชีของคุณ หรือ Service Account ได้เปิดสิทธิ์เข้าถึง Generative Language API ในโปรเจกต์ GCP แล้ว\n" +
                        "2. หากใช้ OAuth ให้รัน 'gcloud auth application-default login' ใหม่เพื่อให้สิทธิ์อัปเดต\n" +
                        "3. ตรวจสอบรหัส Project ID (หากใส่ในช่อง Project ID สำหรับตั้ง Quota) ว่าถูกต้อง\n\n" +
                        `[รายละเอียดความบกพร่องจริง]: ${e.message}`
                    );
                } else {
                    apiResponse = `Error executing request: ${e.message}`;
                }
            }
        } else {
            apiResponse = (
                "⚠️ ขาดสิทธิ์เชื่อมต่อ Google OAuth 2.0 ในเครื่องของคุณ!\n\n" +
                "วิธีเตรียมความพร้อมเพื่อใช้งานจริง:\n" +
                "1. ติดตั้ง Google Cloud CLI ลงในเครื่องคอมพิวเตอร์ของคุณ\n" +
                "2. เปิด Terminal แล้วพิมพ์คำสั่งดังนี้เพื่อเข้าสู่ระบบ:\n" +
                "   gcloud auth application-default login\n" +
                "3. กรอกรหัส Google Cloud Project ID ในหน้าต่าง Inspector ของโหนดนี้\n\n" +
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
