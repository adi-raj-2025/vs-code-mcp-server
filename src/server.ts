import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFile } from "node:fs/promises";
import { loadConfig, saveConfig } from "./config";

const server = new McpServer({
  name: "apigee-trial-server",
  version: "1.0.0",
});


server.registerResource("analyze-apigee-report", "reports://all",
    {
        description : "Get all reports of jasmine test cases for all javascripts files",
        title : "report"
    },
    async (uri) => {
        const filePath = "C:/Users/Aditya Raj/Downloads/iterate-headers/apiproxy/resources/coverage/lcov.info";
        const fileContent = await readFile(filePath, "utf-8");
        return {
            contents: [
            {
                uri : uri.href,
                text : JSON.stringify(fileContent)
            }
            ],
        };
    }
);


server.registerTool("add-jasmine-dependency",
  {
    title: "Apigee Code Coverage Report",
    description: "Run Apigee code coverage report",
    inputSchema: z.object({
      command: z.string().optional(),
      path: z.string().optional()
    })
  },
  async (input) => {

    // ✅ Save after elicitation response
    if (input.command && input.path) {
      saveConfig({
        command: input.command,
        path: input.path
      });
    }

    const config = loadConfig();

    // ✅ Elicitation (allowed here)
    if (!config.command || !config.path) {
      return {
        content: [
          {
            type: "text",
            text: "I need some information to run the code coverage report."
          }
        ],
        elicitation: {
          prompt: "Please provide the command to run code coverage (this will be remembered)",
          fields: [
            {
              name: "command",
              label: "Coverage command",
              placeholder: "npm run coverage",
              required: true
            },
            {
              name: "path",
              label: "Project path",
              placeholder: "D:\\apigee\\repo",
              required: true
            }
          ]
        }
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `Running stored command: "${config.command}" in ${config.path}`
        }
      ]
    };
  }
);


server.registerPrompt("automate-test-case",
  {
    description: "Generate and analyze code coverage report for Apigee project"
    // Remove the argsSchema since we're loading from config
  },
  async (params) => {
    const config = loadConfig();
    const effectivePath = config.path;
    const effectiveCommand = config.command;

    if (!effectivePath || !effectiveCommand) {
      return {
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: `I need to configure the Apigee code coverage report first. 
Please use #add-jasmine-dependency tool to save the configuration.`
          }
        }]
      };
    }

    // Escape backslashes for the path in the command
    const escapedPath = effectivePath.replace(/\\/g, '\\\\');
    
    return {
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `I need to run automated test case generation with code coverage analysis.

**Configuration:**
- Path: ${effectivePath}
- Command: ${effectiveCommand}

**CRITICAL: THIS IS A POWERSHELL COMMAND - DO NOT CHANGE THE SYNTAX**

**Instructions:**
1. FIRST: Run the coverage command in terminal using #runInTerminal with this EXACT PowerShell command:
   \`cd "${escapedPath}"; & ${effectiveCommand}\`

   **DO NOT** change \`; &\` to \`&&\` or any other syntax. This is correct for Windows PowerShell.

2. AFTER the command completes, analyze the report using the #analyze-apigee-report resource.

3. Based on analysis:
   - Identify uncovered lines/functions/branches
   - Add or modify test cases in the corresponding Spec.js file
   - Ensure no syntax errors are introduced

4. After modifying tests, run the coverage command again (same as step 1 - EXACT same syntax)

5. Analyze new report and check if coverage is 100%

6. If not 100%, repeat steps 3-5 until full coverage is achieved
   If 100% coverage is achieved, provide final summary and stop.

**Important:**
- Only run the coverage command once per iteration
- Do not attempt to fix or re-run the command syntax - the \`; &\` syntax is correct
- Focus on analyzing the report and improving test coverage
- Track progress between iterations
- The command uses Windows PowerShell \`; &\` syntax which is different from bash's \`&&\``
        }
      }]
    };
  }
);


async function main(){
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Apigee MCP Server running on stdio");
  // try{
  //   const res = await runApigeeCodeCoverageReport(
  // "C:\\Users\\Aditya Raj\\Downloads\\iterate-headers\\apiproxy\\resources");
  //   console.log(res);
  // }
  // catch(error){
  //     console.error(error);
  // }
}
  
main();