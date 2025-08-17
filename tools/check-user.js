// /tools/check-user.js
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { verifyJson } = require("./verify-json");

const args = process.argv.slice(2);
const userIdIndex = args.indexOf("--user");
const cidIndex = args.indexOf("--cid");

if (userIdIndex === -1 || !args[userIdIndex + 1]) {
  console.error("❌ Usage: node check-user.js --user <user_id> [--cid <poolfile_cid>]");
  process.exit(1);
}

const userId = args[userIdIndex + 1];
const poolCid = cidIndex > -1 ? args[cidIndex + 1] : null;

// Step 1: Load poolfile
let poolFilePath;
if (poolCid) {
  const tempFile = path.join(__dirname, `tmp_pool_${poolCid}.json`);
  execSync(`ipfs get ${poolCid} -o ${tempFile}`);
  poolFilePath = tempFile;
} else {
  const envFile = path.join(__dirname, "../.env.json");
  if (!fs.existsSync(envFile)) {
    console.error("❌ .env.json not found and no CID provided");
    process.exit(1);
  }
  const envData = JSON.parse(fs.readFileSync(envFile, "utf8"));
  poolFilePath = path.join(__dirname, `../data/${envData.sale_name}_pool_${envData.sale_cid}.json`);
}

if (!fs.existsSync(poolFilePath)) {
  console.error(`❌ Poolfile not found: ${poolFilePath}`);
  process.exit(1);
}

const poolData = JSON.parse(fs.readFileSync(poolFilePath, "utf8"));

// Step 2: Verify signature
try {
  verifyJson(poolFilePath);
} catch (e) {
  console.error(`❌ Poolfile signature invalid: ${e.message}`);
  process.exit(1);
}

// Step 3: Find user
const userRecord = poolData.offchain_holders.find(u => u.id === userId);
if (!userRecord) {
  console.log(`ℹ️ User "${userId}" not found in poolfile`);
  process.exit(0);
}

// Step 4: Compute dynamic token value
let tokenPrice = poolData.token?.initial_price_usdt || 1;
const growthRate = poolData.token?.growth_rate_apy || 0;
const firstSaleTs = poolData.token?.first_sale_timestamp;

if (firstSaleTs) {
  const elapsedDays = (Date.now() - new Date(firstSaleTs).getTime()) / (1000 * 60 * 60 * 24);
  const elapsedYears = elapsedDays / 365;
  tokenPrice = tokenPrice * Math.pow(1 + growthRate / 100, elapsedYears);
}

const currentValue = userRecord.tokens_owned * tokenPrice;

// Step 5: Print report
console.log(`🧾 User report for: ${userId}`);
console.log(`Tokens owned: ${userRecord.tokens_owned}`);
console.log(`Current value (USDT): ${currentValue.toFixed(2)}`);
console.log(`Paid out: ${userRecord.paid_out}`);
if (userRecord.tx_id) console.log(`Last transaction ID: ${userRecord.tx_id}`);
