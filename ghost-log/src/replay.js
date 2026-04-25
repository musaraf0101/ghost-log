'use strict';

const chalk = require('chalk');
const { loadThoughts } = require('./store');

const DAY_COLORS = [
  chalk.cyan,
  chalk.green,
  chalk.yellow,
  chalk.magenta,
  chalk.blue,
];

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric', year: 'numeric',
  });
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  });
}

function groupByDay(thoughts) {
  const map = new Map();
  for (const t of thoughts) {
    const day = new Date(t.timestamp).toDateString();
    if (!map.has(day)) map.set(day, []);
    map.get(day).push(t);
  }
  return map;
}

function ghostReplay(lastDays = 30) {
  const thoughts = loadThoughts(lastDays);

  if (thoughts.length === 0) {
    console.log(chalk.yellow('\n👻 No thoughts captured yet. Run `ghost watch` while you code!\n'));
    return;
  }

  console.log(chalk.cyan('\n👻 Ghost Log — Dev Thought Timeline'));
  console.log(chalk.gray('─'.repeat(60)));

  const byDay = groupByDay(thoughts);
  let colorIndex = 0;

  for (const [day, entries] of byDay) {
    const color = DAY_COLORS[colorIndex % DAY_COLORS.length];
    colorIndex++;

    console.log('\n' + color.bold(`  ${formatDate(entries[0].timestamp)}`));
    console.log(chalk.gray('  ' + '─'.repeat(56)));

    for (const entry of entries) {
      const time = chalk.gray(formatTime(entry.timestamp));
      const thought = chalk.white(entry.thought);
      console.log(`  ${time}  ${thought}`);

      if (entry.files && entry.files.length) {
        const files = entry.files.slice(0, 3).join(chalk.gray(', '));
        const more = entry.files.length > 3 ? chalk.gray(` +${entry.files.length - 3} more`) : '';
        console.log(chalk.gray(`          ↳ ${files}${more}`));
      }
    }
  }

  console.log(chalk.gray('\n' + '─'.repeat(60)));
  console.log(chalk.cyan(`  Total: ${thoughts.length} thought${thoughts.length !== 1 ? 's' : ''} over ${byDay.size} day${byDay.size !== 1 ? 's' : ''}\n`));
}

module.exports = { ghostReplay };
