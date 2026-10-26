import * as fs from 'fs';
import * as path from 'path';
import { WorkflowNode, StateType } from '../Node_Workflow';
import { getWorkflowInputDir, getWorkflowOutputDir } from "../../workflow_paths";

export class Zip_Queue extends WorkflowNode {
    async execute(state: StateType): Promise<StateType> {
        this.resolve_inputs(state);
        
        await this.log(
            state.current_run_id,
            `Node '${this.label}' (ZIP Queue) started execution.`
        );
        
        const params = this.node_data?.parameters || {};
        
        let supabase_url = (params.supabaseUrl || "").trim() || (state.variables?.supabase_project_url || "").trim();
        let supabase_key = (params.supabaseKey || "").trim() || (state.variables?.supabase_service_role_key || "").trim();
        let bucket_name = (params.bucketName || "").trim() || (state.variables?.supabase_storage_bucket || "").trim();

        if (!supabase_url || !bucket_name) {
            const wf_nodes = state.variables?._workflow_nodes || [];
            for (const n of wf_nodes) {
                const n_data = n.data || {};
                const sparams = n_data.parameters || {};
                const s_url = (sparams.supabaseUrl || "").trim() || (sparams.supabase_project_url || "").trim();
                const s_key = (sparams.supabaseKey || "").trim() || (sparams.supabase_service_role_key || "").trim();
                const s_bucket = (sparams.bucketName || "").trim() || (sparams.supabase_storage_bucket || "").trim();
                if (s_url && s_bucket) {
                    supabase_url = s_url;
                    supabase_key = s_key;
                    bucket_name = s_bucket;
                    if (!state.variables) state.variables = {};
                    state.variables.supabase_project_url = s_url;
                    state.variables.supabase_service_role_key = s_key;
                    state.variables.supabase_storage_bucket = s_bucket;
                    await this.log(state.current_run_id, `Auto-resolved Supabase credentials from node '${n_data.label || n_data.name}' in workflow.`);
                    break;
                }
            }
        }
        
        const incoming_urls: string[] = [];
        
        const _extract_urls = (val: any): string[] => {
            const extracted: string[] = [];
            let currentVal = val;

            if (typeof currentVal === 'string' && currentVal.trim()) {
                const val_str = currentVal.trim();
                if ((val_str.startsWith("[") && val_str.endsWith("]")) || (val_str.startsWith("{") && val_str.endsWith("}"))) {
                    try {
                        currentVal = JSON.parse(val_str);
                    } catch (e) {
                        // ignore
                    }
                } else {
                    const parts = val_str.replace(/,/g, "\n").split("\n").map(p => p.trim()).filter(p => p);
                    for (const part of parts) {
                        if (part.startsWith("http://") || part.startsWith("https://") || part.endsWith(".zip")) {
                            extracted.push(part);
                        }
                    }
                    return extracted;
                }
            }
            
            if (Array.isArray(currentVal)) {
                let listVal = currentVal;
                if (listVal.every(x => typeof x === 'object' && x !== null && "number" in x)) {
                    try {
                        listVal = [...listVal].sort((a, b) => parseInt(a.number) - parseInt(b.number));
                    } catch (e) {
                        // ignore
                    }
                }
                for (const item of listVal) {
                    if (typeof item === 'string' && (item.startsWith("http://") || item.startsWith("https://") || item.endsWith(".zip"))) {
                        extracted.push(item);
                    } else if (typeof item === 'object' && item !== null) {
                        const url_keys = ["file_url", "fileUrl", "url", "pdf_url", "link", "name", "filename", "path", "document_url", "uri"];
                        let found_url = false;
                        for (const url_key of url_keys) {
                            if (url_key in item && typeof item[url_key] === 'string' && 
                                (item[url_key].startsWith("http://") || item[url_key].startsWith("https://") || item[url_key].endsWith(".zip"))) {
                                extracted.push(item[url_key]);
                                found_url = true;
                                break;
                            }
                        }
                        if (!found_url) {
                            for (const val_str of Object.values(item)) {
                                if (typeof val_str === 'string' && (val_str.startsWith("http://") || val_str.startsWith("https://") || val_str.endsWith(".zip"))) {
                                    extracted.push(val_str);
                                    break;
                                }
                            }
                        }
                    }
                }
            } else if (typeof currentVal === 'object' && currentVal !== null) {
                const skipKeys = ["supabaseUrl", "supabase_project_url", "supabaseKey", "supabase_service_role_key", "supabase_storage_bucket", "bucketName", "supabaseKey_copy"];
                for (const [inner_k, inner_v] of Object.entries(currentVal)) {
                    if (skipKeys.includes(inner_k)) continue;
                    if (Array.isArray(inner_v)) {
                        extracted.push(..._extract_urls(inner_v));
                    } else if (typeof inner_v === 'string' && (inner_v.startsWith("http://") || inner_v.startsWith("https://") || inner_v.endsWith(".zip"))) {
                        extracted.push(inner_v);
                    }
                }
            }
            return extracted;
        };
        
        const wf_edges = state.variables?._workflow_edges || [];
        const incoming_sources = wf_edges.filter((e: any) => e.target === this.node_id).map((e: any) => e.source);
        
        for (const src_id of incoming_sources) {
            const out_val = state.variables[`${src_id}_output`] || state.variables[`${src_id}_api_result`] || state.variables[`${src_id}_db_result`];
            if (out_val) {
                incoming_urls.push(..._extract_urls(out_val));
            }
        }
        const wf_nodes = state.variables?._workflow_nodes || [];
        let source_node_name = "โหนดก่อนหน้า";
        for (const src_id of incoming_sources) {
            const pred_node = wf_nodes.find((n: any) => n.id === src_id);
            if (pred_node) {
                const pred_label = pred_node.data?.label || pred_node.data?.name || src_id;
                if (pred_label.toLowerCase().includes("incremental") || pred_node.type?.toLowerCase().includes("incremental")) {
                    source_node_name = `API Incremental ('${pred_label}')`;
                    break;
                } else {
                    source_node_name = `โหนด '${pred_label}'`;
                }
            }
        }

        if (incoming_urls.length === 0) {
            for (const src_id of incoming_sources) {
                const pred_node = wf_nodes.find((n: any) => n.id === src_id);
                if (pred_node) {
                    const sparams = pred_node.data?.parameters || {};
                    const cached_val = sparams.apiOutput || sparams.dbResult;
                    if (cached_val) {
                        const extracted = _extract_urls(cached_val);
                        if (extracted && extracted.length > 0) {
                            incoming_urls.push(...extracted);
                        }
                    }
                }
            }
        }
                            
        if (incoming_urls.length === 0) {
            const urls_str = params.supabaseUrls || "";
            if (urls_str) {
                incoming_urls.push(..._extract_urls(urls_str));
            }
        }

        if (incoming_urls.length > 0) {
            const url_list_str = incoming_urls.map((u, i) => `   [${i + 1}] ${u}`).join("\n");
            await this.log(state.current_run_id, `📥 [Queue PDF] รับข้อมูล URL จาก ${source_node_name} จำนวน ${incoming_urls.length} รายการ:\n${url_list_str}`);
        } else {
            await this.log(state.current_run_id, `⚠️ [Queue PDF] ไม่พบข้อมูล URL จาก ${source_node_name}`);
        }

        let historical_queue = params.zipQueue || {};
        if (Array.isArray(historical_queue)) {
            const temp: Record<string, any> = {};
            for (let i = 0; i < historical_queue.length; i++) {
                if (typeof historical_queue[i] === 'string') {
                    temp[(i + 1).toString()] = { url: historical_queue[i], index: (i + 1).toString(), status: "wait", disk_name: "" };
                } else if (typeof historical_queue[i] === 'object') {
                    temp[(i + 1).toString()] = historical_queue[i];
                }
            }
            historical_queue = temp;
        }
        
        const zip_queue: Record<string, any> = { ...historical_queue };
        
        let max_index = 0;
        for (const k of Object.keys(zip_queue)) {
            const num = parseInt(k, 10);
            if (!isNaN(num) && num > max_index) {
                max_index = num;
            }
        }
            
        const seen = new Set<string>();
        for (const k of Object.keys(zip_queue)) {
            if (zip_queue[k].url) {
                seen.add(zip_queue[k].url);
            }
        }
        
        let new_count = 0;
        for (const item of incoming_urls) {
            if (!seen.has(item)) {
                seen.add(item);
                max_index++;
                const idx_str = max_index.toString();
                zip_queue[idx_str] = {
                    index: idx_str,
                    url: item,
                    disk_name: "",
                    status: "wait"
                };
                new_count++;
            }
        }
                
        await this.log(state.current_run_id, `Queue processing: ${new_count} new items added. Total queue length: ${Object.keys(zip_queue).length}.`);

        const backend_dir = path.resolve(__dirname, '..', '..', '..'); // Assuming __dirname is src/node_builder/GeneralNode
        const temp_dir = getWorkflowInputDir(state.workflow_id || state.variables?.workflow_id);
        if (!fs.existsSync(temp_dir)) {
            fs.mkdirSync(temp_dir, { recursive: true });
        }

        if (supabase_url && bucket_name) {
            const base_url = supabase_url.replace(/\/$/, '');
            for (const key of Object.keys(zip_queue)) {
                const item = zip_queue[key].url;
                const wf_prefix = `${state.workflow_id || 'wf'}_`;
                if (!(item.startsWith("http://") || item.startsWith("https://")) && !item.startsWith(wf_prefix)) {
                    const regex = /^\d+-.*-\d{10}\.zip$/;
                    if (regex.test(item)) continue;
                    zip_queue[key].url = `${base_url}/storage/v1/object/authenticated/${bucket_name}/${item}`;
                }
            }
        }
        
        let downloaded_count = 0;
        
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        const timestamp = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear().toString().slice(-2)}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
        
        for (const key of Object.keys(zip_queue)) {
            const entry = zip_queue[key];
            if (entry.status === "complete" && entry.disk_name) {
                // If it is already fully complete, verify if the file exists on disk
                const check_path = path.join(temp_dir, entry.disk_name);
                if (fs.existsSync(check_path)) {
                    continue;
                }
            }
            
            const url = entry.url;
            let filename = url.split('/').pop() || "document";
            if (filename.includes('?')) {
                filename = filename.split('?')[0];
            }
                
            let file_path = "";

            const clean_node_id = this.node_id.replace("node_", "");
            
            let clean_name = "";
            let cleanBase = filename;
            const l = cleanBase.toLowerCase();
            if (l.endsWith('.zip') || l.endsWith('.txt') || l.endsWith('.png') || l.endsWith('.json')) {
                cleanBase = l.endsWith('.json') ? cleanBase.slice(0, -5) : cleanBase.slice(0, -4);
            }
            cleanBase = cleanBase.replace(/^([^_]+)_(\d+)_/, '');
            cleanBase = cleanBase.replace(/_\d{2}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/, '');
            cleanBase = cleanBase.replace(/-\d{10}$/, '');
            clean_name = cleanBase.replace(/[^a-zA-Z0-9-_]/g, '').trim();
            if (!clean_name) clean_name = "document";

            if (!entry.disk_name) {
                entry.disk_name = `${clean_node_id}_${entry.index}_${clean_name}_${timestamp}.zip`;
            }
            file_path = path.join(temp_dir, entry.disk_name);
            
            const wfFolderTag = `WF/${state.workflow_id || state.variables?.workflow_id || 'wf_default'}/Input`;
            
            let found_existing_path = "";
            const existing_files = fs.readdirSync(temp_dir);
            for (const existing_f of existing_files) {
                // Find file with matching node_id and index
                if (existing_f.startsWith(`${clean_node_id}_${entry.index}_`) && existing_f.includes(`_${clean_name}_`)) {
                    found_existing_path = path.join(temp_dir, existing_f);
                    entry.disk_name = existing_f; // Use the existing filename so we don't duplicate
                    file_path = found_existing_path;
                    break;
                }
            }

            if (url.startsWith("http://") || url.startsWith("https://")) {
                if (!fs.existsSync(file_path)) {
                    try {
                        await this.log(state.current_run_id, `⏳ [Queue PDF] กำลังดาวน์โหลดไฟล์ PDF จาก URL: ${url} ...`);
                        const headers: Record<string, string> = {
                            "User-Agent": "Mozilla/5.0"
                        };
                        if (supabase_key) {
                            headers["Authorization"] = `Bearer ${supabase_key}`;
                        }
                        
                        const response = await fetch(url, { headers });
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        const buffer = await response.arrayBuffer();
                        fs.writeFileSync(file_path, Buffer.from(buffer));
                        
                        if (fs.existsSync(file_path)) {
                            await this.log(state.current_run_id, `✅ [Queue PDF] ดาวน์โหลดเสร็จสมบูรณ์: [ไฟล์: ${entry.disk_name}] -> เก็บลงในโฟลเดอร์ ${wfFolderTag}`);
                            downloaded_count += 1;
                            entry.status = "complete";
                        } else {
                            throw new Error(`ไม่สามารถสร้างไฟล์ลงบนดิสก์ได้ ${file_path}`);
                        }
                    } catch (download_err: any) {
                        await this.log(state.current_run_id, `❌ [Queue PDF] ดาวน์โหลดล้มเหลวจาก URL: ${url} (ข้อผิดพลาด: ${download_err.message})`);
                        entry.status = "error";
                    }
                } else {
                    await this.log(state.current_run_id, `⏩ [Queue PDF] ไฟล์ [${entry.disk_name}] มีอยู่แล้วในโฟลเดอร์ ${wfFolderTag} (ไม่ต้องดาวน์โหลดใหม่)`);
                    entry.status = "complete";
                }
            } else {
                if (!fs.existsSync(file_path)) {
                    let found_local = false;
                    for (const existing_f of existing_files) {
                        if (existing_f.endsWith(filename)) {
                            fs.copyFileSync(path.join(temp_dir, existing_f), file_path);
                            found_local = true;
                            break;
                        }
                    }
                    if (!found_local) {
                        entry.status = "error";
                    } else {
                        entry.status = "complete";
                    }
                } else {
                    entry.status = "complete";
                }
            }
        }

        const current_index = Object.keys(zip_queue).length;
        
        if (!state.variables) state.variables = {};
        state.variables.has_next = false;
        state.variables.hasNext = false;
        
        const wfFolderTag = `WF/${state.workflow_id || state.variables?.workflow_id || 'wf_default'}/Input`;
        await this.log(state.current_run_id, `🎯 [Queue PDF] สรุปการจัดการไฟล์ลงโฟลเดอร์: นำไฟล์เข้า Queue Files Table สำเร็จทั้งหมด ${current_index} ไฟล์ (เก็บไว้ใน ${wfFolderTag})`);

        const outputs = {
            currentIndex: current_index,
            queueLength: current_index,
            currentUrl: "",
            hasNext: false,
            zipQueue: zip_queue
        };
        
        this.output_data = outputs;
        state.variables[`${this.node_id}_output`] = outputs;
        state.variables[`${this.node_id}_api_result`] = outputs;
        state.variables[`${this.node_id}_previous_max`] = current_index;
        
        if (this.node_complete_callback && outputs) {
            await this.node_complete_callback(this.node_id, outputs);
        }
            
        return {
            ...state,
            active_node: this.node_id,
            logs: [...(state.logs || []), `[${this.label}] สรุปคิวไฟล์: อัปเดต Queue Files Table สำเร็จ (${current_index} รายการ)`],
            variables: state.variables
        };
    }
}

export { Zip_Queue as ZIPQueueNode, Zip_Queue as ZIP_Queue };

