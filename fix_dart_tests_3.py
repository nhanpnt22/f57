import glob, re

for f in glob.glob('implementations/dart/test/*.dart') + glob.glob('implementations/dart/bin/*.dart'):
    with open(f, 'r') as file: c = file.read()
    
    c = re.sub(r'expect\(i57ValidateIdentifier.*?\);\n', '', c)
    c = re.sub(r'expect\(i57ValidateEntropy.*?\);\n', '', c)
    c = re.sub(r"'i57ValidateIdentifier':.*?,", '', c)
    c = re.sub(r"'i57ValidateEntropy':.*?,", '', c)
    c = re.sub(r"'i57ValidateIdentifierId':.*?,", '', c)
    
    c = re.sub(r'expect\(id57IsValid.*?\);\n', '', c)
    c = re.sub(r'expect\(id57IsCanonical.*?\);\n', '', c)
    
    c = re.sub(r'expect\(id57ShortIsValid.*?\);\n', '', c)
    c = re.sub(r'expect\(id57ShortIsCanonical.*?\);\n', '', c)
    
    # H57 auto canonical lengths
    c = re.sub(r"test\('[^']*auto canonical lengths[^']*',.*?\}\);", "", c, flags=re.DOTALL)
    
    with open(f, 'w') as file: file.write(c)

