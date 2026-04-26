import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Register everything for the "All JavaScript Files" global coverage workflow
// ---------------------------------------------------------------------------
export function registerAllFilesWorkflow(server: McpServer): void {

  // ── Tool: all-get-apigee-workflow-instructions ────────────────────────────
  server.registerTool("all-get-apigee-workflow-instructions",
    {
      description: "Get the complete Apigee test automation workflow instructions for ALL Spec.js files (global coverage)",
      inputSchema: z.object({
        command: z.string().optional()
      })
    },
    async (input) => {
      const effectiveCommand = input.command;

      if (!effectiveCommand) {
        return {
          content: [{
            type: "text",
            text: `❌ ERROR: You must provide the 'command' argument to this tool.\n          \nIf you don't know the command, you MUST stop and ask the user for it. Do not guess it.`
          }]
        };
      }

      return {
        content: [{
          type: "text",
          text: `**APIGEE TEST AUTOMATION WORKFLOW INSTRUCTIONS – ALL FILES (GLOBAL COVERAGE)**

**CURRENT CONFIGURATION:**
- Coverage Command: ${effectiveCommand}
- Path: Use #auto-discover-resources tool to find your specific path

**DIRECTORY STRUCTURE (CRITICAL CONTEXT):**
apiproxy/
├── resources/
│   ├── jsc/                    # JavaScript source files
│   │   └── {javascript_name}/  # Each JS file has its own folder
│   │       └── {javascript_name}.js  # Actual JavaScript file
│   ├── spec/                   # Test specification files
│   │   └── {javascript_name}Spec.js  # Test files follow this pattern
│   └── coverage/               # Generated coverage reports
│       ├── lcov.info           # Coverage data file
│       └── lcov-report/        # HTML reports

**KEY PATTERNS:**
1. Source file: resources/jsc/{X}/{X}.js
2. Test file: resources/spec/{X}Spec.js
3. Coverage file: resources/coverage/lcov.info

**IMPORTANT:** Run #auto-discover-resources first to find your specific resources path.

**WORKFLOW STEPS – GLOBAL COVERAGE (ALL FILES):**

**1. INITIAL COVERAGE RUN:**
   Use #runInTerminal to execute the command with the correct OS syntax:
   - Windows PowerShell: \`& ${effectiveCommand}\`
   - Linux/Mac/Bash: \`${effectiveCommand}\`

   ⚠️ **CRITICAL — AFTER RUNNING THE COMMAND:**
   - **DO NOT read or parse the terminal output for coverage data.**
   - **The terminal output is jasmine test results only — it does NOT contain accurate lcov coverage data.**
   - **IMMEDIATELY** call the #analyze-apigee-report tool in the very next step.

**2. ANALYZE REPORT — MANDATORY TOOL CALL (NO EXCEPTIONS):**
   - ✅ **YOU MUST call #analyze-apigee-report tool RIGHT NOW.**
   - ❌ **DO NOT use terminal output to determine coverage.** The terminal shows jasmine pass/fail, NOT line-level lcov data.
   - ❌ **DO NOT skip this step or assume coverage percentages from the terminal.**
   - Call: #analyze-apigee-report — it reads the generated \`lcov.info\` file, which is the ONLY valid source of coverage truth.

**3. IDENTIFY ALL FILES WITH <100% COVERAGE:**
   - Parse the lcov data returned by #analyze-apigee-report to list **ALL** JavaScript files.
   - For each file, calculate coverage percentages (lines, functions, branches).
   - **Make a list** of all files that are **below 100%** in any metric.

**4. PRIORITIZE AND IMPROVE ALL TEST FILES:**
   - For **each** JavaScript file with <100% coverage:
     - Find its corresponding test file: resources/spec/{name}Spec.js.
     - Analyze the uncovered lines/functions/branches for that specific file.
     - Modify the test file to add test cases covering those gaps.
   - **Work on all uncovered files in one iteration** – improve them all before re-running coverage.
   - **NEVER modify** .js source files in jsc/.

**5. RE-RUN COVERAGE:**
   Same command as step 1: \`& ${effectiveCommand}\`
   ⚠️ Again: DO NOT read terminal output — call #analyze-apigee-report immediately after.

**6. CALL #analyze-apigee-report AGAIN:**
   - ✅ Call #analyze-apigee-report to read the updated lcov.info.
   - ❌ Do NOT rely on terminal output to judge coverage progress.

**7. CHECK PROGRESS:**
   - If **ALL** files now show 100% coverage → Provide final summary and STOP.
   - If **any** file still <100% → Return to **step 3** (re-identify uncovered files and improve them again).

**IMPORTANT NOTES FOR GLOBAL WORKFLOW:**
- You are **allowed and expected** to modify **multiple** Spec.js files in one iteration.
- The goal is to reach 100% coverage for **all** JavaScript files, not just a single file.
- Keep track of which files have been improved; you may need to iterate multiple times.
- After each coverage run, the report will show the current status of all files.

**STRICT RULES:**
✅ DO: Work on **ALL** files that need improvement.
✅ DO: Analyze the full coverage report from #analyze-apigee-report.
✅ DO: Modify **multiple** Spec.js files as needed.
✅ DO: Follow {javascript_name}Spec.js naming pattern.
✅ DO: Execute the command using the proper syntax for the user's OS (PowerShell for Windows, Bash for Linux).
✅ DO: ALWAYS call #analyze-apigee-report immediately after every coverage command run.
❌ DON'T: Modify .js source files.
❌ DON'T: Stop until **all** files reach 100% coverage.
❌ DON'T: Use terminal/console output to determine coverage — it only shows jasmine pass/fail, NOT lcov line data.
❌ DON'T: Skip calling #analyze-apigee-report under any circumstances.`
        }]
      };
    }
  );

  // ── Prompt: AlljavascriptFile ──────────────────────────────────────────────
  server.registerPrompt("AlljavascriptFile",
    {
      description: "Generate and analyze code coverage report for ALL JavaScript files (global 100% coverage)",
      argsSchema: {
        command: z.string().optional().describe("The command to run code coverage")
      }
    },
    async (args) => {
      const providedCommand = args?.command;

      return {
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: `I need to execute the **global Apigee test automation workflow** to achieve 100% code coverage for **ALL** JavaScript files.

**WORKFLOW EXECUTION – GLOBAL COVERAGE (ALL FILES)**

**STEP 0: COVERAGE COMMAND**
${providedCommand
  ? `The coverage command to use is: \`${providedCommand}\``
  : `**MANDATORY:** You MUST STOP right now and ask me: "Please provide the exact terminal command to run code coverage (e.g. for PowerShell or Bash)." Do NOT guess the command. Do NOT run any tools yet. Wait for my reply with the command before moving to Step 1.`}

**STEP 1: AUTO-DISCOVER RESOURCES DIRECTORY**

Run this tool: #auto-discover-resources

This tool will:
1. Search for a directory containing both "jsc" and "spec" subdirectories.
2. Return the exact path to your resources directory.
3. Provide the exact command to navigate there.

**STEP 2: NAVIGATE TO DISCOVERED DIRECTORY**

After running #auto-discover-resources, you'll get a command like:
\`cd "C:\\\\path\\\\to\\\\your\\\\apiproxy\\\\resources"\`

Run that EXACT command using #runInTerminal.

**STEP 3: GET GLOBAL WORKFLOW INSTRUCTIONS**

Now call this tool to get complete instructions for the **global** workflow: #all-get-apigee-workflow-instructions. Pass the coverage command to it if it requires one.

**STEP 4: EXECUTE THE GLOBAL WORKFLOW**

Follow the instructions from #all-get-apigee-workflow-instructions exactly.

**Global Iteration Loop:**

1. Run the coverage command (using the exact command established in Step 0)
2. ⚠️ **IMMEDIATELY after running the command — call #analyze-apigee-report**
   - ❌ **DO NOT read or interpret the terminal output as coverage data**
   - ❌ **The terminal shows jasmine test results, NOT lcov coverage data — ignore it completely**
   - ✅ **Call #analyze-apigee-report tool right now — this is mandatory, no exceptions**
3. **Identify ALL JavaScript files with <100% coverage** from the lcov data returned by #analyze-apigee-report.
4. For **each** uncovered file:
   - Find the corresponding Spec.js file in resources/spec/.
   - Add test cases to cover the missing lines/functions/branches.
   - **Modify all uncovered Spec.js files in this iteration.**
5. Re-run coverage command (same as step 1).
6. ✅ Call #analyze-apigee-report again to read the updated lcov.info.
   ❌ Do NOT use the terminal output to assess whether coverage improved.
7. **Check if ALL files are now at 100%:**
   - If yes → Provide final summary and STOP.
   - If no → Return to step 3 (identify remaining uncovered files and improve again).

**Important Notes:**
- This workflow works on **multiple files at once**.
- The goal is 100% coverage across the entire project.
- Keep iterating until every JavaScript file reaches full coverage.
- The terminal remembers the working directory after the initial \`cd\` command.

**CRITICAL RULES:**
- ✅ Work on **ALL** uncovered files in each iteration.
- ✅ Modify **multiple** Spec.js files as needed.
- ✅ Call #analyze-apigee-report **immediately** after every coverage command run.
- ❌ Never modify .js source files.
- ❌ Never stop until **all** files are at 100%.
- ❌ Never use terminal output for coverage data — always call #analyze-apigee-report.

**START BY RUNNING STEP 1: #auto-discover-resources**`
          }
        }]
      };
    }
  );
}
