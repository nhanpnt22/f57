perl -pi -e 's/- BLAKE3 \(preferred\)/- BLAKE3 (primary default)/' "spec/H57 CORE API.txt"
perl -pi -e 's/- BLAKE3 SHOULD be default/- BLAKE3 SHOULD be the primary default/' "spec/ID57 CORE API (MINDU).txt" "spec/ID57-SHORT PROFILE.txt"
