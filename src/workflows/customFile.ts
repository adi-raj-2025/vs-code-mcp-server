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
      description: "Read the custom test cases input file from the TestData directory",
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

        const testDataPath = path.join(resourcesPath, 'TestData', `${input.javascriptName}Input.txt`);

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

  // ── Tool: custom-get-apigee-workflow-instructions ─────────────────────────
  server.registerTool("custom-get-apigee-workflow-instructions",
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
- Path: Use #auto-discover-resources tool to find your specific path

**DIRECTORY STRUCTURE (CRITICAL CONTEXT):**
apiproxy/
├── resources/
│   ├── jsc/                    # JavaScript source files
│   │   └── {javascript_name}/  
│   │       └── {javascript_name}.js  
│   ├── spec/                   # Test specification files
│   │   └── {javascript_name}Spec.js  
│   ├── TestData/               # Custom Test cases File
│   │   └── {javascript_name}Input.txt  
│   └── coverage/               

**KEY PATTERNS:**
1. Source file: resources/jsc/{X}/{X}.js
2. Test file: resources/spec/{X}Spec.js
3. Custom Test Data: resources/TestData/{X}Input.txt

**IMPORTANT:** Run #auto-discover-resources first to find your specific resources path.

**WORKFLOW STEPS:**

**1. IDENTIFY CURRENT COPLIOT CHAT CONTEXT FILE (CRITICAL FIRST STEP):**
   - **LOOK AT COPLIOT CHAT:** Check which SPECIFIC {javascript_name}Spec.js file is currently open in your Copilot chat context
   - **DECLARE THE FILE:** Explicitly state: "Current Copilot chat context file: {filename}Spec.js"
   - **EXTRACT NAME:** Extract the base {javascript_name} (remove 'Spec.js' from the end)

**2. GET CUSTOM TEST CASES DATA:**
   - Use the #read-custom-test-data tool, passing the {javascript_name} you just extracted.
   - This will provide you with the user's specific test scenarios.

**3. IMPROVE ONLY THE CURRENT COPLIOT FILE:**
   - **MODIFY ONLY:** Only modify the {javascript_name}Spec.js file currently open in your Copilot chat
   - **ADD TESTS:** Add test cases strictly based on the requirements and inputs provided in the {javascript_name}Input.txt file.
   - **NEVER modify:** .js source files in jsc/
   - **DO NOT EVEN LOOK AT:** Any other Spec.js files in the folder

**4. FINALIZE:**
   - Provide a summary of the added custom tests.
   - Workflow is COMPLETE for this file.

**STRICT COPLIOT-CONTEXT RULES:**
✅ DO: Work on ONLY the Spec.js file currently open in your Copilot chat
✅ DO: Declare the current file name before any analysis
✅ DO: Read the Custom Test Data from TestData/{javascript_name}Input.txt
❌ DON'T: Modify .js source files
❌ DON'T: Modify any Spec.js files except the one in current Copilot chat
`
        }]
      };
    }
  );

  // ── Prompt: CustomjavascriptFile ──────────────────────────────────────────
  server.registerPrompt("CustomjavascriptFile",
    {
      description: "Generate test cases based on user input from TestData folder for a single file",
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

Run this tool: #auto-discover-resources

**STEP 2: NAVIGATE TO DISCOVERED DIRECTORY**

After running #auto-discover-resources, you'll get a command like:
\`cd "C:\\\\path\\\\to\\\\your\\\\apiproxy\\\\resources"\`

Run that EXACT command using #runInTerminal.

**STEP 3: GET WORKFLOW INSTRUCTIONS**

Call this tool to get complete instructions: #custom-get-apigee-workflow-instructions.

**STEP 4: EXECUTE THE WORKFLOW - COPLIOT CONTEXT FILE ONLY**

Follow the instructions from #custom-get-apigee-workflow-instructions exactly.

**MANDATORY FIRST ACTION - DECLARE CURRENT FILE:**
**Before doing ANY analysis, you MUST declare which file is open in your Copilot chat.**

**Example declaration:** "Current Copilot chat context file: AddContentLanguageHeaderSpec.js"

**Single File Process:**
1. **DECLARE:** State which Spec.js file is open in your Copilot chat
2. **EXTRACT NAME:** Determine the base javascript_name (e.g., AddContentLanguageHeader)
3. **READ DATA:** Use #read-custom-test-data with the extracted name
4. **MODIFY:** Add test cases to the declared Spec.js file based on the custom data
5. **FINISH:** Provide a summary for this specific file. Workflow is COMPLETE.

**CRITICAL COPLIOT-CONTEXT RULES:**
- **WORK ON ONE FILE ONLY:** The Spec.js file currently open in your Copilot chat
- **READ CUSTOM DATA:** Base the tests entirely on the {javascript_name}Input.txt file in TestData.
- **NEVER modify** .js source files

**REQUIRED DECLARATION BEFORE PROCEEDING:**
**What is the EXACT {javascript_name}Spec.js file currently open in your Copilot chat context?**`
          }
        }]
      };
    }
  );
}
