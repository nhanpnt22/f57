import 'package:blake3_dart/blake3_dart.dart'; void main() { var h = Blake3(); h.update(List.filled(1, 0)); print(h.digest()); }
