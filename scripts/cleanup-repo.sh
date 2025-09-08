#!/usr/bin/env bash
set -euo pipefail

echo "Cleaning repository artifacts (coverage, caches, logs)..."

rm -rf ./coverage-acs ./coverage-extractor ./.jest-cache ./.swc ./.next

find . -maxdepth 1 -type f -name "*results.log" -delete || true
find . -maxdepth 1 -type f -name "*validation.log" -delete || true
find . -maxdepth 1 -type f -name "*verification-results.log" -delete || true
find . -maxdepth 1 -type f -name "test-coverage-results.log" -delete || true
find . -maxdepth 1 -type f -name "test-results.log" -delete || true
find . -maxdepth 1 -type f -name "test-suite-results.log" -delete || true
find . -maxdepth 1 -type f -name "performance-results.log" -delete || true
find . -maxdepth 1 -type f -name "perf-results.log" -delete || true
find . -maxdepth 1 -type f -name "accessibility-results.log" -delete || true
find . -maxdepth 1 -type f -name "a11y-results.log" -delete || true

echo "Done."

