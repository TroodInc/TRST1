#!/bin/bash

mkdir -p keys

# Generate private key
openssl genpkey -algorithm RSA -out keys/private.pem -pkeyopt rsa_keygen_bits:4096

# Extract public key
openssl rsa -pubout -in keys/private.pem -out keys/public.pem

echo "✅ RSA key pair generated in ./keys/"
