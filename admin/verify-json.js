const fs = require('fs');
const crypto = require('crypto');

const filePath = process.argv[2];
if (!filePath) {
  console.error('❌ Usage: node verify-json.js <filename.json>');
  process.exit(1);
}

const publicKey = fs.readFileSync('./keys/public.pem', 'utf8');
const original = JSON.parse(fs.readFileSync(filePath, 'utf8'));

if (!original.meta || !original.meta.signature) {
  console.error('❌ No signature found in meta.signature');
  process.exit(1);
}

const { signature, timestamp, signed_by } = original.meta.signature;

// Deep copy and strip meta.signature for verification
const dataToVerify = JSON.parse(JSON.stringify(original));
delete dataToVerify.meta.signature;

// Make sure meta.last_updated === signature.timestamp
if (dataToVerify.meta.last_updated !== timestamp) {
  console.error(`❌ Timestamp mismatch between meta.last_updated (${dataToVerify.meta.last_updated}) and signature.timestamp (${timestamp})`);
  process.exit(1);
}

// Canonical JSON string to verify against signature
const canonicalJson = JSON.stringify(dataToVerify);

// Verify signature
const verify = crypto.createVerify('SHA256');
verify.update(canonicalJson);
verify.end();

const isValid = verify.verify(publicKey, signature, 'base64');

if (isValid) {
  console.log('✅ Signature is VALID');
} else {
  console.error('❌ Signature is INVALID');
  process.exit(1);
}
