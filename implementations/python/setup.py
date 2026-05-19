from setuptools import setup, find_packages

setup(
    name="b57",
    version="0.1.0",
    description="B57 binary-to-text encoding with H57, ID57, ID57-SHORT, I57, R57 profiles",
    author="B57 Project",
    license="All rights reserved",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    python_requires=">=3.8",
    install_requires=[
        "cryptography>=3.4",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0",
            "pytest-cov>=3.0",
        ],
    },
)
