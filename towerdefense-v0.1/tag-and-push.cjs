const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const repo = path.join(__dirname, '..');
const packageJsonPath = path.join(__dirname, 'package.json');
const bumpInput = (process.argv[2] || 'patch').replace(/^v/, '');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function git(args, opts = {}) {
  return execFileSync('git', args, { cwd: repo, encoding: 'utf8', ...opts });
}

function npm(args, opts = {}) {
  return execFileSync(npmCommand, args, { cwd: __dirname, encoding: 'utf8', ...opts });
}

function readVersion() {
  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')).version;
}

const dirty = git(['status', '--porcelain', '--untracked-files=no'], { stdio: ['ignore', 'pipe', 'inherit'] }).trim();
if (dirty) {
  console.error('Working tree has tracked changes. Commit or stash first.');
  process.exit(1);
}

const previousVersion = readVersion();
npm(['version', bumpInput, '--no-git-tag-version'], { stdio: 'inherit' });

const version = readVersion();
const tag = `v${version}`;

if (version === previousVersion) {
  console.error(`Version stayed at ${version}.`);
  process.exit(1);
}

git(['tag', '-a', tag, '-m', tag], { stdio: 'inherit' });
// git(['push', 'origin', tag], { stdio: 'inherit' });
console.log(`Tagged ${tag}`);
