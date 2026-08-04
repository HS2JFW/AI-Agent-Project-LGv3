const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = './workflow_app.db';
const WF_DIR = './WF';

const db = new sqlite3.Database(DB_PATH);

function recoverWorkflows() {
    if (!fs.existsSync(WF_DIR)) {
        console.error('WF directory not found!');
        return;
    }

    const folders = fs.readdirSync(WF_DIR);
    let recoveredCount = 0;

    for (const folder of folders) {
        const folderPath = path.join(WF_DIR, folder);
        if (fs.statSync(folderPath).isDirectory() && folder.startsWith('wf-')) {
            const files = fs.readdirSync(folderPath);
            const wfFile = files.find(f => f.endsWith('.wf'));
            
            if (wfFile) {
                const wfFilePath = path.join(folderPath, wfFile);
                console.log(`Processing ${wfFilePath}...`);
                try {
                    const content = fs.readFileSync(wfFilePath, 'utf8');
                    const wfData = JSON.parse(content);
                    
                    const id = wfData.id || folder;
                    const name = wfData.name || 'Recovered Workflow';
                    const description = wfData.description || '';
                    const nodes = JSON.stringify(wfData.nodes || []);
                    const edges = JSON.stringify(wfData.edges || []);
                    const agent_nodes = JSON.stringify(wfData.agent_nodes || []);
                    const agent_edges = JSON.stringify(wfData.agent_edges || []);
                    const ai_models = JSON.stringify(wfData.ai_models || []);

                    // Check if exists
                    db.get('SELECT id FROM workflows WHERE id = ?', [id], (err, row) => {
                        if (err) {
                            console.error(`Error checking DB for ${id}:`, err);
                            return;
                        }

                        if (row) {
                            // Update
                            db.run(`UPDATE workflows SET 
                                name = ?, description = ?, nodes = ?, edges = ?, 
                                agent_nodes = ?, agent_edges = ?, ai_models = ?,
                                updated_at = datetime('now')
                                WHERE id = ?`,
                                [name, description, nodes, edges, agent_nodes, agent_edges, ai_models, id],
                                function(err) {
                                    if (err) console.error(`Error updating ${id}:`, err);
                                    else console.log(`Updated workflow ${id}`);
                                }
                            );
                        } else {
                            // Insert
                            db.run(`INSERT INTO workflows 
                                (id, name, description, nodes, edges, agent_nodes, agent_edges, ai_models, created_at, updated_at) 
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                                [id, name, description, nodes, edges, agent_nodes, agent_edges, ai_models],
                                function(err) {
                                    if (err) console.error(`Error inserting ${id}:`, err);
                                    else console.log(`Inserted workflow ${id}`);
                                }
                            );
                        }
                    });
                    
                    recoveredCount++;
                } catch (e) {
                    console.error(`Failed to parse/recover ${wfFilePath}:`, e);
                }
            }
        }
    }
    
    // Close db after a slight delay to allow async ops to finish
    setTimeout(() => {
        console.log(`Processed ${recoveredCount} workflow folders.`);
        db.close();
    }, 1000);
}

recoverWorkflows();
