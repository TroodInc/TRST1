// /admin/change-sale-state.js
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const poolFile = process.argv[2];
if (!poolFile) {
  console.error("❌ Usage: node change-sale-state.js <poolfile.json> [--sale_open true] [--whitelist_only false] ...");
  process.exit(1);
}

// Load poolfile
const poolData = JSON.parse(fs.readFileSync(poolFile, "utf8"));

// Allowed state flags
const allowedFlags = ["sale_open", "whitelist_only", "blue_button_mode", "red_button_triggered", "buyback_complete"];

// Apply CLI flags
allowedFlags.forEach(flag => {
  const argIndex = process.argv.indexOf(`--${flag}`);
  if (argIndex > -1) {
    const val = process.argv[argIndex + 1];
    poolData.status[flag] = val === "true";
  }
});

// Update meta.last_updated
poolData.meta.last_updated = new Date().toISOString();

// Sign the poolfile
const signJson = require("../tools/sign-json");
signJson(poolFile);

// Save updated poolfile
fs.writeFileSync(poolFile, JSON.stringify(poolData, null, 2));
console.log(`✅ Updated sale state in: ${poolFile}`);
