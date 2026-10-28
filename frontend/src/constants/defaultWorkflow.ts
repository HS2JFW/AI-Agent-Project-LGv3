import { type Node, type Edge } from 'reactflow';

// Default Workflow Structure to wow the user on first load

export const DEFAULT_NODES: Node[] = [

  // Input Data Sources

  {

    id: 'source-api',

    type: 'customNode',

    position: { x: 80, y: 120 },

    data: { 

      label: 'API Incremental', 

      category: 'Data Sources', 

      name: 'API Incremental', 

      nodeType: 'API Incremental',

      nodeClass: 'API_Incremental',

      originalName: 'API Incremental',

      prompt: 'Fetch marketing leads API data', 

      parameters: { 

        tools: ['api', 'globe'],

        apiUrl: 'https://bqysaldeijwvnhtcfiuj.supabase.co/rest/v1/pdf_table',

        authHeader: 'Bearer sb_publishable_tzQOB9wms5o9q19pA6vFDQ_OK439Ism',

        anonKeyHeader: 'sb_publishable_tzQOB9wms5o9q19pA6vFDQ_OK439Ism',

        functionName: 'GetPDF_Incremental()',

        apiParameters: 'select=number,date,file_url',

        round: 1,

        row: 5,

        apiOutput: ''

      } 

    }

  },

  {

    id: 'source-db',

    type: 'customNode',

    position: { x: 80, y: 260 },

    data: { 

      label: 'Database', 

      category: 'Data Sources', 

      name: 'Database', 

      nodeType: 'DB',

      nodeClass: 'DB',

      originalName: 'DB',

      prompt: 'Query historical CRM records', 

      parameters: { tools: ['database'] } 

    }

  },

  

  // Center Team: Project Manager

  {

    id: 'agent-pm',

    type: 'customNode',

    position: { x: 420, y: 80 },

    data: { 

      label: 'Project Manager', 

      category: 'Agents', 

      name: 'Project Manager', 

      nodeType: 'Agent',

      nodeClass: 'Agent',

      originalName: 'Agent',

      role: 'Orchestrator Agent', 

      prompt: 'Decompose incoming requests, delegate tasks, and aggregate results.', 

      parameters: { progress: 85, progressColor: '#00F0FF', tools: ['api', 'database', 'users'] } 

    }

  },



  // 3 Team Agents

  {

    id: 'agent-website',

    type: 'customNode',

    position: { x: 420, y: 240 },

    data: { 

      label: 'Website Task Agent', 

      category: 'Agents', 

      name: 'Website Task Agent', 

      nodeType: 'Agent',

      nodeClass: 'Agent',

      originalName: 'Agent',

      role: 'Frontend Developer', 

      prompt: 'Build landing pages, optimize SEO tags, and verify responsiveness.', 

      parameters: { progress: 60, progressColor: '#8B5CF6', tools: ['react', 'nodejs', 'python'] } 

    }

  },

  {

    id: 'agent-crm',

    type: 'customNode',

    position: { x: 420, y: 380 },

    data: { 

      label: 'CRM Task Agent', 

      category: 'Agents', 

      name: 'CRM Task Agent', 

      nodeType: 'Agent',

      nodeClass: 'Agent',

      originalName: 'Agent',

      role: 'CRM Manager', 

      prompt: 'Sync data pipelines, trigger email webhooks, and record transactions.', 

      parameters: { progress: 40, progressColor: '#10B981', tools: ['api', 'database', 'users'] } 

    }

  },

  {

    id: 'agent-analytics',

    type: 'customNode',

    position: { x: 420, y: 520 },

    data: { 

      label: 'Analytics Task Agent', 

      category: 'Agents', 

      name: 'Analytics Task Agent', 

      nodeType: 'Agent',

      nodeClass: 'Agent',

      originalName: 'Agent',

      role: 'Data Analyst', 

      prompt: 'Compute aggregate metrics, build visual charts, and generate summary tables.', 

      parameters: { progress: 75, progressColor: '#F59E0B', tools: ['python', 'search', 'database'] } 

    }

  },



  // Audit Agent

  {

    id: 'agent-audit',

    type: 'customNode',

    position: { x: 420, y: 680 },

    data: { 

      label: 'Audit Agent', 

      category: 'Agents', 

      name: 'Audit Agent', 

      nodeType: 'Agent Audit',

      nodeClass: 'Agent_Audit',

      originalName: 'Agent Audit',

      role: 'QA Auditor', 

      prompt: 'Review output code and data reports for standard conformance and correctness.', 

      parameters: { progress: 95, progressColor: '#EF4444', tools: ['check', 'verify'] } 

    }

  },



  // Deliverables

  {

    id: 'deliverable-json',

    type: 'customNode',

    position: { x: 760, y: 520 },

    data: { 

      label: 'JSON Output', 

      category: 'Actions', 

      name: 'JSON Output', 

      nodeType: 'JSON Connector',

      nodeClass: 'JSON_Connector',

      originalName: 'JSON Connector',

      prompt: 'Package deliverables as standard JSON objects', 

      parameters: { tools: ['code'] } 

    }

  },

  {

    id: 'deliverable-db',

    type: 'customNode',

    position: { x: 760, y: 680 },

    data: { 

      label: 'Production DB', 

      category: 'Actions', 

      name: 'Production DB', 

      nodeType: 'DB',

      nodeClass: 'DB',

      originalName: 'DB',

      prompt: 'Upsert verified output records into DB', 

      parameters: { tools: ['database'] } 

    }

  },



  // Notifications

  {

    id: 'notify-gmail',

    type: 'customNode',

    position: { x: 1060, y: 120 },

    data: { 

      label: 'Gmail', 

      category: 'Notification', 

      name: 'Gmail', 

      nodeType: 'Gmail',

      nodeClass: 'Gmail',

      originalName: 'Gmail',

      prompt: 'Send email notifications to administrators', 

      parameters: { tools: ['api'] } 

    }

  },

  {

    id: 'notify-line',

    type: 'customNode',

    position: { x: 1060, y: 260 },

    data: { 

      label: 'LINE', 

      category: 'Notification', 

      name: 'LINE', 

      nodeType: 'Line',

      nodeClass: 'Line',

      originalName: 'Line',

      prompt: 'Push notifications via LINE Messenger bot', 

      parameters: { tools: ['api'] } 

    }

  },

  {

    id: 'notify-mobile',

    type: 'customNode',

    position: { x: 1060, y: 400 },

    data: { 

      label: 'Mobile Message', 

      category: 'Notification', 

      name: 'Mobile Message', 

      nodeType: 'Mobile Message',

      nodeClass: 'Mobile_Message',

      originalName: 'Mobile Message',

      prompt: 'Send SMS alert message', 

      parameters: { tools: ['api'] } 

    }

  }

];



export const DEFAULT_EDGES: Edge[] = [

  // Sources to PM Agent

  { id: 'e-api-pm', source: 'source-api', target: 'agent-pm', animated: true },

  { id: 'e-db-pm', source: 'source-db', target: 'agent-pm', animated: true },

  

  // PM Agent to Team Agents

  { id: 'e-pm-website', source: 'agent-pm', target: 'agent-website', animated: true },

  { id: 'e-pm-crm', source: 'agent-pm', target: 'agent-crm', animated: true },

  { id: 'e-pm-analytics', source: 'agent-pm', target: 'agent-analytics', animated: true },

  

  // Team Agents to Audit Agent

  { id: 'e-website-audit', source: 'agent-website', target: 'agent-audit', animated: true },

  { id: 'e-crm-audit', source: 'agent-crm', target: 'agent-audit', animated: true },

  { id: 'e-analytics-audit', source: 'agent-analytics', target: 'agent-audit', animated: true },

  

  // Audit Agent to Deliverables

  { id: 'e-audit-json', source: 'agent-audit', target: 'deliverable-json', animated: true },

  { id: 'e-audit-db', source: 'agent-audit', target: 'deliverable-db', animated: true },

  

  // Deliverables to Notifications

  { id: 'e-json-gmail', source: 'deliverable-json', target: 'notify-gmail', animated: true },

  { id: 'e-db-line', source: 'deliverable-db', target: 'notify-line', animated: true },

  { id: 'e-db-mobile', source: 'deliverable-db', target: 'notify-mobile', animated: true }

];

export const DEFAULT_AGENT_NODES: Node[] = [

  // Container Nodes (Parent Nodes)

  {

    id: 'container-sources',

    type: 'containerNode',

    position: { x: 20, y: 100 },

    style: { width: 250, height: 410 },

    data: { name: 'Input Data Sources', titleColor: '#D4FF3A' },

    draggable: true,

  },

  {

    id: 'container-notifications',

    type: 'containerNode',

    position: { x: 1060, y: 100 },

    style: { width: 250, height: 410 },

    data: { name: 'Final Notifications', titleColor: '#EA4335' },

    draggable: true,

  },

  {

    id: 'container-deliverables',

    type: 'containerNode',

    position: { x: 490, y: 580 },

    style: { width: 530, height: 180 },

    data: { name: 'Deliverables', titleColor: '#10B981' },

    draggable: true,

  },



  // Source Nodes (Children of container-sources)

  {

    id: 'source-api',

    type: 'customNode',

    parentNode: 'container-sources',

    extent: 'parent',

    position: { x: 5, y: 40 },

    data: { 

      label: 'API Incremental', 

      category: 'Data Sources', 

      name: 'API Incremental', 

      nodeType: 'API Incremental',

      nodeClass: 'API_Incremental',

      originalName: 'API Incremental',

      prompt: 'Fetch marketing leads API data', 

      parameters: { 

        tools: ['api', 'globe'],

        apiUrl: 'https://api.example.com/v1/data',

        functionName: 'fetchData()',

        apiParameters: 'limit=10&status=active',

        apiOutput: '{\n  "status": "success",\n  "data": {\n    "id": 101,\n    "name": "John Doe",\n    "email": "john@example.com",\n    "role": "developer"\n  }\n}'

      } 

    }

  },

  {

    id: 'source-db',

    type: 'customNode',

    parentNode: 'container-sources',

    extent: 'parent',

    position: { x: 5, y: 160 },

    data: { 

      label: 'Database', 

      category: 'Data Sources', 

      name: 'Database', 

      nodeType: 'DB',

      nodeClass: 'DB',

      originalName: 'DB',

      prompt: 'Query historical CRM records', 

      parameters: { tools: ['database'] } 

    }

  },

  

  // Center Team: Project Manager

  {

    id: 'agent-pm',

    type: 'customNode',

    position: { x: 530, y: 30 },

    data: { 

      label: 'Project Manager', 

      category: 'Agents', 

      name: 'Project Manager', 

      nodeType: 'Agent',

      nodeClass: 'Agent',

      originalName: 'Agent',

      role: 'Orchestrator Agent', 

      prompt: 'Decompose incoming requests, delegate tasks, and aggregate results.', 

      parameters: { progress: 85, progressColor: '#00F0FF', tools: ['api', 'database', 'users'] } 

    }

  },



  // 3 Team Agents

  {

    id: 'agent-website',

    type: 'customNode',

    position: { x: 270, y: 260 },

    data: { 

      label: 'Website Task Agent', 

      category: 'Agents', 

      name: 'Website Task Agent', 

      nodeType: 'Agent',

      nodeClass: 'Agent',

      originalName: 'Agent',

      role: 'Frontend Developer', 

      prompt: 'Build landing pages, optimize SEO tags, and verify responsiveness.', 

      parameters: { progress: 60, progressColor: '#8B5CF6', tools: ['react', 'nodejs', 'python'] } 

    }

  },

  {

    id: 'agent-crm',

    type: 'customNode',

    position: { x: 530, y: 260 },

    data: { 

      label: 'CRM Task Agent', 

      category: 'Agents', 

      name: 'CRM Task Agent', 

      nodeType: 'Agent',

      nodeClass: 'Agent',

      originalName: 'Agent',

      role: 'CRM Manager', 

      prompt: 'Sync data pipelines, trigger email webhooks, and record transactions.', 

      parameters: { progress: 40, progressColor: '#10B981', tools: ['api', 'database', 'users'] } 

    }

  },

  {

    id: 'agent-analytics',

    type: 'customNode',

    position: { x: 790, y: 260 },

    data: { 

      label: 'Analytics Task Agent', 

      category: 'Agents', 

      name: 'Analytics Task Agent', 

      nodeType: 'Agent',

      nodeClass: 'Agent',

      originalName: 'Agent',

      role: 'Data Analyst', 

      prompt: 'Compute aggregate metrics, build visual charts, and generate summary tables.', 

      parameters: { progress: 75, progressColor: '#F59E0B', tools: ['python', 'search', 'database'] } 

    }

  },



  // Audit Agent

  {

    id: 'agent-audit',

    type: 'customNode',

    position: { x: 530, y: 450 },

    data: { 

      label: 'Audit Agent', 

      category: 'Agents', 

      name: 'Audit Agent', 

      nodeType: 'Agent Audit',

      nodeClass: 'Agent_Audit',

      originalName: 'Agent Audit',

      role: 'QA Auditor', 

      prompt: 'Review output code and data reports for standard conformance and correctness.', 

      parameters: { progress: 95, progressColor: '#EF4444', tools: ['check', 'verify'] } 

    }

  },



  // Deliverables (Children of container-deliverables)

  {

    id: 'deliverable-json',

    type: 'customNode',

    parentNode: 'container-deliverables',

    extent: 'parent',

    position: { x: 10, y: 45 },

    data: { 

      label: 'JSON Output', 

      category: 'Actions', 

      name: 'JSON Output', 

      nodeType: 'JSON Connector',

      nodeClass: 'JSON_Connector',

      originalName: 'JSON Connector',

      prompt: 'Package deliverables as standard JSON objects', 

      parameters: { tools: ['code'] } 

    }

  },

  {

    id: 'deliverable-db',

    type: 'customNode',

    parentNode: 'container-deliverables',

    extent: 'parent',

    position: { x: 270, y: 45 },

    data: { 

      label: 'Production DB', 

      category: 'Actions', 

      name: 'Production DB', 

      nodeType: 'DB',

      nodeClass: 'DB',

      originalName: 'DB',

      prompt: 'Upsert verified output records into DB', 

      parameters: { tools: ['database'] } 

    }

  },



  // Notifications (Children of container-notifications)

  {

    id: 'notify-gmail',

    type: 'customNode',

    parentNode: 'container-notifications',

    extent: 'parent',

    position: { x: 5, y: 40 },

    data: { 

      label: 'Gmail', 

      category: 'Notification', 

      name: 'Gmail', 

      nodeType: 'Gmail',

      nodeClass: 'Gmail',

      originalName: 'Gmail',

      prompt: 'Send email notifications to administrators', 

      parameters: { tools: ['api'] } 

    }

  },

  {

    id: 'notify-line',

    type: 'customNode',

    parentNode: 'container-notifications',

    extent: 'parent',

    position: { x: 5, y: 160 },

    data: { 

      label: 'LINE', 

      category: 'Notification', 

      name: 'LINE', 

      nodeType: 'Line',

      nodeClass: 'Line',

      originalName: 'Line',

      prompt: 'Push notifications via LINE Messenger bot', 

      parameters: { tools: ['api'] } 

    }

  },

  {

    id: 'notify-mobile',

    type: 'customNode',

    parentNode: 'container-notifications',

    extent: 'parent',

    position: { x: 5, y: 280 },

    data: { 

      label: 'Mobile Message', 

      category: 'Notification', 

      name: 'Mobile Message', 

      nodeType: 'Mobile Message',

      nodeClass: 'Mobile_Message',

      originalName: 'Mobile Message',

      prompt: 'Send SMS alert message', 

      parameters: { tools: ['api'] } 

    }

  }

];



export const DEFAULT_AGENT_EDGES: Edge[] = [

  // Sources to PM Agent (Cyan)

  { id: 'ea-api-pm', source: 'source-api', target: 'agent-pm', animated: true, style: { stroke: '#00F0FF', strokeWidth: 2.5 } },

  { id: 'ea-db-pm', source: 'source-db', target: 'agent-pm', animated: true, style: { stroke: '#00F0FF', strokeWidth: 2.5 } },

  

  // PM Agent to Team Agents (Purple)

  { id: 'ea-pm-website', source: 'agent-pm', target: 'agent-website', animated: true, style: { stroke: '#8B5CF6', strokeWidth: 2.5 } },

  { id: 'ea-pm-crm', source: 'agent-pm', target: 'agent-crm', animated: true, style: { stroke: '#8B5CF6', strokeWidth: 2.5 } },

  { id: 'ea-pm-analytics', source: 'agent-pm', target: 'agent-analytics', animated: true, style: { stroke: '#8B5CF6', strokeWidth: 2.5 } },

  

  // Team Agents to Audit Agent (Purple)

  { id: 'ea-website-audit', source: 'agent-website', target: 'agent-audit', animated: true, style: { stroke: '#8B5CF6', strokeWidth: 2.5 } },

  { id: 'ea-crm-audit', source: 'agent-crm', target: 'agent-audit', animated: true, style: { stroke: '#8B5CF6', strokeWidth: 2.5 } },

  { id: 'ea-analytics-audit', source: 'agent-analytics', target: 'agent-audit', animated: true, style: { stroke: '#8B5CF6', strokeWidth: 2.5 } },

  

  // Audit Agent to Deliverables (Green)

  { id: 'ea-audit-json', source: 'agent-audit', target: 'deliverable-json', animated: true, style: { stroke: '#10B981', strokeWidth: 2.5 } },

  { id: 'ea-audit-db', source: 'agent-audit', target: 'deliverable-db', animated: true, style: { stroke: '#10B981', strokeWidth: 2.5 } },

  

  // Deliverables to Notifications (Green)

  { id: 'ea-json-gmail', source: 'deliverable-json', target: 'notify-gmail', animated: true, style: { stroke: '#10B981', strokeWidth: 2.5 } },

  { id: 'ea-db-line', source: 'deliverable-db', target: 'notify-line', animated: true, style: { stroke: '#10B981', strokeWidth: 2.5 } },

  { id: 'ea-db-mobile', source: 'deliverable-db', target: 'notify-mobile', animated: true, style: { stroke: '#10B981', strokeWidth: 2.5 } },



  // Red dashed loopback rejection edge: Audit to PM

  { id: 'ea-audit-pm-reject', source: 'agent-audit', target: 'agent-pm', animated: true, style: { stroke: '#EF4444', strokeWidth: 2, strokeDasharray: '5,5' } }

];



export interface LogMessage {

  node_id?: string;

  message: string;

  level: string;

  timestamp: string;

  source_file?: string;

  source_class?: string;

  source_function?: string;

  log_type?: 'general' | 'process_action' | 'status_change';

}

