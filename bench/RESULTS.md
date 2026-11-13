# ASST benchmark results

Generated 2026-11-13T14:31:38.387Z on win32-x64, Node 22.23.5. Findings counted at confidence ≥ medium. Reproduce with `npm run bench`.

Precision = TP/(TP+FP), Recall = TP/(TP+FN), F1 = harmonic mean (percent).

## fixtures

| Version | Precision | Recall | F1 | TP | FP | FN | Time (s) | Files/s | Peak RSS (MB) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| v1.0 (line-based engine) | 19.0 | 30.8 | 23.5 | 12 | 51 | 27 | 0.5 | 121 | 41 |
| v2 (current branch) | 100.0 | 100.0 | 100.0 | 39 | 0 | 0 | 0.2 | 358 | 49 |

| CWE | v1.0 (line-based engine) P / R / F1 | v2 (current branch) P / R / F1 |
|---|---:|---:|
| CWE-22 | 66.7 / 50.0 / 57.1 | 100.0 / 100.0 / 100.0 |
| CWE-78 | 25.0 / 50.0 / 33.3 | 100.0 / 100.0 / 100.0 |
| CWE-79 | 5.4 / 40.0 / 9.5 | 100.0 / 100.0 / 100.0 |
| CWE-89 | 50.0 / 33.3 / 40.0 | 100.0 / 100.0 / 100.0 |
| CWE-90 | 100.0 / 100.0 / 100.0 | 100.0 / 100.0 / 100.0 |
| CWE-95 | 50.0 / 100.0 / 66.7 | 100.0 / 100.0 / 100.0 |
| CWE-98 | – / 0.0 / 0.0 | 100.0 / 100.0 / 100.0 |
| CWE-117 | – / 0.0 / 0.0 | 100.0 / 100.0 / 100.0 |
| CWE-200 | – / 0.0 / 0.0 | 100.0 / 100.0 / 100.0 |
| CWE-209 | – / 0.0 / 0.0 | 100.0 / 100.0 / 100.0 |
| CWE-338 | – / 0.0 / 0.0 | 100.0 / 100.0 / 100.0 |
| CWE-352 | 33.3 / 100.0 / 50.0 | 100.0 / 100.0 / 100.0 |
| CWE-384 | – / 0.0 / 0.0 | 100.0 / 100.0 / 100.0 |
| CWE-502 | – / 0.0 / 0.0 | 100.0 / 100.0 / 100.0 |
| CWE-601 | – / 0.0 / 0.0 | 100.0 / 100.0 / 100.0 |
| CWE-611 | 25.0 / 100.0 / 40.0 | 100.0 / 100.0 / 100.0 |
| CWE-621 | – / 0.0 / 0.0 | 100.0 / 100.0 / 100.0 |
| CWE-643 | – / 0.0 / 0.0 | 100.0 / 100.0 / 100.0 |
| CWE-697 | – / 0.0 / 0.0 | 100.0 / 100.0 / 100.0 |
| CWE-698 | 20.0 / 100.0 / 33.3 | 100.0 / 100.0 / 100.0 |
| CWE-798 | – / 0.0 / 0.0 | 100.0 / 100.0 / 100.0 |
| CWE-916 | – / 0.0 / 0.0 | 100.0 / 100.0 / 100.0 |
| CWE-918 | – / 0.0 / 0.0 | 100.0 / 100.0 / 100.0 |

## fixtures-app

| Version | Precision | Recall | F1 | TP | FP | FN | Time (s) | Files/s | Peak RSS (MB) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| v1.0 (line-based engine) | 41.2 | 41.2 | 41.2 | 7 | 10 | 10 | 0.1 | 136 | 42 |
| v2 (current branch) | 100.0 | 100.0 | 100.0 | 17 | 0 | 0 | 0.2 | 106 | 45 |

| CWE | v1.0 (line-based engine) P / R / F1 | v2 (current branch) P / R / F1 |
|---|---:|---:|
| CWE-78 | 50.0 / 100.0 / 66.7 | 100.0 / 100.0 / 100.0 |
| CWE-79 | 14.3 / 33.3 / 20.0 | 100.0 / 100.0 / 100.0 |
| CWE-89 | 100.0 / 100.0 / 100.0 | 100.0 / 100.0 / 100.0 |
| CWE-98 | – / 0.0 / 0.0 | 100.0 / 100.0 / 100.0 |
| CWE-209 | – / 0.0 / 0.0 | 100.0 / 100.0 / 100.0 |
| CWE-352 | 100.0 / 100.0 / 100.0 | 100.0 / 100.0 / 100.0 |
| CWE-384 | – / 0.0 / 0.0 | 100.0 / 100.0 / 100.0 |
| CWE-538 | 50.0 / 50.0 / 50.0 | 100.0 / 100.0 / 100.0 |
| CWE-698 | 50.0 / 100.0 / 66.7 | 100.0 / 100.0 / 100.0 |
| CWE-798 | – / 0.0 / 0.0 | 100.0 / 100.0 / 100.0 |
| CWE-916 | – / 0.0 / 0.0 | 100.0 / 100.0 / 100.0 |
| CWE-918 | – / 0.0 / 0.0 | 100.0 / 100.0 / 100.0 |

## dvwa

| Version | Precision | Recall | F1 | TP | FP | FN | Time (s) | Files/s | Peak RSS (MB) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| v1.0 (line-based engine) | 91.7 | 78.6 | 84.6 | 11 | 1 | 3 | 3.4 | 73 | 59 |
| v2 (current branch) | 100.0 | 78.6 | 88.0 | 11 | 0 | 3 | 0.5 | 483 | 69 |

| CWE | v1.0 (line-based engine) P / R / F1 | v2 (current branch) P / R / F1 |
|---|---:|---:|
| CWE-78 | 75.0 / 100.0 / 85.7 | 100.0 / 100.0 / 100.0 |
| CWE-79 | 100.0 / 100.0 / 100.0 | – / 0.0 / 0.0 |
| CWE-89 | 100.0 / 100.0 / 100.0 | 100.0 / 83.3 / 90.9 |
| CWE-98 | 100.0 / 100.0 / 100.0 | – / 0.0 / 0.0 |
| CWE-601 | – / 0.0 / 0.0 | 100.0 / 100.0 / 100.0 |

## sard

2006 of 42212 cases (sample-2000); scanned with --second-order, matching the suite's threat model (session data, files and command output are untrusted)

| Version | Precision | Recall | F1 | TP | FP | FN | Time (s) | Files/s | Peak RSS (MB) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| v1.0 (line-based engine) | 28.1 | 48.6 | 35.6 | 300 | 769 | 317 | 34.7 | 58 | 79 |
| v2 (current branch) | 73.4 | 60.8 | 66.5 | 375 | 136 | 242 | 2.4 | 844 | 96 |

| CWE | v1.0 (line-based engine) P / R / F1 | v2 (current branch) P / R / F1 |
|---|---:|---:|
| CWE-78 | 25.2 / 100.0 / 40.3 | 53.3 / 53.3 / 53.3 |
| CWE-79 | 46.4 / 53.9 / 49.9 | 79.1 / 53.4 / 63.8 |
| CWE-89 | 9.5 / 100.0 / 17.4 | 100.0 / 72.1 / 83.8 |
| CWE-90 | 54.9 / 100.0 / 70.9 | 80.7 / 88.0 / 84.2 |
| CWE-91 | – / 0.0 / 0.0 | 41.0 / 41.7 / 41.3 |
| CWE-95 | 20.8 / 100.0 / 34.4 | 100.0 / 31.3 / 47.6 |
| CWE-98 | – / 0.0 / 0.0 | 40.0 / 75.0 / 52.2 |
| CWE-209 | – / 0.0 / 0.0 | 100.0 / 100.0 / 100.0 |
| CWE-311 | – / 0.0 / 0.0 | – / 0.0 / 0.0 |
| CWE-327 | – / 0.0 / 0.0 | – / 0.0 / 0.0 |
| CWE-601 | – / 0.0 / 0.0 | 100.0 / 61.0 / 75.8 |
| CWE-862 | – / 0.0 / 0.0 | – / 0.0 / 0.0 |

## Notes

- Fixtures: the annotated ASST fixture corpus (test/fixtures). It is also the regression suite, so high scores are expected there; DVWA and NIST SARD are the independent measures.
- DVWA: ground truth per module and security level in bench/truth/dvwa.json ("impossible" level = secure reference). Modules whose flaw spans several files are scored at module level.
- NIST SARD #103: scored per test-case file. The suite treats session data, files and command output as untrusted input, so the current engine runs with --second-order on this dataset. Labels are used exactly as published; a small number of generated cases sanitize a different variable than the one they use, which affects every tool equally.
- v1.0 findings are mapped to CWE ids by the function or message each finding names.

