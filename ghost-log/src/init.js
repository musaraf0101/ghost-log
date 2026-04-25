'use strict';

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const HOOK_SCRIPT = `#!/bin/sh
# Ghost Log: prepare-commit-msg hook
node "$(git rev-parse --show-toplevel)/node_modules/.bin/ghost-hook" "$1"
`;

const HOOK_SCRIPT_GLOBAL = `#!/bin/sh
# Ghost Log: prepare-commit-msg hook
ghost-hook "$1" 2>/dev/null || true
`;

function findGitRoot(startDir) {
  let dir = startDir;
  while (dir !== path.parse(dir).root) {
    if (fs.existsSync(path.join(dir, '.git'))) return dir;
    dir = path.dirname(dir);
  }
  return null;
}

function ghostInit() {
  const cwd = process.cwd();
  const gitRoot = findGitRoot(cwd);

  if (!gitRoot) {
    console.error(chalk.red('✖  No git repository found. Run `git init` first.'));
    process.exit(1);
  }

  // Create .ghost/logs directory
  const ghostDir = path.join(gitRoot, '.ghost', 'logs');
  fs.mkdirSync(ghostDir, { recursive: true });
  console.log(chalk.green('✔  Created .ghost/logs/'));

  // Write .ghost/.gitignore so logs stay local
  const ghostGitignore = path.join(gitRoot, '.ghost', '.gitignore');
  fs.writeFileSync(ghostGitignore, '*\n!.gitignore\n');
  console.log(chalk.green('✔  Created .ghost/.gitignore (logs stay local)'));

  // Install prepare-commit-msg hook
  const hooksDir = path.join(gitRoot, '.git', 'hooks');
  const hookPath = path.join(hooksDir, 'prepare-commit-msg');

  const hookContent = fs.existsSync(path.join(gitRoot, 'node_modules'))
    ? HOOK_SCRIPT
    : HOOK_SCRIPT_GLOBAL;

  fs.mkdirSync(hooksDir, { recursive: true });
  fs.writeFileSync(hookPath, hookContent, { mode: 0o755 });
  console.log(chalk.green('✔  Installed prepare-commit-msg git hook'));

  // Write ghost-hook bin shim into node_modules/.bin if possible
  const binDir = path.join(gitRoot, 'node_modules', '.bin');
  if (fs.existsSync(binDir)) {
    const hookBin = path.join(binDir, 'ghost-hook');
    const hookSrc = path.resolve(__dirname, 'hook.js');
    const shim = `#!/usr/bin/env node\nrequire(${JSON.stringify(hookSrc)})(process.argv[2]);\n`;
    fs.writeFileSync(hookBin, shim, { mode: 0o755 });
  }

  console.log(chalk.cyan('\n👻 Ghost Log is ready! Run `ghost watch` to start capturing your thoughts.\n'));
}

module.exports = { ghostInit };
