'use strict';
// Release guard: legal pages must not go live while they still contain [[…]] placeholders.
const fs = require('node:fs'), path = require('node:path');
const LEGAL_PAGES = ['impressum.html', 'datenschutz.html'];
function unfinishedLegalPages(root = __dirname) {
  return LEGAL_PAGES.filter(name => { const file = path.join(root, name); return fs.existsSync(file) && /\[\[[^\]]*\]\]/.test(fs.readFileSync(file, 'utf8')); });
}
module.exports = { LEGAL_PAGES, unfinishedLegalPages };
