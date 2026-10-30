import type { Node, Edge } from 'reactflow';
import { getNodeClass } from './nodeGraphUtils';

export async function generateFinalPrompt(
  nodeId: string,
  nodes: Node[],
  edges: Edge[],
  selectedWorkflowId?: string | null,
  backendUrl?: string
): Promise<string> {
  const BACKEND_URL = backendUrl || import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

    const node = nodes.find(n => n.id === nodeId);

    if (!node) return "";

    

    let promptPreview = node.data.prompt || "";

    

    const nCls = getNodeClass(node).replace(/_/g, ' ');

    const isPdfsNode = nCls === 'Agent' || node.data.name === 'Agent' || nCls === 'Agent DB' || node.data.name === 'Agent DB' || nCls === 'Agent Audit' || node.data.name === 'Agent Audit' || nCls === 'PDF to Image Agent' || node.data.name === 'PDF to Image Agent' || nCls === 'PDF to Base64 Agent' || node.data.name === 'PDF to Base64 Agent' || nCls === 'AI Agent API PDFs' || node.data.name === 'AI Agent API PDFs' || node.type === 'AgentAPIPDFsNode' || nCls === 'AI Agent PDFs' || node.data.name === 'AI Agent PDFs' || node.data.name === 'AI Agent PDFs Audit'  || node.type === 'AgentPDFsNode' || nCls === 'AI Agent Zip' || node.data.name === 'AI Agent Zip' || node.type === 'AgentZipNode' || node.type === 'AgentPDFsAuditNode' || nCls === 'AI Agent PDFs Loop' || node.data.name === 'AI Agent PDFs Loop' || node.type === 'AgentPDFsLoopNode' || nCls === 'AI Agent PDFs Chain' || node.data.name === 'AI Agent PDFs Chain' || node.type === 'AgentPDFsChainNode' || nCls === 'AI Agent PDFs Base64' || node.data.name === 'AI Agent PDFs Base64' || node.type === 'AgentPDFsBase64Node' || nCls === 'AI Agent PDFs Image' || node.data.name === 'AI Agent PDFs Image' || node.type === 'AgentPDFsImageNode' || nCls === 'OCR PDFs' || node.data.name === 'OCR PDFs' || node.type === 'OCRPDFsNode';

    if (isPdfsNode) {

      promptPreview = "[PDF Document Content/URL will be injected here]\n\n" + promptPreview;

    }



    const incomingEdges = edges.filter(e => e.target === nodeId);

    let appendedJson = "";

    

    incomingEdges.forEach(edge => {

      const srcNode = nodes.find(n => n.id === edge.source);

      if (srcNode) {

        const srcType = srcNode.type;

        const srcData = srcNode.data;

        

        if ((srcType === "rubric" || srcType === "mca") && srcData.rubricData) {

          let finalData = srcData.rubricData;

          if (edge.sourceHandle && edge.sourceHandle.startsWith("criterion-")) {

            const critId = edge.sourceHandle.replace("criterion-", "");

            const selectedCrit = srcData.rubricData.criteria?.find((c: any) => c.id === critId);

            if (selectedCrit) {

              finalData = {

                ...srcData.rubricData,

                criteria: [selectedCrit]

              };

            }

          }

          appendedJson += "\n\n" + srcType.toUpperCase() + " JSON:\n" + JSON.stringify(finalData, null, 2);

        } else if (srcType === "sample" && srcData.sampleData) {

          let finalData = srcData.sampleData;

          if (edge.sourceHandle && edge.sourceHandle.startsWith("sample-") && edge.sourceHandle !== "sample-all") {

            const sampleId = edge.sourceHandle.replace("sample-", "");

            const selectedSample = srcData.sampleData.samples?.find((s: any) => s.id === sampleId);

            if (selectedSample) {

              finalData = {

                ...srcData.sampleData,

                samples: [selectedSample]

              };

            }

          }

          appendedJson += "\n\nSample JSON:\n" + JSON.stringify(finalData, null, 2);

        } else if (srcType === "table" && srcData.tableData) {

          let finalData = srcData.tableData;

          if (edge.sourceHandle && edge.sourceHandle.startsWith("table-row-")) {

            const rowId = edge.sourceHandle.replace("table-row-", "");

            const selectedRow = srcData.tableData.rows?.find((r: any) => r.id === rowId);

            if (selectedRow) {

              finalData = {

                ...srcData.tableData,

                rows: [selectedRow]

              };

            }

          }

          appendedJson += "\n\nTable JSON:\n" + JSON.stringify(finalData, null, 2);

        }

      }

    });



    

      // Inject TXT fetch logic here

      let appendedText = "";

      for (const edge of incomingEdges) {

        const srcNode = nodes.find(n => n.id === edge.source);

        if (srcNode) {

          const srcData = srcNode.data || {};

          let fileList: any[] = [];

          

          if (srcData.outputs?.agentOutputsTable) fileList = srcData.outputs.agentOutputsTable;

          else if (srcData.parameters?.agentOutputsTable) fileList = srcData.parameters.agentOutputsTable;

          else if (srcData.outputs?.pdfQueue) fileList = srcData.outputs.pdfQueue;

          else if (srcData.parameters?.pdfQueue) fileList = srcData.parameters.pdfQueue;



          if (Array.isArray(fileList)) {

            const txtFiles = fileList.filter(f => typeof f === 'string' && f.endsWith('.txt'));

            for (const txtFile of txtFiles) {

              try {

                const wfId = selectedWorkflowId || 'default';

                const url = `${BACKEND_URL}/api/agent-result/${encodeURIComponent(txtFile)}?workflow_id=${encodeURIComponent(wfId)}`;

                const res = await fetch(url);

                if (res.ok) {

                  const textData = await res.text();

                  appendedText += "\n\n--- Text from " + txtFile + " ---\n" + textData;

                }

              } catch (e) {

                console.error("Failed to fetch txt file:", txtFile, e);

              }

            }

          }

        }

      }

      return promptPreview + appendedJson + appendedText;
}

export async function generateFinalPayload(
  nodeId: string,
  nodes: Node[],
  edges: Edge[],
  selectedWorkflowId?: string | null,
  backendUrl?: string
): Promise<string> {
  const BACKEND_URL = backendUrl || import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

    const node = nodes.find(n => n.id === nodeId);

    if (!node) return "";

    

    const finalPrompt = await generateFinalPrompt(nodeId, nodes, edges, selectedWorkflowId, BACKEND_URL);

    const modelName = node.data.parameters?.modelName || 'gemini-2.5-flash';

    const nCls = getNodeClass(node).replace(/_/g, ' ');

    const isPdfsNode = nCls === 'Agent' || node.data.name === 'Agent' || nCls === 'Agent DB' || node.data.name === 'Agent DB' || nCls === 'Agent Audit' || node.data.name === 'Agent Audit' || nCls === 'PDF to Image Agent' || node.data.name === 'PDF to Image Agent' || nCls === 'PDF to Base64 Agent' || node.data.name === 'PDF to Base64 Agent' || nCls === 'AI Agent API PDFs' || node.data.name === 'AI Agent API PDFs' || node.type === 'AgentAPIPDFsNode' || nCls === 'AI Agent PDFs' || node.data.name === 'AI Agent PDFs' || node.data.name === 'AI Agent PDFs Audit'  || node.type === 'AgentPDFsNode' || nCls === 'AI Agent Zip' || node.data.name === 'AI Agent Zip' || node.type === 'AgentZipNode' || node.type === 'AgentPDFsAuditNode' || nCls === 'AI Agent PDFs Loop' || node.data.name === 'AI Agent PDFs Loop' || node.type === 'AgentPDFsLoopNode' || nCls === 'AI Agent PDFs Chain' || node.data.name === 'AI Agent PDFs Chain' || node.type === 'AgentPDFsChainNode' || nCls === 'AI Agent PDFs Base64' || node.data.name === 'AI Agent PDFs Base64' || node.type === 'AgentPDFsBase64Node' || nCls === 'AI Agent PDFs Image' || node.data.name === 'AI Agent PDFs Image' || node.type === 'AgentPDFsImageNode' || nCls === 'OCR PDFs' || node.data.name === 'OCR PDFs' || node.type === 'OCRPDFsNode';

    const isOpenRouter = modelName.includes('/');

    

    const hasIncomingQueue = edges.some(e => {

      const n = nodes.find(sn => sn.id === e.source);

      if (!n || e.target !== nodeId) return false;

      const name = n.data?.name?.toLowerCase() || '';

      return name.includes('queue') || n.type === 'pdfQueue' || n.type === 'fileQueue' || n.type === 'imageQueue' || n.type === 'urlList';

    });



    const hasFile = isPdfsNode || hasIncomingQueue;



    let payload: any = {};



    if (isOpenRouter) {

      const messages: any[] = [];

      const role = node.data.role?.trim();

      if (role) {

        messages.push({ role: "system", content: role });

      }



      if (hasFile) {

        messages.push({

          role: "user",

          content: [

            { type: "text", text: finalPrompt },

            { type: "file", file: { file_data: "data:application/pdf;base64,<BASE64_DATA_GENERATED_AT_RUNTIME>" } }

          ]

        });

      } else {

        messages.push({ role: "user", content: finalPrompt });

      }



      payload = {

        model: modelName,

        messages: messages,

        temperature: parseFloat(node.data.parameters?.temperature || 0),

        top_p: parseFloat(node.data.parameters?.topP || 0.95),

        max_tokens: parseInt(node.data.parameters?.maxOutputTokens || 8192)

      };

    } else {

      payload = {

        contents: [

          {

            parts: [

              { text: finalPrompt }

            ]

          }

        ],

        generationConfig: {

          temperature: parseFloat(node.data.parameters?.temperature || 0),

          maxOutputTokens: parseInt(node.data.parameters?.maxOutputTokens || 8192),

          topP: parseFloat(node.data.parameters?.topP || 0.95),

          topK: parseInt(node.data.parameters?.topK || 40)

        }

      };



      if (hasFile) {

        payload.contents[0].parts.push({

          fileData: {

            mimeType: "application/pdf",

            fileUri: "https://generativelanguage.googleapis.com/v1beta/files/<FILE_URI_GENERATED_AT_RUNTIME>"

          }

        });

      }

    }



    return JSON.stringify(payload, null, 2);
}
