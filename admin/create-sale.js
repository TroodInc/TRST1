// /admin/create-sale.js
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const saleName = process.argv[2];
const capArgIndex = process.argv.indexOf("--cap");
const totalCap = capArgIndex > -1 ? parseInt(process.argv[capArgIndex + 1]) : 1_000_000;

if (!saleName) {
  console.error("❌ Usage: node create-sale.js <saleName> [--cap <total_token_cap>]");
  process.exit(1);
}

// Step 1: Build initial pool object
const pool = {
  version: "1.0",
  token: {
    _comment: "You can edit these parameters manually before signing.",
    symbol: saleName.toUpperCase(),
    name: `${saleName.toUpperCase()} Buyback Token v1`,
    initial_price_usdt: 1.0,
    growth_rate_apy: 100,
    first_sale_timestamp: null,
    price_status: "idle"
  },
  pool: {
    _comment: "Token supply configuration.",
    total_token_cap: totalCap,
    sold_tokens: 0,
    available_tokens: totalCap,
    usdt_collected: 0,
    usdt_in_buyback_pool: 0
  },
  status: {
    _comment: "Sale state flags (usually updated by admin scripts).",
    sale_open: false,
    whitelist_only: true,
    blue_button_mode: false,
    red_button_triggered: false,
    buyback_complete: false
  },
  activity_log: [],
  offchain_holders_ref: null,
  notes: "Zero-day initialized. No tokens sold yet. You may edit this note.",
  meta: {
    _comment: "System-managed fields, do not edit manually after signing.",
    previous_cid: null,
    last_updated: new Date().toISOString(),
    source: "https://trood.com/tokensale",
    signature: null
  }
};

// Step 2: Write temp genesis file
const genesisFile = `${saleName}_pool_genesis.json`;
fs.writeFileSync(genesisFile, JSON.stringify(pool, null, 2));
console.log(`📄 Created genesis file: ${genesisFile}`);

// Step 3: Add to IPFS and capture cid0
const cid0 = execSync(`ipfs add -Q ${genesisFile}`).toString().trim();
console.log(`🌱 Genesis CID (cid0): ${cid0}`);

// Step 4: Create IPNS key with name = cid0
try {
  execSync(`ipfs key gen ${cid0} --type=rsa --size=2048`);
  console.log(`🔑 Created IPNS key named: ${cid0}`);
} catch (e) {
  if (e.stderr.toString().includes("already exists")) {
    console.log(`ℹ️ IPNS key ${cid0} already exists, skipping creation.`);
  } else {
    throw e;
  }
}

// Step 5: Save final pool file with sale_cid
pool.meta.sale_cid = cid0;
const finalFile = `${saleName}_pool_${cid0}.json`;
fs.writeFileSync(finalFile, JSON.stringify(pool, null, 2));

console.log(`✅ Sale created!`);
console.log(`   Genesis CID / IPNS key: ${cid0}`);
console.log(`   Local pool file: ${finalFile}`);

// Step 6: Update central sales registry
const salesFile = path.join(__dirname, "../data/sales.json");
let sales = {};
if (fs.existsSync(salesFile)) {
  sales = JSON.parse(fs.readFileSync(salesFile, "utf8"));
}

sales[saleName] = { sale_cid: cid0 };
fs.writeFileSync(salesFile, JSON.stringify(sales, null, 2));
console.log(`🗂 Updated central sales registry: ${salesFile}`);
