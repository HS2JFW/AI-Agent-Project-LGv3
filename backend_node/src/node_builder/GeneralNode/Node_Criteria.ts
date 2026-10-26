import { WorkflowNode, StateType } from '../Node_Workflow';

export class Rubric extends WorkflowNode {
    async execute(state: StateType): Promise<Partial<StateType>> {
        this.resolve_inputs(state);
        await this.log(state.current_run_id, `Node '${this.label}' (Rubric) started execution.`);
        
        const params = this.node_data?.parameters || {};
        const rubricData = this.node_data?.rubricData || params.rubricData || {};
        
        this.output_data = rubricData;
        state.variables[`${this.node_id}_output`] = rubricData;
        state.variables[`${this.node_id}_rubric`] = rubricData;
        
        if (this.node_complete_callback) {
            await this.node_complete_callback(this.node_id, rubricData);
        }
        
        await this.log(state.current_run_id, `Node '${this.label}' completed.`);
        return {
            active_node: this.node_id,
            logs: [...(state.logs || []), `[${this.label}] Rubric configuration loaded`],
            variables: state.variables
        };
    }
}

export class Multi_Criteria_Analysis extends WorkflowNode {
    async execute(state: StateType): Promise<Partial<StateType>> {
        this.resolve_inputs(state);
        await this.log(state.current_run_id, `Node '${this.label}' (Multi-Criteria Analysis) started execution.`);
        
        const params = this.node_data?.parameters || {};
        const mcaData = this.node_data?.mcaData || params || {};
        
        this.output_data = mcaData;
        state.variables[`${this.node_id}_output`] = mcaData;
        
        if (this.node_complete_callback) {
            await this.node_complete_callback(this.node_id, mcaData);
        }
        
        await this.log(state.current_run_id, `Node '${this.label}' completed.`);
        return {
            active_node: this.node_id,
            logs: [...(state.logs || []), `[${this.label}] Multi-Criteria Analysis evaluated`],
            variables: state.variables
        };
    }
}

export class Sample extends WorkflowNode {
    async execute(state: StateType): Promise<Partial<StateType>> {
        this.resolve_inputs(state);
        await this.log(state.current_run_id, `Node '${this.label}' (Sample) started execution.`);
        
        const params = this.node_data?.parameters || {};
        this.output_data = params;
        state.variables[`${this.node_id}_output`] = params;
        
        if (this.node_complete_callback) {
            await this.node_complete_callback(this.node_id, params);
        }
        
        await this.log(state.current_run_id, `Node '${this.label}' completed.`);
        return {
            active_node: this.node_id,
            logs: [...(state.logs || []), `[${this.label}] Sample data ready`],
            variables: state.variables
        };
    }
}

export class Table extends WorkflowNode {
    async execute(state: StateType): Promise<Partial<StateType>> {
        this.resolve_inputs(state);
        await this.log(state.current_run_id, `Node '${this.label}' (Table) started execution.`);
        
        const params = this.node_data?.parameters || {};
        const tableData = this.node_data?.tableData || params.tableData || params;
        
        this.output_data = tableData;
        state.variables[`${this.node_id}_output`] = tableData;
        
        if (this.node_complete_callback) {
            await this.node_complete_callback(this.node_id, tableData);
        }
        
        await this.log(state.current_run_id, `Node '${this.label}' completed.`);
        return {
            active_node: this.node_id,
            logs: [...(state.logs || []), `[${this.label}] Table data loaded`],
            variables: state.variables
        };
    }
}
