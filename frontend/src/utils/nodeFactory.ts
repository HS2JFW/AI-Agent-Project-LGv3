import type { Node } from 'reactflow';

export function createNewNodeInstances(
  category: string,
  name: string,
  dropPosition: { x: number; y: number } | undefined,
  agentNodes: Node[],
  bounds?: DOMRect | null,
  reactFlowInstance?: any
): { newNodeLogic: Node; newNodeAgent: Node } {
  let position = dropPosition;

  if (!position) {
    if (bounds && reactFlowInstance) {
      const jitterX = (Math.random() - 0.5) * 60;
      const jitterY = (Math.random() - 0.5) * 60;
      position = reactFlowInstance.project({
        x: bounds.width / 2 + jitterX,
        y: bounds.height / 2 + jitterY,
      });
    } else {
      position = { x: 350, y: 250 };
    }
  }

  const nodeId = `node_${Date.now()}`;

  let logicPosition = { x: position?.x ?? 350, y: position?.y ?? 250 };
  let agentPosition = { x: position?.x ?? 350, y: position?.y ?? 250 };
  let parentNode: string | undefined = undefined;
  let extent: 'parent' | undefined = undefined;

  if (category === 'Data Sources') {
    parentNode = 'container-sources';
    extent = 'parent';
    const currentSources = agentNodes.filter(n => n.parentNode === 'container-sources');
    agentPosition = { x: 5, y: 40 + currentSources.length * 120 };
  } else if (category === 'Notification') {
    parentNode = 'container-notifications';
    extent = 'parent';
    const currentNotifs = agentNodes.filter(n => n.parentNode === 'container-notifications');
    agentPosition = { x: 5, y: 40 + currentNotifs.length * 120 };
  } else if (category === 'Actions' || category === 'Dataset' || category === 'Datasets' || category === 'Big Data & Analytics') {
    parentNode = 'container-deliverables';
    extent = 'parent';
    const currentActions = agentNodes.filter(n => n.parentNode === 'container-deliverables');
    agentPosition = { x: 10 + currentActions.length * 260, y: 45 };
  }

      let defaultParams: any = {};

      if (name === 'API Connector') {

        defaultParams = {

          apiUrl: 'https://api.example.com/v1/data',

          functionName: 'fetchData()',

          apiParameters: 'limit=10&status=active',

          apiOutput: '{\n  "status": "success",\n  "data": {\n    "id": 101,\n    "name": "John Doe",\n    "email": "john@example.com",\n    "role": "developer"\n  }\n}'

        };

      } else if (name === 'API Incremental') {

        defaultParams = {

          apiUrl: 'https://bqysaldeijwvnhtcfiuj.supabase.co/rest/v1/pdf_table',

          authHeader: 'Bearer sb_publishable_tzQOB9wms5o9q19pA6vFDQ_OK439Ism',

          anonKeyHeader: 'sb_publishable_tzQOB9wms5o9q19pA6vFDQ_OK439Ism',

          functionName: 'GetPDF_Incremental()',

          apiParameters: 'select=number,date,file_url',

          round: 1,

          row: 5,

          apiOutput: ''

        };

      } else if (name === 'Graph RAG') {

        defaultParams = {

          graphEndpoint: 'bolt://localhost:7687',

          databaseType: 'neo4j',

          graphQuery: 'MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 25',

          topK: 5,

          similarityThreshold: 0.7,

          tools: ['database', 'search']

        };

      } else if (name === 'JSON Connector' || name === 'JSON Connector List') {

        defaultParams = {

          fields: []

        };

      } else if (name === 'Storage') {

        defaultParams = {

          supabaseUrl: 'https://bqysaldeijwvnhtcfiuj.supabase.co',

          supabaseKey: '',

          bucketName: 'pdfs'

        };

      } else if (name === 'Timer') {

        defaultParams = {

          timerMode: 'calendarSpecific',

          calendarSpecificDates: [],

          calendarPatternType: 'daily'

        };

      } else if (name === 'Workflow Timer') {

        defaultParams = {

          timerMode: 'interval',

          intervalValue: 2,

          intervalUnit: 'seconds',

          remainingSeconds: 2,

          schedulerActive: false

        };

      } else if (name === 'Pdfs Loader') {

        defaultParams = {

          pdfUrls: ''

        };

      } else if (name === 'PDF Queue') {

        defaultParams = {

          supabaseUrls: '',

          bucketName: 'pdfs',

          currentIndex: 0,

          queueLength: 0,

          currentUrl: '',

          hasNext: false

        };

      } else if (name === 'TXT Queue') {

        defaultParams = {

          supabaseUrls: '',

          bucketName: 'txts',

          currentIndex: 0,

          queueLength: 0,

          currentUrl: '',

          hasNext: false,

          txtQueue: []

        };

      } else if (name === 'Zip Queue') {

        defaultParams = {

          supabaseUrls: '',

          bucketName: 'zips',

          currentIndex: 0,

          queueLength: 0,

          currentUrl: '',

          hasNext: false,

          zipQueue: []

        };

      } else if (name === 'Extract') {

        defaultParams = {

          googleApiKey: '',

          modelName: 'gemini-2.5-flash',

          prompt: 'Extract all core assertions, technical specifications, and key requirements. Remove preamble and redundant text.',

          extractedText: ''

        };

      } else if (name === 'De-duplicate Text') {

        defaultParams = {

          googleApiKey: '',

          modelName: 'gemini-2.5-flash',

          prompt: 'Remove semantic redundancies and collapse duplicate claims. Isolate specific numeric thresholds and metrics.',

          deduplicatedText: ''

        };

      } else if (name === 'Structured Parse JSON') {

        defaultParams = {

          googleApiKey: '',

          modelName: 'gemini-2.5-flash',

          structuredJson: ''

        };

      } else if (name === 'State') {

        defaultParams = {

          stateOutput: ''

        };

      } else if (name === 'Mark It Down' || name === 'MarkItDown') {

        defaultParams = {

          agentOutputsTable: [],

          pdfUrls: '',

          currentIndex: 0,

          previous_max: 0

        };

      } else if (name === 'Agent' || name === 'Agent DB' || name === 'Agent Audit' || name === 'PDF to Image Agent' || name === 'PDF to Base64 Agent' || name === 'AI Agent API' || name === 'AI Agent API PDFs' || name === 'AI Agent PDFs' || name === 'AI Agent DB' || name === 'AI Agent PDFs Audit' || name === 'AI Agent Zip' || name === 'AI Agent PDFs Loop' || name === 'AI Agent PDFs Chain' || name === 'AI Agent PDFs Base64' || name === 'AI Agent PDFs Image' || name === 'OCR PDFs' || name === 'AI Agent Account' || name === 'AI Agent Vertex AI') {

        defaultParams = {

          modelName: 'gemini-2.5-flash',

          temperature: 0.0,

          maxOutputTokens: 2048,

          topP: 1.0,

          topK: 40,

          safetySettings: 'BLOCK_MEDIUM_AND_ABOVE',

          recursionLimit: 20,

          stateSchema: 'messages, remaining_chunks, pdf_content',

          configurableModel: 'default',

          configurableTemp: '',

          langsmithTracing: true,

          langsmithProject: 'gemini-pdf-summarizer',

          langsmithTags: 'v1-test, temp-0',

          langsmithMetadata: '{\n  "user_id": "123"\n}'

        };

        

        if (name === 'AI Agent API') {

          defaultParams.googleApiKey = '';

        } else if (name === 'Agent' || name === 'Agent DB' || name === 'Agent Audit' || name === 'PDF to Image Agent' || name === 'PDF to Base64 Agent' || name === 'AI Agent API PDFs' || name === 'AI Agent PDFs' || name === 'AI Agent DB' || name === 'AI Agent PDFs Audit' || name === 'AI Agent Zip' || name === 'AI Agent PDFs Loop' || name === 'AI Agent PDFs Chain' || name === 'AI Agent PDFs Base64' || name === 'AI Agent PDFs Image' || name === 'OCR PDFs') {

          defaultParams.googleApiKey = '';

          defaultParams.pdfUrls = '';

          defaultParams.agentOutputsTable = [];

          defaultParams.agentOutputStatusesMap = {};

          

          if (name === 'AI Agent DB' || name === 'Agent DB') {

            defaultParams.connectionString = '';

            defaultParams.mode = 'auto';

            defaultParams.prompt = 'Analyze the input data and construct a raw SQL INSERT query to save it into the target database table. Return ONLY the SQL statement, no markdown formatting.';

          }

          

          if (name === 'AI Agent Zip') {

            defaultParams.prompt = "????????????????????????????????????? ???????????????, ?????, ???????????????? ???? ???????????? ??????? ?????????????? '??' ????????? ????????????????? '?????'";

          }

          if (name === 'AI Agent PDFs Base64' || name === 'AI Agent PDFs Image' || name === 'PDF to Base64 Agent' || name === 'PDF to Image Agent') {

            defaultParams.modelName = 'gemini-1.5-flash';

          }

        } else if (name === 'AI Agent Account') {

          defaultParams.googleCloudProject = '';

        } else if (name === 'AI Agent Vertex AI') {

          defaultParams.googleCloudProject = '';

          defaultParams.serviceAccountJsonPath = '';

        }

      } else if (name === 'Polars Parquet Converter') {

        defaultParams = {

          sourceType: 'upload',

          filePattern: '*.xlsx, *.csv',

          sheetName: 'Sheet1',

          compression: 'snappy',

          autoTypeInference: true,

          nullHandling: 'keep',

          chunkSize: 50000,

          outputParquetPath: './workflow_inputs/parquet_cache',

          convertedFiles: [],

          catalog: {}

        };

      } else if (name === 'DuckDB Virtual Lake') {

        defaultParams = {

          executionMode: 'agent_driven',

          sqlQuery: "SELECT * FROM read_parquet('workflow_inputs/parquet_cache/*.parquet') LIMIT 10",

          statementTimeout: '10s',

          maxResultRows: 100,

          memoryLimit: '2GB',

          queryResults: [],

          previewColumns: []

        };

      } else if (name === 'Autonomous Big Data Analyst' || name === 'Multi-Agent Pipeline Container') {

        defaultParams = {

          mode: 'auto',

          businessObjective: 'วิเคราะห์ยอดขายและผลประกอบการ หาแนวโน้มสำคัญ ตรวจสอบความผิดปกติ (Anomalies) และจัดทำข้อเสนอแนะเชิงกลยุทธ์',

          sourceFiles: [],

          targetParquetPath: './workflow_inputs/parquet_cache',

          sqlTimeout: '15s',

          team: [

            { id: 'agent_1', name: 'Planner Agent', role: 'วางแผนและแตกโจทย์วิเคราะห์เป็นลำดับขั้นตอน', model: 'gemini-2.5-flash', persona: 'Chief Data Strategist' },

            { id: 'agent_2', name: 'SQL Engineer & Critic', role: 'สร้างและตรวจสอบคำสั่ง DuckDB SQL ข้าม Parquet', model: 'gemini-2.5-flash', persona: 'DuckDB Senior Engineer & Verification Lead' },

            { id: 'agent_3', name: 'Domain Specialist', role: 'วิเคราะห์ตัวเลข สถิติ และหาจุดผิดปกติเชิงธุรกิจ', model: 'gemini-2.5-flash', persona: 'Senior Business Intelligence Specialist' },

            { id: 'agent_4', name: 'Executive Synthesizer', role: 'สังเคราะห์บทสรุปและจัดทำคำแนะนำผู้บริหาร', model: 'gemini-2.5-flash', persona: 'Executive Insights Director' }

          ],

          executionStatus: 'idle',

          finalReport: ''

        };

      } else if (name === 'Planner Agent' || name === 'SQL Engineer & Critic' || name === 'Domain Specialist' || name === 'Executive Synthesizer') {

        defaultParams = {

          modelName: 'gemini-2.5-flash',

          temperature: 0.0,

          maxOutputTokens: 2048,

          role: name === 'Planner Agent' 

            ? 'Chief Data Strategist' 

            : name === 'SQL Engineer & Critic' 

              ? 'DuckDB Senior Engineer & Critic' 

              : name === 'Domain Specialist' 

                ? 'Senior Business Intelligence Specialist' 

                : 'Executive Insights Director',

          prompt: name === 'Planner Agent' 

            ? 'วิเคราะห์โครงสร้างตารางข้อมูลและแตกขั้นตอนการวิเคราะห์ (Analytical Decomposition) เป็นข้อๆ'

            : name === 'SQL Engineer & Critic'

              ? 'เขียนและตรวจสอบคำสั่ง DuckDB SQL เพื่อดึงข้อมูลและคำนวณตัวเลขตามขั้นตอนที่ได้รับ'

              : name === 'Domain Specialist'

                ? 'วิเคราะห์ผลลัพธ์จาก SQL เพื่อหา Insight เชิงธุรกิจ และหาความผิดปกติของตัวเลข'

                : 'รวบรวมข้อค้นพบจากทุก Agent และสังเคราะห์เป็นบทสรุปผู้บริหาร (Executive Summary)'

        };

      }



      const newNodeLogic: Node = {

        id: nodeId,

        type: category === 'Criteria' ? (name === 'Sample' ? 'sample' : (name === 'Table' ? 'table' : (name === 'Multi-Criteria Analysis' ? 'mca' : 'rubric'))) : (name === 'PDF Extractor' ? 'pdfExtractor' : (name === 'Multi-Agent Pipeline Container' ? 'containerNode' : 'customNode')),

        position: logicPosition,

        selected: true,

        data: { 

          label: name, 

          category, 

          name, 

          nodeClass: name.replace(/\s+/g, '_'),

          originalName: name,

          nodeType: name,

          prompt: defaultParams.prompt || (category === 'Models' || category === 'Agents' || category === 'Agent' || name?.toLowerCase().includes('agent') ? 'Configure instructions' : ''),

          role: defaultParams.role || (category === 'Agents' || category === 'Agent' || name?.toLowerCase().includes('agent') ? 'Agent Role' : ''),

          parameters: defaultParams

        },

      };



      const newNodeAgent: Node = {

        id: nodeId,

        type: category === 'Criteria' ? (name === 'Sample' ? 'sample' : (name === 'Table' ? 'table' : (name === 'Multi-Criteria Analysis' ? 'mca' : 'rubric'))) : 'customNode',

        parentNode,

        extent,

        position: agentPosition,

        data: { 

          label: name, 

          category, 

          name, 

          nodeClass: name.replace(/\s+/g, '_'),

          originalName: name,

          nodeType: name,

          prompt: defaultParams.prompt || (category === 'Models' || category === 'Agents' || category === 'Agent' || name?.toLowerCase().includes('agent') ? 'Configure instructions' : ''),

          role: defaultParams.role || (category === 'Agents' || category === 'Agent' || name?.toLowerCase().includes('agent') ? 'Agent Role' : ''),

          parameters: defaultParams

        },

      };


  return { newNodeLogic, newNodeAgent };
}
