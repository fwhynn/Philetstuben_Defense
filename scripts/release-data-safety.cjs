const fs = require('node:fs'), path = require('node:path');
// Ordinary releases must not contain destructive database migrations.
// Intentional season resets require a separate, explicitly reviewed operation.
function assertDataSafe(apiRoot) {
  const dir = path.join(apiRoot, 'database_structure');
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir).filter(n => n.endsWith('.sql'))) {
    const sql = fs.readFileSync(path.join(dir, name), 'utf8').replace(/--[^\n]*|\/\*[\s\S]*?\*\//g, '');
    if (/\b(?:DROP\s+(?:TABLE|DATABASE)|TRUNCATE\s+(?:TABLE\s+)?|DELETE\s+FROM)\b/i.test(sql)) {
      throw new Error(`Release blocked: destructive database migration ${name}. Preserve saves and leaderboards; review resets separately.`);
    }
  }
}
module.exports = { assertDataSafe };
