const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline/promises');

const repo = __dirname;
const workspaceRoot = path.dirname(repo);
const apiRepo = path.join(workspaceRoot, 'api.autohextd');
const packageJsonPath = path.join(repo, 'package.json');
const packageLockPath = path.join(repo, 'package-lock.json');
const npmCliPath = process.env.npm_execpath;
const args = process.argv.slice(2);
const releaseAll = args.includes('--all');
const releaseServerOnly = args.includes('--server');
const releaseClientOnly = args.includes('--client');
const testFlag = args.includes('--test');
const positionalArgs = args.filter(arg => !arg.startsWith('--'));
const knownFlags = ['--all', '--server', '--client', '--test'];
const unknownFlags = args.filter(arg => arg.startsWith('--') && !knownFlags.includes(arg));
const packageJsonGitPath = path.relative(repo, packageJsonPath);
const packageLockGitPath = path.relative(repo, packageLockPath);

if (releaseServerOnly && releaseClientOnly) {
  console.error('Use either --server or --client, not both.');
  process.exit(1);
}

const releaseMode = releaseServerOnly ? 'server' : 'client';

if (positionalArgs.length || unknownFlags.length) {
  console.error('This script always increments the version with digit carry. Use `npm run tag`, `npm run tag -- --all`, or `npm run tag -- --server`.');
  process.exit(1);
}

function gitAt(cwd, args, opts = {}) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', ...opts });
}

function git(args, opts = {}) {
  return gitAt(repo, args, opts);
}

function npm(args, opts = {}) {
  if (npmCliPath) {
    return execFileSync(process.execPath, [npmCliPath, ...args], {
      cwd: repo,
      encoding: 'utf8',
      ...opts,
    });
  }

  if (process.platform === 'win32') {
    return execFileSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npm.cmd', ...args], {
      cwd: repo,
      encoding: 'utf8',
      ...opts,
    });
  }

  return execFileSync('npm', args, { cwd: repo, encoding: 'utf8', ...opts });
}

function readVersion() {
  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')).version;
}

function parseSemver(tag) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(tag || '');
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function bumpDigitCarryVersion(version) {
  const parsed = parseSemver(version || '0.0.0') || { major: 0, minor: 0, patch: 0 };
  let { major, minor, patch } = parsed;

  patch += 1;
  if (patch >= 10) {
    patch = 0;
    minor += 1;
  }
  if (minor >= 10) {
    minor = 0;
    major += 1;
  }

  return `${major}.${minor}.${patch}`;
}

function bumpDigitCarryTag(tag) {
  return `v${bumpDigitCarryVersion(tag || '0.0.0')}`;
}

function nextTestNumber(cwd, baseTag) {
  try {
    const list = gitAt(cwd, ['tag', '--list', `${baseTag}-test*`], { stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (!list) return 1;
    const tags = list.split(/\r?\n/);
    let max = 0;
    for (const t of tags) {
      const m = /-test(\d+)$/.exec(t);
      if (m) {
        const n = Number(m[1]);
        if (n > max) max = n;
      }
    }
    return max + 1;
  } catch {
    return 1;
  }
}

function isGitRepo(cwd) {
  try {
    return gitAt(cwd, ['rev-parse', '--is-inside-work-tree'], { stdio: ['ignore', 'pipe', 'ignore'] }).trim() === 'true';
  } catch {
    return false;
  }
}

function ensureCleanRepo(cwd, label) {
  const dirty = gitAt(cwd, ['status', '--porcelain', '--untracked-files=normal'], { stdio: ['ignore', 'pipe', 'inherit'] }).trim();
  if (dirty) {
    console.error(`${label} has uncommitted changes or untracked files. Review and commit first.`);
    process.exit(1);
  }
}

function tagExists(cwd, tag) {
  try {
    return gitAt(cwd, ['rev-parse', '--verify', '--quiet', `refs/tags/${tag}`], { stdio: ['ignore', 'pipe', 'ignore'] }).trim() !== '';
  } catch {
    return false;
  }
}

function latestTag(cwd) {
  try {
    return gitAt(cwd, ['describe', '--tags', '--abbrev=0', '--match', 'v*'], { stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

function getDeployCommits(cwd) {
  const baseTag = latestTag(cwd);
  const logArgs = ['log', '--format=- %h [%cr]: %s'];
  if (baseTag) logArgs.push(`${baseTag}..HEAD`);
  const output = gitAt(cwd, logArgs, { stdio: ['ignore', 'pipe', 'inherit'] }).trim();
  return {
    baseTag,
    commits: output ? output.split(/\r?\n/) : [],
  };
}

function printDeployCommits(label, deployInfo) {
  const suffix = deployInfo.baseTag ? ` since ${deployInfo.baseTag}` : '';
  console.log(`\n${label} commits queued for deploy${suffix}:`);
  if (!deployInfo.commits.length) {
    console.log('  - none since the last tag');
    return;
  }
  deployInfo.commits.forEach(line => console.log(`  ${line}`));
}

async function confirmApiRelease(hasApiRepo) {
  if (releaseMode === 'server') return true;
  if (!hasApiRepo) return false;
  if (releaseAll) {
    console.log('\nUsing --all: the sibling API repo will be tagged and pushed too.');
    return true;
  }

  console.log('\nTip: pass --all to also tag and push the sibling API repo without this prompt.');
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.log('Non-interactive terminal detected; skipping sibling API tag/push.');
    return false;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = (await rl.question('Also tag and push the sibling API repo in ../api.autohextd? [y/N] ')).trim();
    return /^(y|yes)$/i.test(answer);
  } finally {
    rl.close();
  }
}

function pushRelease(cwd, tag, label) {
  gitAt(cwd, ['push', 'origin', 'HEAD'], { stdio: 'inherit' });
  gitAt(cwd, ['push', 'origin', tag], { stdio: 'inherit' });
  console.log(`${label} pushed with ${tag}.`);
}

async function main() {
  require('./scripts/release-readiness.cjs').assertReleaseReady(repo, { apiOnly: releaseMode === 'server' });
  const hasApiRepo = isGitRepo(apiRepo);
  if (hasApiRepo) require('./scripts/release-data-safety.cjs').assertDataSafe(apiRepo);
  if (releaseMode === 'client') {
    ensureCleanRepo(repo, 'Game repo');
    const unfinishedLegal = require('./legal-placeholders.cjs').unfinishedLegalPages(repo);
    if (unfinishedLegal.length) {
      console.error(`Legal pages still contain [[…]] placeholders: ${unfinishedLegal.join(', ')}. Fill them in before releasing.`);
      process.exit(1);
    }
    const gameDeployInfo = getDeployCommits(repo);
    printDeployCommits('Game', gameDeployInfo);
  }

  if (hasApiRepo) {
    printDeployCommits('API', getDeployCommits(apiRepo));
  } else {
    console.log(`\nSibling API repo not found at ${apiRepo}.`);
  }

  if (releaseMode === 'server' && !hasApiRepo) {
    console.error(`Sibling API repo not found at ${apiRepo}.`);
    process.exit(1);
  }

  const releaseApi = await confirmApiRelease(hasApiRepo);
  if (releaseApi) ensureCleanRepo(apiRepo, 'API repo');


  // The sibling checkout identifies the exact API code we require, even for client-only releases.
  if (!hasApiRepo) throw Error('The API checkout is required to verify the deployed version.');
  const { prepareClientRelease } = require('./scripts/deployment-status.cjs');
  if (releaseApi && gitAt(apiRepo, ['branch','--show-current']).trim() !== 'main') throw Error('API deployment pulls main; switch or merge to main before releasing.');
  if (releaseMode === 'client' && gitAt(repo, ['branch','--show-current']).trim() !== 'main') throw Error('Client deployment pulls main; switch or merge to main before releasing.');

  const previousVersion = readVersion();
  const nextVersion = bumpDigitCarryVersion(previousVersion);
  const base = (latestTag(repo) || 'v' + previousVersion).replace(/-test\d+$/i, '');
  const tag = testFlag ? base + '-test' + nextTestNumber(repo, base) : 'v' + nextVersion;
  const apiTag = releaseMode === 'server' ? (testFlag ? base + '-test' + nextTestNumber(apiRepo, base) : bumpDigitCarryTag(latestTag(apiRepo))) : tag;
  if (releaseMode === 'client' && tagExists(repo, tag)) throw Error('Client tag already exists: ' + tag);
  if (releaseApi && tagExists(apiRepo, apiTag)) throw Error('API tag already exists. Use a separate --server release to retry the API rollout, then --client.');

  // Validate release notes before publishing either repository, without mutating them.
  const notesFile = path.join(repo, 'patch-notes.json');
  const releaseNotes = releaseMode === 'client' && !testFlag ? require('./release-notes.cjs').prepare(notesFile, nextVersion) : null;
  await prepareClientRelease({apiRoot: apiRepo, publishApi: releaseApi ? async () => {
    gitAt(apiRepo, ['tag','-a',apiTag,'-m',apiTag], {stdio:'inherit'});
    pushRelease(apiRepo, apiTag, 'API');
    console.log('Waiting for verified API backup, migration and worker readiness...');
  } : undefined});
  if (releaseMode === 'server') { console.log('API release verified: ' + apiTag); return; }

  // No client version, commit or tag is changed until the exact API release is ready.
  if (!testFlag) {
    npm(['version', nextVersion, '--no-git-tag-version'], {stdio:'inherit'});
    fs.writeFileSync(notesFile, JSON.stringify(releaseNotes,null,2)+'\n');
    const filesToCommit=[packageJsonGitPath,'patch-notes.json'];
    if(fs.existsSync(packageLockPath))filesToCommit.push(packageLockGitPath);
    git(['add',...filesToCommit],{stdio:'inherit'});
    git(['commit','-m','chore: release '+tag],{stdio:'inherit'});
  }
  git(['tag','-a',tag,'-m',tag],{stdio:'inherit'});
  pushRelease(repo,tag,'Game');
  console.log('Released ' + tag + ' after verified API preparation.');

}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
