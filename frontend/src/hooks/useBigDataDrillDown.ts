import { useCallback } from 'react';
import type { Node, Edge } from 'reactflow';

export interface UseBigDataDrillDownProps {
  nodes: Node[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  setSelectedProcessNodeIds: React.Dispatch<React.SetStateAction<string[]>>;
  setIsSubflowModeActive: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useBigDataDrillDown({
  nodes,
  setNodes,
  setEdges,
  setSelectedProcessNodeIds,
  setIsSubflowModeActive,
}: UseBigDataDrillDownProps) {
  const handleDrillDownContainer = useCallback((containerNode: Node) => {
    const nodeParams = containerNode.data?.parameters || {};
    const team = Array.isArray(nodeParams.team) ? nodeParams.team : [
      { id: 'agent_1', name: 'Planner Agent', role: 'Decomposes objective into analytical steps', model: 'gemini-2.5-flash', persona: 'Chief Data Strategist' },
      { id: 'agent_2', name: 'SQL Engineer & Critic', role: 'Generates & validates DuckDB queries', model: 'gemini-2.5-flash', persona: 'DuckDB Senior Engineer & Critic' },
      { id: 'agent_3', name: 'Domain Specialist', role: 'Analyzes anomalies and trends', model: 'gemini-2.5-flash', persona: 'Senior Business Intelligence Specialist' },
      { id: 'agent_4', name: 'Executive Synthesizer', role: 'Synthesizes executive summary & recommendations', model: 'gemini-2.5-flash', persona: 'Executive Insights Director' }
    ];

    const baseX = containerNode.position.x;
    const baseY = containerNode.position.y;
    const childPrefix = `${containerNode.id}_sub_`;
    const existingChildren = nodes.filter(n => n.id.startsWith(childPrefix));

    if (existingChildren.length > 0) {
      setSelectedProcessNodeIds(existingChildren.map(n => n.id));
      setIsSubflowModeActive(true);
      return;
    }

    const converterId = `${childPrefix}polars`;
    const polarsNode: Node = {
      id: converterId,
      type: 'customNode',
      position: { x: baseX, y: baseY + 180 },
      data: {
        label: 'Polars Parquet Converter',
        category: 'Datasets',
        name: 'Polars Parquet Converter',
        nodeClass: 'Polars_Parquet_Converter',
        originalName: 'Polars Parquet Converter',
        nodeType: 'Polars Parquet Converter',
        parameters: {
          sourceType: 'upload',
          filePattern: '*.xlsx, *.csv',
          sheetName: 'Sheet1',
          compression: 'snappy',
          autoTypeInference: true,
          outputParquetPath: './workflow_inputs/parquet_cache'
        }
      }
    };

    const duckdbId = `${childPrefix}duckdb`;
    const duckdbNode: Node = {
      id: duckdbId,
      type: 'customNode',
      position: { x: baseX + 320, y: baseY + 180 },
      data: {
        label: 'DuckDB Virtual Lake',
        category: 'Datasets',
        name: 'DuckDB Virtual Lake',
        nodeClass: 'DuckDB_Virtual_Lake',
        originalName: 'DuckDB Virtual Lake',
        nodeType: 'DuckDB Virtual Lake',
        parameters: {
          executionMode: 'agent_driven',
          sqlQuery: "SELECT * FROM read_parquet('workflow_inputs/parquet_cache/*.parquet') LIMIT 10",
          statementTimeout: '10s'
        }
      }
    };

    const agentNodesList: Node[] = [];
    const agentEdgesList: Edge[] = [];

    team.forEach((agent: any, index: number) => {
      const aId = `${childPrefix}agent_${index + 1}`;
      agentNodesList.push({
        id: aId,
        type: 'customNode',
        position: { x: baseX + 640 + (index * 280), y: baseY + 180 },
        data: {
          label: agent.name || `Specialist ${index + 1}`,
          category: 'Agents',
          name: agent.name || `Specialist ${index + 1}`,
          nodeClass: 'Agent',
          originalName: 'Agent',
          nodeType: 'Agent',
          role: agent.persona || agent.role || 'Data Specialist',
          prompt: agent.role || 'Analyze data from DuckDB',
          parameters: {
            modelName: agent.model || 'gemini-2.5-flash',
            temperature: 0.0
          }
        }
      });

      if (index === 0) {
        agentEdgesList.push({
          id: `edge_${duckdbId}_${aId}`,
          source: duckdbId,
          target: aId,
          animated: true,
          style: { stroke: '#38bdf8', strokeWidth: 2 }
        });
      } else {
        const prevId = `${childPrefix}agent_${index}`;
        agentEdgesList.push({
          id: `edge_${prevId}_${aId}`,
          source: prevId,
          target: aId,
          animated: true,
          style: { stroke: '#a855f7', strokeWidth: 2 }
        });
      }
    });

    const edgeConverterToDuck: Edge = {
      id: `edge_${converterId}_${duckdbId}`,
      source: converterId,
      target: duckdbId,
      animated: true,
      style: { stroke: '#10b981', strokeWidth: 2 }
    };

    const allNewNodes = [polarsNode, duckdbNode, ...agentNodesList];
    const allNewEdges = [edgeConverterToDuck, ...agentEdgesList];

    setNodes(prev => [...prev, ...allNewNodes]);
    setEdges(prev => [...prev, ...allNewEdges]);
    setSelectedProcessNodeIds(allNewNodes.map(n => n.id));
    setIsSubflowModeActive(true);
  }, [nodes, setNodes, setEdges, setSelectedProcessNodeIds, setIsSubflowModeActive]);

  return {
    handleDrillDownContainer,
  };
}

