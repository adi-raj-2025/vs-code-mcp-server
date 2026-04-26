import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Register everything for the "Current JavaScript File" single-file workflow
// ---------------------------------------------------------------------------
export function registerCurrentFileWorkflow(server: McpServer): void {

  // ── Tool: getCurrentSpecWorkFlowInstruction ────────────────────────────────
  server.registerTool("getCurrentSpecWorkFlowInstruction",
    {
      description: "Get the complete Apigee test automation workflow instructions and context",
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
          text: `**APIGEE TEST AUTOMATION WORKFLOW INSTRUCTIONS**

**CURRENT CONFIGURATION:**
- Coverage Command: ${effectiveCommand}
- Path: Use #findResourcesDirectoryPath tool to find your specific path

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

**IMPORTANT:** Run #findResourcesDirectoryPath first to find your specific resources path.

**WORKFLOW STEPS:**

**1. IDENTIFY CURRENT COPILOT CHAT CONTEXT FILE (CRITICAL FIRST STEP):**
   - **LOOK AT COPILOT CHAT:** Check which SPECIFIC {javascript_name}Spec.js file is currently open in your Copilot chat context
   - **DECLARE THE FILE:** Explicitly state: "Current Copilot chat context file: {filename}Spec.js"
   - **CONFIRM SINGLE FILE:** Verify you are working on ONLY ONE file

**2. INITIAL COVERAGE RUN:**
   Use #runInTerminal to execute the command with the correct OS syntax:
   - Windows PowerShell: \`& ${effectiveCommand}\`
   - Linux/Mac/Bash: \`${effectiveCommand}\`

   ⚠️ **CRITICAL — AFTER RUNNING THE COMMAND:**
   - **DO NOT read or parse the terminal output for coverage data.**
   - **The terminal output is jasmine test results only — it does NOT contain accurate lcov coverage data.**
   - **IMMEDIATELY** call the #analyzeJasmineTestReport tool in the very next step.

**3. ANALYZE REPORT (MANDATORY TOOL CALL — NO EXCEPTIONS):**
   - ✅ **YOU MUST call the #analyzeJasmineTestReport tool RIGHT NOW.**
   - ❌ **DO NOT use terminal output to determine coverage.** The terminal shows jasmine pass/fail, NOT line-level lcov data.
   - ❌ **DO NOT skip this step or assume coverage from the terminal.**
   - The tool reads the generated \`lcov.info\` file — this is the ONLY valid source of coverage truth.
   - Call: #analyzeJasmineTestReport

**4. FILTER ANALYSIS TO CURRENT COPILOT FILE ONLY:**
   - **FOCUS ON ONE FILE:** In the lcov report returned by #analyzeJasmineTestReport, ONLY look at the JavaScript file that corresponds to your current Copilot chat context file
   - **EXTRACT BASE NAME:** If current file is "AddContentLanguageHeaderSpec.js", ONLY analyze "AddContentLanguageHeader.js"
   - **CALCULATE COVERAGE:** Calculate coverage percentage ONLY for this single file using the lcov data
   - **FIND UNCOVERED LINES:** Identify uncovered lines/functions/branches ONLY for this file from the lcov data

**5. IMPROVE ONLY THE CURRENT COPILOT FILE:**
   - **MODIFY ONLY:** Only modify the {javascript_name}Spec.js file currently open in your Copilot chat
   - **ADD TESTS:** Add test cases ONLY for uncovered lines/branches in this single file
   - **NEVER modify:** .js source files in jsc/
   - **DO NOT EVEN LOOK AT:** Any other Spec.js files in the folder

**6. RE-RUN COVERAGE:**
   Same command as step 2: \`& ${effectiveCommand}\`
   ⚠️ Again: DO NOT read terminal output — call #analyzeJasmineTestReport immediately after.

**7. CALL #analyzeJasmineTestReport AGAIN:**
   - ✅ Call #analyzeJasmineTestReport to read the updated lcov.info.
   - ❌ Do NOT rely on terminal output to judge coverage progress.

**8. CHECK COVERAGE FOR CURRENT COPILOT FILE ONLY:**
   - **If CURRENT FILE coverage = 100%:** Provide summary for this file and STOP
   - **If CURRENT FILE coverage < 100%:** Return to step 4 (continue improving THIS SINGLE FILE)

**STRICT COPILOT-CONTEXT RULES:**
✅ DO: Work on ONLY the Spec.js file currently open in your Copilot chat
✅ DO: Declare the current file name before any analysis
✅ DO: Filter coverage analysis to ONLY the corresponding JavaScript file
✅ DO: Follow {javascript_name}Spec.js naming pattern  
✅ DO: Execute the command using the proper syntax for the user's OS (PowerShell for Windows, Bash for Linux).
✅ DO: ALWAYS call #analyzeJasmineTestReport immediately after every coverage command run.
❌ DON'T: Modify .js source files
❌ DON'T: Look at, analyze, or calculate coverage for ANY other files
❌ DON'T: Modify any Spec.js files except the one in current Copilot chat
❌ DON'T: Even mention other files in the coverage report
❌ DON'T: Use terminal/console output to determine coverage — it only shows jasmine pass/fail, NOT lcov line data.
❌ DON'T: Skip calling #analyzeJasmineTestReport under any circumstances.

**EXAMPLE:**
- **Copilot chat context:** You have AddContentLanguageHeaderSpec.js open
- **Work ONLY on:** AddContentLanguageHeader.js coverage
- **Modify ONLY:** AddContentLanguageHeaderSpec.js
- **IGNORE COMPLETELY:** AnotherFile.js, ThirdFile.js (even if they exist in coverage report)
- **DECLARE:** "Current Copilot chat context file: AddContentLanguageHeaderSpec.js" BEFORE starting`
        }]
      };
    }
  );

  // ── Prompt: CurrentSpecWorkFlow ─────────────────────────────────────────
  server.registerPrompt("CurrentSpecWorkFlow",
    {
      description: "Generate and analyze code coverage report for Apigee project",
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
            text: `I need to execute the Apigee test automation workflow to achieve 100% code coverage.

**CRITICAL REQUIREMENT:** You must work on ONLY ONE Spec.js file - the one currently open in your Copilot chat context.

**WORKFLOW EXECUTION:**

**STEP 0: COVERAGE COMMAND**
${providedCommand
  ? `The coverage command to use is: \`${providedCommand}\``
  : `**MANDATORY:** You MUST STOP right now and ask me: "Please provide the exact terminal command to run code coverage (e.g. for PowerShell or Bash)." Do NOT guess the command. Do NOT run any tools yet. Wait for my reply with the command before moving to Step 1.`}

**STEP 1: AUTO-DISCOVER RESOURCES DIRECTORY**

First, let me automatically discover your Apigee resources directory.

Run this tool: #findResourcesDirectoryPath

This tool will:
1. Search for a directory containing both "jsc" and "spec" subdirectories
2. Return the exact path to your resources directory
3. Provide the exact command to navigate there

**STEP 2: NAVIGATE TO DISCOVERED DIRECTORY**

After running #findResourcesDirectoryPath, you'll get a command like:
\`cd "C:\\\\path\\\\to\\\\your\\\\apiproxy\\\\resources"\`

Run that EXACT command using #runInTerminal.

**STEP 3: GET WORKFLOW INSTRUCTIONS**

Now call this tool to get complete instructions: #getCurrentSpecWorkFlowInstruction. Pass the coverage command to it if it requires one.

**STEP 4: EXECUTE THE WORKFLOW - COPILOT CONTEXT FILE ONLY**

Follow the instructions from #getCurrentSpecWorkFlowInstruction exactly.

**MANDATORY FIRST ACTION - DECLARE CURRENT FILE:**
**Before doing ANY analysis, you MUST declare which file is open in your Copilot chat.**

**Example declaration:** "Current Copilot chat context file: AddContentLanguageHeaderSpec.js"

**Single File Iteration Loop:**
1. **DECLARE:** State which Spec.js file is open in your Copilot chat
2. Run the coverage command (using the exact command established in Step 0)
3. ⚠️ **IMMEDIATELY after running the command — call #analyzeJasmineTestReport**
   - ❌ **DO NOT read or interpret the terminal output as coverage data**
   - ❌ **The terminal shows jasmine test results, NOT lcov coverage data — ignore it completely**
   - ✅ **Call #analyzeJasmineTestReport tool right now — this is mandatory**
4. **FILTER TO ONE FILE:** From the lcov data returned by #analyzeJasmineTestReport, ONLY look at the JavaScript file that matches your declared Copilot file
5. **CALCULATE FOR ONE FILE:** Calculate coverage percentage ONLY for this single file using lcov data
6. **STRICTLY IGNORE OTHERS:** DO NOT even read coverage data for any other files
7. If THIS SINGLE FILE coverage < 100%:
   - Modify ONLY the Spec.js file you declared
   - **DO NOT EVEN OPEN** any other Spec.js files
   - Return to step 2 (run coverage command again, then immediately call #analyzeJasmineTestReport)
8. If THIS SINGLE FILE coverage = 100%:
   - Provide summary for this specific file only
   - Workflow for this file is COMPLETE

**Important Notes:**
- The auto-discovery tool finds the path dynamically for your current project
- The \`cd\` command only needs to be run ONCE at the beginning
- **STRICT SINGLE-FILE:** Work on ONLY ONE file - the one in your Copilot chat
- **NO MULTI-FILE:** Never analyze or modify multiple files
- **IGNORE OTHERS COMPLETELY:** Pretend other files don't exist in the coverage report
- Continue looping until the SINGLE Copilot context file reaches 100% coverage

**CRITICAL COPILOT-CONTEXT RULES:**
- **WORK ON ONE FILE ONLY:** The Spec.js file currently open in your Copilot chat
- **DECLARE FIRST:** Always declare the file name before analysis
- **FILTER ANALYSIS:** Only analyze the corresponding .js file in the lcov report from #analyzeJasmineTestReport
- **NEVER modify** .js source files
- **DO NOT EVEN MENTION** other files in the coverage report
- Determine the OS environment and use the appropriate terminal syntax.
- **NEVER use terminal output for coverage data** — always call #analyzeJasmineTestReport after every run.
- **#analyzeJasmineTestReport is MANDATORY after every coverage command** — no exceptions.

**EXAMPLE WORKFLOW:**
1. **You have open:** AddContentLanguageHeaderSpec.js in Copilot chat
2. **Declare:** "Current Copilot chat context file: AddContentLanguageHeaderSpec.js"
3. **Run coverage** → Get report with multiple files
4. **Only analyze:** AddContentLanguageHeader.js data
5. **Ignore completely:** AnotherFile.js, ThirdFile.js (don't even read their data)
6. **Modify only:** AddContentLanguageHeaderSpec.js
7. **Repeat** until AddContentLanguageHeader.js = 100%

**REQUIRED DECLARATION BEFORE PROCEEDING:**
**What is the EXACT {javascript_name}Spec.js file currently open in your Copilot chat context?**

**Example answer:** "Current Copilot chat context file: AddContentLanguageHeaderSpec.js"`
          }
        }]
      };
    }
  );
}
