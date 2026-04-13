---
name: security-scan-trivy
description: Vulnerability scan with Trivy
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
disable-model-invocation: true
---

# Trivy Security Scan

## Instructions

- まずCritical/Highを対象にする
- 例外（許容する脆弱性）は理由と期限を必ず残す
- CIに組み込む場合は「最初は警告→次にfail」に段階導入

