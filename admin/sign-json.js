const fs = require('fs');
const crypto = require('crypto');

const filePath = process.argv[2];
if (!filePath) {
  console.error('❌ Usage: node sign-json.js <filename.json>');
  process.exit(1);
}

// Load keys
const privateKey = fs.readFileSync('./keys/private.pem', 'utf8');
const publicKey = fs.readFileSync('./keys/public.pem', 'utf8');

// Read and parse JSON
const original = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Generate timestamp once
const timestamp = new Date().toISOString();

// Update meta.last_updated to match signature timestamp
original.meta = original.meta || {};
original.meta.last_updated = timestamp;

// Deep copy and strip meta.signature if present (we don't sign the signature itself)
const dataToSign = JSON.parse(JSON.stringify(original));
if (dataToSign.meta && dataToSign.meta.signature) {
  delete dataToSign.meta.signature;
}

// Canonical JSON for signing
const canonicalJson = JSON.stringify(dataToSign);

// Sign the data
const sign = crypto.createSign('SHA256');
sign.update(canonicalJson);
sign.end();
const signature = sign.sign(privateKey, 'base64');

// Inject signature info back into original.meta.signature
original.meta.signature = {
  signed_by: "trood.com", // Replace with real ID or wallet address
  signature: signature,
  public_key: publicKey,
  timestamp: timestamp
};

// Write back the signed file with pretty formatting
fs.writeFileSync(filePath, JSON.stringify(original, null, 2));

console.log(`✅ Signed and updated: ${filePath}`);
