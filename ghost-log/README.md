# Ghost Log

> Your silent dev journal - automatically captures the _why_ behind every commit.

Ghost Log watches you code in the background. After a quiet period it asks one question: **"What was the logic behind that last session?"** Your answer gets stored locally and injected into your next git commit message as context - no cloud, no account, no cost.

---

## Table of Contents

- [How It Works](#how-it-works)
- [Setup](#setup)
- [Initialize in Your Project](#initialize-in-your-project)
- [Usage](#usage)
- [Commands Reference](#commands-reference)
- [Project Structure](#project-structure)
- [How Each File Works](#how-each-file-works)
- [Local Storage](#local-storage)
- [Dependencies](#dependencies)
- [Testing Manually](#testing-manually)
- [Adding a New Command](#adding-a-new-command)
- [Publishing a New Version](#publishing-a-new-version)
- [Contributing](#contributing)
- [License](#license)

---

## How It Works

```
You code  →  Ghost watches silently  →  After 10 min quiet: "Why?"
     ↓
Your answer saved to .ghost/logs/
     ↓
You run git commit  →  Hook injects your thoughts into the commit message
     ↓
ghost replay  →  Beautiful timeline of every decision you made
```

---

## Setup

### Requirements

- Node.js 16+
- A git repository

### Option A - Install from NPM (recommended)

```bash
npm install -g ghost-log
```

### Option B - Run from source

```bash
git clone https://github.com/musaraf0101/ghost-log.git
cd ghost-log
npm install
npm link        # makes the `ghost` command available globally
```

To unlink when done:

```bash
npm unlink -g ghost-log
```

---

## Initialize in Your Project

Inside your project folder, run:

```bash
ghost init
```

Ghost Log sets everything up automatically. You are ready to go.

---

## Usage

### Start the watcher

```bash
ghost watch
```

Runs in the background and monitors file changes. After **10 minutes of silence** following activity, it asks:

```
👻 What was the logic behind that last session? (Enter to skip)
```

Type your reasoning, press Enter, and Ghost Log saves it. Press Enter with nothing to skip.

**Custom quiet period:**

```bash
ghost watch --quiet-period 5    # prompt after 5 minutes of silence
ghost watch --quiet-period 20   # prompt after 20 minutes
```

### Replay your thought timeline

```bash
ghost replay
```

Prints a color-coded timeline of every thought you captured:

```
👻 Ghost Log - Dev Thought Timeline
────────────────────────────────────────────────────────────

  Friday, Apr 24, 2026
  ────────────────────────────────────────────────────────
  10:02 AM  Switching to Postgres because SQLite can't handle the JSON load
          ↳ db/schema.js, models/user.js
  02:15 PM  Refactoring auth flow to use JWT instead of sessions
          ↳ auth/login.js, middleware/verify.js

────────────────────────────────────────────────────────────
  Total: 2 thoughts over 1 day
```

**Show last N days only:**

```bash
ghost replay --last 7     # last 7 days
ghost replay --last 90    # last 90 days
```

### What your commit messages look like

When you run `git commit`, the hook silently appends your recent thoughts as comments:

```
feat: add JWT authentication

# Ghost Log Context
# [Fri, Apr 24, 02:15 PM] Refactoring auth flow to use JWT instead of sessions
#   Files: auth/login.js, middleware/verify.js
```

The `#` lines are git comments — they appear in your editor but are **not** part of the final commit message.

---

## Commands Reference

| Command                            | Description                              |
| ---------------------------------- | ---------------------------------------- |
| `ghost init`                       | Set up Ghost Log in the current git repo |
| `ghost watch`                      | Start the background file watcher        |
| `ghost watch --quiet-period <min>` | Set custom quiet period in minutes       |
| `ghost replay`                     | Show your full thought timeline          |
| `ghost replay --last <days>`       | Show thoughts from last N days           |
| `ghost --version`                  | Show version number                      |
| `ghost --help`                     | Show help                                |

---

## Project Structure

```
ghost-log/
├── bin/
│   └── cli.js        ← Entry point. Defines all CLI commands using commander.
├── src/
│   ├── init.js       ← ghost init  : creates .ghost/ folder + installs git hook
│   ├── watcher.js    ← ghost watch : monitors file changes, triggers prompts
│   ├── hook.js       ← git hook    : reads thoughts, injects into commit message
│   ├── replay.js     ← ghost replay: loads + displays thought timeline
│   └── store.js      ← shared     : read/write JSON files in .ghost/logs/
├── docs/
│   └── ghost-log.md  ← original project spec
├── README.md
├── LICENSE
└── package.json
```

---

## How Each File Works

### `bin/cli.js`

The entry point. Uses `commander` to register three commands: `init`, `watch`, and `replay`. Each command delegates to its module in `src/`.

### `src/init.js`

Runs when the user executes `ghost init`. Does three things:

- Creates `.ghost/logs/` directory in the git root
- Writes `.ghost/.gitignore` so logs are never committed
- Copies the `prepare-commit-msg` hook into `.git/hooks/`

### `src/watcher.js`

Runs when the user executes `ghost watch`. Uses `chokidar` to watch the project directory. Starts a silence timer after every file save. When the timer expires (default 10 min), it prompts the user with `inquirer` and saves the answer via `store.js`.

### `src/hook.js`

Called automatically by git before every commit via the `prepare-commit-msg` hook. It:

1. Gets the timestamp of the last commit using `git log`
2. Loads all thoughts captured since that commit from `store.js`
3. Appends them as `#` comment lines to the commit message file

### `src/store.js`

Shared utility used by `watcher.js`, `hook.js`, and `replay.js`. Handles:

- `saveThought(data)` — writes a JSON file to `.ghost/logs/`
- `loadThoughts(days)` — reads and returns all thoughts, optionally filtered by date
- `getThoughtsSinceLastCommit(time)` — returns only thoughts after a given timestamp

### `src/replay.js`

Runs when the user executes `ghost replay`. Loads all thoughts via `store.js`, groups them by day, and prints a color-coded timeline using `chalk`.

---

## Local Storage

All thoughts are stored in your project's `.ghost/logs/` directory as plain JSON files:

```json
{
  "thought": "Switching to Postgres because SQLite can't handle the JSON load",
  "files": ["db/schema.js", "models/user.js"],
  "timestamp": "2026-04-24T10:02:00.000Z"
}
```

- **No cloud** — everything stays on your machine
- **No auth** — no accounts or API keys needed
- **No cost** — $0 forever
- `.ghost/` is git-ignored by default so thoughts never leak into your repo

---

## Dependencies

| Package      | Version | Purpose                                   |
| ------------ | ------- | ----------------------------------------- |
| `chokidar`   | ^3.x    | File watcher (CPU-efficient)              |
| `inquirer`   | ^8.x    | Interactive terminal prompts              |
| `chalk`      | ^4.x    | Terminal colors                           |
| `commander`  | ^14.x   | CLI command parsing                       |
| `simple-git` | ^3.x    | Git operations (available for future use) |

> Versions are pinned to CommonJS-compatible majors. `chalk@5+`, `inquirer@9+`, and `chokidar@4+` are ESM-only and will break the project.

---

## Testing Manually

### Test `ghost init`

```bash
mkdir /tmp/test-project && cd /tmp/test-project
git init
ghost init
# Expected: .ghost/logs/ created, .git/hooks/prepare-commit-msg installed
```

### Test `ghost watch`

```bash
cd /tmp/test-project
ghost watch --quiet-period 1   # 1 minute quiet period for fast testing
# Edit any file, wait 1 min, answer the prompt
```

### Test the git hook

```bash
# Save a thought manually
node -e "
const { saveThought } = require('ghost-log/src/store');
saveThought({ thought: 'test thought', files: ['index.js'], timestamp: new Date().toISOString() });
"

# Simulate what the hook does
echo 'fix: test commit' > /tmp/msg.txt
node /path/to/ghost-log/src/hook.js /tmp/msg.txt
cat /tmp/msg.txt
# Expected: commit message with Ghost Log Context appended
```

### Test `ghost replay`

```bash
ghost replay
ghost replay --last 7
```

---

## Adding a New Command

1. Create `src/yourcommand.js` and export a function
2. Register it in `bin/cli.js`:

```js
const { yourCommand } = require("../src/yourcommand");

program.command("yourcommand").description("What it does").action(yourCommand);
```

---

## Publishing a New Version

```bash
# Patch release (bug fix)
npm version patch

# Minor release (new feature)
npm version minor

# Major release (breaking change)
npm version major

npm publish
git push && git push --tags
```

---

## Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Test manually using the steps above
5. Submit a pull request

No strict rules — keep it simple, keep it local-first, keep it $0.

---

## Tips

- Run `ghost watch` in a separate terminal while you code, or add it to your project's startup script
- Use `ghost replay` before writing a PR description — your context is already written
- The watcher ignores `node_modules`, `.git`, and dotfiles automatically
- Skipping a prompt (pressing Enter with no input) is fine — Ghost Log never forces you

---

## License

Public Domain — see [LICENSE](LICENSE) for details.
