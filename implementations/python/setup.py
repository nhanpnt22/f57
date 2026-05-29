from setuptools import setup, find_packages

setup(
    name = "f57",
    version="0.1.0",
    description="F57 binary-to-text encoding with H57, ID57, ID57-SHORT, I57, R57 profiles",
    author="F57 Project",
    url="https://github.com/aco/f57",
    project_urls={
        "Source": "https://github.com/aco/f57",
        "Issues": "https://github.com/aco/f57/issues",
    },
    license="All rights reserved",
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
