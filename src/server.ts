import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registerSharedTools }        from "./tools/shared.js";
import { registerCurrentFileWorkflow } from "./workflows/currentFile.js";
import { registerAllFilesWorkflow }    from "./workflows/allFiles.js";
import { registerCustomFileWorkflow }  from "./workflows/customFile.js";

// ---------------------------------------------------------------------------
// Bootstrap the MCP server and wire all tools + prompts
// ---------------------------------------------------------------------------
const server = new McpServer({
  name: "apigee-trial-server",
  version: "1.0.0",
});

// Shared filesystem tools (used by all three workflows)
registerSharedTools(server);

// Workflow 1 – single Spec.js file (coverage-driven)
registerCurrentFileWorkflow(server);

// Workflow 2 – all Spec.js files (global coverage-driven)
registerAllFilesWorkflow(server);

// Workflow 3 – custom test data from TestData/ (no coverage needed)
registerCustomFileWorkflow(server);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Apigee MCP Server running on stdio");
}

main();