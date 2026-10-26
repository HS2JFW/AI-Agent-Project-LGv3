import { Datasource, WorkflowState } from "../Node_Workflow";

export class Graph_RAG extends Datasource {
    async connect(endpoint?: string): Promise<any> {
        if (!endpoint) {
            const params = this.node_data.parameters || {};
            endpoint = params.graphEndpoint || params.endpoint || "bolt://localhost:7687";
        }
        await this.log(
            this.state?.current_run_id || "",
            `[File: Node_Graph_RAG.ts | Class: Graph_RAG | Method: connect] Connecting to Knowledge Graph at ${endpoint}...`
        );
        return { connected: true, endpoint };
    }

    async query(connection: any, cypherQuery?: string): Promise<Record<string, any>[]> {
        if (!cypherQuery) {
            const params = this.node_data.parameters || {};
            cypherQuery = params.graphQuery || params.query || "MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 25";
        }

        await this.log(
            this.state?.current_run_id || "",
            `[File: Node_Graph_RAG.ts | Class: Graph_RAG | Method: query] Executing Graph Query: ${cypherQuery}`
        );

        // Simulation / Execution placeholder for Graph RAG retrieval
        const sampleNodes = [
            { id: "entity_1", label: "TOR Document", type: "Document", properties: { title: "Terms of Reference" } },
            { id: "entity_2", label: "Procurement Committee", type: "Organization", properties: { role: "Evaluator" } },
            { id: "entity_3", label: "Security Requirements", type: "Requirement", properties: { compliance: "Mandatory" } }
        ];

        return sampleNodes;
    }

    Show_Result(rows_data: Record<string, any>[]): string {
        return JSON.stringify(rows_data, null, 2);
    }

    async execute(state: WorkflowState): Promise<Record<string, any>> {
        this.state = state;
        const current_run_id = state.current_run_id;
        const params = this.node_data?.parameters || {};
        const endpoint = params.graphEndpoint || "bolt://localhost:7687";
        const queryStr = params.graphQuery || "MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 25";

        await this.log(
            current_run_id,
            `[File: Node_Graph_RAG.ts | Class: Graph_RAG | Method: execute] Starting Graph RAG retrieval for node '${this.label}'`
        );

        try {
            const conn = await this.connect(endpoint);
            const graphData = await this.query(conn, queryStr);
            const resultText = this.Show_Result(graphData);

            if (!this.node_data.parameters) this.node_data.parameters = {};
            this.node_data.parameters.output = resultText;
            this.node_data.parameters.graphData = graphData;
            this.node_data.status = "success";

            await this.log(
                current_run_id,
                `[File: Node_Graph_RAG.ts | Class: Graph_RAG | Method: execute] Graph RAG retrieved ${graphData.length} entities successfully.`
            );

            if (this.node_complete_callback) {
                this.node_complete_callback(this.node_id, this.node_data);
            }

            return {
                status: "success",
                output: resultText,
                graphData
            };
        } catch (err: any) {
            this.node_data.status = "error";
            await this.log(
                current_run_id,
                `[File: Node_Graph_RAG.ts | Class: Graph_RAG | Method: execute] Error: ${err.message}`,
                "ERROR"
            );
            throw err;
        }
    }
}

export { Graph_RAG as GraphRagNode };
