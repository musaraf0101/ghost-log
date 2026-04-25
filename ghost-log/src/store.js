'use strict';

const fs = require('fs');
const path = require('path');

function findGhostDir(startDir) {
  let dir = startDir || process.cwd();
  while (dir !== path.parse(dir).root) {
    const candidate = path.join(dir, '.ghost', 'logs');
    if (fs.existsSync(candidate)) return candidate;
    dir = path.dirname(dir);
  }
  return null;
}

function saveThought(data) {
  const logsDir = findGhostDir();
  if (!logsDir) {
    throw new Error('Ghost Log not initialized. Run `ghost init` first.');
  }
  const ts = data.timestamp || new Date().toISOString();
  const filename = ts.replace(/[:.]/g, '-') + '.json';
  fs.writeFileSync(path.join(logsDir, filename), JSON.stringify(data, null, 2));
}

function loadThoughts(sinceDaysAgo) {
  const logsDir = findGhostDir();
  if (!logsDir) return [];

  const cutoff = sinceDaysAgo
    ? Date.now() - sinceDaysAgo * 24 * 60 * 60 * 1000
    : 0;

  return fs
    .readdirSync(logsDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try { return JSON.parse(fs.readFileSync(path.join(logsDir, f), 'utf8')); }
      catch { return null; }
    })
    .filter(Boolean)
    .filter((t) => new Date(t.timestamp).getTime() >= cutoff)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

function getThoughtsSinceLastCommit(lastCommitTime) {
  const logsDir = findGhostDir();
  if (!logsDir) return [];

  const cutoff = lastCommitTime ? new Date(lastCommitTime).getTime() : 0;
  return fs
    .readdirSync(logsDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try { return JSON.parse(fs.readFileSync(path.join(logsDir, f), 'utf8')); }
      catch { return null; }
    })
    .filter(Boolean)
    .filter((t) => new Date(t.timestamp).getTime() > cutoff)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

module.exports = { saveThought, loadThoughts, getThoughtsSinceLastCommit, findGhostDir };
