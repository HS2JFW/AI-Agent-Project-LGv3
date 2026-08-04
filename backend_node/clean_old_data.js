const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

// 1. Delete file from WF/
const wfDir = path.join(__dirname, 'WF');
if (fs.existsSync(wfDir)) {
  const files = fs.readdirSync(wfDir);
  files.forEach(file => {
    if (file.includes('314f21fa') || file.toLowerCase().includes('blank') || file.endsWith('.wf')) {
      try {
        const filePath = path.join(wfDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        if (file.includes('314f21fa') || file.toLowerCase().includes('blank') || content.includes('New Blank Workflow')) {
          fs.unlinkSync(filePath);
          console.log('Deleted leftover WF file:', file);
        }
      } catch (e) {}
    }
  });
}

// 2. Delete from SQLite DB workflow_app.db
const dbPath = path.join(__dirname, 'workflow_app.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening db:', err);
    return;
  }
  
  db.serialize(() => {
    db.run("DELETE FROM execution_logs WHERE run_id IN (SELECT id FROM workflow_runs WHERE workflow_id IN (SELECT id FROM workflows WHERE name LIKE '%Blank%'))", function(err) {
      console.log('Deleted execution_logs rows:', this ? this.changes : 0);
    });
    db.run("DELETE FROM workflow_runs WHERE workflow_id IN (SELECT id FROM workflows WHERE name LIKE '%Blank%')", function(err) {
      console.log('Deleted workflow_runs rows:', this ? this.changes : 0);
    });
    db.run("DELETE FROM workflows WHERE name LIKE '%Blank%' OR name = 'New Blank Workflow'", function(err) {
      console.log('Deleted workflows rows:', this ? this.changes : 0);
    });
  });
});
