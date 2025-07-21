import os
import re
import glob

def fix_method_spacing(file_path):
    """
    Improved method spacing fix that handles edge cases better
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        lines = content.split('\n')
        modified_lines = []
        
        i = 0
        while i < len(lines):
            line = lines[i]
            stripped = line.strip()
            
            # Add current line
            modified_lines.append(line)
            
            # Check if this line ends a method (closing brace at method level)
            if stripped == '}' and i > 0:
                # Look ahead to see if next non-empty line is a JSDoc comment
                next_line_idx = i + 1
                
                # Skip existing empty lines
                while next_line_idx < len(lines) and not lines[next_line_idx].strip():
                    next_line_idx += 1
                
                # If next line exists and starts with /** (JSDoc comment)
                if (next_line_idx < len(lines) and 
                    lines[next_line_idx].strip().startswith('/**') and
                    next_line_idx == i + 1):  # No blank line exists
                    
                    # Check if this is not the last closing brace of the class
                    if not is_class_closing_brace(lines, i):
                        modified_lines.append('')
                        print(f"  Added blank line at line {i+1}")
            
            i += 1
        
        new_content = '\n'.join(modified_lines)
        
        # Only write if content changed
        if new_content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"✓ Updated: {file_path}")
            return True
        else:
            print(f"- No changes: {file_path}")
            return False
            
    except Exception as e:
        print(f"✗ Error processing {file_path}: {e}")
        return False

def is_class_closing_brace(lines, brace_index):
    """
    Check if this closing brace is the final closing brace of the class
    """
    # Count remaining non-empty lines after this brace
    remaining_lines = lines[brace_index + 1:]
    non_empty_remaining = [line for line in remaining_lines if line.strip()]
    
    # If only whitespace remains, this is likely the class closing brace
    return len(non_empty_remaining) == 0

def process_all_ts_files():
    """Process all TypeScript files in src/app/ directory"""
    pattern = os.path.join("src", "app", "**", "*.ts")
    files = glob.glob(pattern, recursive=True)
    
    print(f"Found {len(files)} TypeScript files in src/app/")
    print("Processing files for missing blank lines after methods...\n")
    
    updated_count = 0
    
    for file_path in files:
        print(f"\nProcessing: {file_path}")
        if fix_method_spacing(file_path):
            updated_count += 1
    
    print(f"\n=== Summary ===")
    print(f"Processed: {len(files)} files")
    print(f"Updated: {updated_count} files")
    print(f"No changes: {len(files) - updated_count} files")

if __name__ == "__main__":
    process_all_ts_files()
