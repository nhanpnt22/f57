import glob, re

for f in glob.glob('implementations/dart/test/*.dart') + glob.glob('implementations/dart/bin/*.dart'):
    with open(f, 'r') as file: c = file.read()
    
    c = c.replace('id57GenerateDefault(input)', 'id57Generate(input, ID57Length.def)')
    c = c.replace("id57GenerateDefault('x'.codeUnits)", "id57Generate('x'.codeUnits, ID57Length.def)")
    c = c.replace("id57GenerateDefault('abc'.codeUnits)", "id57Generate('abc'.codeUnits, ID57Length.def)")
    c = c.replace("id57GenerateDefault('test'.codeUnits)", "id57Generate('test'.codeUnits, ID57Length.def)")
    
    c = c.replace("id57VerifyDefault('abc'.codeUnits, s)", "id57Verify('abc'.codeUnits, s, ID57Length.def)")
    c = c.replace("id57VerifyDefault('abcx'.codeUnits, s)", "id57Verify('abcx'.codeUnits, s, ID57Length.def)")
    c = c.replace("id57VerifyDefault(input, id57Default)", "id57Verify(input, id57Default, ID57Length.def)")
    
    c = c.replace("id57ShortGenerateDefault('abc'.codeUnits)", "id57ShortGenerate('abc'.codeUnits, ID57ShortLength.def)")
    c = c.replace("id57ShortGenerateDefault('test'.codeUnits)", "id57ShortGenerate('test'.codeUnits, ID57ShortLength.def)")
    c = c.replace("id57ShortGenerateDefault(input)", "id57ShortGenerate(input, ID57ShortLength.def)")
    
    c = c.replace("id57ShortVerifyDefault('abc'.codeUnits, s)", "id57ShortVerify('abc'.codeUnits, s, ID57ShortLength.def)")
    c = c.replace("id57ShortVerifyDefault(input, id57ShortDefault)", "id57ShortVerify(input, id57ShortDefault, ID57ShortLength.def)")

    # random R57Mode 
    c = c.replace('i57Random(R57Mode.csprng)', 'i57Random(22)')

    # Some test methods like id57IsValid and ValidateIdentifier might just need string removal of those assertions if they are totally gone in i57.dart. 
    # Or I should add them back to i57 and id57 if they were meant to be exported. Looking at h57.dart we have h57IsValid, for id57 we can add them.
    
    with open(f, 'w') as file: file.write(c)

