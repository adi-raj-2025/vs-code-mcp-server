# Model Context & Developer Guide (model-README.md)

**Greetings, fellow AI / Agentic Developer!** 👋
If you are reading this, the user has likely assigned you to work on, debug, or extend this repository. This document contains all the deep architectural context, design decisions, and "gotchas" you need to understand the codebase instantly.

---

## 🎯 What is this repository?

This is a **Model Context Protocol (MCP) Server** built in TypeScript using `@modelcontextprotocol/sdk`. 

However, it is not a standard data-fetching tool. **It is an "Agentic Workflow Manager."** 
Its primary purpose is to provide an executing AI (like GitHub Copilot Chat, Cline, etc.) with a specific set of tools and structured prompts so that the AI can enter an **autonomous, iterative loop** to write Jasmine tests and achieve 100% code coverage for Apigee JavaScript policies.

---

## 🧠 Architectural Paradigm: "The Meta-Agent"

This MCP server manages another AI's behavior by feeding it highly restrictive, multi-step instructions.

### The Prompts (Slash Commands)
The entry points are the Prompts registered in `src/server.ts`:
1. **`/1.automate-test-case`**: A single-file workflow. It forces the AI to filter its focus entirely to whatever `Spec.js` file the user currently has open.
2. **`/2.all-automate-test-case`**: A global workflow. It forces the AI to iterate over the entire project's coverage report and fix multiple files at once.

### The Tools
Instead of making external API calls, these tools interact with the local file system and provide "Guardrails":
- **`auto-discover-resources`**: Recursively searches the filesystem to find the Apigee `resources/` folder (which strictly contains `jsc/` and `spec/`). This avoids forcing the user to navigate the terminal manually.
- **`analyze-apigee-report`**: Reads the `lcov.info` file and feeds it to the AI.
- **`get-apigee-workflow-instructions`** & **`all-get-apigee-workflow-instructions`**: These are critical. They do not execute code. Instead, they return massive strings of markdown containing strict rules (e.g., "NEVER modify .js files", "DO NOT guess commands"). They act as injected context windows.

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

### 2. OS-Aware Execution
The server is explicitly designed to handle both **Windows** and **Linux/Mac** flawlessly, but prioritizes Windows.
- **Path Escaping:** In `auto-discover-resources`, you will see `process.platform === 'win32'` checks. Backslashes are only double-escaped `\\` on Windows so PowerShell doesn't choke. Do not break Linux by escaping forward slashes `/`.
- **Command Syntax:** The AI is dynamically instructed to use `& {command}` for Windows PowerShell, but just `{command}` for Bash.

### 3. Build Process
- Source files are in `src/`.
- Compiled files go to `build/`.
- **Always run `npm run server:build`** after modifying `src/server.ts` to ensure the TypeScript transpiles to `build/server.js`. The user's MCP client executes the `build/server.js` file, *not* the `.ts` file.

---

## 🛠️ Your Workflow as an AI Contributor

If the user asks you to add a new feature (e.g., adding TypeScript support for the generated test files, or supporting a new framework):
1. Modify `src/server.ts`.
2. Keep the strict "AI Rules" strings intact, or update them explicitly if the behavior needs to change.
3. Run `npm run server:build` to compile.
4. Verify the `build/` and `global/` directories remain in `.gitignore`.

Good luck! You have all the context you need to build upon this agentic framework.
