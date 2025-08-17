// /admin/upload-poolfile.js
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Load central sales registry
const salesFile = path.join(__dirname, "../data/sales.json");
if (!fs.existsSync(salesFile)) {
  console.error("❌ Sales registry not found. Run create-sale first.");
  process.exit(1);
}

const sales = JSON.parse(fs.readFileSync(salesFile, "utf8"));

// Get sale name and poolfile path
const saleName = process.argv[2];
const poolFile = process.argv[3];

if (!saleName || !poolFile) {
  console.error("❌ Usage: node upload-poolfile.js <saleName> <poolfile.json>");
  process.exit(1);
}

if (!fs.existsSync(poolFile)) {
  console.error(`❌ Pool file not found: ${poolFile}`);
  process.exit(1);
}

const saleInfo = sales[saleName];
if (!saleInfo) {
  console.error(`❌ Sale not found in registry: ${saleName}`);
  process.exit(1);
}

const saleCid = saleInfo.sale_cid;

// Step 1: Verify JSON signature
try {
  execSync(`node ./verify-json.js ${poolFile}`, { stdio: "inherit" });
} catch (e) {
  console.error("❌ Signature verification failed. Aborting upload.");
  process.exit(1);
}

// Step 2: Upload to IPFS
const newCid = execSync(`ipfs add -Q ${poolFile}`).toString().trim();
console.log(`📄 Uploaded poolfile to IPFS. CID: ${newCid}`);

// Step 3: Ensure IPNS key exists
try {
  execSync(`ipfs key list -l | grep ${saleCid}`);
  console.log(`ℹ️ IPNS key "${saleCid}" already exists.`);
} catch (e) {
  console.log(`🔑 IPNS key "${saleCid}" not found. Creating it...`);
  try {
    execSync(`ipfs key gen ${saleCid} --type=rsa --size=2048`, { stdio: "inherit" });
    console.log(`✅ IPNS key "${saleCid}" created successfully.`);
  } catch (err) {
    console.error("❌ Failed to create IPNS key:", err.stderr.toString());
    process.exit(1);
  }
}

// Step 4: Publish to IPNS using sale_cid as key
try {
  execSync(`ipfs name publish --key=${saleCid} /ipfs/${newCid}`, { stdio: "inherit" });
  console.log(`🔗 Published to IPNS with key ${saleCid}: /ipns/${saleCid}`);
} catch (e) {
  console.error("❌ IPNS publish failed:", e.stderr.toString());
  process.exit(1);
}

console.log("✅ Poolfile uploaded and IPNS updated successfully.");
