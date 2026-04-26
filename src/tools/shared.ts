import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Helper: locate the Apigee resources/ directory from the current working dir
// ---------------------------------------------------------------------------
export function findResourcesPathFromCurrentDir(): string | null {
  const cwd = process.cwd();

  const patternsToCheck = [
    { path: cwd,                                      check: ['jsc', 'spec'] },
    { path: path.join(cwd, '..'),                     check: ['jsc', 'spec'] },
    { path: path.join(cwd, 'resources'),              check: ['jsc', 'spec'] },
    { path: path.join(cwd, 'apiproxy', 'resources'),  check: ['jsc', 'spec'] },
    { path: path.join(cwd, '..', 'resources'),        check: ['jsc', 'spec'] },
  ];

  for (const pattern of patternsToCheck) {
    try {
      if (fs.existsSync(pattern.path)) {
        const jscPath  = path.join(pattern.path, 'jsc');
        const specPath = path.join(pattern.path, 'spec');
        if (fs.existsSync(jscPath) && fs.existsSync(specPath)) {
          return pattern.path;
        }
      }
    } catch {
      // continue to next pattern
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Register shared tools onto the McpServer instance
// ---------------------------------------------------------------------------
export function registerSharedTools(server: McpServer): void {

  // ── Tool: analyzeJasmineTestReport ──────────────────────────────────────────
  server.registerTool("analyzeJasmineTestReport",
    {
      title: "Read Apigee Coverage Report",
      description: "Read lcov.info coverage report file and return its content for analysis",
      inputSchema: z.object({
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
                text: `❌ Could not find resources directory automatically.\n\n**Please:**\n1. Run #findResourcesDirectoryPath first to get your resources path\n2. Then run this tool with the path: #analyzeJasmineTestReport resourcesPath="your\\\\path\\\\here"\n\n**Or:** Provide the path manually to this tool.`
              }]
            };
          }
          resourcesPath = discoveredPath;
        }

        const coveragePath = path.join(resourcesPath, 'coverage', 'lcov.info');

        if (!fs.existsSync(coveragePath)) {
          return {
            content: [{
              type: "text",
              text: `❌ Coverage report not found at: ${coveragePath}\n\n**Before using this tool, you must:**\n1. Navigate to resources directory: \`cd "${resourcesPath.replace(/\\/g, '\\\\')}"\`\n2. Run coverage command: \`& {your_coverage_command}\` (or just \`{your_coverage_command}\` on Linux/Mac)\n\n**The coverage file should be generated at:** ${coveragePath}`
            }]
          };
        }

        const fileContent = await fs.promises.readFile(coveragePath, 'utf-8');

        return {
          content: [{
            type: "text",
            text: `**Coverage Report Content (lcov.info)**\n\n**File Path:** ${coveragePath}\n**Resources Directory:** ${resourcesPath}\n**File Size:** ${fileContent.length} characters\n**Lines:** ${fileContent.split('\n').length}\n\n\`\`\`\n${fileContent}\n\`\`\`\n\n**Analyze this lcov report to:**\n1. Calculate code coverage percentages (lines, functions, branches)\n2. Identify uncovered lines, functions, and branches\n3. Determine which JavaScript file needs test improvements\n4. Suggest specific test cases to add to the corresponding Spec.js file\n5. Track progress towards 100% coverage`
          }]
        };

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{
            type: "text",
            text: `❌ Error reading coverage report: ${errorMessage}\n\n**Troubleshooting:**\n1. Ensure the coverage command ran successfully\n2. Check if the file exists at the expected path\n3. Verify file permissions`
          }]
        };
      }
    }
  );

  // ── Tool: findResourcesDirectoryPath ────────────────────────────────────────
  server.registerTool("findResourcesDirectoryPath",
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

        function findResourcesDir(currentPath: string, depth: number = 0, maxDepth: number = 4): string | null {
          if (depth > maxDepth) return null;

          try {
            const jscPath  = path.join(currentPath, 'jsc');
            const specPath = path.join(currentPath, 'spec');

            if (fs.existsSync(jscPath) && fs.existsSync(specPath)) {
              const jscStat  = fs.statSync(jscPath);
              const specStat = fs.statSync(specPath);
              if (jscStat.isDirectory() && specStat.isDirectory()) {
                return currentPath;
              }
            }

            if (path.basename(currentPath) === 'resources') {
              const parentDir  = path.dirname(currentPath);
              const parentName = path.basename(parentDir);
              if (parentName === 'apiproxy') {
                if (fs.existsSync(jscPath) && fs.existsSync(specPath)) {
                  return currentPath;
                }
              }
            }

            const entries = fs.readdirSync(currentPath, { withFileTypes: true });

            for (const entry of entries) {
              if (
                entry.isDirectory() &&
                !entry.name.startsWith('.') &&
                entry.name !== 'node_modules' &&
                entry.name !== 'coverage'
              ) {
                const found: string | null = findResourcesDir(
                  path.join(currentPath, entry.name),
                  depth + 1,
                  maxDepth
                );
                if (found) return found;
              }
            }

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

        const resourcesPath: string | null = findResourcesDir(startPath);

        if (resourcesPath) {
          const isWindows    = process.platform === 'win32';
          const escapedPath  = isWindows ? resourcesPath.replace(/\\/g, '\\\\') : resourcesPath;

          return {
            content: [{
              type: "text",
              text: `✅ Successfully discovered resources directory!\n\n**Found Path:** ${resourcesPath}\n\n**To use this path in the automation workflow:**\n\n1. Run this command to navigate to the directory:\n   \`cd "${escapedPath}"\`\n\n2. Then run #automate-test-case to start the automation\n\n**Directory structure found:**\n- Resources: ${resourcesPath}\n- Contains: ${fs.existsSync(path.join(resourcesPath, 'jsc'))  ? '✓ jsc/'  : '✗ jsc/'}\n- Contains: ${fs.existsSync(path.join(resourcesPath, 'spec')) ? '✓ spec/' : '✗ spec/'}`
            }]
          };
        } else {
          return {
            content: [{
              type: "text",
              text: `❌ Could not find Apigee resources directory!\n\nSearched from: ${startPath}\n\n**What I looked for:**\n- A directory containing both "jsc" and "spec" subdirectories\n- Typically located at: .../apiproxy/resources/\n\n**Troubleshooting:**\n1. Make sure you're in or near an Apigee project directory\n2. Check if the project has the structure: resources/jsc/ and resources/spec/\n3. Try running from a different starting directory\n\n**You can also try these manual commands:**\n\n**Windows:**\n\`\`\`powershell\n# List directory structure\ntree /F\n\n# Or search for resources directory\nGet-ChildItem -Recurse -Directory -Filter "resources" | ForEach-Object {\n    if (Test-Path "$_\\\\jsc" -PathType Container) {\n        if (Test-Path "$_\\\\spec" -PathType Container) {\n            Write-Host "Found: $_"\n        }\n    }\n}\n\`\`\`\n\n**Mac/Linux:**\n\`\`\`bash\nfind . -type d -name "resources" | while read dir; do\n    if [ -d "$dir/jsc" ] && [ -d "$dir/spec" ]; then\n        echo "Found: $dir"\n    fi\ndone\n\`\`\``
            }]
          };
        }

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{
            type: "text",
            text: `❌ Error during auto-discovery: ${errorMessage}\n\nCurrent directory: ${process.cwd()}\n\nPlease check your permissions or try a different starting path.`
          }]
        };
      }
    }
  );
}
