# Apigee Test Automation MCP Server

This Model Context Protocol (MCP) server acts as an AI agent designed to automate the generation of Jasmine test cases for Apigee JavaScript policies. By analyzing code coverage reports, the server guides an AI Copilot (like GitHub Copilot Chat) to iteratively write missing tests until you achieve 100% coverage.

## Features

- 🔍 **Auto-Discovery** – Automatically locates your Apigee `resources/` directory from any starting path.
- 📊 **Coverage Analysis** – Ingests `lcov.info` to precisely target uncovered lines, functions, and branches.
- 🧪 **AI-Driven Iterations** – The AI autonomously runs coverage commands, analyzes gaps, and rewrites tests in a loop.
- 💻 **OS-Aware** – Fully supports Windows (PowerShell) and Linux/Mac (Bash) command execution seamlessly.
- 🔒 **Guardrailed Coverage Reads** – The AI is strictly instructed to always read coverage from the `lcov.info` file (via `#analyze-apigee-report`) and never rely on terminal output.

---

## The Workflows

The server provides three primary workflows (Slash Commands/Prompts):

1. **`/CurrentjavascriptFile` (Single File Workflow)**
   Perfect for when you have a specific `Spec.js` file open in your editor. The AI will strictly filter its analysis and edits exclusively to that single file, ignoring the rest of the project until that file reaches 100% coverage.

2. **`/AlljavascriptFile` (Global Workflow)**
   The AI will ingest the entire project's coverage report and iteratively work through *every* uncovered file, adding tests to multiple files until global 100% coverage is achieved across the entire project.

3. **`/CustomjavascriptFile` (Custom Input Workflow)**
   Perfect for when you want to supply custom test scenarios instead of relying on coverage gaps. The AI will read your requirements from `resources/TestData/{your_file}Input.txt` and generate the exact tests you asked for in your currently open `Spec.js` file. This workflow does not run tests or require a coverage command.

---

## Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or later)
- An Apigee project with the standard structure (`apiproxy/resources/jsc/` and `apiproxy/resources/spec/`).

### Building Locally

```bash
git clone <repository-url>
cd vs-code-mcp-server
npm install
npm run server:build
```

### Inspecting the Server (Development)

Use the MCP Inspector UI to browse tools and prompts interactively:

```bash
npm run server:inspect
```

This launches the inspector at `http://localhost:6274` with authentication disabled for local development.

> **Note:** The `server:dev` script runs the server directly via `tsx` (included as a dev dependency). No pre-build step is needed when using the inspector.

### Running Locally (Connecting to your IDE)

To connect this server to your MCP client (like VS Code GitHub Copilot or Cline), you need to configure your IDE's MCP settings file (often `mcp.json` or `cline_mcp_settings.json`).

**Example configuration using standard Node.js (after building):**
```json
{
  "mcpServers": {
    "apigee-automation": {
      "command": "node",
      "args": ["build/server.js"],
      "cwd": "C:/absolute/path/to/vs-code-mcp-server"
    }
  }
}
```

**Or run it dynamically using the dev script:**
```json
{
  "mcpServers": {
    "apigee-automation": {
      "command": "npm",
      "args": ["run", "server:dev"],
      "cwd": "C:/absolute/path/to/vs-code-mcp-server"
    }
  }
}
```

*(Note: Make sure to replace the `cwd` paths with the actual absolute path to where you cloned this repository.)*

Once saved, **restart your IDE or MCP client** so it establishes the connection to the server.

---

## How to Use

Using the automation is incredibly easy. Simply open your AI Chat interface and trigger the prompt.

### **Step 1: Trigger the workflow**
Type `/CurrentjavascriptFile` (or use your IDE's slash command menu). 

*Tip: If your IDE supports prompt arguments, you can optionally provide your coverage command directly (e.g. `/CurrentjavascriptFile "npm test"`).*

### **Step 2: Provide the Coverage Command**
If you didn't provide the command in Step 1, the AI is strictly instructed to stop and ask you for it:
> *"Please provide the exact terminal command to run code coverage (e.g. for PowerShell or Bash)."*

Reply with your standard coverage execution command, for example:
```powershell
"C:\Users\username\istanbul" cover "C:\Users\username\jasmine-node" spec
```

### **Step 3: Watch the AI Work!**
The AI will acknowledge your command and immediately execute its autonomous loop:
1. It runs the `#auto-discover-resources` tool to find your files.
2. It executes your coverage command in your IDE's terminal.
3. It **immediately** calls the `#analyze-apigee-report` tool to read the generated `lcov.info` — it does **not** use the terminal output for coverage data.
4. It identifies the gaps in coverage and edits your `Spec.js` files to add the missing assertions.
5. It re-runs the coverage command and repeats from step 3 until coverage is 100%.

> ⚠️ **Important:** The terminal output after running the coverage command shows Jasmine pass/fail results only — it does **not** contain line-level lcov data. The AI is strictly instructed to always call `#analyze-apigee-report` to read `lcov.info` directly.

---

## Available Tools (Under the Hood)

These are the tools the AI uses autonomously to interact with your filesystem. You don't need to call these yourself!

| Tool | Description |
|---|---|
| `#auto-discover-resources` | Recursively searches the current directory to locate the Apigee `resources` folder. |
| `#analyze-apigee-report` | Reads and formats the raw `lcov.info` file — the **only** valid source of coverage truth. |
| `#read-custom-test-data` | Reads specific test cases from `resources/TestData/{name}Input.txt`. |
| `#get-apigee-workflow-instructions` | Feeds the AI strict operational rules and guardrails for the single-file workflow. |
| `#all-get-apigee-workflow-instructions` | Feeds the AI global operational rules and guardrails for the entire project workflow. |
| `#custom-get-apigee-workflow-instructions` | Feeds the AI operational rules for the Custom Input workflow. |

---

## Troubleshooting

- **`lcov.info not found`:** Ensure your coverage command actually generates an `lcov.info` file inside `resources/coverage/`.
- **Resources directory not discovered:** Ensure your terminal is opened inside or near the root of the Apigee project folder. The project must have a `resources/jsc` and `resources/spec` folder.
- **AI refuses to proceed:** The AI is strictly trained not to proceed without a valid terminal command. Make sure you answer its Step 0 question properly!
- **AI reads terminal output instead of lcov.info:** This is fixed by design — the workflow instructions explicitly forbid using terminal output and mandate calling `#analyze-apigee-report` after every coverage run.
- **`server:inspect` fails to start:** Ensure you have run `npm install` so that `tsx` (a dev dependency) is available. If the inspector shows JSON parse errors, ensure the `DANGEROUSLY_OMIT_AUTH` env var has no spaces around the `=` sign in the npm script.
