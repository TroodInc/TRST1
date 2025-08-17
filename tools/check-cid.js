// /tools/check-cid.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const inputCid = process.argv[2];

// Optional: load from .env.json if no CID provided
let cidToCheck = inputCid;
if (!cidToCheck) {
  const envFile = path.join(__dirname, "../.env.json");
  if (!fs.existsSync(envFile)) {
    console.error("❌ No CID provided and .env.json not found");
    process.exit(1);
  }
  const envData = JSON.parse(fs.readFileSync(envFile, "utf8"));
  cidToCheck = envData.sale_cid;
}

try {
  // Step 1: Fetch poolfile from IPFS
  const poolJson = execSync(`ipfs cat ${cidToCheck}`).toString();
  const poolData = JSON.parse(poolJson);

  // Basic validation
  if (!poolData.token || !poolData.pool) {
    console.error("❌ Provided CID does not appear to be a valid tokensale poolfile");
    process.exit(1);
  }

  // Step 2: Identify genesis CID (cid0)
  const genesisCid = poolData.meta?.sale_cid || cidToCheck;

  // Step 3: Try to resolve IPNS
  let ipnsResolvedCid = null;
  try {
    ipnsResolvedCid = execSync(`ipfs name resolve ${genesisCid} --timeout=5s`).toString().trim().replace("/ipfs/", "");
  } catch (e) {
    console.warn("ℹ️ Could not resolve IPNS record (might not exist yet)");
  }

  // Step 4: Latest CID is either resolved IPNS or the poolfile itself
  const latestCid = ipnsResolvedCid || cidToCheck;

  // Step 5: Extract main parameters
  const mainParams = {
    token_symbol: poolData.token.symbol,
    token_name: poolData.token.name,
    total_token_cap: poolData.pool.total_token_cap,
    sold_tokens: poolData.pool.sold_tokens,
    available_tokens: poolData.pool.available_tokens,
    usdt_collected: poolData.pool.usdt_collected
  };

  // Step 6: Output report
  console.log("🧾 Tokensale CID Report");
  console.log(`Checked CID: ${cidToCheck}`);
  console.log(`Valid tokensale: ✅`);
  console.log(`Genesis CID (cid0): ${genesisCid}`);
  console.log(`Latest CID: ${latestCid}`);
  console.log(`IPNS points to: ${ipnsResolvedCid || "none"}`);
  console.log("Main parameters:", mainParams);

  // Step 7: Highlight IPNS mismatch
  if (ipnsResolvedCid && ipnsResolvedCid !== latestCid) {
    console.warn("⚠️ WARNING: IPNS does not point to the latest poolfile!");
  } else if (ipnsResolvedCid) {
    console.log("✅ IPNS correctly points to the latest poolfile.");
  }
} catch (err) {
  console.error("❌ Error fetching or parsing poolfile:", err.message);
  process.exit(1);
}
