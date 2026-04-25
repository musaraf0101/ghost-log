#!/usr/bin/env node

'use strict';

const { Command } = require('commander');
const chalk = require('chalk');

const { ghostInit } = require('../src/init');
const { ghostReplay } = require('../src/replay');
const { startWatcher } = require('../src/watcher');
const { version } = require('../package.json');

const program = new Command();

program
  .name('ghost')
  .description(chalk.cyan('Ghost Log - your silent dev journal'))
  .version(version);

program
  .command('init')
  .description('Initialize Ghost Log in the current git repo')
  .action(ghostInit);

program
  .command('watch')
  .description('Start the background watcher (captures your "why" thoughts)')
  .option('-q, --quiet-period <minutes>', 'minutes of silence before prompting', '1')
  .action((opts) => startWatcher(parseInt(opts.quietPeriod, 10)));

program
  .command('replay')
  .description('Replay your dev thought timeline')
  .option('-n, --last <days>', 'show thoughts from last N days', '30')
  .action((opts) => ghostReplay(parseInt(opts.last, 10)));

program.parse(process.argv);
