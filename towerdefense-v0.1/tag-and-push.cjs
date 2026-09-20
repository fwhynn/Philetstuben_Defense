const { execFileSync } = require('child_process');
const path = require('path');
const { version } = require('./package.json');
const repo = path.join(__dirname, '..');
const tag = `v${version}`;

function git(args, opts = {}) {
  return execFileSync('git', args, { cwd: repo, encoding: 'utf8', ...opts });
}

const dirty = git(['status', '--porcelain', '--untracked-files=no'], { stdio: ['ignore', 'pipe', 'inherit'] }).trim();
if (dirty) {
  console.error('Working tree has tracked changes. Commit or stash first.');
  process.exit(1);
}

git(['tag', '-a', tag, '-m', tag], { stdio: 'inherit' });
git(['push', 'origin', 'HEAD'], { stdio: 'inherit' });
git(['push', 'origin', tag], { stdio: 'inherit' });
console.log(`Pushed ${tag}`);
