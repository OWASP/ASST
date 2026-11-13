# ASST benchmark results

Generated 2026-11-13T13:46:15.296Z on win32-x64, Node 22.23.5. Findings counted at confidence ≥ medium. Reproduce with `npm run bench`.

Precision = TP/(TP+FP), Recall = TP/(TP+FN), F1 = harmonic mean (percent).

## fixtures

| Version | Precision | Recall | F1 | TP | FP | FN | Time (s) | Files/s | Peak RSS (MB) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| v1.0 (line-based engine) | 19.0 | 30.8 | 23.5 | 12 | 51 | 27 | 0.4 | 157 | 43 |

| CWE | v1.0 (line-based engine) P / R / F1 |
|---|---:|
| CWE-22 | 66.7 / 50.0 / 57.1 |
| CWE-78 | 25.0 / 50.0 / 33.3 |
| CWE-79 | 5.4 / 40.0 / 9.5 |
| CWE-89 | 50.0 / 33.3 / 40.0 |
| CWE-90 | 100.0 / 100.0 / 100.0 |
| CWE-95 | 50.0 / 100.0 / 66.7 |
| CWE-98 | – / 0.0 / 0.0 |
| CWE-117 | – / 0.0 / 0.0 |
| CWE-200 | – / 0.0 / 0.0 |
| CWE-209 | – / 0.0 / 0.0 |
| CWE-338 | – / 0.0 / 0.0 |
| CWE-352 | 33.3 / 100.0 / 50.0 |
| CWE-384 | – / 0.0 / 0.0 |
| CWE-502 | – / 0.0 / 0.0 |
| CWE-601 | – / 0.0 / 0.0 |
| CWE-611 | 25.0 / 100.0 / 40.0 |
| CWE-621 | – / 0.0 / 0.0 |
| CWE-643 | – / 0.0 / 0.0 |
| CWE-697 | – / 0.0 / 0.0 |
| CWE-698 | 20.0 / 100.0 / 33.3 |
| CWE-798 | – / 0.0 / 0.0 |
| CWE-916 | – / 0.0 / 0.0 |
| CWE-918 | – / 0.0 / 0.0 |

## fixtures-app

| Version | Precision | Recall | F1 | TP | FP | FN | Time (s) | Files/s | Peak RSS (MB) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| v1.0 (line-based engine) | 35.3 | 40.0 | 37.5 | 6 | 11 | 9 | 0.1 | 157 | 43 |

| CWE | v1.0 (line-based engine) P / R / F1 |
|---|---:|
| CWE-78 | 50.0 / 100.0 / 66.7 |
| CWE-79 | 14.3 / 33.3 / 20.0 |
| CWE-89 | 100.0 / 100.0 / 100.0 |
| CWE-98 | – / 0.0 / 0.0 |
| CWE-209 | – / 0.0 / 0.0 |
| CWE-352 | 100.0 / 100.0 / 100.0 |
| CWE-384 | – / 0.0 / 0.0 |
| CWE-538 | 25.0 / 50.0 / 33.3 |
| CWE-698 | 50.0 / 100.0 / 66.7 |
| CWE-798 | – / 0.0 / 0.0 |
| CWE-916 | – / 0.0 / 0.0 |
| CWE-918 | – / 0.0 / 0.0 |

## dvwa

| Version | Precision | Recall | F1 | TP | FP | FN | Time (s) | Files/s | Peak RSS (MB) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| v1.0 (line-based engine) | 91.7 | 78.6 | 84.6 | 11 | 1 | 3 | 10.2 | 25 | 59 |

| CWE | v1.0 (line-based engine) P / R / F1 |
|---|---:|
| CWE-78 | 75.0 / 100.0 / 85.7 |
| CWE-79 | 100.0 / 100.0 / 100.0 |
| CWE-89 | 100.0 / 100.0 / 100.0 |
| CWE-98 | 100.0 / 100.0 / 100.0 |
| CWE-601 | – / 0.0 / 0.0 |

## sard

2006 of 42212 cases (sample-2000)

| Version | Precision | Recall | F1 | TP | FP | FN | Time (s) | Files/s | Peak RSS (MB) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| v1.0 (line-based engine) | 28.1 | 48.6 | 35.6 | 300 | 769 | 317 | 97.1 | 21 | 75 |

| CWE | v1.0 (line-based engine) P / R / F1 |
|---|---:|
| CWE-78 | 25.2 / 100.0 / 40.3 |
| CWE-79 | 46.4 / 53.9 / 49.9 |
| CWE-89 | 9.5 / 100.0 / 17.4 |
| CWE-90 | 54.9 / 100.0 / 70.9 |
| CWE-91 | – / 0.0 / 0.0 |
| CWE-95 | 20.8 / 100.0 / 34.4 |
| CWE-98 | – / 0.0 / 0.0 |
| CWE-209 | – / 0.0 / 0.0 |
| CWE-311 | – / 0.0 / 0.0 |
| CWE-327 | – / 0.0 / 0.0 |
| CWE-601 | – / 0.0 / 0.0 |
| CWE-862 | – / 0.0 / 0.0 |

