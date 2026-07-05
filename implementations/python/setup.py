from pathlib import Path

from setuptools import setup, find_packages


README = Path(__file__).with_name("README.md").read_text(encoding="utf-8")

setup(
    name = "f57",
    version="0.3.0",
    description="F57 binary-to-text encoding with H57, ID57 (incl. fixed-width lengths), I57, R57 profiles",
    long_description=README,
    long_description_content_type="text/markdown",
    author="F57 Project",
    url="https://github.com/aco/f57",
    project_urls={
        "Source": "https://github.com/aco/f57",
        "Issues": "https://github.com/aco/f57/issues",
    },
    license="All rights reserved",
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3 :: Only",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Software Development :: Libraries",
        "Topic :: Security :: Cryptography",
        "License :: Other/Proprietary License",
    ],
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    python_requires=">=3.8",
    install_requires=[
        "cryptography>=3.4",
        "blake3>=0.3",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0",
            "pytest-cov>=3.0",
        ],
    },
)
