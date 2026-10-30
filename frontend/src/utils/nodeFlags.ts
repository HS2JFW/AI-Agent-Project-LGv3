import type { Node } from 'reactflow';
import {
  getNodeClass,
  isWorkflowTimerNode,
  isRegularTimerNode,
} from './nodeGraphUtils';

export interface NodeFlags {
  selectedCls: string;
  isSelectedDbNode: boolean;
  isSelectedGraphRagNode: boolean;
  isSelectedApiConnectorNode: boolean;
  isSelectedApiIncrementalNode: boolean;
  isSelectedJsonConnectorNode: boolean;
  isSelectedJsonConnectorListNode: boolean;
  isSelectedPageNode: boolean;
  isSelectedStorageNode: boolean;
  isSelectedWorkflowTimerNode: boolean;
  isSelectedRegularTimerNode: boolean;
  isSelectedTimerNode: boolean;
  isSelectedPdfsLoaderNode: boolean;
  isSelectedPdfQueueNode: boolean;
  isSelectedTxtQueueNode: boolean;
  isSelectedZipQueueNode: boolean;
  isSelectedPdfExtractorNode: boolean;
  isSelectedExtractNode: boolean;
  isSelectedDeDuplicateNode: boolean;
  isSelectedStructuredParseNode: boolean;
  isSelectedStateNode: boolean;
  isSelectedOcrPdfsNode: boolean;
  isSelectedMarkItDownNode: boolean;
  isSelectedPolarsConverterNode: boolean;
  isSelectedDuckDbNode: boolean;
  isSelectedBigDataAnalystNode: boolean;
  isSelectedBigDataContainerNode: boolean;
}

export function computeNodeFlags(selectedNode: Node | null): NodeFlags {
  const selectedCls = selectedNode ? getNodeClass(selectedNode).replace(/_/g, ' ') : '';

  const isSelectedDbNode = selectedNode ? (
    ((selectedCls.toLowerCase().includes('db') || selectedCls.toLowerCase().includes('database')) && 
     !selectedCls.toLowerCase().includes('agent') && 
     !selectedCls.toLowerCase().includes('duckdb')) ||
    selectedCls.toLowerCase().includes('supabase')
  ) : false;

  const isSelectedGraphRagNode = selectedCls === 'Graph RAG' || selectedCls.toLowerCase().includes('graph rag');
  const isSelectedApiConnectorNode = selectedCls === 'API Connector';
  const isSelectedApiIncrementalNode = selectedCls === 'API Incremental';
  const isSelectedJsonConnectorNode = selectedCls === 'JSON Connector';
  const isSelectedJsonConnectorListNode = selectedCls === 'JSON Connector List';
  const isSelectedPageNode = selectedCls === 'Page';
  const isSelectedStorageNode = selectedCls === 'Storage';
  const isSelectedWorkflowTimerNode = selectedNode ? isWorkflowTimerNode(selectedNode) : false;
  const isSelectedRegularTimerNode = selectedNode ? isRegularTimerNode(selectedNode) : false;
  const isSelectedTimerNode = isSelectedWorkflowTimerNode || isSelectedRegularTimerNode;
  const isSelectedPdfsLoaderNode = selectedCls === 'Pdfs Loader';
  const isSelectedPdfQueueNode = selectedCls === 'PDF Queue';
  const isSelectedTxtQueueNode = selectedCls === 'TXT Queue';
  const isSelectedZipQueueNode = selectedCls === 'Zip Queue';
  const isSelectedPdfExtractorNode = selectedCls === 'PDF Extractor';
  const isSelectedExtractNode = selectedCls === 'Extract';
  const isSelectedDeDuplicateNode = selectedCls === 'De-duplicate Text';
  const isSelectedStructuredParseNode = selectedCls === 'Structured Parse JSON';
  const isSelectedStateNode = selectedCls === 'State';
  const isSelectedOcrPdfsNode = selectedCls === 'OCR PDFs';
  const isSelectedMarkItDownNode = selectedCls === 'Mark It Down' || selectedCls.toLowerCase().includes('markitdown');

  // Big Data & Analytics Inspector Selectors
  const isSelectedPolarsConverterNode = selectedNode ? (
    selectedCls === 'Polars Parquet Converter' ||
    selectedCls === 'Polars_Parquet_Converter' ||
    selectedCls.toLowerCase().includes('polars') ||
    selectedCls.toLowerCase().includes('parquet converter')
  ) : false;

  const isSelectedDuckDbNode = selectedNode ? (
    selectedCls === 'DuckDB Virtual Lake' ||
    selectedCls === 'DuckDB_Virtual_Lake' ||
    selectedCls.toLowerCase().includes('duckdb')
  ) : false;

  const isSelectedBigDataAnalystNode = selectedNode ? (
    selectedCls === 'Autonomous Big Data Analyst' ||
    selectedCls === 'Autonomous_Big_Data_Analyst' ||
    selectedCls.toLowerCase().includes('big data analyst') ||
    selectedCls.toLowerCase().includes('big_data_analyst')
  ) : false;

  const isSelectedBigDataContainerNode = selectedNode ? (
    selectedCls === 'Multi-Agent Pipeline Container' ||
    selectedCls === 'Multi-Agent_Pipeline_Container' ||
    selectedCls.toLowerCase().includes('pipeline container')
  ) : false;

  return {
    selectedCls,
    isSelectedDbNode,
    isSelectedGraphRagNode,
    isSelectedApiConnectorNode,
    isSelectedApiIncrementalNode,
    isSelectedJsonConnectorNode,
    isSelectedJsonConnectorListNode,
    isSelectedPageNode,
    isSelectedStorageNode,
    isSelectedWorkflowTimerNode,
    isSelectedRegularTimerNode,
    isSelectedTimerNode,
    isSelectedPdfsLoaderNode,
    isSelectedPdfQueueNode,
    isSelectedTxtQueueNode,
    isSelectedZipQueueNode,
    isSelectedPdfExtractorNode,
    isSelectedExtractNode,
    isSelectedDeDuplicateNode,
    isSelectedStructuredParseNode,
    isSelectedStateNode,
    isSelectedOcrPdfsNode,
    isSelectedMarkItDownNode,
    isSelectedPolarsConverterNode,
    isSelectedDuckDbNode,
    isSelectedBigDataAnalystNode,
    isSelectedBigDataContainerNode,
  };
}
