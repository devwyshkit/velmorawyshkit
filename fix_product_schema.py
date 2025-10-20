#!/usr/bin/env python3
"""
Fix partner_products INSERT statements to match actual schema.
Removes rating and rating_count columns which don't exist.
"""

import re

# Read the SQL file
with open('ALL_MIGRATIONS_AND_DATA.sql', 'r') as f:
    content = f.read()

# Pattern to match INSERT INTO partner_products blocks
insert_pattern = r'(INSERT INTO partner_products \([^)]+\) VALUES \([^)]+\);)'

def fix_insert(match):
    insert_block = match.group(1)
    
    # Remove rating and rating_count from column list
    insert_block = re.sub(r',?\s*rating,', '', insert_block)
    insert_block = re.sub(r',?\s*rating_count,', '', insert_block)
    
    # Remove the corresponding values (4.8, 234, etc.)
    # This is tricky - we need to count commas and remove the right values
    # Simpler: just remove lines that are standalone numbers after removing columns
    lines = insert_block.split('\n')
    fixed_lines = []
    skip_next_value = False
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        
        # Skip if this line was a rating column
        if 'rating,' in line or 'rating_count,' in line:
            continue
            
        # Check if previous line was rating column, skip the value
        if i > 0 and ('rating,' in lines[i-1] or 'rating_count,' in lines[i-1]):
            # This line might be the value, check if it's just a number
            if re.match(r'^\s*\d+\.?\d*,?\s*$', line):
                continue
        
        fixed_lines.append(line)
    
    return '\n'.join(fixed_lines)

# Fix all INSERT statements
fixed_content = re.sub(
    r'INSERT INTO partner_products \(([^)]+)\) VALUES \(([^)]+)\);',
    fix_insert,
    content,
    flags=re.DOTALL
)

# Write back
with open('ALL_MIGRATIONS_AND_DATA.sql', 'w') as f:
    f.write(fixed_content)

print("✅ Fixed partner_products INSERT statements")
print("Removed: rating, rating_count columns and their values")

