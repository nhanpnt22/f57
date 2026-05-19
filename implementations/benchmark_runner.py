#!/usr/bin/env python3
import os
import subprocess
import json
import time

def run_go():
    print("Running Go benchmark...")
    cmd = ["go", "run", "cmd/benchmark/main.go"]
    res = subprocess.run(cmd, cwd="go", capture_output=True, text=True)
    return json.loads(res.stdout.strip())

def run_js():
    print("Running JavaScript benchmark...")
    cmd = ["node", "scripts/benchmark.mjs"]
    res = subprocess.run(cmd, cwd="javascript", capture_output=True, text=True)
    return json.loads(res.stdout.strip())

def run_rust():
    print("Running Rust benchmark...")
    subprocess.run(["cargo", "build", "--release", "--bin", "benchmark"], cwd="rust", capture_output=True)
    cmd = ["./target/release/benchmark"]
    res = subprocess.run(cmd, cwd="rust", capture_output=True, text=True)
    try:
        return json.loads(res.stdout.strip())
    except:
        return {"language": "Rust", "error": res.stderr}

def run_dart():
    print("Running Dart benchmark...")
    cmd = ["dart", "run", "bin/benchmark.dart"]
    res = subprocess.run(cmd, cwd="dart", capture_output=True, text=True)
    return json.loads(res.stdout.strip())

def run_python():
    print("Running Python benchmark...")
    cmd = ["python3", "scripts/benchmark.py"]
    res = subprocess.run(cmd, cwd="python", capture_output=True, text=True)
    return json.loads(res.stdout.strip())

def main():
    results = []
    
    try: results.append(run_go())
    except Exception as e: print(f"Go failed: {e}")
    
    try: results.append(run_js())
    except Exception as e: print(f"JS failed: {e}")
    
    try: results.append(run_rust())
    except Exception as e: print(f"Rust failed: {e}")
    
    try: results.append(run_dart())
    except Exception as e: print(f"Dart failed: {e}")
    
    try: results.append(run_python())
    except Exception as e: print(f"Python failed: {e}")

    # Generate Markdown Report
    md = "# Multi-Language B57 Benchmark Report\n\n"
    md += f"**Date:** {time.strftime('%Y-%m-%d')}\n"
    md += "**Iterations:** 100,000 operations per task (32-byte input)\n\n"
    
    md += "| Language | Encode (ms) | Decode (ms) | ID57 Generate (ms) | Ops/sec (ID57) |\n"
    md += "|----------|-------------|-------------|--------------------|----------------|\n"
    
    for r in results:
        if "error" in r:
            md += f"| {r.get('language', 'Unknown')} | ERROR | ERROR | ERROR | N/A |\n"
        else:
            lang = r["language"]
            enc = r["encode_ms"]
            dec = r["decode_ms"]
            id57 = r["id57_ms"]
            ops_sec = int((r["iterations"] / id57) * 1000) if id57 > 0 else "N/A"
            md += f"| {lang} | {enc} | {dec} | {id57} | {ops_sec} |\n"
    
    with open("BENCHMARK_REPORT.md", "w") as f:
        f.write(md)
    
    print("\n" + md)

if __name__ == "__main__":
    main()
