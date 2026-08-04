import { WorkflowNode, WorkflowState } from '../Node_Workflow';
import * as pdfParse from 'pdf-parse';

export class PdfsLoaderNode extends WorkflowNode {
    async execute(state: WorkflowState): Promise<any> {
        this.resolve_inputs(state);

        await this.log(
            state.current_run_id,
            `Node '${this.label}' (${this.node_type}) started execution.`
        );

        const params = this.node_data.parameters || {};

        // Keys to save list and indexing in run-specific state variables
        const list_var_key = `${this.node_id}_pdf_list`;
        const idx_var_key = `${this.node_id}_pdf_index`;

        let pdf_urls: string[] = [];

        // 1. Retrieve the list of PDF URLs if not already saved in state
        if (!(list_var_key in state.variables)) {
            const input_val = this.input_data;

            if (input_val) {
                if (typeof input_val === 'string') {
                    try {
                        const parsed = JSON.parse(input_val);
                        if (Array.isArray(parsed)) {
                            pdf_urls = parsed;
                        } else if (typeof parsed === 'object' && parsed !== null) {
                            for (const [k, v] of Object.entries(parsed)) {
                                if (Array.isArray(v)) {
                                    pdf_urls = v;
                                    break;
                                }
                            }
                        }
                    } catch (e) {
                        if (input_val.trim().startsWith("http://") || input_val.trim().startsWith("https://")) {
                            pdf_urls = [input_val.trim()];
                        }
                    }
                } else if (Array.isArray(input_val)) {
                    pdf_urls = input_val;
                } else if (typeof input_val === 'object' && input_val !== null) {
                    for (const [k, v] of Object.entries(input_val)) {
                        if (Array.isArray(v)) {
                            pdf_urls = v as string[];
                            break;
                        }
                    }
                }
            }

            // Fallback to manual parameters
            if (pdf_urls.length === 0) {
                const pdf_urls_param = params.pdfUrls || "";
                if (pdf_urls_param) {
                    try {
                        const parsed = JSON.parse(pdf_urls_param);
                        if (Array.isArray(parsed)) {
                            pdf_urls = parsed;
                        }
                    } catch (e) {
                        pdf_urls = pdf_urls_param
                            .replace(/\n/g, ",")
                            .split(",")
                            .map((u: string) => u.trim())
                            .filter((u: string) => u);
                    }
                }
            }

            state.variables[list_var_key] = pdf_urls;
            state.variables[idx_var_key] = 0;
            await this.log(state.current_run_id, `Pdfs Loader: Initialized URL list with ${pdf_urls.length} PDF(s).`);
        } else {
            pdf_urls = state.variables[list_var_key];
        }

        const current_idx = state.variables[idx_var_key] || 0;

        // 2. Check if we have more PDFs to load
        if (current_idx < pdf_urls.length) {
            const url = pdf_urls[current_idx];
            await this.log(state.current_run_id, `Pdfs Loader: Loading PDF [${current_idx + 1}/${pdf_urls.length}] from URL: ${url} ...`);

            try {
                // Download PDF
                const response = await fetch(url, {
                    headers: { "User-Agent": "Mozilla/5.0" },
                    signal: AbortSignal.timeout(30000)
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const pdf_data = await response.arrayBuffer();

                // Extract Text
                const pdfDataBuffer = Buffer.from(pdf_data);
                const data = await (pdfParse as any)(pdfDataBuffer);
                const pdf_text = data.text;

                await this.log(state.current_run_id, `Pdfs Loader: Successfully extracted ${pdf_text.length} characters.`);

                // Update output data
                this.output_data = {
                    pdf_url: url,
                    pdf_text: pdf_text,
                    pdf_index: current_idx,
                    pdf_total: pdf_urls.length
                };

                // Update index and state variables for next iteration routing
                const next_idx = current_idx + 1;
                state.variables[idx_var_key] = next_idx;
                state.variables["pdf_loader_has_more"] = (next_idx < pdf_urls.length);

            } catch (e: any) {
                const err_msg = `Pdfs Loader failed to load/extract PDF: ${e.message}`;
                await this.log(state.current_run_id, `Error: ${err_msg}`);
                this.output_data = {
                    pdf_url: url,
                    pdf_text: `Error loading PDF: ${e.message}`,
                    pdf_index: current_idx,
                    pdf_total: pdf_urls.length
                };
                const next_idx = current_idx + 1;
                state.variables[idx_var_key] = next_idx;
                state.variables["pdf_loader_has_more"] = (next_idx < pdf_urls.length);
            }
        } else {
            // Out of bounds
            await this.log(state.current_run_id, "Pdfs Loader: All PDF files have been processed.");
            this.output_data = {
                pdf_url: "",
                pdf_text: "Finished",
                pdf_index: current_idx,
                pdf_total: pdf_urls.length
            };
            state.variables["pdf_loader_has_more"] = false;
        }

        state.variables[`${this.node_id}_output`] = this.Output();

        const outputs = {
            pdf_url: this.output_data.pdf_url,
            pdf_text: this.output_data.pdf_text,
            pdf_index: this.output_data.pdf_index,
            pdf_total: this.output_data.pdf_total
        };

        if (this.node_complete_callback) {
            await this.node_complete_callback(this.node_id, outputs);
        }

        return {
            active_node: this.node_id,
            logs: [...state.logs, `[${this.label}] Loaded PDF index ${current_idx}`],
            variables: state.variables
        };
    }
}
