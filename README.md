# Apigee Test Automation MCP Server

This Model Context Protocol (MCP) server acts as an AI agent designed to automate the generation of Jasmine test cases for Apigee JavaScript policies. By analyzing code coverage reports, the server guides an AI Copilot (like GitHub Copilot Chat) to iteratively write missing tests until you achieve 100% coverage.

## Features

- 🔍 **Auto-Discovery** – Automatically locates your Apigee `resources/` directory from any starting path.
- 📊 **Coverage Analysis** – Ingests `lcov.info` to precisely target uncovered lines, functions, and branches.
- 🧪 **AI-Driven Iterations** – The AI autonomously runs coverage commands, analyzes gaps, and rewrites tests in a loop.
- 💻 **OS-Aware** – Fully supports Windows (PowerShell) and Linux/Mac (Bash) command execution seamlessly.

---

## The Workflows

The server provides two primary workflows (Slash Commands/Prompts):

1. **`/1.automate-test-case` (Single File Workflow)**
   Perfect for when you have a specific `Spec.js` file open in your editor. The AI will strictly filter its analysis and edits exclusively to that single file, ignoring the rest of the project until that file reaches 100% coverage.

2. **`/2.all-automate-test-case` (Global Workflow)**
   The AI will ingest the entire project's coverage report and iteratively work through *every* uncovered file, adding tests to multiple files until global 100% coverage is achieved across the entire project.

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
Type `/1.automate-test-case` (or use your IDE's slash command menu). 

*Tip: If your IDE supports prompt arguments, you can optionally provide your coverage command directly (e.g. `/1.automate-test-case "npm test"`).*

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
3. It uses the `#analyze-apigee-report` tool to read the generated `lcov.info`.
4. It identifies the gaps in coverage and edits your `Spec.js` files to add the missing assertions.
5. It re-runs the coverage command to verify success, repeating the loop until coverage is 100%.

---

## Available Tools (Under the Hood)

These are the tools the AI uses autonomously to interact with your filesystem. You don't need to call these yourself!

| Tool | Description |
|---|---|
| `#auto-discover-resources` | Recursively searches the current directory to locate the Apigee `resources` folder. |
| `#analyze-apigee-report` | Ingests and formats the raw `lcov.info` file for AI analysis. |
| `#get-apigee-workflow-instructions` | Feeds the AI strict operational rules and guardrails for the single-file workflow. |
| `#all-get-apigee-workflow-instructions` | Feeds the AI global operational rules and guardrails for the entire project workflow. |

---

## Troubleshooting

- **`lcov.info not found`:** Ensure your coverage command actually generates an `lcov.info` file inside `resources/coverage/`.
- **Resources directory not discovered:** Ensure your terminal is opened inside or near the root of the Apigee project folder. The project must have a `resources/jsc` and `resources/spec` folder.
- **AI refuses to proceed:** The AI is strictly trained not to proceed without a valid terminal command. Make sure you answer its Step 0 question properly!
