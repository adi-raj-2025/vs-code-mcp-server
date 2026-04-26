# Model Context & Developer Guide (model-README.md)

**Greetings, fellow AI / Agentic Developer!** 👋
If you are reading this, the user has likely assigned you to work on, debug, or extend this repository. This document contains all the deep architectural context, design decisions, and "gotchas" you need to understand the codebase instantly.

---

## 🎯 What is this repository?

This is a **Model Context Protocol (MCP) Server** built in TypeScript using `@modelcontextprotocol/sdk`. 

However, it is not a standard data-fetching tool. **It is an "Agentic Workflow Manager."** 
Its primary purpose is to provide an executing AI (like GitHub Copilot Chat, Cline, etc.) with a specific set of tools and structured prompts so that the AI can enter an **autonomous, iterative loop** to write Jasmine tests and achieve 100% code coverage for Apigee JavaScript policies.

---

## 📁 Project Structure

The codebase was refactored from a single monolithic `src/server.ts` into a modular layout. Each workflow is now fully self-contained in its own file:

```
src/
├── server.ts                  ← Slim orchestrator: creates McpServer, wires all modules, starts stdio transport
├── tools/
│   └── shared.ts              ← Shared filesystem tools used by all workflows
└── workflows/
    ├── currentFile.ts         ← Workflow 1: Single Spec.js file (coverage-driven)
    ├── allFiles.ts            ← Workflow 2: All Spec.js files (global coverage-driven)
    └── customFile.ts          ← Workflow 3: Custom test data from TestCases/
```

Each workflow file exports a single `register*(server: McpServer): void` function. The `McpServer` instance is created once in `server.ts` and passed in — zero global state, zero coupling between modules.

**When modifying or adding a workflow:**
1. Edit (or create) the relevant file in `src/workflows/` or `src/tools/`.
2. If adding a new file, import and call its `register*` function in `src/server.ts`.
3. Run `npm run server:build` to compile.

---

## 🧠 Architectural Paradigm: "The Meta-Agent"

This MCP server manages another AI's behavior by feeding it highly restrictive, multi-step instructions.

### The Prompts (Slash Commands)
The entry points are the Prompts registered across the workflow modules:
1. **`/CurrentSpecWorkFlow`** (`src/workflows/currentFile.ts`): A single-file workflow. It forces the AI to filter its focus entirely to whatever `Spec.js` file the user currently has open and loops code coverage until 100%.
2. **`/AllSpecWorkFlow`** (`src/workflows/allFiles.ts`): A global workflow. It forces the AI to iterate over the entire project's coverage report and fix multiple files at once.
3. **`/CustomSpecWorkFlow`** (`src/workflows/customFile.ts`): A manual input workflow. It forces the AI to read specific test case requirements from `TestCases/{name}Test.txt` and generate tests for the open `Spec.js` file, completely bypassing code coverage execution.

### The Tools
Instead of making external API calls, these tools interact with the local file system and provide "Guardrails". They live in two places:

**`src/tools/shared.ts`** (used by all workflows):
- **`findResourcesDirectoryPath`**: Recursively searches the filesystem to find the Apigee `resources/` folder (which strictly contains `jsc/` and `spec/`). This avoids forcing the user to navigate the terminal manually.
- **`analyzeJasmineTestReport`**: Reads the `lcov.info` file and feeds it to the AI. This is the **only valid source of coverage truth** — the AI is instructed never to use terminal output for coverage data.
- **`findResourcesPathFromCurrentDir()`**: Exported helper function used internally by `read-custom-test-data`.

**`src/workflows/currentFile.ts`**:
- **`getCurrentSpecWorkFlowInstruction`**: Returns strict operational rules for the single-file workflow (including mandatory `#analyzeJasmineTestReport` enforcement).

**`src/workflows/allFiles.ts`**:
- **`getAllSpecWorkflowInstruction`**: Returns strict operational rules for the global workflow (including mandatory `#analyzeJasmineTestReport` enforcement).

**`src/workflows/customFile.ts`**:
- **`read-custom-test-data`**: Reads the user-provided manual test cases from the `TestCases` directory.
- **`getCustomSpecWorkFlowInstruction`**: Returns operational rules for the Custom Input workflow.

---

## ⚠️ Crucial Quirks & "Gotchas" (Read Before Modifying)

If you are asked to modify the workflow or tools, pay close attention to the following historical design decisions:

### 1. The "Elicitation" / Command Injection Problem
Initially, the server relied on storing the test command in a `.mcp-config.json` file, or using MCP tool `elicitation` blocks to ask the user for it. 
**The Problem:** Many MCP clients (like Copilot Chat) completely ignore `elicitation` requests from tools and will instead hallucinate a command (like `npm test`) to proceed autonomously.
**The Solution (Current Architecture):**
We removed configuration files entirely. Instead, the Prompts define an `argsSchema: { command: z.string() }`.
If the user doesn't provide the command in the slash command, the AI is fed a **"STEP 0" instruction** that literally forces it to output: *"Please provide the exact terminal command..."* and wait.
Additionally, if the AI attempts to call the workflow instructions tool *without* the command, the tool will return a hard `❌ ERROR` text block forcing the AI to stop. **Do not revert this to standard elicitation.**

### 2. Terminal Output vs. lcov.info (Critical Guardrail)
**The Problem:** After running the jasmine coverage command, the terminal shows test pass/fail results. The AI was prone to reading this terminal output and using it as coverage data instead of calling `#analyzeJasmineTestReport`.
**The Solution (Current Architecture):**
Every workflow instruction string now contains explicit, multi-layered rules:
- `⚠️ DO NOT read or parse the terminal output for coverage data.`
- `✅ YOU MUST call #analyzeJasmineTestReport RIGHT NOW — MANDATORY, NO EXCEPTIONS.`
- `❌ DON'T: Use terminal/console output to determine coverage — it only shows jasmine pass/fail, NOT lcov line data.`

**Do not remove or weaken these rules.** If you add new workflow steps that involve running the coverage command, always follow with the same explicit `#analyzeJasmineTestReport` enforcement pattern.

### 3. OS-Aware Execution
The server is explicitly designed to handle both **Windows** and **Linux/Mac** flawlessly, but prioritizes Windows.
- **Path Escaping:** In `findResourcesDirectoryPath` (`src/tools/shared.ts`), you will see `process.platform === 'win32'` checks. Backslashes are only double-escaped `\\` on Windows so PowerShell doesn't choke. Do not break Linux by escaping forward slashes `/`.
- **Command Syntax:** The AI is dynamically instructed to use `& {command}` for Windows PowerShell, but just `{command}` for Bash.

### 4. Build Process & Dev Dependencies
- Source files are in `src/`.
- Compiled files go to `build/`.
- **Always run `npm run server:build`** after modifying any file under `src/` to ensure TypeScript transpiles to `build/server.js`. The user's MCP client executes `build/server.js`, *not* the `.ts` files.
- `tsx` is listed as a **devDependency** and is required for `npm run server:dev` (used by the inspector). If `tsx` is missing, the MCP inspector will fail with `SyntaxError: Unexpected token '>'` because npm's own output gets written to stdout and corrupts the stdio JSON stream.
- The `server:inspect` script uses `set DANGEROUSLY_OMIT_AUTH=true` (no spaces around `=`). Spaces around the `=` sign in a Windows `set` command create a variable with a trailing space in its name, silently breaking auth bypass.
- The `server:inspect` script passes `--silent` to the inner `npm run server:dev` call to suppress npm's own banner from polluting the MCP stdio channel.

---

## 🛠️ Your Workflow as an AI Contributor

If the user asks you to add a new feature (e.g., adding TypeScript support for the generated test files, or supporting a new framework):
1. Identify which workflow file to modify: `src/workflows/currentFile.ts`, `allFiles.ts`, or `customFile.ts`. For shared utilities, use `src/tools/shared.ts`.
2. If creating a brand-new workflow, create a new file in `src/workflows/`, export a `register*(server: McpServer): void` function, and import + call it in `src/server.ts`.
3. Keep the strict "AI Rules" strings intact, or update them explicitly if the behavior needs to change. Pay special attention to the `#analyzeJasmineTestReport` enforcement blocks — never remove them.
4. Run `npm run server:build` to compile.
5. Verify the `build/` and `global/` directories remain in `.gitignore`.

Good luck! You have all the context you need to build upon this agentic framework.
