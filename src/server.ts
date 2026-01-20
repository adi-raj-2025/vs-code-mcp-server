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
    description: "Generate and analyze code coverage report for Apigee project",
    argsSchema: {
      path: z.string().optional().describe("Absolute path to the Apigee local repository"),
      command: z.string().optional().describe("Command to run")
    }
  },
  async (params) => {
    const config = loadConfig();
    const effectivePath = params.path || config.path;
    const effectiveCommand = params.command || config.command;

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

    return {
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `
Follow the below steps strictly without skipping any steps.

**Configuration**
- Path: ${effectivePath}
- Command: ${effectiveCommand}

---

### Step 1: Navigate to project directory and run generate report command
Use #runInTerminal:
\`\`\`
cd "${effectivePath}; & "${effectiveCommand}"
\`\`\`

---

### Step 2: Analyze coverage report
Now analyze the coverage report calling existing mcp resource analyze-apigee-report whose url:- reports://all -> strictly follow this.

**Analysis rules:**
- Identify unit test file:  
  \`<ActualJavascriptFileName>Spec.js\`
- Extract \`ActualJavascriptFileName\`
- Analyze only this source file:
  \`./jsc/<ActualJavascriptFileName>/<ActualJavascriptFileName>.js\`

Strictly Follow the below format for analysis and printing summary:  
**Generate and print a short summary with:** 
- Total test cases executed
- Statements coverage %
- Branch coverage %
- Function coverage %
- Functionality coverage (based on covered functions)
- List of uncovered:
  - Lines
  - Functions
  - Branches

Ignore coverage data of all other files.

### Step 3. **Add/Modify test cases**:
   - On the basis of your analysis of test cases, add new test cases for uncovered functionality
   - Also make sure that adding new test cases does not break existing functionality or should not throw syntax errors
   - Modify existing tests if they don't adequately cover certain paths

### Step 4. : Navigate to project directory and run generate report command  again
    Use #runInTerminal:
    \`\`\`
    cd "${effectivePath}; & "${effectiveCommand}"
    \`\`\`

### Step 5. **Analyze the new report** (reports://all again):
   - Check if coverage improved
   - Identify remaining uncovered elements

### Step 6.

**IF CODE COVERAGE IS 100%:**
- Provide final summary showing all metrics at 100%
- Confirm all lines, functions, and branches are covered
- Provide recommendations for maintaining coverage

**Important Notes:**
- Make incremental changes to test files
- Test each modification by running the coverage command
- Focus on meaningful tests that verify actual functionality
- Document what was added/modified in each iteration

**STOP HERE IF 100% COVERAGE IS ACHIEVED**

### ELSE (IF CODE COVERAGE IS NOT 100%):
- Go back to **Step 3** and repeat the process until full coverage is achieved.
`
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