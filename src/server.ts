import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFile } from "node:fs/promises";
import { loadConfig, saveConfig } from "./config";
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';


const server = new McpServer({
  name: "apigee-trial-server",
  version: "1.0.0",
});

// Updated add-jasmine-dependency to only store command

server.registerTool("add-jasmine-dependency",{
    title: "Apigee Code Coverage Setup",
    description: "Set up code coverage command for Apigee project",
    inputSchema: z.object({
      command: z.string().optional()
    })
  },
  async (input) => {
    const { command } = input;

    // If command is provided, save it
    if (command) {
      saveConfig({
        command: command
      });

      return {
        content: [{
          type: "text",
          text: `✅ Coverage command saved successfully!

            **Command:** ${command}

            **Note:** The path will be dynamically discovered each time you run the automation based on your current directory.

            **Next Steps:**
            1. Navigate to your Apigee project in terminal
            2. Run #automate-test-case to start automation`
        }]
      };
    }

    // If command is not provided, ask for it via elicitation
    return {
      content: [{
        type: "text",
        text: `I need the coverage command to run for your Apigee project.

          The command should be in PowerShell format.`
      }],
      elicitation: {
        prompt: "Please provide the command to run code coverage",
        fields: [
          {
            name: "command",
            label: "Coverage command",
            placeholder: `"C:\\Users\\{HOST_NAME}\\AppData\\Roaming\\npm\\istanbul" cover "C:\\Users\\{HOST_NAME\\AppData\\Roaming\\npm\\node_modules\\jasmine-node\\bin\\jasmine-node" spec`,
            required: true
          }
        ]
      }
    };
  }
);

// Simple tool to read and return coverage report content
server.registerTool("analyze-apigee-report",
  {
    title: "Read Apigee Coverage Report",
    description: "Read lcov.info coverage report file and return its content for analysis",
    inputSchema: z.object({
      resourcesPath: z.string().optional().describe("Optional path to resources directory (auto-discovers if not provided)")
    })
  },
  async (input) => {
    try {
      // Get resources path
      let resourcesPath = input.resourcesPath;
      
      if (!resourcesPath) {
        // Try to auto-discover
        const discoveredPath = findResourcesPathFromCurrentDir();
        if (!discoveredPath) {
          return {
            content: [{
              type: "text",
              text: `❌ Could not find resources directory automatically.

**Please:**
1. Run #auto-discover-resources first to get your resources path
2. Then run this tool with the path: #analyze-apigee-report resourcesPath="your\\path\\here"

**Or:** Provide the path manually to this tool.`
            }]
          };
        }
        resourcesPath = discoveredPath;
      }
      
      const coveragePath = path.join(resourcesPath, 'coverage', 'lcov.info');
      
      // Check if coverage file exists
      if (!fs.existsSync(coveragePath)) {
        return {
          content: [{
            type: "text",
            text: `❌ Coverage report not found at: ${coveragePath}

**Before using this tool, you must:**
1. Navigate to resources directory: \`cd "${resourcesPath.replace(/\\/g, '\\\\')}"\`
2. Run coverage command: \`& {your_coverage_command}\`

**The coverage file should be generated at:** ${coveragePath}`
          }]
        };
      }
      
      // Read the lcov file
      const fileContent = await fs.promises.readFile(coveragePath, 'utf-8');
      
      return {
        content: [{
          type: "text",
          text: `**Coverage Report Content (lcov.info)**

**File Path:** ${coveragePath}
**Resources Directory:** ${resourcesPath}
**File Size:** ${fileContent.length} characters
**Lines:** ${fileContent.split('\\n').length}

\`\`\`
${fileContent}
\`\`\`

**Analyze this lcov report to:**
1. Calculate code coverage percentages (lines, functions, branches)
2. Identify uncovered lines, functions, and branches
3. Determine which JavaScript file needs test improvements
4. Suggest specific test cases to add to the corresponding Spec.js file
5. Track progress towards 100% coverage`
        }]
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [{
          type: "text",
          text: `❌ Error reading coverage report: ${errorMessage}

**Troubleshooting:**
1. Ensure the coverage command ran successfully
2. Check if the file exists at the expected path
3. Verify file permissions`
        }]
      };
    }
  }
);

// Helper function to find resources directory
function findResourcesPathFromCurrentDir() {
  const cwd = process.cwd();
  
  // Common patterns to check
  const patternsToCheck = [
    { path: cwd, check: ['jsc', 'spec'] },
    { path: path.join(cwd, '..'), check: ['jsc', 'spec'] },
    { path: path.join(cwd, 'resources'), check: ['jsc', 'spec'] },
    { path: path.join(cwd, 'apiproxy', 'resources'), check: ['jsc', 'spec'] },
    { path: path.join(cwd, '..', 'resources'), check: ['jsc', 'spec'] },
  ];
  
  for (const pattern of patternsToCheck) {
    try {
      if (fs.existsSync(pattern.path)) {
        const jscPath = path.join(pattern.path, 'jsc');
        const specPath = path.join(pattern.path, 'spec');
        
        if (fs.existsSync(jscPath) && fs.existsSync(specPath)) {
          return pattern.path;
        }
      }
    } catch (error) {
      // Continue to next pattern
    }
  }
  
  return null;
}


server.registerTool("auto-discover-resources",
  {
    title: "Auto Discover Resources Directory",
    description: "Automatically find Apigee resources directory",
    inputSchema: z.object({
      searchPath: z.string().optional().describe("Optional starting path for search (defaults to current directory)")
    })
  },
  async (input) => {
    const startPath: string = input.searchPath || process.cwd();
    
    try {
      console.log(`Starting search from: ${startPath}`);
      
      // Function to recursively search for resources directory
      function findResourcesDir(currentPath: string, depth: number = 0, maxDepth: number = 4): string | null {
        if (depth > maxDepth) return null;
        
        try {
          // Check if current directory is resources
          const jscPath = path.join(currentPath, 'jsc');
          const specPath = path.join(currentPath, 'spec');
          
          if (fs.existsSync(jscPath) && fs.existsSync(specPath)) {
            // Check if jsc and spec are directories
            const jscStat = fs.statSync(jscPath);
            const specStat = fs.statSync(specPath);
            if (jscStat.isDirectory() && specStat.isDirectory()) {
              return currentPath;
            }
          }
          
          // Check if this is a resources directory (name check)
          if (path.basename(currentPath) === 'resources') {
            // Check parent for apiproxy to confirm Apigee structure
            const parentDir = path.dirname(currentPath);
            const parentName = path.basename(parentDir);
            if (parentName === 'apiproxy') {
              if (fs.existsSync(jscPath) && fs.existsSync(specPath)) {
                return currentPath;
              }
            }
          }
          
          // Search subdirectories
          const entries = fs.readdirSync(currentPath, { withFileTypes: true });
          
          for (const entry of entries) {
            if (entry.isDirectory() && 
                !entry.name.startsWith('.') && 
                entry.name !== 'node_modules' && 
                entry.name !== 'coverage') {
              
              const found: string | null = findResourcesDir(
                path.join(currentPath, entry.name), 
                depth + 1, 
                maxDepth
              );
              
              if (found) return found;
            }
          }
          
          // If not found in current directory, try parent (only at depth 0)
          if (depth === 0 && currentPath !== path.parse(currentPath).root) {
            const parentPath = path.dirname(currentPath);
            if (parentPath !== currentPath) {
              return findResourcesDir(parentPath, depth + 1, maxDepth);
            }
          }
          
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.log(`Error searching ${currentPath}: ${errorMessage}`);
        }
        
        return null;
      }
      
      // Start search
      const resourcesPath: string | null = findResourcesDir(startPath);
      
      if (resourcesPath) {
        // Escape backslashes for PowerShell
        const escapedPath = resourcesPath.replace(/\\/g, '\\\\');
        
        return {
          content: [{
            type: "text",
            text: `✅ Successfully discovered resources directory!

**Found Path:** ${resourcesPath}

**To use this path in the automation workflow:**

1. Run this command to navigate to the directory:
   \`cd "${escapedPath}"\`

2. Then run #automate-test-case to start the automation

**Directory structure found:**
- Resources: ${resourcesPath}
- Contains: ${fs.existsSync(path.join(resourcesPath, 'jsc')) ? '✓ jsc/' : '✗ jsc/'}
- Contains: ${fs.existsSync(path.join(resourcesPath, 'spec')) ? '✓ spec/' : '✗ spec/'}`
          }]
        };
      } else {
        return {
          content: [{
            type: "text",
            text: `❌ Could not find Apigee resources directory!

Searched from: ${startPath}

**What I looked for:**
- A directory containing both "jsc" and "spec" subdirectories
- Typically located at: .../apiproxy/resources/

**Troubleshooting:**
1. Make sure you're in or near an Apigee project directory
2. Check if the project has the structure: resources/jsc/ and resources/spec/
3. Try running from a different starting directory

**You can also try these manual commands:**

**Windows:**
\`\`\`powershell
# List directory structure
tree /F

# Or search for resources directory
Get-ChildItem -Recurse -Directory -Filter "resources" | ForEach-Object {
    if (Test-Path "$_\\jsc" -PathType Container) {
        if (Test-Path "$_\\spec" -PathType Container) {
            Write-Host "Found: $_"
        }
    }
}
\`\`\`

**Mac/Linux:**
\`\`\`bash
find . -type d -name "resources" | while read dir; do
    if [ -d "$dir/jsc" ] && [ -d "$dir/spec" ]; then
        echo "Found: $dir"
    fi
done
\`\`\``
          }]
        };
      }
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [{
          type: "text",
          text: `❌ Error during auto-discovery: ${errorMessage}

Current directory: ${process.cwd()}

Please check your permissions or try a different starting path.`
        }]
      };
    }
  }
);

// First, create a tool that provides the workflow instructions
server.registerTool("get-apigee-workflow-instructions",
  {
    description: "Get the complete Apigee test automation workflow instructions and context"
  },
  async () => {
    const config = loadConfig();
    const effectiveCommand = config.command;
    
    if (!effectiveCommand) {
      return {
        content: [{
          type: "text",
          text: "Configuration not found. Please run #add-jasmine-dependency first."
        }]
      };
    }
    
    return {
      content: [{
        type: "text",
        text: `**APIGEE TEST AUTOMATION WORKFLOW INSTRUCTIONS**

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

**WORKFLOW STEPS:**

**1. INITIAL COVERAGE RUN:**
   Use #runInTerminal with this EXACT PowerShell command:
   \`& ${effectiveCommand}\`

**2. ANALYZE REPORT:**
   Use #analyze-apigee-report resource

**3. IDENTIFY COVERAGE GAPS:**
   - Find JavaScript file with <100% coverage
   - Extract file name (e.g., "AddContentLanguageHeader")
   - Corresponding test file: {name}Spec.js

**4. IMPROVE TEST FILE:**
   - Only modify: resources/spec/{name}Spec.js
   - Never modify .js source files in jsc/
   - Add test cases for uncovered lines/branches

**5. RE-RUN COVERAGE:**
   Same command as step 1: \`& ${effectiveCommand}\`

**6. CHECK COVERAGE:**
   - If 100%: Provide summary and STOP
   - If <100%: Return to step 3

**STRICT RULES:**
✅ DO: Only modify files in resources/spec/
✅ DO: Follow {javascript_name}Spec.js naming pattern  
✅ DO: Use PowerShell syntax: & "command"
❌ DON'T: Modify .js source files
❌ DON'T: Change command syntax to bash`
      }]
    };
  }
);


server.registerPrompt("automate-test-case",
  {
    description: "Generate and analyze code coverage report for Apigee project"
  },
  async () => {
    const config = loadConfig();
    
    if (!config.command) {
      return {
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: `Configuration needed. Please use #add-jasmine-dependency tool first.`
          }
        }]
      };
    }
    
    return {
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `I need to execute the Apigee test automation workflow to achieve 100% code coverage.

**WORKFLOW EXECUTION:**

**STEP 1: AUTO-DISCOVER RESOURCES DIRECTORY**

First, let me automatically discover your Apigee resources directory.

Run this tool: #auto-discover-resources

This tool will:
1. Search for a directory containing both "jsc" and "spec" subdirectories
2. Return the exact path to your resources directory
3. Provide the exact command to navigate there

**STEP 2: NAVIGATE TO DISCOVERED DIRECTORY**

After running #auto-discover-resources, you'll get a command like:
\`cd "C:\\path\\to\\your\\apiproxy\\resources"\`

Run that EXACT command using #runInTerminal.

**STEP 3: GET WORKFLOW INSTRUCTIONS**

Now call this tool to get complete instructions: #get-apigee-workflow-instructions

**STEP 4: EXECUTE THE ITERATIVE WORKFLOW**

Follow the instructions from #get-apigee-workflow-instructions exactly. This includes:

**Iteration Loop:**
1. Run coverage command: \`& ${config.command}\`
2. Analyze results with #analyze-apigee-report
3. If coverage < 100%:
   - Modify only the corresponding Spec.js file
   - Return to step 1 (run coverage command again)
4. If coverage = 100%:
   - Provide final summary
   - STOP

**Important Notes:**
- The auto-discovery tool finds the path dynamically for your current project
- The \`cd\` command only needs to be run ONCE at the beginning
- After that, the iterative process uses ONLY the coverage command: \`& ${config.command}\`
- Each iteration re-runs the coverage command, analyzes, and improves tests
- Continue looping until 100% coverage is achieved

**CRITICAL RULES:**
- Only modify {javascript_name}Spec.js files in spec/ directory
- Never modify .js source files
- Use exact PowerShell syntax as shown command: \`& ${config.command}\`
- The terminal remembers the working directory after the initial \`cd\` command`
        }
      }]
    };
  }
);


async function main(){
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Apigee MCP Server running on stdio");
}
  
main();