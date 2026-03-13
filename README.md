# Apigee Test Automation MCP Server

This Model Context Protocol (MCP) server automates the generation of Jasmine test cases for Apigee JavaScript policies by analyzing code coverage reports. It provides two primary workflows:

- **`/mcp.apigee_trial.automate-test-case`** – Improves coverage for the **currently open Spec.js file** (single-file context).
- **`/mcp.apigee_trial.all-automate-test-case`** – Works on **all JavaScript files** to achieve 100% global coverage.

The server dynamically discovers your Apigee project structure, runs the coverage command, parses `lcov.info`, and suggests (or automatically adds) missing test cases.

---

## Features

- 🔍 **Auto-discovery** – Finds the `resources` directory (containing `jsc/` and `spec/`) from your current working directory.
- 📊 **Coverage analysis** – Parses `lcov.info` to identify uncovered lines, functions, and branches.
- ✍️ **Test case generation** – Suggests or automatically appends test snippets to the corresponding `Spec.js` files.
- 🧪 **Two workflows**:
  - **Single-file** – Focus only on the Spec file currently open in your Copilot chat.
  - **Global** – Improves all files until every JavaScript file reaches 100% coverage.
- 🛠️ **Configuration persistence** – Stores your coverage command in `.mcp-config.json` for reuse.

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later)
- An Apigee project with the following structure:

```
apiproxy/
└── resources/
    ├── jsc/                 # JavaScript source files (each in its own subfolder)
    │   └── myPolicy/
    │       └── myPolicy.js
    ├── spec/                # Jasmine test files
    │   └── myPolicySpec.js
    └── coverage/            # Generated coverage reports (created after running the tool)
        └── lcov.info
```

---

# Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/apigee-test-automation-mcp.git
cd apigee-test-automation-mcp
```

### 2. Install dependencies

```bash
npm install
```

### 3. Build the project (if using TypeScript)

```bash
npm run build
```

### 4. Start the MCP server

```bash
node dist/index.js
```

The server will run on **stdio** and is ready to be connected by an MCP client (e.g., **VS Code with Copilot Chat**).

---

# Configuration

Before using the automation, you must set up your **coverage command**.

## `#add-jasmine-dependency`

This tool stores the PowerShell command needed to generate coverage reports.

### Usage (first time)

```
#add-jasmine-dependency
```

The server will ask for your coverage command, for example:

```
"C:\Users\...\istanbul" cover "C:\Users\...\jasmine-node" spec
```

Provide it once; it will be saved in **`.mcp-config.json`** in the current directory.

To update the command, simply run the tool again and supply the new command.

**Note:** The path to your `resources` directory is **not stored** – it is auto-discovered each time you run a workflow.

---

# Usage – Single-File Workflow (`automate-test-case`)

Use this when you have a specific **Spec.js** file open in your Copilot chat and want to bring only that corresponding JavaScript file to **100% coverage**.

## Steps

1. Open the desired `{policyName}Spec.js` file in your editor.

2. Run the command:

```
/mcp.apigee_trial.automate-test-case
```

*(If your MCP client uses a different prefix, adjust accordingly.)*

3. Follow the instructions provided by the server:

- It will first ask you to auto-discover the resources directory via:

```
#auto-discover-resources
```

- Then you’ll need to `cd` into that directory.

- Finally, the server will guide you through the iterative loop:

  1. Run the coverage command.
  2. Analyze the report (using `#analyze-apigee-report`).
  3. Modify only the open **Spec.js** file based on uncovered elements.
  4. Re-run coverage until that single file reaches **100%**.

---

# Usage – Global Workflow (`all-automate-test-case`)

Use this to achieve **100% coverage across all JavaScript files** in your project.

## Steps

Run the command:

```
/mcp.apigee_trial.all-automate-test-case
```

The server will:

1. Auto-discover the resources path.
2. Read `resources/coverage/lcov.info`.
3. List all JavaScript files with less than **100% coverage**.
4. For each file, suggest test cases to add to the corresponding `Spec.js`.

By default, the tool **only suggests changes**.

To automatically append the test snippets to the files, add:

```
/mcp.apigee_trial.all-automate-test-case applyChanges:true
```

⚠️ **Use auto-apply with caution – always review the generated tests.**

After applying changes:

1. Re-run the coverage command.
2. Repeat until all files are at **100% coverage**.

---

# Example Workflow

Assume your project is at:

```
C:\my-apigee-proxy
```

and you have two policies: **AddHeader** and **RemoveHeader**.

### 1. Store coverage command (one time)

```
#add-jasmine-dependency
```

Provide:

```
"C:\Users\Me\AppData\Roaming\npm\istanbul" cover "C:\Users\Me\AppData\Roaming\npm\node_modules\jasmine-node\bin\jasmine-node" spec
```

### 2. Auto-discover path

```
#auto-discover-resources
```

Returns:

```
C:\my-apigee-proxy\apiproxy\resources
```

### 3. Navigate

```
cd "C:\my-apigee-proxy\apiproxy\resources"
```

### 4. Run coverage

```
& "C:\Users\Me\AppData\Roaming\npm\istanbul" cover "C:\Users\Me\AppData\Roaming\npm\node_modules\jasmine-node\bin\jasmine-node" spec
```

### 5. Global analysis

```
/mcp.apigee_trial.all-automate-test-case
```

Example result:

- **AddHeader.js – 75%** (missing line 12, function `validateInput`)
- **RemoveHeader.js – 80%** (missing branch at line 22)

The tool suggests tests for:

- `AddHeaderSpec.js`
- `RemoveHeaderSpec.js`

Apply changes (manually or with `applyChanges:true`), then re-run coverage.

---

# Tools Summary

| Tool / Command | Description |
|---|---|
| `#add-jasmine-dependency` | Stores the coverage command in `.mcp-config.json`. |
| `#auto-discover-resources` | Searches for the Apigee resources directory and returns its path. |
| `#analyze-apigee-report` | Returns the raw content of `resources/coverage/lcov.info` for AI analysis. |
| `#get-apigee-workflow-instructions` | Provides step-by-step instructions for the single-file workflow. |
| `#get-apigee-workflow-instructions-all` | Provides instructions for the global workflow. |
| `/mcp.apigee_trial.automate-test-case` | Initiates the single-file workflow (prompt). |
| `/mcp.apigee_trial.all-automate-test-case` | Performs global coverage analysis and optionally applies changes (tool). |

---

# Troubleshooting

**`lcov.info not found`**

Run the coverage command first using `#runInTerminal`.

---

**Resources directory not discovered**

Ensure you are inside or near the **Apigee project folder**. Try:

```
#auto-discover-resources
```

from the project root.

---

**Coverage command not stored**

Run:

```
#add-jasmine-dependency
```

and provide the command.

---

**Generated tests cause syntax errors**

Review the snippets; they are **simple placeholders** and may need adjustment for your test framework.

---

# Contributing

Contributions are welcome! Please open an **issue** or **pull request** on the GitHub repository.

---

# License

MIT