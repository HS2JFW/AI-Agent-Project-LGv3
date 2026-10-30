import { DEFAULT_AGENT_NODES } from '../constants/defaultWorkflow';
import { DRAGGABLE_TEMPLATES } from '../constants/sidebarMenus';
import type { Node, Edge } from 'reactflow';

export const getNodeClass = (n?: Node | null): string => {

    if (!n || !n.data) return '';

    const params = n.data.parameters || {};



    // 1. Parameter-based self-healing for Big Data & Analytics nodes

    if ('filePattern' in params && 'compression' in params) return 'Polars_Parquet_Converter';

    if ('executionMode' in params && 'statementTimeout' in params) return 'DuckDB_Virtual_Lake';

    if ('businessObjective' in params && 'team' in params) {

      if (n.data.name?.includes('Container') || n.type === 'containerNode') return 'Multi-Agent_Pipeline_Container';

      return 'Autonomous_Big_Data_Analyst';

    }



    // 2. Specific Big Data Agent Roles self-healing

    const roleLow = (n.data.role || params.role || '').toLowerCase();

    const promptLow = (n.data.prompt || params.prompt || '').toLowerCase();

    const nameLow = (n.data.name || '').toLowerCase();

    const labelLow = (n.data.label || '').toLowerCase();

    const origLow = (n.data.originalName || '').toLowerCase();

    const combinedAgentText = [nameLow, labelLow, origLow, roleLow, promptLow].join(' ');



    if (combinedAgentText.includes('planner')) return 'Planner_Agent';

    if (combinedAgentText.includes('sql engineer') || combinedAgentText.includes('critic')) return 'SQL_Engineer_&_Critic';

    if (combinedAgentText.includes('domain specialist') || (n.data.category === 'Agents' && combinedAgentText.includes('specialist'))) return 'Domain_Specialist';

    if (combinedAgentText.includes('synthesizer') || (n.data.category === 'Agents' && combinedAgentText.includes('executive'))) return 'Executive_Synthesizer';



    if (n.data.nodeClass && n.data.nodeClass !== 'Agent') return n.data.nodeClass.replace(/\s+/g, '_');

    if (n.data.nodeType && n.data.nodeType !== 'Agent') return n.data.nodeType.replace(/\s+/g, '_');

    if (n.data.originalName && n.data.originalName !== 'Agent') return n.data.originalName.replace(/\s+/g, '_');

    if (n.data.type && n.data.type !== 'customNode' && n.data.type !== 'containerNode' && n.data.type !== 'logicNode') return n.data.type.replace(/\s+/g, '_');

    if (n.data.parameters) {

      if ('agentOutputsTable' in n.data.parameters && 'pdfUrls' in n.data.parameters) return 'Agent';

      if ('pdfQueue' in n.data.parameters && 'bucketName' in n.data.parameters) return 'PDF_Queue';

      if ('txtQueue' in n.data.parameters && 'bucketName' in n.data.parameters) return 'TXT_Queue';

      if ('zipQueue' in n.data.parameters && 'bucketName' in n.data.parameters) return 'Zip_Queue';

      if ('graphEndpoint' in n.data.parameters || 'graphQuery' in n.data.parameters) return 'Graph_RAG';

      if ('dbConnectionMode' in n.data.parameters) return 'DB';

      if ('fallbackPdfUrls' in n.data.parameters || ('pdfUrls' in n.data.parameters && !('agentOutputsTable' in n.data.parameters))) return 'Pdfs_Loader';

      if ('extractFormat' in n.data.parameters) return 'Extract';

      if ('dedupKey' in n.data.parameters) return 'De_duplicate_Text';

      if ('jsonSchema' in n.data.parameters) return 'Structured_Parse_JSON';

      if ('stateOutput' in n.data.parameters) return 'State';

      if ('cronExpression' in n.data.parameters || 'timerInterval' in n.data.parameters) return 'Timer';

      if ('apiMethod' in n.data.parameters && 'incrementalKey' in n.data.parameters) return 'API_Incremental';

      if ('apiMethod' in n.data.parameters) return 'API_Connector';

      if ('jsonPath' in n.data.parameters) return 'JSON_Connector';

    }

    if (n.data.name === 'JSON Connector List' || n.data.label === 'JSON Connector List') {

      return 'JSON_Connector_List';

    }

    const fallback = n.data.name || n.data.label || '';

    return fallback.replace(/\s+/g, '_');

  };



export const isWorkflowTimerNode = (n?: Node | null): boolean => {

    if (!n || !n.data) return false;

    const type = (n.data.nodeType || n.data.nodeClass || '').toLowerCase().replace(/_/g, ' ');

    if (type === 'workflow timer') return true;

    const name = (n.data.name || '').toLowerCase().replace(/_/g, ' ');

    const label = (n.data.label || '').toLowerCase().replace(/_/g, ' ');

    const cat = (n.data.category || '').toLowerCase().replace(/_/g, ' ');

    return name === 'workflow timer' || label === 'workflow timer' || cat === 'workflow timer';

  };



export const isRegularTimerNode = (n?: Node | null): boolean => {

    if (!n || !n.data) return false;

    if (isWorkflowTimerNode(n)) return false;

    const type = (n.data.nodeType || n.data.nodeClass || getNodeClass(n) || '').toLowerCase().replace(/_/g, ' ');

    if (type === 'timer') return true;

    const name = (n.data.name || '').toLowerCase().replace(/_/g, ' ');

    const label = (n.data.label || '').toLowerCase().replace(/_/g, ' ');

    const cat = (n.data.category || '').toLowerCase().replace(/_/g, ' ');

    return name === 'timer' || label === 'timer' || (cat === 'actions' && type === 'timer');

  };



export const isProtectedTimerNode = (n?: Node | null): boolean => {

    if (!n || !n.data) return false;

    if (isWorkflowTimerNode(n)) return false;

    return n.data.isProtected === true || n.deletable === false;

  };



export const isTargetAgentNode = (n?: Node | null): boolean => {

    if (!n || !n.data) return false;

    const nodeType = (n.data.nodeType || getNodeClass(n) || '').toLowerCase().replace(/_/g, ' ');

    const name = (n.data.name || '').toLowerCase().replace(/_/g, ' ');

    const label = (n.data.label || '').toLowerCase().replace(/_/g, ' ');

    const nodeClass = (n.data.nodeClass || '').toLowerCase().replace(/_/g, ' ');



    const isImageNode = nodeType === 'pdf to image agent' || nodeType === 'pdf to base64 agent' ||

                        name.includes('pdf to image agent') || label.includes('pdf to image agent') || nodeClass.includes('pdf to image agent') ||

                        name.includes('pdf to base64 agent') || label.includes('pdf to base64 agent') || nodeClass.includes('pdf to base64 agent') ||

                        name.includes('agent pdfs image') || label.includes('agent pdfs image') || nodeClass.includes('agent pdfs image') ||

                        name.includes('ocr');

                        

    const isDbNode = nodeType === 'agent db' || name.includes('agent db') || label.includes('agent db') || nodeClass.includes('agent db');

    const isAuditNode = nodeType === 'agent audit' || name.includes('agent audit') || label.includes('agent audit') || nodeClass.includes('agent audit');

    const isPdfNode = (nodeType === 'agent' || name.includes('agent') || label.includes('agent') || nodeClass.includes('agent')) && !isImageNode && !isDbNode && !isAuditNode;



    return isImageNode || isPdfNode || isDbNode || isAuditNode;

  };



export const getParentMaxListForNode = (targetNodeId: string, currentNodes: Node[], currentEdges: Edge[]): { parentMax: number, parentKey: string, parentName: string } => {

    const incomingEdges = currentEdges.filter(e => e.target === targetNodeId);

    let parentMax = 0;

    let parentKey = '';

    let parentName = '';



    incomingEdges.forEach(e => {

      const pNode = currentNodes.find(n => n.id === e.source);

      if (!pNode || !pNode.data) return;

      const pParams = pNode.data.parameters || {};

      

      const q = pParams.pdfQueue || pParams.txtQueue || pParams.zipQueue || pParams.table;

      let count = 0;

      if (Array.isArray(q)) count = q.length;

      else if (typeof q === 'object' && q !== null) count = Object.keys(q).length;

      

      const aOut = pParams.agentOutputsTable;

      let aCount = 0;

      if (Array.isArray(aOut)) aCount = aOut.length;

      else if (typeof aOut === 'object' && aOut !== null) aCount = Object.keys(aOut).length;



      const effectiveCount = Math.max(count, aCount, Number(pParams.queueLength) || 0, Number(pParams.previous_max) || 0);

      if (effectiveCount > parentMax) {

        parentMax = effectiveCount;

        parentKey = pNode.id;

        parentName = pNode.data.label || pNode.data.name || pNode.id;

      }

    });



    return { parentMax, parentKey, parentName };

  };



export const getChildCompletedCountForNode = (node: Node): number => {

    const params = node.data?.parameters || {};

    const rawOutputs = params.agentOutputsTable || params.agentResultQueue;

    let count = 0;

    if (typeof rawOutputs === 'object' && !Array.isArray(rawOutputs) && rawOutputs !== null) {

      count = Object.keys(rawOutputs).length;

    } else if (Array.isArray(rawOutputs)) {

      count = rawOutputs.length;

    }

    return Math.max(count, Number(params.currentIndex) || 0);

  };


export const inferCanonicalNodeType = (n: any): string => {

    if (!n) return 'Agent';

    const params = n.data?.parameters || {};



    // 0. Parameter-based self-healing first (highest fidelity):

    if ('filePattern' in params && 'compression' in params) return 'Polars Parquet Converter';

    if ('executionMode' in params && 'statementTimeout' in params) return 'DuckDB Virtual Lake';

    if ('businessObjective' in params && 'team' in params) {

      if (n.data?.name?.includes('Container') || n.type === 'containerNode') return 'Multi-Agent Pipeline Container';

      return 'Autonomous Big Data Analyst';

    }



    const explicitType = n.data?.nodeType;

    if (explicitType && typeof explicitType === 'string' && explicitType.trim() !== '') {

      const raw = explicitType.trim();

      const low = raw.toLowerCase();

      // Big Data & Analytics & Datasets & Agents

      if (low === 'polars parquet converter' || low.includes('polars') || low.includes('parquet converter')) return 'Polars Parquet Converter';

      if (low === 'duckdb virtual lake' || low === 'duckdb query engine' || low.includes('duckdb')) return 'DuckDB Virtual Lake';

      if (low === 'autonomous big data analyst' || low.includes('big data analyst') || low.includes('big_data_analyst')) return 'Autonomous Big Data Analyst';

      if (low === 'multi-agent pipeline container' || low.includes('pipeline container')) return 'Multi-Agent Pipeline Container';

      if (low === 'planner agent' || low === 'planner') return 'Planner Agent';

      if (low === 'sql engineer & critic' || low.includes('sql engineer') || low.includes('critic')) return 'SQL Engineer & Critic';

      if (low === 'domain specialist' || low.includes('domain specialist')) return 'Domain Specialist';

      if (low === 'executive synthesizer' || low.includes('synthesizer')) return 'Executive Synthesizer';



      if (low === 'agent db' || low === 'ai agent db') return 'Agent DB';

      if (low === 'agent audit' || low === 'ai agent pdfs audit' || low === 'ai agent audit') return 'Agent Audit';

      if (low === 'agent' || low === 'ai agent' || low === 'ai agent pdfs' || low === 'ai agent pdf' || low === 'ai agent zip' || low === 'ai agent pdfs loop' || low === 'ai agent api pdfs' || low === 'ai agent api') return 'Agent';

      if (low === 'pdf to image agent' || low === 'ai agent pdfs image' || low === 'ocr pdfs' || low === 'pdf to image') return 'PDF to Image Agent';

      if (low === 'pdf to base64 agent' || low === 'ai agent pdfs base64' || low === 'pdf to base64') return 'PDF to Base64 Agent';

      if (low === 'workflow timer') return 'Workflow Timer';

      if (low === 'timer') return 'Timer';

      if (low === 'api incremental' || low === 'api connector') return 'API Incremental';

      if (low === 'graph rag' || low === 'graph_rag' || low.includes('graph rag') || low.includes('graph_rag')) return 'Graph RAG';

      if (low === 'db' || low === 'database' || low === 'supabase' || low === 'vector db') return 'DB';

      if (low === 'page' || low === 'mark it down' || low === 'markitdown') return 'Page';

      if (low === 'storage') return 'Storage';

      if (low === 'json connector' || low === 'json connector list' || low.includes('json')) return 'JSON Connector';

      if (low === 'pdf queue') return 'PDF Queue';

      if (low === 'txt queue') return 'TXT Queue';

      if (low === 'zip queue') return 'Zip Queue';

      if (low === 'gmail') return 'Gmail';

      if (low === 'line') return 'Line';

      if (low === 'mobile message') return 'Mobile Message';

      if (low === 'rubric') return 'Rubric';

      if (low === 'multi-criteria analysis' || low === 'mca' || low.includes('multi-criteria')) return 'Multi-Criteria Analysis';

      if (low === 'sample') return 'Sample';

      if (low === 'table') return 'Table';

      return raw;

    }



    const nodeClass = (n.data?.nodeClass || '').trim();

    const originalName = (n.data?.originalName || '').trim();

    const name = (n.data?.name || '').trim();

    const label = (n.data?.label || '').trim();

    const rfType = (n.type || '').trim();

    const category = (n.data?.category || '').trim();

    const allText = [nodeClass, originalName, name, label].join(' ').toLowerCase();



    // Big Data & Analytics checking:

    if (allText.includes('polars') || allText.includes('parquet converter')) return 'Polars Parquet Converter';

    if (allText.includes('duckdb')) return 'DuckDB Virtual Lake';

    if (allText.includes('autonomous') || allText.includes('big data analyst') || allText.includes('big_data_analyst')) return 'Autonomous Big Data Analyst';

    if (allText.includes('pipeline container') || allText.includes('pipeline_container') || rfType === 'containerNode') return 'Multi-Agent Pipeline Container';



    // Agents team checking:

    if (allText.includes('planner')) return 'Planner Agent';

    if (allText.includes('sql engineer') || allText.includes('critic')) return 'SQL Engineer & Critic';

    if (allText.includes('domain specialist') || (category === 'Agents' && allText.includes('specialist'))) return 'Domain Specialist';

    if (allText.includes('synthesizer') || (category === 'Agents' && allText.includes('executive'))) return 'Executive Synthesizer';



    // 1. Timers

    if (isWorkflowTimerNode(n) || nodeClass === 'Workflow Timer' || name === 'Workflow Timer' || label === 'Workflow Timer') {

      return 'Workflow Timer';

    }

    if (nodeClass === 'Timer' || name === 'Timer' || label === 'Timer' || (name.toLowerCase().includes('timer') && !name.toLowerCase().includes('workflow'))) {

      return 'Timer';

    }

    // 2. OCR Agents

    if (nodeClass.includes('Base64') || originalName.includes('Base64') || name.includes('Base64') || label.includes('Base64')) {

      return 'PDF to Base64 Agent';

    }

    if (nodeClass.includes('Image') || originalName.includes('Image') || name.includes('Image') || label.includes('Image')) {

      return 'PDF to Image Agent';

    }

    // 3. Agent DB

    if (nodeClass.includes('Agent DB') || originalName.includes('Agent DB') || name.includes('Agent DB') || label.includes('Agent DB') ||

        nodeClass.includes('AI Agent DB') || originalName.includes('AI Agent DB') || name.includes('AI Agent DB') || label.includes('AI Agent DB')) {

      return 'Agent DB';

    }

    // 4. Agent Audit

    if (nodeClass.includes('Audit') || originalName.includes('Audit') || name.includes('Audit') || label.includes('Audit')) {

      return 'Agent Audit';

    }

    // 5. Queues

    if (nodeClass === 'PDF Queue' || name === 'PDF Queue' || originalName === 'PDF Queue' || label === 'PDF Queue') return 'PDF Queue';

    if (nodeClass === 'TXT Queue' || name === 'TXT Queue' || originalName === 'TXT Queue' || label === 'TXT Queue') return 'TXT Queue';

    if (nodeClass === 'Zip Queue' || name === 'Zip Queue' || originalName === 'Zip Queue' || label === 'Zip Queue') return 'Zip Queue';

    // 6. Data Sources / Actions

    if (nodeClass === 'API Incremental' || originalName === 'API Incremental' || name === 'API Incremental' || label === 'API Incremental' || name === 'API Connector' || label === 'API Connector') return 'API Incremental';

    if (nodeClass === 'Graph RAG' || nodeClass === 'Graph_RAG' || originalName === 'Graph RAG' || name === 'Graph RAG' || label === 'Graph RAG' || name.toLowerCase().includes('graph rag')) return 'Graph RAG';

    if (nodeClass === 'DB' || originalName === 'DB' || name === 'DB' || label === 'DB' || name === 'Database' || label === 'Database') return 'DB';

    if (nodeClass === 'Page' || originalName === 'Page' || name === 'Page' || label === 'Page') return 'Page';

    if (nodeClass === 'Storage' || originalName === 'Storage' || name === 'Storage' || label === 'Storage') return 'Storage';

    if (nodeClass === 'JSON Connector' || originalName === 'JSON Connector' || name === 'JSON Connector' || label === 'JSON Connector' || name.toLowerCase().includes('json')) return 'JSON Connector';

    // 7. Notifications

    if (nodeClass === 'Gmail' || originalName === 'Gmail' || name === 'Gmail' || label === 'Gmail') return 'Gmail';

    if (nodeClass.toLowerCase() === 'line' || originalName.toLowerCase() === 'line' || name.toLowerCase() === 'line' || label.toLowerCase() === 'line') return 'Line';

    if (nodeClass.toLowerCase().includes('mobile') || originalName.toLowerCase().includes('mobile') || name.toLowerCase().includes('mobile') || label.toLowerCase().includes('mobile')) return 'Mobile Message';

    // 8. Criteria

    if (rfType === 'rubric' || name === 'Rubric' || label === 'Rubric') return 'Rubric';

    if (rfType === 'mca' || name === 'Multi-Criteria Analysis' || label === 'Multi-Criteria Analysis') return 'Multi-Criteria Analysis';

    if (rfType === 'sample' || name === 'Sample' || label === 'Sample') return 'Sample';

    if (rfType === 'table' || name === 'Table' || label === 'Table') return 'Table';



    // 9. Legacy / Original Agents

    if (category === 'Agent' || nodeClass.toLowerCase() === 'agent' || name.toLowerCase() === 'agent' || label.toLowerCase() === 'agent') {

      return 'Agent';

    }



    // Preserve custom node name if present

    if (name && name !== 'Agent') return name;



    return 'Agent';

  };



export const sanitizeLoadedNodes = (nodesList: any[]) => {

    const sanitized = (nodesList || []).map((n: any, idx: number) => {

      const position = n.position && typeof n.position.x === 'number' && typeof n.position.y === 'number'

        ? n.position

        : { x: 150 + idx * 240, y: 150 };



      const canonicalType = inferCanonicalNodeType(n);



      const isWfTimer = canonicalType === 'Workflow Timer' || isWorkflowTimerNode(n);

      if (isWfTimer) {

        return {

          ...n,

          position,

          deletable: true,

          data: {

            ...n.data,

            nodeType: 'Workflow Timer',

            nodeClass: 'Workflow_Timer',

            originalName: 'Workflow Timer',

            name: n.data?.name || 'Workflow Timer',

            label: n.data?.label || 'Workflow Timer',

            category: 'Actions',

            isProtected: false,

            parameters: {

              timerMode: 'interval',

              intervalValue: n.data?.parameters?.intervalValue !== undefined ? n.data?.parameters?.intervalValue : 2,

              intervalUnit: n.data?.parameters?.intervalUnit || 'seconds',

              remainingSeconds: n.data?.parameters?.remainingSeconds !== undefined ? n.data?.parameters?.remainingSeconds : 2,

              ...n.data?.parameters

            }

          }

        };

      }



      if (n.data?.name === 'Extract' || n.data?.label === 'Extract') {

        return {

          ...n,

          position,

          data: {

            ...n.data,

            nodeType: canonicalType,

            parameters: {

              ...n.data?.parameters,

              extractedText: ''

            }

          }

        };

      }



      // Check category from DRAGGABLE_TEMPLATES

      let category: string | undefined = undefined;

      for (const sec of DRAGGABLE_TEMPLATES) {

        if (sec.items.some((item: any) => item.name === canonicalType)) {

          category = sec.category;

          break;

        }

      }

      if (!category) {

        category = n.data?.category;

      }



      // Preserve existing label or friendly name, while ensuring nodeType is canonical

      const currentLabel = n.data?.label !== undefined ? n.data?.label : n.data?.name;

      const finalLabel = (currentLabel === 'AI Agent PDFs' ? 'Agent' :

                          currentLabel === 'AI Agent PDFs Image' ? 'PDF to Image Agent' :

                          currentLabel === 'AI Agent PDFs Base64' ? 'PDF to Base64 Agent' :

                          currentLabel === 'AI Agent DB' ? 'Agent DB' :

                          currentLabel === 'AI Agent PDFs Audit' ? 'Agent Audit' :

                          (currentLabel && currentLabel !== 'Agent') ? currentLabel : canonicalType);



      const currentName = n.data?.name || canonicalType;

      const finalName = (currentName === 'AI Agent PDFs' ? 'Agent' :

                         currentName === 'AI Agent PDFs Image' ? 'PDF to Image Agent' :

                         currentName === 'AI Agent PDFs Base64' ? 'PDF to Base64 Agent' :

                         currentName === 'AI Agent DB' ? 'Agent DB' :

                         currentName === 'AI Agent PDFs Audit' ? 'Agent Audit' :

                         (currentName && currentName !== 'Agent') ? currentName : canonicalType);



      return {

        ...n,

        position,

        data: {

          ...n.data,

          nodeType: canonicalType,

          nodeClass: canonicalType.replace(/\s+/g, '_'),

          originalName: n.data?.originalName || canonicalType,

          category: category || n.data?.category || 'Actions',

          name: finalName,

          label: finalLabel

        }

      };

    });



    return sanitized;

  };


export const getAgentEdgeStyle = (source: string, target: string) => {
  if (target === 'agent-pm') {
    return { stroke: '#00F0FF', strokeWidth: 2.5 };
  }
  if (source === 'agent-audit' && target === 'agent-pm') {
    return { stroke: '#EF4444', strokeWidth: 2, strokeDasharray: '5,5' };
  }
  if (
    source === 'agent-audit' || 
    source.startsWith('deliverable') || 
    target.startsWith('notify') || 
    source.startsWith('notify')
  ) {
    return { stroke: '#10B981', strokeWidth: 2.5 };
  }
  return { stroke: '#8B5CF6', strokeWidth: 2.5 };
};

export const buildAgentNodesFromLogicNodes = (logicNodes: Node[]) => {
  const containers = DEFAULT_AGENT_NODES.filter(n => n.type === 'containerNode');
  const constructedNodes: Node[] = [...containers];
  
  logicNodes.forEach((ln) => {
    let parentNode: string | undefined = undefined;
    let extent: 'parent' | undefined = undefined;
    let agentPosition = { ...ln.position };

    if (ln.data.category === 'Data Sources') {
      parentNode = 'container-sources';
      extent = 'parent';
      const currentSources = constructedNodes.filter(n => n.parentNode === 'container-sources');
      agentPosition = { x: 5, y: 40 + currentSources.length * 120 };
    } else if (ln.data.category === 'Notification') {
      parentNode = 'container-notifications';
      extent = 'parent';
      const currentNotifs = constructedNodes.filter(n => n.parentNode === 'container-notifications');
      agentPosition = { x: 5, y: 40 + currentNotifs.length * 120 };
    } else if (ln.data.category === 'Actions' || ln.data.category === 'Dataset') {
      parentNode = 'container-deliverables';
      extent = 'parent';
      const currentActions = constructedNodes.filter(n => n.parentNode === 'container-deliverables');
      agentPosition = { x: 10 + currentActions.length * 260, y: 45 };
    }

    constructedNodes.push({
      ...ln,
      parentNode,
      extent,
      position: agentPosition,
    });
  });

  return constructedNodes;
};

export const buildAgentEdgesFromLogicEdges = (logicEdges: Edge[]) => {
  return logicEdges.map(le => ({
    ...le,
    style: getAgentEdgeStyle(le.source, le.target)
  }));
};

export const cleanAgentNodesForSave = (agentNodes: any[]) => {
  return agentNodes.map((n: any) => {
    if (n.data?.parameters?.agentResultQueue) {
      const cleanParameters = { ...n.data.parameters };
      delete cleanParameters.agentResultQueue;
      return { ...n, data: { ...n.data, parameters: cleanParameters } };
    }
    return n;
  });
};
