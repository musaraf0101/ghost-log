#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { getThoughtsSinceLastCommit } = require('./store');

function run(commitMsgFile) {
  if (!commitMsgFile) {
    console.error('[ghost-log] No commit message file provided.');
    process.exit(1);
  }

  let lastCommitTime = null;
  try {
    const iso = execSync('git log -1 --format=%cI', { stdio: ['pipe', 'pipe', 'ignore'] })
      .toString()
      .trim();
    if (iso) lastCommitTime = iso;
  } catch {
    // no commits yet
  }

  const thoughts = getThoughtsSinceLastCommit(lastCommitTime);

  if (thoughts.length === 0) return;

  const existing = fs.readFileSync(commitMsgFile, 'utf8');

  const lines = thoughts.map((t) => {
    const time = new Date(t.timestamp).toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    const files = t.files && t.files.length
      ? `\n#   Files: ${t.files.slice(0, 4).join(', ')}${t.files.length > 4 ? ` +${t.files.length - 4} more` : ''}`
      : '';
    return `# [${time}] ${t.thought}${files}`;
  });

  const section = [
    '',
    '# ─── Ghost Log Context ──────────────────────────────────────',
    ...lines,
    '# ─────────────────────────────────────────────────────────────',
  ].join('\n');

  fs.writeFileSync(commitMsgFile, existing.trimEnd() + '\n' + section + '\n');
}

module.exports = run;

if (require.main === module) {
  run(process.argv[2]);
}
