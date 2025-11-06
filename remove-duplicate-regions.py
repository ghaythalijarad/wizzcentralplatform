#!/usr/bin/env python3
"""
Remove duplicate regions API code from local-dev-server.js
Removes lines 792 through 2451 (the entire legacy Mapbox section)
"""

import os
from datetime import datetime

FILE_PATH = "/Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/local-dev-server.js"

# Backup the file
backup_name = f"{FILE_PATH}.backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
os.system(f'cp "{FILE_PATH}" "{backup_name}"')
print(f"✅ Backup created: {backup_name}")

# Read the file
with open(FILE_PATH, 'r') as f:
    lines = f.readlines()

print(f"📊 Original file: {len(lines)} lines")

# Find the section to remove
start_marker = "// REGIONS MANAGEMENT API - MAPBOX-POWERED SYSTEM"
end_marker = "// Redirect for old regions management URLs"

start_line = None
end_line = None

for i, line in enumerate(lines):
    if start_marker in line and start_line is None:
        start_line = i
        print(f"📍 Found start at line {i + 1}")
    if end_marker in line and end_line is None:
        end_line = i
        print(f"📍 Found end at line {i + 1}")
        break

if start_line is not None and end_line is not None:
    # Remove the section
    new_lines = lines[:start_line] + lines[end_line:]
    
    with open(FILE_PATH, 'w') as f:
        f.writelines(new_lines)
    
    removed_count = end_line - start_line
    print(f"✅ Removed {removed_count} lines")
    print(f"📊 New file: {len(new_lines)} lines")
    print("")
    print("✅ Cleanup complete!")
else:
    print("❌ Could not find markers")
    print(f"   Start found: {start_line is not None}")
    print(f"   End found: {end_line is not None}")
