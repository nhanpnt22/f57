import re, glob
# Go errors.go
with open('go/errors.go', 'r') as file: c = file.read()
c = re.sub(r'// ErrInvalidHashFunction.*?ErrInvalidHashFunction\n', '', c, flags=re.DOTALL)
c = re.sub(r'// NewInvalidHashFunctionError.*?\}\n\n', '', c, flags=re.DOTALL)
with open('go/errors.go', 'w') as file: file.write(c)

with open('go/test_vars_test.go', 'r') as file: c = file.read()
c = re.sub(r'type HashFunction string\nconst \(\n\tHashBLAKE3 HashFunction = "blake3"\n\tHashSHA256 HashFunction = "sha256"\n\tHashSHA512 HashFunction = "sha512"\n\)\n', '', c)
with open('go/test_vars_test.go', 'w') as file: file.write(c)

# JS cross-language script
with open('javascript/scripts/cross-language-e2e.mjs', 'r') as file: c = file.read()
c = c.replace('\n  HashFunction,', '')
c = c.replace('HashFunction.BLAKE3, ', '')
c = c.replace('HashFunction.SHA256, ', '')
c = c.replace('HashFunction.SHA512, ', '')
c = c.replace('HashFunction.BLAKE3', '')
# ID57Short
c = c.replace('HashFunction.SHA256', '')
with open('javascript/scripts/cross-language-e2e.mjs', 'w') as file: file.write(c)

