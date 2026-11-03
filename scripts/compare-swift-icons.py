#!/usr/bin/env python3
import json
import sys
from icon_parity import compare

report = compare(sys.argv[1], swift=True)
print(json.dumps(report, indent=2))
sys.exit(1 if report["failed"] else 0)
