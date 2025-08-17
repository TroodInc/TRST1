# TRST1 Tools

This repository contains scripts to manage Trood token sales using IPFS and off-chain poolfiles. It supports creating new sales, signing JSON poolfiles, verifying signatures, recording transactions, and querying user balances.

---

## Folder Structure

/admin - Main admin scripts (create-sale, upload-poolfile, change-sale-state, etc.)\
/data - Storage for poolfiles, .env.json, and activity logs\
/tools - Utility scripts (check-user, check-cid, etc.)\
/keys - RSA keypairs for signing and verification\
/private - Optional: private keys or sensitive data\

---

## Scripts

### Admin Scripts

* **create-sale.js** – Create a new token sale and generate initial poolfile. Updates `.env.json`.
* **upload-poolfile.js** – Uploads a poolfile to IPFS and verifies its signature.
* **change-sale-state.js** – Update sale state flags (`sale_open`, `whitelist_only`, etc.) and record changes in activity log.

### JSON Signature Tools

* **sign-json.js** – Sign any JSON file using a private key.
* **verify-json.js** – Verify the signature of a JSON file using a public key.

### Utility Tools

* **check-user.js** – Query a user’s token balance and value. Optional CID parameter to check historical poolfiles.
* **check-cid.js** – Check if a CID belongs to a valid token sale, its genesis CID, latest CID, and main sale parameters.

---

## Poolfile Structure

Poolfiles store the current state of a tokensale. Key sections include:

* `token` – Token parameters (symbol, name, initial price, growth rate)
* `pool` – Supply and collected funds
* `status` – Sale state flags
* `activity_log` – Array of changes or events (diffs)
* `offchain_holders` – Users and their token balances
* `meta` – Metadata, including `sale_cid`, `last_updated`, and `signature`

---

## Example Usage

```bash
# Create a new sale
node admin/create-sale.js my_sale --cap 1000000

# Upload poolfile
node admin/upload-poolfile.js my_sale_pool_<cid>.json

# Change sale state
node admin/change-sale-state.js my_sale_pool_<cid>.json --sale_open true

# Verify JSON signature
node admin/verify-json.js my_sale_pool_<cid>.json

# Check user balance
node tools/check-user.js user123

# Check sale CID info
node tools/check-cid.js <cid>
```

---

## Keys

* Private and public RSA keys are stored in `/keys/`.
* Signatures ensure integrity of poolfiles and sale state.

---

## Notes

* Poolfiles are versioned via IPFS CIDs; the `activity_log` can store only diffs for efficiency.
* `.env.json` keeps track of the current sale and its `sale_cid`.
* IPNS keys correspond to genesis CIDs for easy reference to the latest state.

---

## License

MIT License
