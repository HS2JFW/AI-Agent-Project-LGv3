import React, { useState } from 'react';
import { Copy, RotateCcw, Eye } from 'lucide-react';

export interface ConnectorsAndProcessorsInspectorProps {
  selectedNode: any;
  updateSelectedNodeParameter: (field: string, value: any) => void;
  updateSelectedNodeData: (field: string, value: any) => void;
  updateDbConnectionParameter?: (key: string, val: any) => void;
  nodes: any[];
  setNodes: React.Dispatch<React.SetStateAction<any[]>>;
  edges: any[];
  selectedWorkflowId: string | null;
  aiModels: any[];
  openDialog: (type: 'agent_result' | 'pdf_queue' | 'json' | 'zip_queue' | 'txt_queue', filename: string, rawContent?: string) => void;
  isSelectedDbNode: boolean;
  isSelectedGraphRagNode: boolean;
  isSelectedApiConnectorNode: boolean;
  isSelectedApiIncrementalNode: boolean;
  isSelectedJsonConnectorNode: boolean;
  isSelectedJsonConnectorListNode: boolean;
  isSelectedPageNode: boolean;
  isSelectedStorageNode: boolean;
  isSelectedPdfsLoaderNode: boolean;
  isSelectedOcrPdfsNode: boolean;
  isSelectedExtractNode: boolean;
  isSelectedDeDuplicateNode: boolean;
  isSelectedStructuredParseNode: boolean;
  isSelectedStateNode: boolean;
  backendUrl?: string;
}

export const ConnectorsAndProcessorsInspector: React.FC<ConnectorsAndProcessorsInspectorProps> = ({
  selectedNode,
  updateSelectedNodeParameter,
  updateSelectedNodeData,
  updateDbConnectionParameter,
  nodes,
  setNodes,
  edges,
  selectedWorkflowId,
  aiModels,
  openDialog,
  isSelectedDbNode,
  isSelectedGraphRagNode,
  isSelectedApiConnectorNode,
  isSelectedApiIncrementalNode,
  isSelectedJsonConnectorNode,
  isSelectedJsonConnectorListNode,
  isSelectedPageNode,
  isSelectedStorageNode,
  isSelectedPdfsLoaderNode,
  isSelectedOcrPdfsNode,
  isSelectedExtractNode,
  isSelectedDeDuplicateNode,
  isSelectedStructuredParseNode,
  isSelectedStateNode,
  backendUrl,
}) => {
  const BACKEND_URL = backendUrl || import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';
  const [copiedNodeId, setCopiedNodeId] = useState<string | null>(null);
  void selectedWorkflowId;

  const handleUpdateDbConnParam = updateDbConnectionParameter || ((key: string, val: any) => {
    if (!selectedNode) return;
    const currentParams = selectedNode.data.parameters || {};
    const updatedParams = { ...currentParams, [key]: val };
    const mode = updatedParams.dbConnectionMode || 'localhost';
    if (mode === 'localhost') {
      const filePath = updatedParams.dbFilePath || 'workflow_app.db';
      updatedParams.connectionString = `sqlite:///${filePath}`;
    }
    updateSelectedNodeData('parameters', updatedParams);
  });

  // Internal alias for updateDbConnectionParameter in JSX
  const updateDbConnectionParameterInternal = handleUpdateDbConnParam;

  if (
    !isSelectedDbNode &&
    !isSelectedGraphRagNode &&
    !isSelectedApiConnectorNode &&
    !isSelectedApiIncrementalNode &&
    !isSelectedJsonConnectorNode &&
    !isSelectedJsonConnectorListNode &&
    !isSelectedPageNode &&
    !isSelectedStorageNode &&
    !isSelectedPdfsLoaderNode &&
    !isSelectedOcrPdfsNode &&
    !isSelectedExtractNode &&
    !isSelectedDeDuplicateNode &&
    !isSelectedStructuredParseNode &&
    !isSelectedStateNode
  ) {
    return null;
  }

  return (
    <>
                {/* DB Connection String and SQL Query (Specific to DB / Database / Supabase nodes) */}

                {isSelectedDbNode && (

                  <>

                    {/* Connection Mode Dropdown */}

                    <div className="space-y-1.5 mb-2">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Connection Mode

                      </label>

                      <select

                        value={selectedNode.data.parameters?.dbConnectionMode || 'localhost'}

                        onChange={(e) => updateDbConnectionParameterInternal('dbConnectionMode', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text"

                      >

                        <option value="localhost">Localhost</option>

                        <option value="http">HTTP</option>

                      </select>

                    </div>



                    {selectedNode.data.parameters?.dbConnectionMode === 'http' ? (

                      // HTTP Mode Details: Connection String input only

                      <div className="space-y-1.5 mb-2">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Database Connection String

                        </label>

                        <input

                          type="text"

                          value={selectedNode.data.parameters?.connectionString || ''}

                          onChange={(e) => updateSelectedNodeParameter('connectionString', e.target.value)}

                          className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                          placeholder="e.g. postgresql://user:password@host:port/dbname?sslmode=require"

                        />

                      </div>

                    ) : (

                      // Localhost Mode Details: SQLite Database File Path input only

                      <div className="space-y-1.5 mb-2">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Database File Path

                        </label>

                        <input

                          type="text"

                          value={selectedNode.data.parameters?.dbFilePath || 'workflow_app.db'}

                          onChange={(e) => updateDbConnectionParameterInternal('dbFilePath', e.target.value)}

                          className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                          placeholder="e.g. workflow_app.db"

                        />

                      </div>

                    )}



                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        SQL Query

                      </label>

                      <textarea

                        value={selectedNode.data.parameters?.sqlQuery || ''}

                        onChange={(e) => updateSelectedNodeParameter('sqlQuery', e.target.value)}

                        rows={5}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2.5 px-3 rounded-lg text-cyber-text resize-none leading-relaxed font-mono"

                        placeholder="e.g. SELECT * FROM workflows LIMIT 5;"

                      />

                    </div>

                    <div className="space-y-1.5">

                      <div className="flex items-center justify-between">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Query Result

                        </label>

                        {selectedNode.data.parameters?.dbOutput && (

                          <button

                            onClick={() => updateSelectedNodeParameter('dbOutput', '')}

                            className="text-[9px] font-bold uppercase tracking-wider text-cyber-neon hover:text-cyber-neon-dim transition-all cursor-pointer bg-transparent border-none outline-none focus:outline-none"

                            title="Clear query results"

                          >

                            Clear Result

                          </button>

                        )}

                      </div>

                      <textarea

                        readOnly

                        value={selectedNode.data.parameters?.dbOutput || ''}

                        rows={6}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2.5 px-3 rounded-lg text-cyber-text resize-y leading-relaxed font-mono overflow-y-auto"

                        placeholder="Query results will appear here..."

                      />

                    </div>

                  </>

                )}



                {/* Graph RAG configuration fields */}

                {isSelectedGraphRagNode && (

                  <>

                    <div className="space-y-1.5 mb-2">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Graph Database Type

                      </label>

                      <select

                        value={selectedNode.data.parameters?.databaseType || 'neo4j'}

                        onChange={(e) => updateSelectedNodeParameter('databaseType', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text"

                      >

                        <option value="neo4j">Neo4j (Bolt/HTTP)</option>

                        <option value="memgraph">Memgraph</option>

                        <option value="kuzu">Kùzu DB</option>

                        <option value="networkx">NetworkX / In-Memory</option>

                      </select>

                    </div>



                    <div className="space-y-1.5 mb-2">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Graph Endpoint URL

                      </label>

                      <input

                        type="text"

                        value={selectedNode.data.parameters?.graphEndpoint || ''}

                        onChange={(e) => updateSelectedNodeParameter('graphEndpoint', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                        placeholder="e.g. bolt://localhost:7687 or http://localhost:7474"

                      />

                    </div>



                    <div className="space-y-1.5 mb-2">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Cypher / Graph Query

                      </label>

                      <textarea

                        value={selectedNode.data.parameters?.graphQuery || ''}

                        onChange={(e) => updateSelectedNodeParameter('graphQuery', e.target.value)}

                        rows={4}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2.5 px-3 rounded-lg text-cyber-text resize-none leading-relaxed font-mono"

                        placeholder="e.g. MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 25"

                      />

                    </div>



                    <div className="grid grid-cols-2 gap-2 mb-2">

                      <div className="space-y-1.5">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Top K Entities

                        </label>

                        <input

                          type="number"

                          value={selectedNode.data.parameters?.topK !== undefined ? selectedNode.data.parameters.topK : 5}

                          onChange={(e) => updateSelectedNodeParameter('topK', Number(e.target.value))}

                          className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                        />

                      </div>

                      <div className="space-y-1.5">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Similarity Threshold

                        </label>

                        <input

                          type="number"

                          step="0.05"

                          min="0"

                          max="1"

                          value={selectedNode.data.parameters?.similarityThreshold !== undefined ? selectedNode.data.parameters.similarityThreshold : 0.7}

                          onChange={(e) => updateSelectedNodeParameter('similarityThreshold', Number(e.target.value))}

                          className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                        />

                      </div>

                    </div>



                    <div className="space-y-1.5">

                      <div className="flex items-center justify-between">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Graph Output / Result

                        </label>

                        {selectedNode.data.parameters?.output && (

                          <button

                            onClick={() => updateSelectedNodeParameter('output', '')}

                            className="text-[9px] font-bold uppercase tracking-wider text-cyber-neon hover:text-cyber-neon-dim transition-all cursor-pointer bg-transparent border-none outline-none focus:outline-none"

                            title="Clear graph result"

                          >

                            Clear

                          </button>

                        )}

                      </div>

                      <textarea

                        readOnly

                        value={selectedNode.data.parameters?.output || (selectedNode.data.parameters?.graphData ? JSON.stringify(selectedNode.data.parameters.graphData, null, 2) : '')}

                        rows={6}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2.5 px-3 rounded-lg text-cyber-text resize-y leading-relaxed font-mono overflow-y-auto"

                        placeholder="Graph query results and entity subgraphs will appear here after execution..."

                      />

                    </div>

                  </>

                )}



                {/* API Connector configuration fields */}

                {isSelectedApiConnectorNode && (

                  <>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        API Endpoint URL

                      </label>

                      <input

                        type="text"

                        value={selectedNode.data.parameters?.apiUrl || ''}

                        onChange={(e) => updateSelectedNodeParameter('apiUrl', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                        placeholder="e.g. https://bqysaldeijwvnhtcfiuj.supabase.co/rest/v1/pdf_table"

                      />

                    </div>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Authorization (Header)

                      </label>

                      <input

                        type="text"

                        value={selectedNode.data.parameters?.authHeader || ''}

                        onChange={(e) => updateSelectedNodeParameter('authHeader', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                        placeholder="e.g. Bearer sb_publishable_tzQOB9wms5o9q19pA6vFDQ_OK439Ism"

                      />

                    </div>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Public Anon Key / API Key

                      </label>

                      <input

                        type="text"

                        value={selectedNode.data.parameters?.anonKeyHeader || ''}

                        onChange={(e) => updateSelectedNodeParameter('anonKeyHeader', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                        placeholder="e.g. sb_publishable_tzQOB9wms5o9q19pA6vFDQ_OK439Ism"

                      />

                    </div>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Function Call

                      </label>

                      <input

                        type="text"

                        value={selectedNode.data.parameters?.functionName || ''}

                        onChange={(e) => updateSelectedNodeParameter('functionName', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                        placeholder="e.g. GetPDF()"

                      />

                    </div>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Parameters

                      </label>

                      <input

                        type="text"

                        value={selectedNode.data.parameters?.apiParameters || ''}

                        onChange={(e) => updateSelectedNodeParameter('apiParameters', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                        placeholder="e.g. select=number,date,file_url"

                      />

                    </div>

                    <div className="space-y-1.5">

                      <div className="flex items-center justify-between">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          API Output

                        </label>

                        {selectedNode.data.parameters?.apiOutput && (

                          <button

                            onClick={() => updateSelectedNodeParameter('apiOutput', '')}

                            className="text-[9px] font-bold uppercase tracking-wider text-cyber-neon hover:text-cyber-neon-dim transition-all cursor-pointer bg-transparent border-none outline-none focus:outline-none"

                            title="Clear API output preview"

                          >

                            Clear

                          </button>

                        )}

                      </div>

                      <textarea

                        readOnly

                        value={selectedNode.data.parameters?.apiOutput || ''}

                        rows={8}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2.5 px-3 rounded-lg text-cyber-text resize-y leading-relaxed font-mono overflow-y-auto"

                        placeholder="API Response output will appear here after execution..."

                      />

                    </div>

                  </>

                )}



                {/* API Incremental configuration fields */}

                {isSelectedApiIncrementalNode && (

                  <>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        API Endpoint URL

                      </label>

                      <input

                        type="text"

                        value={selectedNode.data.parameters?.apiUrl || ''}

                        onChange={(e) => updateSelectedNodeParameter('apiUrl', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                        placeholder="e.g. https://bqysaldeijwvnhtcfiuj.supabase.co/rest/v1/pdf_table"

                      />

                    </div>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Authorization (Header)

                      </label>

                      <input

                        type="text"

                        value={selectedNode.data.parameters?.authHeader || ''}

                        onChange={(e) => updateSelectedNodeParameter('authHeader', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                        placeholder="e.g. Bearer sb_publishable_tzQOB9wms5o9q19pA6vFDQ_OK439Ism"

                      />

                    </div>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Public Anon Key / API Key

                      </label>

                      <input

                        type="text"

                        value={selectedNode.data.parameters?.anonKeyHeader || ''}

                        onChange={(e) => updateSelectedNodeParameter('anonKeyHeader', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                        placeholder="e.g. sb_publishable_tzQOB9wms5o9q19pA6vFDQ_OK439Ism"

                      />

                    </div>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Function Call

                      </label>

                      <input

                        type="text"

                        value={selectedNode.data.parameters?.functionName || ''}

                        onChange={(e) => updateSelectedNodeParameter('functionName', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                        placeholder="e.g. GetPDF_Incremental()"

                      />

                    </div>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Parameters

                      </label>

                      <input

                        type="text"

                        value={selectedNode.data.parameters?.apiParameters || ''}

                        onChange={(e) => updateSelectedNodeParameter('apiParameters', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                        placeholder="e.g. select=number,date,file_url"

                      />

                    </div>

                    <div className="flex items-end space-x-2.5">

                      <div className="flex-1 space-y-1.5">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Round (Automatic)

                        </label>

                        <input

                          type="number"

                          readOnly

                          value={selectedNode.data.parameters?.round !== undefined ? selectedNode.data.parameters.round : 1}

                          className="w-full text-xs bg-cyber-dark border border-cyber-border py-2 px-3 rounded-lg text-cyber-muted font-mono cursor-not-allowed"

                          title="This value increments automatically. Use Reset to start over."

                        />

                      </div>

                      

                      <button

                        type="button"

                        onClick={() => {

                          updateSelectedNodeParameter('round', 1);

                          setNodes((nds) => nds.map((n) => {

                            const name = n.data.name?.toLowerCase() || '';

                            const label = n.data.label?.toLowerCase() || '';

                            const type = n.type?.toLowerCase() || '';

                            const isTimer = name.includes('timer') || label.includes('timer') || type.includes('timer');

                            if (isTimer) {

                              return {

                                ...n,

                                data: {

                                  ...n.data,

                                  parameters: {

                                    ...n.data.parameters,

                                    runCount: 0

                                  }

                                }

                              };

                            }

                            return n;

                          }));

                        }}

                        className="p-2 rounded-lg bg-cyber-dark border border-cyber-border hover:border-cyber-neon hover:text-cyber-neon text-cyber-text transition-all cursor-pointer flex items-center justify-center h-[34px] w-[34px] mb-0.5 focus:outline-none"

                        title="Reset round to 1"

                      >

                        <RotateCcw className="w-3.5 h-3.5" />

                      </button>



                      <div className="flex-1 space-y-1.5">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Row Size

                        </label>

                        <input

                          type="number"

                          min="1"

                          value={selectedNode.data.parameters?.row !== undefined ? selectedNode.data.parameters.row : 5}

                          onChange={(e) => updateSelectedNodeParameter('row', Math.max(1, Number(e.target.value)))}

                          className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                        />

                      </div>

                    </div>

                    <div className="space-y-1.5">

                      <div className="flex items-center justify-between">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          API Output

                        </label>

                        {selectedNode.data.parameters?.apiOutput && (

                          <button

                            onClick={() => updateSelectedNodeParameter('apiOutput', '')}

                            className="text-[9px] font-bold uppercase tracking-wider text-cyber-neon hover:text-cyber-neon-dim transition-all cursor-pointer bg-transparent border-none outline-none focus:outline-none"

                            title="Clear API output preview"

                          >

                            Clear

                          </button>

                        )}

                      </div>

                      <textarea

                        readOnly

                        value={selectedNode.data.parameters?.apiOutput || ''}

                        rows={8}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2.5 px-3 rounded-lg text-cyber-text resize-y leading-relaxed font-mono overflow-y-auto"

                        placeholder="API Response output will appear here after execution..."

                      />

                    </div>

                  </>

                )}



                {/* JSON Connector configuration fields */}

                {(isSelectedJsonConnectorNode || isSelectedJsonConnectorListNode) && (

                  <>

                    <div className="space-y-4">

                      {/* JSON Data Table (Moved to Top) */}

                      {isSelectedJsonConnectorListNode && (() => {

                        const jsonListTableRaw = selectedNode.data.parameters?.table || selectedNode.data.parameters?.agentOutputsTable || [];

                        const jsonListTable = Array.isArray(jsonListTableRaw) ? jsonListTableRaw : Object.values(jsonListTableRaw);

                        const isJsonListTableValid = Array.isArray(jsonListTable) && jsonListTable.length > 0;

                        let jsonListKeys: string[] = [];

                        if (isJsonListTableValid) {

                          const firstItem = jsonListTable[0];

                          if (typeof firstItem === 'object' && firstItem !== null) {

                            jsonListKeys = Object.keys(firstItem);

                          }

                        }

                        return (

                          <div className="space-y-1.5 pb-2 border-b border-cyber-border border-opacity-50">

                            <div className="flex items-center justify-between">

                              <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block flex-1">

                                JSON Data Table ({jsonListTable.length || 0})

                              </label>

                            </div>

                            <div className="border border-cyber-border rounded-lg overflow-x-auto bg-cyber-dark bg-opacity-40 max-h-[300px]">

                              <table className="w-full text-left border-collapse whitespace-nowrap">

                                <thead>

                                  <tr className="bg-cyber-dark border-b border-cyber-border text-[8px] uppercase tracking-wider text-cyber-muted sticky top-0 z-10">

                                    <th className="py-2 px-3 text-center w-16 border-r border-cyber-border border-opacity-30 bg-cyber-dark">View</th>

                                    <th className="py-2 px-3 text-center w-12 border-r border-cyber-border border-opacity-30 bg-cyber-dark">ID</th>

                                    {jsonListKeys.map(k => (

                                      <th key={k} className="py-2 px-3 border-r border-cyber-border border-opacity-30 bg-cyber-dark">{k}</th>

                                    ))}

                                    {jsonListKeys.length === 0 && <th className="py-2 px-3 border-r border-cyber-border border-opacity-30 bg-cyber-dark">Data</th>}

                                  </tr>

                                </thead>

                                <tbody className="divide-y divide-cyber-border divide-opacity-35 text-[10px]">

                                  {isJsonListTableValid ? jsonListTable.map((row: any, idx: number) => {

                                    const isSelected = selectedNode.data.parameters?.select_row_index === idx || (selectedNode.data.parameters?.select_row_index === undefined && idx === 0);

                                    return (

                                    <tr 

                                        key={idx} 

                                        onClick={async () => {

                                          updateSelectedNodeParameter('select_row_index', idx);

                                          if (isSelectedJsonConnectorListNode) {

                                            const tableDict = selectedNode.data.parameters?.agentOutputsTable || {};

                                            const keyArr = Object.keys(tableDict);

                                            let fileName = tableDict[idx] || tableDict[idx.toString()] || tableDict[keyArr[idx]];

                                            if (fileName && typeof fileName === 'string') {

                                              try {

                                                const res = await fetch(`${BACKEND_URL}/api/files?file=${encodeURIComponent(fileName)}`);

                                                if (res.ok) {

                                                  const text = await res.text();

                                                  updateSelectedNodeParameter('jsonOutput', text);

                                                } else {

                                                  console.error("Failed to fetch file:", fileName);

                                                  updateSelectedNodeParameter('jsonOutput', JSON.stringify(row, null, 2));

                                                }

                                              } catch (e) {

                                                console.error("Error fetching file:", e);

                                                updateSelectedNodeParameter('jsonOutput', JSON.stringify(row, null, 2));

                                              }

                                            } else {

                                              updateSelectedNodeParameter('jsonOutput', JSON.stringify(row, null, 2));

                                            }

                                          } else {

                                              updateSelectedNodeParameter('jsonOutput', JSON.stringify(row, null, 2));

                                          }

                                        }}

                                        className={`cursor-pointer transition-colors ${isSelected ? 'bg-cyber-neon text-black font-bold' : 'hover:bg-cyber-light hover:bg-opacity-10 text-cyber-text'}`}

                                      >

                                      <td className="py-2 px-3 text-center border-r border-cyber-border border-opacity-30">

                                        <button

                                          type="button"

                                          onClick={(e) => {

                                            e.stopPropagation(); // prevent row click when clicking view

                                            if (typeof row === 'string' && (row.endsWith('.md') || row.endsWith('.txt') || row.endsWith('.json'))) {

                                              openDialog('agent_result', row);

                                            } else {

                                              const content = JSON.stringify(row, null, 2);

                                              openDialog('json', `row_${idx+1}.md`, content);

                                            }

                                          }}

                                          className="text-[9px] font-mono bg-cyber-dark hover:bg-cyber-light hover:bg-opacity-20 text-cyber-neon border border-cyber-border hover:border-cyber-neon px-1.5 py-0.5 rounded transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"

                                          title="View Full JSON Row"

                                        >

                                          <Eye className="w-2.5 h-2.5" /> View

                                        </button>

                                      </td>

                                      <td className="py-2 px-3 text-center font-mono font-bold text-[10px] text-cyber-muted border-r border-cyber-border border-opacity-30">{idx + 1}</td>

                                      {jsonListKeys.length > 0 ? jsonListKeys.map(k => (

                                        <td key={k} className="py-2 px-3 font-mono max-w-[250px] border-r border-cyber-border border-opacity-30" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>

                                          <span className="line-clamp-3">{typeof row[k] === 'object' ? JSON.stringify(row[k]) : String(row[k])}</span>

                                        </td>

                                      )) : (

                                        <td className="py-2 px-3 font-mono border-r border-cyber-border border-opacity-30" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>

                                          <span className="line-clamp-3">{typeof row === 'object' ? JSON.stringify(row) : String(row)}</span>

                                        </td>

                                      )}

                                    </tr>

                                  )}) : (

                                    <tr>

                                      <td colSpan={jsonListKeys.length + 2} className="py-4 text-center text-cyber-muted italic text-[10px]">

                                        No data yet. Execute workflow to generate JSON data table.

                                      </td>

                                    </tr>

                                  )}

                                </tbody>

                              </table>

                            </div>

                          </div>

                        );

                      })()}





                      {/* JSON Output Text Box */}

                      <div className="space-y-1.5 pt-2 border-t border-cyber-border border-opacity-35">

                        <div className="flex items-center justify-between">

                          <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                            JSON Output

                          </label>

                          {selectedNode.data.parameters?.jsonOutput && (

                            <button

                              onClick={() => updateSelectedNodeParameter('jsonOutput', '')}

                              className="text-[9px] font-bold uppercase tracking-wider text-cyber-neon hover:text-cyber-neon-dim transition-all cursor-pointer bg-transparent border-none outline-none focus:outline-none"

                              title="Clear JSON output preview"

                            >

                              Clear

                            </button>

                          )}

                        </div>

                        <textarea

                          readOnly

                          value={selectedNode.data.parameters?.jsonOutput || ''}

                          rows={12}

                          className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2.5 px-3 rounded-lg text-cyber-text resize-y leading-relaxed font-mono overflow-y-auto"

                          placeholder="Filtered JSON output will appear here after execution..."

                        />

                      </div>

                      {/* Retrieve JSON Button for JSON Connector List */}

                      {isSelectedJsonConnectorListNode && (

                        <button

                          type="button"

                          onClick={() => {

                            const incomingEdges = edges.filter(e => e.target === selectedNode.id);

                            if (incomingEdges.length === 0) {

                              alert("No parent node connected.");

                              return;

                            }

                            const parentNode = nodes.find(n => n.id === incomingEdges[0].source);

                            if (!parentNode) return;

                            

                            let resultData = null;

                            const params = parentNode.data?.parameters || {};

                            if (params.markitdownTable) resultData = params.markitdownTable;

                            else if (params.agentOutputsTable) resultData = params.agentOutputsTable;

                            else if (params.pdfQueue) resultData = params.pdfQueue;

                            else if (params.table) resultData = params.table;

                            else if (params.agentOutput) resultData = params.agentOutput;

                            else if (params.apiOutput) resultData = params.apiOutput;

                            else if (params.dbOutput) resultData = params.dbOutput;

                            else if (params.jsonOutput) resultData = params.jsonOutput;

                            else if (params.structuredJson) resultData = params.structuredJson;

                            else if (params.stateOutput) resultData = params.stateOutput;

                            else if (params.jsonText) resultData = params.jsonText;

                            else if (params.pdfUrls) resultData = params.pdfUrls;

                            

                            if (!resultData) {

                              alert("No result found in parent node yet. Please run the workflow first or add fields manually.");

                              return;

                            }

                            

                            try {

                              let jsonStr = '';

                              if (typeof resultData === 'string') {

                                jsonStr = resultData;

                              } else if (Array.isArray(resultData)) {

                                if (resultData.length > 0) {

                                  const firstRow = resultData[0];

                                  if (typeof firstRow === 'string') {

                                    jsonStr = firstRow;

                                  } else if (typeof firstRow === 'object' && firstRow !== null) {

                                    if (firstRow['.md']) jsonStr = firstRow['.md'];

                                    else if (firstRow.content) jsonStr = firstRow.content;

                                    else if (firstRow.markdown) jsonStr = firstRow.markdown;

                                    else jsonStr = JSON.stringify(firstRow);

                                  } else {

                                    jsonStr = JSON.stringify(firstRow);

                                  }

                                }

                              } else {

                                jsonStr = JSON.stringify(resultData);

                              }

                              

                              const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);

                              if (jsonMatch) {

                                jsonStr = jsonMatch[1];

                              }

                              

                              let parsed: any = null;

                              try {

                                parsed = JSON.parse(jsonStr);

                              } catch (e) {

                                // If parsing fails (e.g. raw markdown text), fallback to the original table structure

                                parsed = resultData;

                              }

                              

                              let keys: string[] = [];

                              if (Array.isArray(parsed) && parsed.length > 0) {

                                keys = Object.keys(parsed[0]);

                              } else if (typeof parsed === 'object' && parsed !== null) {

                                keys = Object.keys(parsed);

                              }

                              

                              if (keys.length > 0) {

                                updateSelectedNodeParameter('fields', keys);

                                updateSelectedNodeParameter('parsedDataPreview', parsed);

                                alert(`Successfully retrieved ${keys.length} fields.`);

                              } else {

                                alert("No JSON fields could be extracted.");

                              }

                            } catch (e: any) {

                              alert("Error retrieving fields: " + e.message);

                            }

                          }}

                          className="w-full px-3 py-2 bg-cyber-neon text-black font-bold text-xs rounded-lg hover:bg-opacity-80 transition-all cursor-pointer border-none outline-none flex items-center justify-center space-x-2 shadow-[0_0_4px_rgba(212,255,58,0.3)]"

                        >

                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>

                            <polyline points="7 10 12 15 17 10"></polyline>

                            <line x1="12" y1="15" x2="12" y2="3"></line>

                          </svg>

                          <span>Retrieve JSON</span>

                        </button>

                      )}



                      {/* Add Field Input & Button */}

                      <div className="space-y-1.5">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Add JSON Field

                        </label>

                        <div className="flex space-x-2">

                          <input

                            type="text"

                            id="new-field-input"

                            placeholder="e.g. url, email"

                            className="flex-1 text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                            onKeyDown={(e) => {

                              if (e.key === 'Enter') {

                                const input = e.currentTarget;

                                const val = input.value.trim();

                                if (val) {

                                  const currentFields = selectedNode.data.parameters?.fields || [];

                                  if (!currentFields.includes(val)) {

                                    updateSelectedNodeParameter('fields', [...currentFields, val]);

                                  }

                                  input.value = '';

                                }

                              }

                            }}

                          />

                          <button

                            type="button"

                            onClick={() => {

                              const input = document.getElementById('new-field-input') as HTMLInputElement;

                              const val = input?.value.trim();

                              if (val) {

                                  const currentFields = selectedNode.data.parameters?.fields || [];

                                  if (!currentFields.includes(val)) {

                                    updateSelectedNodeParameter('fields', [...currentFields, val]);

                                  }

                                  if (input) input.value = '';

                              }

                            }}

                            className="px-3 py-2 bg-cyber-neon text-black font-bold text-xs rounded-lg hover:bg-opacity-80 transition-all cursor-pointer border-none outline-none"

                          >

                            Add Field

                          </button>

                        </div>

                      </div>



                      {/* Fields Table */}

                      <div className="space-y-1.5">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Fields List

                        </label>

                        <div className="border border-cyber-border rounded-lg overflow-hidden bg-cyber-dark bg-opacity-40">

                          <table className="w-full text-xs text-left border-collapse">

                            <thead>

                              <tr className="border-b border-cyber-border bg-cyber-dark bg-opacity-80">

                                <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-cyber-muted w-8 text-center">View</th>

                                <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-cyber-muted">Field Name</th>

                                <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-cyber-muted text-right">Action</th>

                              </tr>

                            </thead>

                            <tbody>

                              {!(selectedNode.data.parameters?.fields && selectedNode.data.parameters.fields.length > 0) ? (

                                <tr>

                                  <td colSpan={3} className="py-3 px-3 text-center text-cyber-muted italic text-[11px]">

                                    No fields added yet.

                                  </td>

                                </tr>

                              ) : (

                                selectedNode.data.parameters.fields.map((field: string) => (

                                  <tr key={field} className="border-b border-cyber-border border-opacity-35 hover:bg-cyber-dark hover:bg-opacity-20 transition-all">

                                    <td className="py-2 px-3 text-center">

                                      <button

                                        type="button"

                                        onClick={() => {

                                          let fieldData = '';

                                          if (isSelectedJsonConnectorListNode) {

                                            const idx = selectedNode.data.parameters?.select_row_index || 0;

                                            const table = selectedNode.data.parameters?.table || selectedNode.data.parameters?.agentOutputsTable || [];

                                            fieldData = table[idx] ? table[idx][field] : '';

                                          } else {

                                            try {

                                              const outputObj = JSON.parse(selectedNode.data.parameters?.jsonOutput || '{}');

                                              fieldData = outputObj[field];

                                            } catch(e) {}

                                          }

                                          openDialog('json', `field_${field}.json`, JSON.stringify(fieldData, null, 2) || '');

                                        }}

                                        className="text-[9px] font-mono bg-cyber-dark hover:bg-cyber-light hover:bg-opacity-20 text-cyber-neon border border-cyber-border hover:border-cyber-neon px-1.5 py-0.5 rounded transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"

                                        title="View extracted field data"

                                      >

                                        <Eye className="w-2.5 h-2.5" /> View

                                      </button>

                                    </td>

                                    <td className="py-2 px-3 font-mono text-cyan-400">{field}</td>

                                    <td className="py-2 px-3 text-right">

                                      <button

                                        type="button"

                                        onClick={() => {

                                          const currentFields = selectedNode.data.parameters?.fields || [];

                                          updateSelectedNodeParameter('fields', currentFields.filter((f: string) => f !== field));

                                        }}

                                        className="text-red-400 hover:text-red-300 font-bold text-[10px] uppercase tracking-wider bg-transparent border-none outline-none cursor-pointer"

                                      >

                                        Remove

                                      </button>

                                    </td>

                                  </tr>

                                ))

                              )}

                            </tbody>

                          </table>

                        </div>

                      </div>



                    </div>

                  </>

                )}

                {/* Page Display Node configuration fields */}

                {isSelectedPageNode && (

                  <>

                    <div className="space-y-1.5">

                      <div className="flex items-center justify-between">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Page Display Content

                        </label>

                        {selectedNode.data.parameters?.pageOutput && (

                          <button

                            onClick={() => updateSelectedNodeParameter('pageOutput', '')}

                            className="text-[9px] font-bold uppercase tracking-wider text-cyber-neon hover:text-cyber-neon-dim transition-all cursor-pointer bg-transparent border-none outline-none focus:outline-none"

                            title="Clear display content"

                          >

                            Clear

                          </button>

                        )}

                      </div>

                      <textarea

                        readOnly

                        value={selectedNode.data.parameters?.pageOutput || ''}

                        rows={16}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2.5 px-3 rounded-lg text-cyber-text resize-y leading-relaxed font-mono overflow-y-auto"

                      />

                    </div>

                  </>

                )}



                {/* Storage Node configuration fields */}

                {isSelectedStorageNode && (

                  <>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Supabase Project URL

                      </label>

                      <input

                        type="text"

                        value={selectedNode.data.parameters?.supabaseUrl || ''}

                        onChange={(e) => updateSelectedNodeParameter('supabaseUrl', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                        placeholder="e.g. https://xyz.supabase.co"

                      />

                    </div>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Supabase Service Role Key / API Key

                      </label>

                      <div className="flex gap-2">

                        <input

                          type="password"

                          value={selectedNode.data.parameters?.supabaseKey || ''}

                          onChange={(e) => updateSelectedNodeParameter('supabaseKey', e.target.value)}

                          className="flex-1 text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                          placeholder="eyJhbGciOi..."

                        />

                        <button

                          type="button"

                          onClick={() => {

                            navigator.clipboard.writeText(selectedNode.data.parameters?.supabaseKey || '');

                            setCopiedNodeId(selectedNode.id);

                            setTimeout(() => setCopiedNodeId(null), 1000);

                          }}

                          className="px-2.5 py-2 rounded-lg bg-cyber-dark border border-cyber-border text-cyber-neon hover:bg-cyber-neon hover:text-black transition-all flex items-center justify-center space-x-1 cursor-pointer shrink-0"

                          title="Copy Key to Clipboard"

                        >

                          {copiedNodeId === selectedNode.id ? (

                            <span className="text-[9px] font-bold">Copied!</span>

                          ) : (

                            <Copy className="w-3.5 h-3.5" />

                          )}

                        </button>

                      </div>

                    </div>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Storage Bucket Name

                      </label>

                      <input

                        type="text"

                        value={selectedNode.data.parameters?.bucketName || ''}

                        onChange={(e) => updateSelectedNodeParameter('bucketName', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-3 rounded-lg text-cyber-text font-mono"

                        placeholder="e.g. pdfs"

                      />

                    </div>

                  </>

                )}



                {/* Pdfs Loader Node configuration fields */}

                {isSelectedPdfsLoaderNode && (

                  <>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Fallback PDF URLs (JSON list or comma-separated)

                      </label>

                      <textarea

                        value={selectedNode.data.parameters?.pdfUrls || ''}

                        onChange={(e) => updateSelectedNodeParameter('pdfUrls', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2.5 px-3 rounded-lg text-cyber-text font-mono h-24 resize-y"

                        placeholder='e.g. ["http://url.pdf"] or http://url1.pdf, http://url2.pdf'

                      />

                    </div>

                  </>

                )}


                {/* OCR PDFs Node Parameter Editor */}

                {isSelectedOcrPdfsNode && (

                  <>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Select OCR Engine

                      </label>

                      <select

                        value={selectedNode.data.parameters?.ocrEngine || 'PyMuPDF'}

                        onChange={(e) => updateSelectedNodeParameter('ocrEngine', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border rounded px-2 py-2 text-cyber-text focus:border-cyber-neon focus:outline-none"

                      >

                        <option value="PyMuPDF">PyMuPDF (Fast, Text Layer)</option>

                        <option value="pdfplumber">pdfplumber (Accurate Tables)</option>

                        <option value="paddleocr">PaddleOCR (Server Model)</option>

                        <option value="easyocr">EasyOCR (Thai + English)</option>

                      </select>

                      <p className="text-[9px] text-cyber-muted italic mt-1">

                        Select the engine to use for extracting text from the PDF queue.

                      </p>

                    </div>

                  </>

                )}



                {/* Extract Node Parameter Editor */}

                {isSelectedExtractNode && (

                  <>

                    <div className="space-y-1.5">

                      <div className="flex items-center justify-between text-[10px]">

                        <label className="font-bold uppercase tracking-wider text-cyber-muted block">

                          AI Model Selection

                        </label>

                        <span className="text-[9px] text-cyber-neon italic">Shared API Key via Models Tab</span>

                      </div>

                      <select

                        value={selectedNode.data.parameters?.modelName || 'gemini-2.5-flash'}

                        onChange={(e) => updateSelectedNodeParameter('modelName', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-2.5 rounded-lg text-cyber-text"

                      >

                        {aiModels.map((m) => (

                          <option key={m.id} value={m.modelName}>

                            {m.label || m.modelName} ({m.provider})

                          </option>

                        ))}

                      </select>

                    </div>



                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Extraction Prompt Instructions

                      </label>

                      <textarea

                        value={selectedNode.data.parameters?.prompt || ''}

                        onChange={(e) => updateSelectedNodeParameter('prompt', e.target.value)}

                        rows={3}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2.5 px-3 rounded-lg text-cyber-text resize-y leading-relaxed font-mono"

                      />

                    </div>

                    <div className="space-y-1.5">

                      <div className="flex items-center justify-between">

                        <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                          Extracted Text

                        </label>

                        <button

                          onClick={() => updateSelectedNodeParameter('extractedText', '')}

                          className="text-[9px] font-extrabold uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors bg-cyber-dark px-2 py-0.5 rounded border border-cyber-border border-opacity-65 hover:border-red-400 cursor-pointer"

                        >

                          Clear

                        </button>

                      </div>

                      <textarea

                        readOnly

                        value={selectedNode.data.parameters?.extractedText || ''}

                        rows={6}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border py-2 px-3 rounded-lg text-cyber-text font-mono resize-y leading-relaxed"

                        placeholder="Core assertions will appear here after execution..."

                      />

                    </div>

                  </>

                )}



                {/* De-duplicate Node Parameter Editor */}

                {isSelectedDeDuplicateNode && (

                  <>

                    <div className="space-y-1.5">

                      <div className="flex items-center justify-between text-[10px]">

                        <label className="font-bold uppercase tracking-wider text-cyber-muted block">

                          AI Model Selection

                        </label>

                        <span className="text-[9px] text-cyber-neon italic">Shared API Key via Models Tab</span>

                      </div>

                      <select

                        value={selectedNode.data.parameters?.modelName || 'gemini-2.5-flash'}

                        onChange={(e) => updateSelectedNodeParameter('modelName', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-2.5 rounded-lg text-cyber-text"

                      >

                        {aiModels.map((m) => (

                          <option key={m.id} value={m.modelName}>

                            {m.label || m.modelName} ({m.provider})

                          </option>

                        ))}

                      </select>

                    </div>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        De-duplication Prompt

                      </label>

                      <textarea

                        value={selectedNode.data.parameters?.prompt || ''}

                        onChange={(e) => updateSelectedNodeParameter('prompt', e.target.value)}

                        rows={3}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2.5 px-3 rounded-lg text-cyber-text resize-y leading-relaxed font-mono"

                      />

                    </div>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        De-duplicated Facts & Metrics

                      </label>

                      <textarea

                        readOnly

                        value={selectedNode.data.parameters?.deduplicatedText || ''}

                        rows={6}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border py-2 px-3 rounded-lg text-cyber-text font-mono resize-y leading-relaxed"

                        placeholder="De-duplicated text and numeric count will appear here..."

                      />

                    </div>

                  </>

                )}



                {/* Structured Parse JSON Node Parameter Editor */}

                {isSelectedStructuredParseNode && (

                  <>

                    <div className="space-y-1.5">

                      <div className="flex items-center justify-between text-[10px]">

                        <label className="font-bold uppercase tracking-wider text-cyber-muted block">

                          AI Model Selection

                        </label>

                        <span className="text-[9px] text-cyber-neon italic">Shared API Key via Models Tab</span>

                      </div>

                      <select

                        value={selectedNode.data.parameters?.modelName || 'gemini-2.5-flash'}

                        onChange={(e) => updateSelectedNodeParameter('modelName', e.target.value)}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border focus:border-cyber-neon focus:outline-none py-2 px-2.5 rounded-lg text-cyber-text"

                      >

                        {aiModels.map((m) => (

                          <option key={m.id} value={m.modelName}>

                            {m.label || m.modelName} ({m.provider})

                          </option>

                        ))}

                      </select>

                    </div>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Structured 7-Section JSON Output

                      </label>

                      <textarea

                        readOnly

                        value={selectedNode.data.parameters?.structuredJson || ''}

                        rows={10}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border py-2 px-3 rounded-lg text-cyber-text font-mono resize-y leading-relaxed"

                        placeholder="Structured JSON object will appear here after parsing..."

                      />

                    </div>

                  </>

                )}



                {/* State Node Parameter Editor */}

                {isSelectedStateNode && (

                  <>

                    <div className="space-y-1.5">

                      <label className="text-[10px] font-bold uppercase tracking-wider text-cyber-muted block">

                        Active State Variables & Debugger

                      </label>

                      <textarea

                        readOnly

                        value={selectedNode.data.parameters?.stateOutput || ''}

                        rows={16}

                        className="w-full text-xs bg-cyber-dark border border-cyber-border py-2 px-3 rounded-lg text-cyber-text font-mono resize-y leading-relaxed font-mono"

                        placeholder="Global state values will appear here after execution..."

                      />

                    </div>

                  </>

                )}


    </>
  );
};

export default ConnectorsAndProcessorsInspector;
