import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as fs from 'fs';
import * as path from 'path';
import { findResourcesPathFromCurrentDir } from "../tools/shared.js";

// ---------------------------------------------------------------------------
// Register everything for the "Custom JavaScript File" workflow
// ---------------------------------------------------------------------------
export function registerCustomFileWorkflow(server: McpServer): void {

  // ── Tool: read-custom-test-data ───────────────────────────────────────────
  server.registerTool("read-custom-test-data",
    {
      title: "Read Custom Test Data",
      description: "Read the custom test cases input file from the TestCases directory",
      inputSchema: z.object({
        javascriptName: z.string().describe("The base name of the JavaScript file (without .js or Spec.js)"),
        resourcesPath: z.string().optional().describe("Optional path to resources directory (auto-discovers if not provided)")
      })
    },
    async (input) => {
      try {
        let resourcesPath = input.resourcesPath;

        if (!resourcesPath) {
          const discoveredPath = findResourcesPathFromCurrentDir();
          if (!discoveredPath) {
            return {
              content: [{
                type: "text",
                text: `❌ Could not find resources directory automatically. Please provide resourcesPath.`
              }]
            };
          }
          resourcesPath = discoveredPath;
        }

        const testDataPath = path.join(resourcesPath, 'TestCases', `${input.javascriptName}Test.txt`);

        if (!fs.existsSync(testDataPath)) {
          return {
            content: [{
              type: "text",
              text: `❌ Test data file not found at: ${testDataPath}\nPlease create this file with your custom test cases.`
            }]
          };
        }

        const fileContent = await fs.promises.readFile(testDataPath, 'utf-8');

        return {
          content: [{
            type: "text",
            text: `**Custom Test Data for ${input.javascriptName}**\n\n**File Path:** ${testDataPath}\n\n\`\`\`text\n${fileContent}\n\`\`\`\n\n**Instructions:**\nUse the requirements and scenarios described in this text to generate new test cases in the corresponding ${input.javascriptName}Spec.js file.`
          }]
        };

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{
            type: "text",
            text: `❌ Error reading test data file: ${errorMessage}`
          }]
        };
      }
    }
  );

  // ── Tool: getCustomSpecWorkFlowInstruction ─────────────────────────
  server.registerTool("getCustomSpecWorkFlowInstruction",
    {
      description: "Get the complete Apigee test automation workflow instructions for Custom Test Cases",
      inputSchema: z.object({})
    },
    async () => {
      return {
        content: [{
          type: "text",
          text: `**APIGEE CUSTOM TEST AUTOMATION WORKFLOW INSTRUCTIONS**

**CURRENT CONFIGURATION:**
- Path: Use #findResourcesDirectoryPath tool to find your specific path

**DIRECTORY STRUCTURE (CRITICAL CONTEXT):**
apiproxy/
├── resources/
│   ├── jsc/                    # JavaScript source files
│   │   └── {javascript_name}/  
│   │       └── {javascript_name}.js  
│   ├── spec/                   # Test specification files
│   │   └── {javascript_name}Spec.js  
│   ├── TestCases/               # Custom Test cases File
│   │   └── {javascript_name}Test.txt  
│   └── coverage/               

**KEY PATTERNS:**
1. Source file: resources/jsc/{X}/{X}.js
2. Test file: resources/spec/{X}Spec.js
3. Custom Test Data: resources/TestCases/{X}Test.txt

**IMPORTANT:** Run #findResourcesDirectoryPath first to find your specific resources path.

**WORKFLOW STEPS:**

**1. IDENTIFY CURRENT COPILOT CHAT CONTEXT FILE (CRITICAL FIRST STEP):**
   - **LOOK AT COPILOT CHAT:** Check which SPECIFIC {javascript_name}Spec.js file is currently open in your Copilot chat context
   - **DECLARE THE FILE:** Explicitly state: "Current Copilot chat context file: {filename}Spec.js"
   - **EXTRACT NAME:** Extract the base {javascript_name} (remove 'Spec.js' from the end)

**2. GET CUSTOM TEST CASES DATA:**
   - Use the #read-custom-test-data tool, passing the {javascript_name} you just extracted.
   - This will provide you with the user's specific test scenarios.

**3. IMPROVE ONLY THE CURRENT COPILOT FILE:**
   - **MODIFY ONLY:** Only modify the {javascript_name}Spec.js file currently open in your Copilot chat
   - **ADD TESTS:** Add test cases strictly based on the requirements and inputs provided in the {javascript_name}Test.txt file.
   - **NEVER modify:** .js source files in jsc/
   - **DO NOT EVEN LOOK AT:** Any other Spec.js files in the folder

**4. FINALIZE:**
   - Provide a summary of the added custom tests.
   - Workflow is COMPLETE for this file.

**STRICT COPILOT-CONTEXT RULES:**
✅ DO: Work on ONLY the Spec.js file currently open in your Copilot chat
✅ DO: Declare the current file name before any analysis
✅ DO: Read the Custom Test Data from TestCases/{javascript_name}Test.txt
❌ DON'T: Modify .js source files
❌ DON'T: Modify any Spec.js files except the one in current Copilot chat
`
        }]
      };
    }
  );

  // ── Prompt: CustomSpecWorkFlow ──────────────────────────────────────────
  server.registerPrompt("CustomSpecWorkFlow",
    {
      description: "Generate test cases based on user input from TestCases folder for a single file",
      argsSchema: {}
    },
    async () => {
      return {
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: `I need to execute the Custom Test Case workflow to add test cases based on specific user inputs.

**CRITICAL REQUIREMENT:** You must work on ONLY ONE Spec.js file - the one currently open in your Copilot chat context.

**WORKFLOW EXECUTION:**

**STEP 1: AUTO-DISCOVER RESOURCES DIRECTORY**

Run this tool: #findResourcesDirectoryPath

**STEP 2: NAVIGATE TO DISCOVERED DIRECTORY**

After running #findResourcesDirectoryPath, you'll get a command like:
\`cd "C:\\\\path\\\\to\\\\your\\\\apiproxy\\\\resources"\`

Run that EXACT command using #runInTerminal.

**STEP 3: GET WORKFLOW INSTRUCTIONS**

Call this tool to get complete instructions: #getCustomSpecWorkFlowInstruction.

**STEP 4: EXECUTE THE WORKFLOW - COPILOT CONTEXT FILE ONLY**

Follow the instructions from #getCustomSpecWorkFlowInstruction exactly.

**MANDATORY FIRST ACTION - DECLARE CURRENT FILE:**
**Before doing ANY analysis, you MUST declare which file is open in your Copilot chat.**

**Example declaration:** "Current Copilot chat context file: AddContentLanguageHeaderSpec.js"

**Single File Process:**
1. **DECLARE:** State which Spec.js file is open in your Copilot chat
2. **EXTRACT NAME:** Determine the base javascript_name (e.g., AddContentLanguageHeader)
3. **READ DATA:** Use #read-custom-test-data with the extracted name
4. **MODIFY:** Add test cases to the declared Spec.js file based on the custom data
5. **FINISH:** Provide a summary for this specific file. Workflow is COMPLETE.

**CRITICAL COPILOT-CONTEXT RULES:**
- **WORK ON ONE FILE ONLY:** The Spec.js file currently open in your Copilot chat
- **READ CUSTOM DATA:** Base the tests entirely on the {javascript_name}Test.txt file in TestCases.
- **NEVER modify** .js source files

**REQUIRED DECLARATION BEFORE PROCEEDING:**
**What is the EXACT {javascript_name}Spec.js file currently open in your Copilot chat context?**`
          }
        }]
      };
    }
  );
}
