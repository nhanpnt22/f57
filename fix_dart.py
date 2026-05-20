import os, glob, re

# Fix lib files
def rewrite(f, process_fn):
    with open(f, 'r') as file:
        content = file.read()
    new_content = process_fn(content)
    with open(f, 'w') as file:
        file.write(new_content)

def fix_errors(c):
    c = re.sub(r'class InvalidHashFunctionError.*?\n.*?\n.*?\n.*?\n.*?\n\}\n', '', c, flags=re.DOTALL)
    c = re.sub(r'class InvalidHashFunctionError.*?\n.*?\n.*?\n.*?\n\}\n', '', c, flags=re.DOTALL)
    return c

rewrite('implementations/dart/lib/src/errors.dart', fix_errors)

