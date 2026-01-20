// config.ts
import fs from "fs";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), ".mcp-config.json");

export function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return {};
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
}

export function saveConfig(config: any) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}
