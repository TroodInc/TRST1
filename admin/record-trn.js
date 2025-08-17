// /admin/record-trn.js
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { verifyJson } = require("../tools/verify-json"); // assuming verify-json exports a function

const poolFile = process.argv[2];
const eventsFile = process.argv[3]; // JSON file with array of events

if (!poolFile || !eventsFile) {
  console.error("❌ Usage: node record-trn.js <pool_file.json> <events.json>");
  process.exit(1);
}

// Load poolfile
const poolData = JSON.parse(fs.readFileSync(poolFile, "utf8"));

// Verify signature before making changes
if (!verifyJson(poolFile)) {
  console.error("❌ Poolfile signature verification failed. Aborting.");
  process.exit(1);
}

// Load new events
const newEvents = JSON.parse(fs.readFileSync(eventsFile, "utf8"));
if (!Array.isArray(newEvents)) {
  console.error("❌ Events file must contain an array of events");
  process.exit(1);
}

// Ensure each event has required fields
newEvents.forEach((e, idx) => {
  if (!e.type || !e.user_id || !e.timestamp) {
    console.error(`❌ Event at index ${idx} is missing required fields: type, user_id, timestamp`);
    process.exit(1);
  }
});

// Prepare incremental log
const prevActivityLog = poolData.latest_activity || [];
poolData.latest_activity = newEvents;

// Link previous poolfile
const prevCid = poolData.meta?.sale_cid || null;
poolData.meta.previous_cid = prevCid;
poolData.meta.last_updated = new Date().toISOString();

// Write updated poolfile
const updatedFileName = poolFile.replace(".json", `_updated.json`);
fs.writeFileSync(updatedFileName, JSON.stringify(poolData, null, 2));

console.log(`✅ Recorded ${newEvents.length} events to ${updatedFileName}`);
console.log(`   Previous CID: ${prevCid}`);
