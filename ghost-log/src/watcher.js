'use strict';

const chokidar = require('chokidar');
const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const { saveThought } = require('./store');

const CODE_EXTENSIONS = /\.(js|ts|jsx|tsx|py|rb|go|rs|java|c|cpp|cs|php|swift|kt|dart|vue|svelte|html|css|scss|json|yaml|yml|md|sh|bash)$/;

function startWatcher(quietMinutes = 10) {
  const cwd = process.cwd();
  const quietMs = quietMinutes * 60 * 1000;
  let silenceTimer = null;
  let lastActivity = null;
  let isPrompting = false;
  let sessionFiles = new Set();

  console.log(chalk.cyan(`\n👻 Ghost Log is watching... (quiet period: ${quietMinutes}m)\n`));
  console.log(chalk.gray('   Ctrl+C to stop\n'));

  const watcher = chokidar.watch(cwd, {
    ignored: [
      /(^|[/\\])\../, // dot files/dirs
      /node_modules/,
      /\.ghost/,
      /\.git/,
    ],
    persistent: true,
    ignoreInitial: true,
  });

  function onActivity(filePath) {
    if (!CODE_EXTENSIONS.test(filePath)) return;
    if (isPrompting) return;

    sessionFiles.add(path.relative(cwd, filePath));
    lastActivity = Date.now();

    clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => triggerPrompt(), quietMs);
  }

  async function triggerPrompt() {
    if (isPrompting || sessionFiles.size === 0) return;
    isPrompting = true;

    console.log(chalk.gray('\n─'.repeat(50)));
    console.log(chalk.magenta(`  Files touched: ${[...sessionFiles].slice(0, 5).join(', ')}${sessionFiles.size > 5 ? ` +${sessionFiles.size - 5} more` : ''}`));

    try {
      const { thought } = await inquirer.prompt([
        {
          type: 'input',
          name: 'thought',
          message: chalk.white('👻 What was the logic behind that last session?') + chalk.gray(' (Enter to skip)'),
        },
      ]);

      if (thought && thought.trim()) {
        await saveThought({
          thought: thought.trim(),
          files: [...sessionFiles],
          timestamp: new Date().toISOString(),
        });
        console.log(chalk.green('  ✔  Captured.\n'));
      } else {
        console.log(chalk.gray('  Skipped.\n'));
      }
    } catch {
      // inquirer throws on Ctrl+C — exit gracefully
      console.log(chalk.yellow('\n👻 Ghost Log stopped.'));
      process.exit(0);
    }

    sessionFiles.clear();
    isPrompting = false;
  }

  watcher.on('change', onActivity);
  watcher.on('add', onActivity);

  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n👻 Ghost Log stopped.'));
    watcher.close();
    process.exit(0);
  });
}

module.exports = { startWatcher };
