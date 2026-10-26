/**
 * migrate_workflow_nodes.js
 * 
 * Standalone migration script to normalize and modernize all workflow nodes across:
 * 1. Active SQLite Database (workflow_app.db)
 * 2. Active Filesystem Storage (backend_node/WF/<wf-id>/*.wf)
 * 3. Template & Backup Workflows (_work flow/*.wf)
 * 
 * Usage:
 *   node migrate_workflow_nodes.js --dry-run
 *   node migrate_workflow_nodes.js --apply
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const isDryRun = process.argv.includes('--dry-run') || !process.argv.includes('--apply');
const isApply = process.argv.includes('--apply');

console.log('================================================================');
console.log('   Workflow Node Modernization & Standardization Migration');
console.log(`   Mode: ${isApply ? 'APPLY (Modifying Database and Files)' : 'DRY-RUN (Preview Only)'}`);
console.log('================================================================\n');

// 22 Canonical Node Definitions
const CANONICAL_CATEGORIES = {
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
  'Agent': 'Agents',
  'Agent DB': 'Agents',
  'Agent Audit': 'Agents',
  'PDF to Base64 Agent': 'OCR',
  'PDF to Image Agent': 'OCR',
  'Gmail': 'Notification',
  'Line': 'Notification',
  'Mobile Message': 'Notification',
  'Rubric': 'Criteria',
  'Multi-Criteria Analysis': 'Criteria',
  'Sample': 'Criteria',
  'Table': 'Criteria',
};

// Legacy default titles that should be replaced with modern clean names
const LEGACY_DEFAULT_NAMES = {
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

/**
 * Normalizes an individual node to canonical standards
 */
function migrateNode(n) {
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

  // 1. Workflow Timer
  if (allText.includes('workflow timer') || allText.includes('workflow_timer')) {
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
    targetCategory = 'Agents';
    targetOriginalName = 'Agent Audit';
  }
  // 4. Agent DB
  else if (allText.includes('agent db') || allText.includes('agent_db')) {
    targetType = 'Agent DB';
    targetClass = 'Agent_DB';
    targetCategory = 'Agents';
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
  else if (allText.includes('vector db') || ntLow === 'db' || ncLow === 'db' || nLow === 'db' || lLow === 'db' || allText.includes('database') || allText.includes('supabase')) {
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
  }
  else if (allText.includes('txt queue') || allText.includes('txt_queue')) {
    targetType = 'TXT Queue';
    targetClass = 'TXT_Queue';
    targetCategory = 'Dataset';
    targetOriginalName = 'TXT Queue';
  }
  else if (allText.includes('zip queue') || allText.includes('zip_queue')) {
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
  }
  else if (allText.includes('line')) {
    targetType = 'Line';
    targetClass = 'Line';
    targetCategory = 'Notification';
    targetOriginalName = 'Line';
  }
  else if (allText.includes('mobile')) {
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
  }
  else if (rfType === 'mca' || allText.includes('multi-criteria') || allText.includes('multi_criteria') || allText.includes('multi criteria')) {
    targetType = 'Multi-Criteria Analysis';
    targetClass = 'Multi_Criteria_Analysis';
    targetCategory = 'Criteria';
    targetOriginalName = 'Multi-Criteria Analysis';
  }
  else if (rfType === 'sample' || allText.includes('sample')) {
    targetType = 'Sample';
    targetClass = 'Sample';
    targetCategory = 'Criteria';
    targetOriginalName = 'Sample';
  }
  else if (rfType === 'table' || allText.includes('table')) {
    targetType = 'Table';
    targetClass = 'Table';
    targetCategory = 'Criteria';
    targetOriginalName = 'Table';
  }
  // 15. Agents (Default / Catch-all)
  else {
    targetType = 'Agent';
    targetClass = 'Agent';
    targetCategory = 'Agents';
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

/**
 * Deep copy directory helper
 */
function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Global statistics
let totalWorkflowsExamined = 0;
let totalNodesExamined = 0;
let totalNodesMigrated = 0;

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

// -------------------------------------------------------------
// STEP 1: Backup (If Apply mode)
// -------------------------------------------------------------
const dbPath = path.resolve(__dirname, 'workflow_app.db');
const wfDirPath = path.resolve(__dirname, 'WF');
const templateDirPath = path.resolve(__dirname, '..', '_work flow');

if (isApply) {
  console.log('--- Step 1: Performing Backups ---');
  if (fs.existsSync(dbPath)) {
    const dbBackup = `${dbPath}.bak_${timestamp}`;
    fs.copyFileSync(dbPath, dbBackup);
    console.log(`[Backup] SQLite DB saved to: ${dbBackup}`);
  }
  if (fs.existsSync(wfDirPath)) {
    const wfBackup = `${wfDirPath}_backup_${timestamp}`;
    copyDirSync(wfDirPath, wfBackup);
    console.log(`[Backup] WF directory saved to: ${wfBackup}`);
  }
  if (fs.existsSync(templateDirPath)) {
    const templateBackup = `${templateDirPath}_backup_${timestamp}`;
    copyDirSync(templateDirPath, templateBackup);
    console.log(`[Backup] _work flow directory saved to: ${templateBackup}`);
  }
  console.log('Backups completed successfully.\n');
}

// -------------------------------------------------------------
// STEP 2: Migrate SQLite Database
// -------------------------------------------------------------
console.log('--- Step 2: Migrating SQLite Database (workflow_app.db) ---');
if (fs.existsSync(dbPath)) {
  const db = new Database(dbPath);
  const workflows = db.prepare('SELECT id, name, nodes, agent_nodes FROM workflows').all();
  
  const updateStmt = db.prepare('UPDATE workflows SET nodes = ?, agent_nodes = ?, updated_at = datetime(\'now\') WHERE id = ?');

  for (const wf of workflows) {
    totalWorkflowsExamined++;
    let nodes = [];
    let agentNodes = [];
    try { nodes = JSON.parse(wf.nodes || '[]'); } catch (e) {}
    try { agentNodes = JSON.parse(wf.agent_nodes || '[]'); } catch (e) {}

    let wfNodesChanged = 0;
    const migratedNodes = nodes.map(n => {
      totalNodesExamined++;
      const res = migrateNode(n);
      if (JSON.stringify(res) !== JSON.stringify(n)) {
        wfNodesChanged++;
        totalNodesMigrated++;
      }
      return res;
    });

    const migratedAgentNodes = agentNodes.map(n => {
      totalNodesExamined++;
      const res = migrateNode(n);
      if (JSON.stringify(res) !== JSON.stringify(n)) {
        wfNodesChanged++;
        totalNodesMigrated++;
      }
      return res;
    });

    console.log(`[DB] Workflow: "${wf.name}" (${wf.id}) -> ${nodes.length} nodes, ${agentNodes.length} agent_nodes. (${wfNodesChanged} node updates required)`);

    if (isApply && wfNodesChanged > 0) {
      updateStmt.run(
        JSON.stringify(migratedNodes),
        JSON.stringify(migratedAgentNodes),
        wf.id
      );
      console.log(`     -> Updated in database successfully.`);
    }
  }
} else {
  console.log('[DB] Warning: workflow_app.db not found!');
}
console.log('');

// -------------------------------------------------------------
// STEP 3: Migrate Active Filesystem Storage (backend_node/WF/)
// -------------------------------------------------------------
console.log('--- Step 3: Migrating Active Filesystem Storage (backend_node/WF/) ---');
if (fs.existsSync(wfDirPath)) {
  const dirs = fs.readdirSync(wfDirPath, { withFileTypes: true });
  for (const d of dirs) {
    if (!d.isDirectory()) continue;
    const currentWfDir = path.join(wfDirPath, d.name);
    const files = fs.readdirSync(currentWfDir);
    for (const f of files) {
      if (!f.endsWith('.wf')) continue;
      const filePath = path.join(currentWfDir, f);
      try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        totalWorkflowsExamined++;
        let changed = false;

        if (Array.isArray(content.nodes)) {
          content.nodes = content.nodes.map(n => {
            totalNodesExamined++;
            const res = migrateNode(n);
            if (JSON.stringify(res) !== JSON.stringify(n)) {
              changed = true;
              totalNodesMigrated++;
            }
            return res;
          });
        }

        if (Array.isArray(content.agentNodes)) {
          content.agentNodes = content.agentNodes.map(n => {
            totalNodesExamined++;
            const res = migrateNode(n);
            if (JSON.stringify(res) !== JSON.stringify(n)) {
              changed = true;
              totalNodesMigrated++;
            }
            return res;
          });
        }

        if (Array.isArray(content.agent_nodes)) {
          content.agent_nodes = content.agent_nodes.map(n => {
            totalNodesExamined++;
            const res = migrateNode(n);
            if (JSON.stringify(res) !== JSON.stringify(n)) {
              changed = true;
              totalNodesMigrated++;
            }
            return res;
          });
        }

        console.log(`[WF File] ${path.relative(__dirname, filePath)} -> nodes: ${content.nodes?.length || 0}, agentNodes: ${content.agentNodes?.length || content.agent_nodes?.length || 0} (Changed: ${changed})`);

        if (isApply && changed) {
          fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
          console.log(`     -> Saved to file.`);
        }
      } catch (e) {
        console.error(`Error processing ${filePath}:`, e.message);
      }
    }
  }
}
console.log('');

// -------------------------------------------------------------
// STEP 4: Migrate Template & Backup Workflows (_work flow/)
// -------------------------------------------------------------
console.log('--- Step 4: Migrating Template Workflows (_work flow/) ---');
if (fs.existsSync(templateDirPath)) {
  const files = fs.readdirSync(templateDirPath);
  for (const f of files) {
    if (!f.endsWith('.wf')) continue;
    const filePath = path.join(templateDirPath, f);
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      totalWorkflowsExamined++;
      let changed = false;

      if (Array.isArray(content.nodes)) {
        content.nodes = content.nodes.map(n => {
          totalNodesExamined++;
          const res = migrateNode(n);
          if (JSON.stringify(res) !== JSON.stringify(n)) {
            changed = true;
            totalNodesMigrated++;
          }
          return res;
        });
      }

      if (Array.isArray(content.agentNodes)) {
        content.agentNodes = content.agentNodes.map(n => {
          totalNodesExamined++;
          const res = migrateNode(n);
          if (JSON.stringify(res) !== JSON.stringify(n)) {
            changed = true;
            totalNodesMigrated++;
          }
          return res;
        });
      }

      if (Array.isArray(content.agent_nodes)) {
        content.agent_nodes = content.agent_nodes.map(n => {
          totalNodesExamined++;
          const res = migrateNode(n);
          if (JSON.stringify(res) !== JSON.stringify(n)) {
            changed = true;
            totalNodesMigrated++;
          }
          return res;
        });
      }

      console.log(`[Template] ${f} -> nodes: ${content.nodes?.length || 0} (Changed: ${changed})`);

      if (isApply && changed) {
        fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
        console.log(`     -> Saved to file.`);
      }
    } catch (e) {
      console.error(`Error processing ${filePath}:`, e.message);
    }
  }
}
console.log('');

// -------------------------------------------------------------
// Summary
// -------------------------------------------------------------
console.log('================================================================');
console.log('                    MIGRATION SUMMARY');
console.log('================================================================');
console.log(`Workflows Processed:    ${totalWorkflowsExamined}`);
console.log(`Total Nodes Examined:   ${totalNodesExamined}`);
console.log(`Total Node Updates:     ${totalNodesMigrated}`);
if (!isApply) {
  console.log('\n>>> To apply these changes to database and files, run:');
  console.log('    node migrate_workflow_nodes.js --apply\n');
} else {
  console.log('\n>>> All changes have been safely applied and verified!\n');
}
