/**
 * nodeNormalizer.ts
 * 
 * Centralized normalizer for Workflow Nodes ensuring all nodes comply with:
 * 1. nodeType matches canonical Workspace Tool name
 * 2. nodeClass matches Class name with spaces replaced by '_'
 * 3. originalName matches nodeType
 * 4. category matches canonical Workspace Tool category
 * 5. legacy default labels/names are upgraded to clean standard names
 */

export const CANONICAL_CATEGORIES: Record<string, string> = {
  'DB': 'Data Sources',
  'API Incremental': 'Data Sources',
  'Graph RAG': 'Data Sources',
  'Page': 'Actions',
  'Storage': 'Data Sources',
  'JSON Connector': 'Actions',
  'Timer': 'Actions',
  'Workflow Timer': 'Actions',
  'PDF Queue': 'Dataset',
  'TXT Queue': 'Dataset',
  'Zip Queue': 'Dataset',
  'Agent': 'Agent',
  'Agent DB': 'Agent',
  'Agent Audit': 'Agent',
  'PDF to Base64 Agent': 'OCR',
  'PDF to Image Agent': 'OCR',
  'Gmail': 'Notification',
  'Line': 'Notification',
  'Mobile Message': 'Notification',
  'Rubric': 'Criteria',
  'Multi-Criteria Analysis': 'Criteria',
  'Sample': 'Criteria',
  'Table': 'Criteria',
  // Big Data & Analytics, Datasets & Multi-Agent Team
  'Polars Parquet Converter': 'Datasets',
  'DuckDB Virtual Lake': 'Datasets',
  'DuckDB Query Engine': 'Datasets',
  'Autonomous Big Data Analyst': 'Big Data & Analytics',
  'Multi-Agent Pipeline Container': 'Big Data & Analytics',
  'AI Data Analyst': 'Big Data & Analytics',
  'Planner Agent': 'Agents',
  'SQL Engineer & Critic': 'Agents',
  'Domain Specialist': 'Agents',
  'Executive Synthesizer': 'Agents',
};

const LEGACY_DEFAULT_NAMES: Record<string, string> = {
  'AI Agent PDFs': 'Agent',
  'AI Agent DB': 'Agent DB',
  'AI Agent PDFs Audit': 'Agent Audit',
  'AI Agent Audit': 'Agent Audit',
  'AI Agent PDFs Image': 'PDF to Image Agent',
  'PDF to Image': 'PDF to Image Agent',
  'AI Agent PDFs Base64': 'PDF to Base64 Agent',
  'PDF to Base64': 'PDF to Base64 Agent',
  'JSON Connector List': 'JSON Connector',
  'Database': 'DB'
};

export function normalizeWorkflowNode(n: any): any {
  if (!n || typeof n !== 'object') return n;

  // Container nodes are preserved as-is
  if (n.type === 'containerNode' || (n.id && typeof n.id === 'string' && n.id.startsWith('container-'))) {
    return n;
  }

  const d = n.data || {};
  const nodeType = (d.nodeType || '').trim();
  const nodeClass = (d.nodeClass || '').trim();
  const originalName = (d.originalName || '').trim();
  const name = (d.name || '').trim();
  const label = (d.label || '').trim();
  const rfType = (n.type || '').trim();

  let targetType = '';
  let targetClass = '';
  let targetCategory = '';
  let targetOriginalName = '';

  const ntLow = nodeType.toLowerCase();
  const ncLow = nodeClass.toLowerCase();
  const onLow = originalName.toLowerCase();
  const nLow = name.toLowerCase();
  const lLow = label.toLowerCase();
  const allText = [ntLow, ncLow, onLow, nLow, lLow].join(' ');

  const params = d.parameters || {};

  // 0.1 Big Data: Polars Parquet Converter
  if (allText.includes('polars') || allText.includes('parquet converter') || ('filePattern' in params && 'compression' in params)) {
    targetType = 'Polars Parquet Converter';
    targetClass = 'Polars_Parquet_Converter';
    targetCategory = 'Datasets';
    targetOriginalName = 'Polars Parquet Converter';
  }
  // 0.2 Big Data: DuckDB Virtual Lake
  else if (allText.includes('duckdb') || ('executionMode' in params && 'statementTimeout' in params)) {
    targetType = 'DuckDB Virtual Lake';
    targetClass = 'DuckDB_Virtual_Lake';
    targetCategory = 'Datasets';
    targetOriginalName = 'DuckDB Virtual Lake';
  }
  // 0.3 Big Data: Autonomous Big Data Analyst
  else if (allText.includes('autonomous') || allText.includes('big data analyst') || allText.includes('big_data_analyst') || ('businessObjective' in params && 'team' in params)) {
    targetType = 'Autonomous Big Data Analyst';
    targetClass = 'Autonomous_Big_Data_Analyst';
    targetCategory = 'Big Data & Analytics';
    targetOriginalName = 'Autonomous Big Data Analyst';
  }
  // 0.4 Big Data: Multi-Agent Pipeline Container
  else if (allText.includes('pipeline container') || allText.includes('pipeline_container') || rfType === 'containerNode') {
    targetType = 'Multi-Agent Pipeline Container';
    targetClass = 'Multi-Agent_Pipeline_Container';
    targetCategory = 'Big Data & Analytics';
    targetOriginalName = 'Multi-Agent Pipeline Container';
  }
  // 0.5 Agents: Planner Agent
  else if (allText.includes('planner')) {
    targetType = 'Planner Agent';
    targetClass = 'Planner_Agent';
    targetCategory = 'Agents';
    targetOriginalName = 'Planner Agent';
  }
  // 0.6 Agents: SQL Engineer & Critic
  else if (allText.includes('sql engineer') || allText.includes('critic')) {
    targetType = 'SQL Engineer & Critic';
    targetClass = 'SQL_Engineer_&_Critic';
    targetCategory = 'Agents';
    targetOriginalName = 'SQL Engineer & Critic';
  }
  // 0.7 Agents: Domain Specialist
  else if (allText.includes('domain specialist') || (d.category === 'Agents' && allText.includes('specialist'))) {
    targetType = 'Domain Specialist';
    targetClass = 'Domain_Specialist';
    targetCategory = 'Agents';
    targetOriginalName = 'Domain Specialist';
  }
  // 0.8 Agents: Executive Synthesizer
  else if (allText.includes('synthesizer') || (d.category === 'Agents' && allText.includes('executive'))) {
    targetType = 'Executive Synthesizer';
    targetClass = 'Executive_Synthesizer';
    targetCategory = 'Agents';
    targetOriginalName = 'Executive Synthesizer';
  }
  // 1. Workflow Timer
  else if (allText.includes('workflow timer') || allText.includes('workflow_timer')) {
    targetType = 'Workflow Timer';
    targetClass = 'Workflow_Timer';
    targetCategory = 'Actions';
    targetOriginalName = 'Workflow Timer';
  }
  // 2. Timer
  else if (allText.includes('timer')) {
    targetType = 'Timer';
    targetClass = 'Timer';
    targetCategory = 'Actions';
    targetOriginalName = 'Timer';
  }
  // 3. Agent Audit
  else if (allText.includes('audit')) {
    targetType = 'Agent Audit';
    targetClass = 'Agent_Audit';
    targetCategory = 'Agent';
    targetOriginalName = 'Agent Audit';
  }
  // 4. Agent DB
  else if (allText.includes('agent db') || allText.includes('agent_db')) {
    targetType = 'Agent DB';
    targetClass = 'Agent_DB';
    targetCategory = 'Agent';
    targetOriginalName = 'Agent DB';
  }
  // 5. OCR: Base64
  else if (allText.includes('base64')) {
    targetType = 'PDF to Base64 Agent';
    targetClass = 'PDF_to_Base64_Agent';
    targetCategory = 'OCR';
    targetOriginalName = 'PDF to Base64 Agent';
  }
  // 6. OCR: Image
  else if (allText.includes('image') || allText.includes('ocr pdfs')) {
    targetType = 'PDF to Image Agent';
    targetClass = 'PDF_to_Image_Agent';
    targetCategory = 'OCR';
    targetOriginalName = 'PDF to Image Agent';
  }
  // 7. Data Sources: API Incremental
  else if (allText.includes('incremental') || allText.includes('api connector')) {
    targetType = 'API Incremental';
    targetClass = 'API_Incremental';
    targetCategory = 'Data Sources';
    targetOriginalName = 'API Incremental';
  }
  // 7.1 Data Sources: Graph RAG
  else if (allText.includes('graph rag') || allText.includes('graph_rag')) {
    targetType = 'Graph RAG';
    targetClass = 'Graph_RAG';
    targetCategory = 'Data Sources';
    targetOriginalName = 'Graph RAG';
  }
  // 8. Data Sources: DB / Database
  else if (
    allText.includes('vector db') ||
    ntLow === 'db' ||
    ncLow === 'db' ||
    nLow === 'db' ||
    lLow === 'db' ||
    allText.includes('database') ||
    allText.includes('supabase')
  ) {
    targetType = 'DB';
    targetClass = 'DB';
    targetCategory = 'Data Sources';
    targetOriginalName = 'DB';
  }
  // 9. Dataset: Queues
  else if (allText.includes('pdf queue') || allText.includes('pdf_queue')) {
    targetType = 'PDF Queue';
    targetClass = 'PDF_Queue';
    targetCategory = 'Dataset';
    targetOriginalName = 'PDF Queue';
  } else if (allText.includes('txt queue') || allText.includes('txt_queue')) {
    targetType = 'TXT Queue';
    targetClass = 'TXT_Queue';
    targetCategory = 'Dataset';
    targetOriginalName = 'TXT Queue';
  } else if (allText.includes('zip queue') || allText.includes('zip_queue')) {
    targetType = 'Zip Queue';
    targetClass = 'Zip_Queue';
    targetCategory = 'Dataset';
    targetOriginalName = 'Zip Queue';
  }
  // 10. Actions: Page
  else if (allText.includes('page') || allText.includes('mark it down') || allText.includes('markitdown')) {
    targetType = 'Page';
    targetClass = 'Page';
    targetCategory = 'Actions';
    targetOriginalName = 'Page';
  }
  // 11. Data Sources: Storage
  else if (allText.includes('storage')) {
    targetType = 'Storage';
    targetClass = 'Storage';
    targetCategory = 'Data Sources';
    targetOriginalName = 'Storage';
  }
  // 12. Actions: JSON Connector
  else if (allText.includes('json')) {
    targetType = 'JSON Connector';
    targetClass = 'JSON_Connector';
    targetCategory = 'Actions';
    targetOriginalName = 'JSON Connector';
  }
  // 13. Notifications
  else if (allText.includes('gmail')) {
    targetType = 'Gmail';
    targetClass = 'Gmail';
    targetCategory = 'Notification';
    targetOriginalName = 'Gmail';
  } else if (allText.includes('line')) {
    targetType = 'Line';
    targetClass = 'Line';
    targetCategory = 'Notification';
    targetOriginalName = 'Line';
  } else if (allText.includes('mobile')) {
    targetType = 'Mobile Message';
    targetClass = 'Mobile_Message';
    targetCategory = 'Notification';
    targetOriginalName = 'Mobile Message';
  }
  // 14. Criteria
  else if (rfType === 'rubric' || allText.includes('rubric')) {
    targetType = 'Rubric';
    targetClass = 'Rubric';
    targetCategory = 'Criteria';
    targetOriginalName = 'Rubric';
  } else if (
    rfType === 'mca' ||
    allText.includes('multi-criteria') ||
    allText.includes('multi_criteria') ||
    allText.includes('multi criteria')
  ) {
    targetType = 'Multi-Criteria Analysis';
    targetClass = 'Multi_Criteria_Analysis';
    targetCategory = 'Criteria';
    targetOriginalName = 'Multi-Criteria Analysis';
  } else if (rfType === 'sample' || allText.includes('sample')) {
    targetType = 'Sample';
    targetClass = 'Sample';
    targetCategory = 'Criteria';
    targetOriginalName = 'Sample';
  } else if (rfType === 'table' || allText.includes('table')) {
    targetType = 'Table';
    targetClass = 'Table';
    targetCategory = 'Criteria';
    targetOriginalName = 'Table';
  }
  // 15. Fallback for custom / existing nodes: preserve their identity!
  else if (name && !name.toLowerCase().includes('ai agent') && name !== 'Agent') {
    targetType = nodeType || name;
    targetClass = nodeClass || name.replace(/\s+/g, '_');
    targetCategory = d.category || CANONICAL_CATEGORIES[targetType] || 'Actions';
    targetOriginalName = originalName || targetType;
  }
  // 16. Agents (Default / Catch-all for legacy generic Agent)
  else {
    targetType = 'Agent';
    targetClass = 'Agent';
    targetCategory = d.category === 'Agents' ? 'Agents' : 'Agent';
    targetOriginalName = 'Agent';
  }

  // Ensure category matches canonical definition
  if (CANONICAL_CATEGORIES[targetType]) {
    targetCategory = CANONICAL_CATEGORIES[targetType];
  }

  // Handle label and name
  const finalLabel = LEGACY_DEFAULT_NAMES[label] || label || targetType;
  const finalName = LEGACY_DEFAULT_NAMES[name] || name || targetType;

  // Specific parameters normalization for Workflow Timer
  let updatedParams = { ...(d.parameters || {}) };
  if (targetType === 'Workflow Timer') {
    updatedParams = {
      timerMode: 'interval',
      intervalValue: updatedParams.intervalValue !== undefined ? updatedParams.intervalValue : 2,
      intervalUnit: updatedParams.intervalUnit || 'seconds',
      remainingSeconds: updatedParams.remainingSeconds !== undefined ? updatedParams.remainingSeconds : 2,
      ...updatedParams
    };
  }

  return {
    ...n,
    data: {
      ...d,
      nodeType: targetType,
      nodeClass: targetClass,
      originalName: targetOriginalName,
      category: targetCategory,
      name: finalName,
      label: finalLabel,
      parameters: updatedParams
    }
  };
}

export function normalizeWorkflowNodes(nodesList: any[]): any[] {
  if (!Array.isArray(nodesList)) return [];
  return nodesList.map(n => normalizeWorkflowNode(n));
}
