import { WorkflowNode, WorkflowState } from '../Node_Workflow';
import { getWorkflowInputDir } from '../../workflow_paths';
import fs from 'fs/promises';
import path from 'path';

export class JSON_Connector_List extends WorkflowNode {
    incoming_node_ids: string[];
    edges_list: any[];

    constructor(
        node_id: string,
        node_type: string,
        node_data: any,
        log_callback?: (runId: string, msg: string) => any,
        node_complete_callback?: (nodeId: string, outputs: any) => any,
        incoming_node_ids: string[] = [],
        edges_list: any[] = []
    ) {
        super(node_id, node_type, node_data, log_callback, node_complete_callback);
        this.incoming_node_ids = incoming_node_ids || [];
        this.edges_list = edges_list || [];
        
        if (!this.node_data.parameters) {
            this.node_data.parameters = {};
        }
        if (!this.node_data.parameters.fields) {
            this.node_data.parameters.fields = [];
        }
    }


    GetJSON(state: WorkflowState): string {
        if (this.input_data !== undefined && this.input_data !== null) {
            if (typeof this.input_data === 'string') {
                return this.input_data;
            }
            return JSON.stringify(this.input_data);
        }
        
        // DEBUG WHAT WE HAVE
        const wf_nodes_debug = state.variables._workflow_nodes || [];
        let dbg_str = "DEBUG WF NODES: ";
        for (const src_id of this.incoming_node_ids) {
            const parentDbg = wf_nodes_debug.find((n: any) => n.id === src_id);
            if (parentDbg && parentDbg.data && parentDbg.data.parameters) {
                dbg_str += " " + src_id + " keys: " + Object.keys(parentDbg.data.parameters).join(',');
            } else {
                dbg_str += " " + src_id + " NO PARAMETERS!";
            }
        }
        
        (this as any).node_data.dbg_str = dbg_str;
        // Fallback to legacy variables or single-node-run parameters
        for (const src_id of this.incoming_node_ids) {
            const output = state.variables[`${src_id}_output`];
            if (output !== undefined && output !== null) {
                if (typeof output === 'string') return output;
                return JSON.stringify(output);
            }
            
            // Check workflow nodes for parameters (in case of single node run)
            const wf_nodes = state.variables._workflow_nodes || [];
            const parent = wf_nodes.find((n: any) => n.id === src_id);
            if (parent && parent.data && parent.data.parameters) {
                // If the parent is an AI Agent PDF, its output is in agentOutputsTable
                if (parent.data.parameters.agentOutputsTable) {
                    return JSON.stringify({ agentOutputsTable: parent.data.parameters.agentOutputsTable });
                }
                if (parent.data.parameters.table) {
                    return JSON.stringify({ table: parent.data.parameters.table });
                }
            }
        }
        return "{}";
    }

    async execute(state: WorkflowState): Promise<any> {
        this.incoming_node_ids = state.variables._incoming_node_ids || this.incoming_node_ids;
        this.resolve_inputs(state);
        
        await this.log(
            state.current_run_id,
            `Node '${this.label}' (${this.category ? this.category : this.node_type}) started execution (Pass-through mode).`
        );
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Pass-through loop variables
        const previousMaxList: Record<string, number> = state.variables["previousMaxList"] || {};
        let currentIndex = state.variables["currentIndex"] || 0;
        let hasNext = state.variables["hasNext"] || state.variables["has_next"] || false;
        let targetKeyToProcess = state.variables["targetKeyToProcess"] !== undefined ? state.variables["targetKeyToProcess"] : currentIndex;
        
        // Inherit parent max
        let myQueueLength = 0;
        for (const parentId of this.incoming_node_ids) {
            const parentMax = state.variables[`${parentId}_previous_max`];
            if (parentMax !== undefined) myQueueLength = parentMax;
            const parentOutput = state.variables[`${parentId}_output`];
            if (parentOutput && parentOutput.queueLength !== undefined) myQueueLength = parentOutput.queueLength;
            if (parentOutput && parentOutput.hasNext !== undefined) hasNext = parentOutput.hasNext;
        }

        // Get saved data dict for pass-through storage
        let savedJsons: Record<string, any> = state.variables[`${this.node_id}_saved_jsons`] || {};
        
        const json_text = this.GetJSON(state);
        let parsed_data: any = {};
        let wasFileRead = false;
        
        const fields = this.node_data.parameters?.fields || [];
        await this.log(state.current_run_id, `Extracting and filtering JSON fields: ${JSON.stringify(fields)}`);

        const parentIdsStr = this.incoming_node_ids.length > 0 ? this.incoming_node_ids.join(', ') : 'Unknown';

        // ---------------- HARD DEBUG LOGS ----------------
        await this.log(state.current_run_id, `[DEBUG] WF NODES DATA: ${(this as any).node_data.dbg_str}`);
        await this.log(state.current_run_id, `[DEBUG] RAW json_text from GetJSON: ${json_text.substring(0, 500)}...`);
        await this.log(state.current_run_id, `[DEBUG] targetKeyToProcess: ${targetKeyToProcess}`);
        await this.log(state.current_run_id, `[DEBUG] currentIndex: ${currentIndex}`);

        let targetFilename = "";
        let filtered_data: any[] = [];
        try {
            // First parse the incoming payload
            let initial_parse: any = null;
            try {
                initial_parse = JSON.parse(json_text);
                await this.log(state.current_run_id, `[DEBUG] Successfully parsed json_text. Keys available: ${Object.keys(initial_parse).join(', ')}`);
            } catch (e) {
                // If it's a raw filename string instead of a JSON object
                initial_parse = json_text;
                await this.log(state.current_run_id, `[DEBUG] json_text is not a JSON object, treating as string: ${initial_parse}`);
            }
            
            
            
            // --- AUTO DISCOVERY ---
            if (typeof initial_parse === 'object' && initial_parse !== null && Object.keys(initial_parse).length === 0 && this.incoming_node_ids.length > 0) {
                await this.log(state.current_run_id, `[DEBUG] Payload is empty {}. Initiating Auto-Discovery of parent files...`);
                const parentId = this.incoming_node_ids[0];
                const cleanParentId = parentId.replace(/-/g, '_');
                
                const queuePdfDir = getWorkflowInputDir(state.workflow_id || state.variables?.workflow_id);
                try {
                    const fsPromises = require('fs').promises;
                    const files = await fsPromises.readdir(queuePdfDir);
                    const matchedFiles = files.filter((f: string) => f.startsWith(cleanParentId) && (f.endsWith('.json') || f.endsWith('.md') || f.endsWith('.txt')));
                    
                    if (matchedFiles.length > 0) {
                        await this.log(state.current_run_id, `[DEBUG] Auto-Discovery found ${matchedFiles.length} files from parent ${parentId}`);
                        // Sort files alphabetically so they are processed in order
                        matchedFiles.sort();
                        initial_parse = { agentOutputsTable: {} } as any;
                        matchedFiles.forEach((f: string, i: number) => {
                            initial_parse.agentOutputsTable[String(i)] = f;
                        });
                        if (myQueueLength === 0) myQueueLength = matchedFiles.length;
                        
                        // We must also save this to state so that loop execution updates the Queue Length properly!
                        state.variables[`${this.node_id}_previous_max`] = myQueueLength;
                    } else {
                        await this.log(state.current_run_id, `[DEBUG] Auto-Discovery found NO files for parent ${parentId} in ${queuePdfDir}`);
                    }
                } catch(e: any) {
                    await this.log(state.current_run_id, `[DEBUG] Auto-Discovery failed: ${e.message}`);
                }
            }
            // --- END AUTO DISCOVERY ---

            // Check if it's from AI Agent PDFs format
            let targetFilesMap: Record<string, string> = {};
            if (initial_parse && typeof initial_parse === 'object') {
                if (initial_parse.agentOutputsTable && Object.keys(initial_parse.agentOutputsTable).length > 0) {
                    targetFilesMap = initial_parse.agentOutputsTable;
                    await this.log(state.current_run_id, `[DEBUG] Found agentOutputsTable with ${Object.keys(targetFilesMap).length} files.`);
                } else if (initial_parse.pdfQueue && Object.keys(initial_parse.pdfQueue).length > 0) {
                    targetFilesMap = initial_parse.pdfQueue;
                    await this.log(state.current_run_id, `[DEBUG] Found pdfQueue with ${Object.keys(targetFilesMap).length} files.`);
                } else {
                    await this.log(state.current_run_id, `[DEBUG] No valid file list found in payload! payload is: ${JSON.stringify(initial_parse).substring(0, 200)}`);
                }
            } else if (typeof initial_parse === 'string') {
                targetFilesMap[targetKeyToProcess] = initial_parse;
                await this.log(state.current_run_id, `[DEBUG] Using string as single targetFilename: ${initial_parse}`);
            }
            
           
            
            if (Object.keys(targetFilesMap).length > 0) {
                await this.log(state.current_run_id, `[JSON Connector List] Requesting data from Parent Node ID(s): ${parentIdsStr}`);
                
                const queuePdfDir = getWorkflowInputDir(state.workflow_id || state.variables?.workflow_id);
                const workflowAgentDir = path.join(queuePdfDir, '..', 'workflow_agents');
                const agentDir = path.join(workflowAgentDir, String(state.workflow_id || state.variables?.workflow_id));
                
                try {
                    await fs.mkdir(agentDir, { recursive: true });
                } catch (e) {}

                const files = await fs.readdir(queuePdfDir);
                const agentFiles = await fs.readdir(agentDir).catch(() => [] as string[]);
                const allFiles = [...files, ...agentFiles];
                
                const cleanNodeId = this.node_id.replace(/\s+/g, '_');
                const currentTimestamp = new Date().getTime().toString();
                const currentDatetime = new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/[\/\s:]/g, '-').replace(',', '');
                
                for (const [rowKey, tFile] of Object.entries(targetFilesMap)) {
                    // It can be a simple filename like 123456789_abcdef_....md
                    // We just look for the file in agentDir or queuePdfDir
                    let matchedFile = null;
                    if (agentFiles.includes(tFile)) matchedFile = path.join(agentDir, tFile);
                    else if (files.includes(tFile)) matchedFile = path.join(queuePdfDir, tFile);
                    else {
                        // Fallback matching
                        const coreMatch = tFile.match(/\d{13}_[a-zA-Z0-9]{6}/);
                        if (coreMatch) {
                            const extractedCoreId = coreMatch[0];
                            const found = allFiles.find(f => f.includes(extractedCoreId) && (f.endsWith('.json') || f.endsWith('.md')));
                            if (found) {
                                matchedFile = files.includes(found) ? path.join(queuePdfDir, found) : path.join(agentDir, found);
                            }
                        }
                    }
                    
                    if (matchedFile) {
                        const fileContent = await fs.readFile(matchedFile, 'utf-8');
                        let pData: any = null;
                        
                        try {
                            const cleanStr = fileContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
                            pData = JSON.parse(cleanStr);
                            
                            if (typeof pData !== 'object' || pData === null) {
                                pData = { content: pData };
                            }
                        } catch(e) {
                            pData = { content: fileContent };
                        }
                        
                        // Filter the fields
                        const filtered_row: Record<string, any> = {};
                        for (const f of fields) {
                            if (f in pData) {
                                filtered_row[f] = pData[f];
                            }
                        }
                        filtered_row.source_file = path.basename(matchedFile);
                        
                        filtered_data.push(filtered_row);
                        
                        // Generate new .md file for JSON Connector List
                        const randomStr = Math.random().toString(36).substring(2, 8);
                        const outFilename = `${cleanNodeId}_${rowKey}_${currentTimestamp}_${randomStr}_${currentDatetime}.md`;
                        const outPath = path.join(agentDir, outFilename);
                        
                        const jsonOutputContent = JSON.stringify(filtered_row, null, 2);
                        await fs.writeFile(outPath, jsonOutputContent, "utf-8");
                        
                        // Save into Dictionary to maintain connection with parent index
                        savedJsons[rowKey] = outFilename;
                        wasFileRead = true;
                        
                    } else {
                        await this.log(state.current_run_id, `[JSON Connector List] ERROR: File ${tFile} not found in directory ${queuePdfDir} or ${agentDir}`);
                    }
                }
                
                await this.log(state.current_run_id, `[DEBUG] Aggregated & generated ${filtered_data.length} .md files successfully.`);
            } else {
                await this.log(state.current_run_id, `[DEBUG] Target filename dictionary is empty. Proceeding without reading file.`);
            }
            
            // If it wasn't a file, unwrap the payload directly
            if (!wasFileRead) {
                let parsed_data: any = initial_parse;
                
                // Unwrap table from known parent output formats
                if (parsed_data && typeof parsed_data === 'object' && !Array.isArray(parsed_data)) {
                    if (Array.isArray(parsed_data.markitdownTable)) parsed_data = parsed_data.markitdownTable;
                    else if (Array.isArray(parsed_data.agentOutputsTable)) parsed_data = parsed_data.agentOutputsTable;
                    else if (Array.isArray(parsed_data.dbOutput)) parsed_data = parsed_data.dbOutput;
                    else if (Array.isArray(parsed_data.apiOutput)) parsed_data = parsed_data.apiOutput;
                    else if (Array.isArray(parsed_data.jsonOutput)) parsed_data = parsed_data.jsonOutput;
                    else if (Array.isArray(parsed_data.parsedDataPreview)) parsed_data = parsed_data.parsedDataPreview;
                    else if (Array.isArray(parsed_data.table)) parsed_data = parsed_data.table;
                    else if (Array.isArray(parsed_data.pdfQueue)) parsed_data = parsed_data.pdfQueue;
                    else if (typeof parsed_data.agentOutputsTable === 'object') {
                        // Fallback dictionary extraction
                        if (parsed_data.agentOutputsTable[targetKeyToProcess]) {
                            parsed_data = parsed_data.agentOutputsTable[targetKeyToProcess];
                        }
                    }
                }
                
                if (Array.isArray(parsed_data)) {
                    for (const row of parsed_data) {
                        if (typeof row === 'object' && row !== null) {
                            const filtered_row: Record<string, any> = {};
                            for (const f of fields) {
                                if (f in row) {
                                    filtered_row[f] = row[f];
                                }
                            }
                            filtered_data.push(filtered_row);
                        } else {
                            filtered_data.push(row);
                        }
                    }
                } else if (typeof parsed_data === 'object' && parsed_data !== null) {
                    const single_filtered: any = {};
                    for (const f of fields) {
                        if (f in parsed_data) {
                            single_filtered[f] = parsed_data[f];
                        }
                    }
                    filtered_data.push(single_filtered);
                }
                savedJsons[targetKeyToProcess] = filtered_data;
            }
            
        } catch (e: any) {
            await this.log(state.current_run_id, `Error processing JSON payload: ${e.message}`);
        }
        
        state.variables[`${this.node_id}_saved_jsons`] = savedJsons;
        
        if (myQueueLength === 0 && Array.isArray(filtered_data)) {
             myQueueLength = filtered_data.length;
        }

        previousMaxList[this.node_id] = myQueueLength;
        state.variables[`${this.node_id}_previous_max`] = myQueueLength;
        
        // Ensure state variables are forwarded
        state.variables["previousMaxList"] = previousMaxList;
        state.variables["currentIndex"] = currentIndex;
        state.variables["hasNext"] = hasNext;
        state.variables["has_next"] = hasNext;

        const sent_logs: string[] = [];
        for (const edge of this.edges_list) {
            if (edge.source === this.node_id) {
                const target_node_id = edge.target;
                
                // Route specific fields
                if (edge.sourceHandle && edge.sourceHandle !== "output" && edge.sourceHandle !== "bottom-source") {
                    const fieldName = edge.sourceHandle;
                    let val = Array.isArray(filtered_data) ? filtered_data.map((item: any) => item[fieldName]) : filtered_data[fieldName];
                    if (val !== undefined) {
                        this.SendField(state, fieldName, [typeof val === 'string' ? val : JSON.stringify(val)], target_node_id);
                        sent_logs.push(`Routed field '${fieldName}' to node ${target_node_id}`);
                    }
                } else {
                    // Full output payload dictionary mimicking AI Agent PDFs
                    state.variables[`${target_node_id}_input_data`] = {
                        agentOutputsTable: savedJsons,
                        currentIndex: currentIndex,
                        previousMaxList: previousMaxList,
                        queueLength: myQueueLength,
                        hasNext: hasNext
                    };
                    sent_logs.push(`Forwarded Dictionary pass-through payload to '${target_node_id}'.`);
                }
            }
        }

        let output_msg = "";
        if (sent_logs.length > 0) {
            output_msg = sent_logs.join("\n");
        } else {
            output_msg = `JSON Connector executed. Filtered Row ${targetKeyToProcess}: ${JSON.stringify(filtered_data)}`;
        }
            
        await this.log(state.current_run_id, output_msg);
        await this.log(state.current_run_id, `Node '${this.label}' completed execution.`);
        
        this.output_data = filtered_data;
        
        const output_data_payload = {
            ...this.Output(),
            table: Array.isArray(filtered_data) ? filtered_data : [filtered_data],
            agentOutputsTable: savedJsons,
            previous_max: myQueueLength,
            currentIndex,
            previousMaxList,
            queueLength: myQueueLength,
            hasNext
        };
        
        state.variables[`${this.node_id}_output`] = output_data_payload;
        return output_data_payload;
    }
}
