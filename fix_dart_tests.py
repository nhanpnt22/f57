import glob, re

for f in glob.glob('implementations/dart/test/*.dart') + glob.glob('implementations/dart/bin/*.dart'):
    with open(f, 'r') as file: c = file.read()
    c = re.sub(r'HashFunction\.[a-z0-9]+\s*,\s*', '', c)
    c = re.sub(r'HashFunction\?[^,]+,\s*', '', c)
    c = c.replace('HashFunction.blake3', '')
    c = c.replace('HashFunction.sha256', '')
    c = c.replace('HashFunction.sha512', '')
    
    # fix imports and tests that explicitly test for sha256/sha512 defaults
    c = re.sub(r"test\('[^']*HashFunction[^']*',.*?\}\);", "", c, flags=re.DOTALL)
    c = re.sub(r"test\('[^']*SHA-256[^']*',.*?\}\);", "", c, flags=re.DOTALL)
    c = re.sub(r"test\('[^']*SHA-512[^']*',.*?\}\);", "", c, flags=re.DOTALL)
    
    with open(f, 'w') as file: file.write(c)

