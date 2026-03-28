const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(process.cwd(), 'supabase/migrations');
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

const createdTables = new Set();
const rlsEnabledTables = new Set();

files.forEach(file => {
  const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
  
  const createRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)/gi;
  let match;
  while ((match = createRegex.exec(content)) !== null) {
    createdTables.add(match[1].toLowerCase());
  }

  const alterRegex = /ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi;
  while ((match = alterRegex.exec(content)) !== null) {
    rlsEnabledTables.add(match[1].toLowerCase());
  }
});

const missingRls = [...createdTables].filter(t => !rlsEnabledTables.has(t));
console.log("=== RLS REPORT ===");
console.log("Total Tables: " + createdTables.size);
console.log("RLS Enabled:  " + rlsEnabledTables.size);
console.log("Missing RLS:  " + missingRls.join(', '));
