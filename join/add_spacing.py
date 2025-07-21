import os
import re
import glob

def add_spacing_after_methods(file_path):
    """
    Add blank lines after method/function endings in TypeScript files
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        lines = content.split('\n')
        modified_lines = []
        
        brace_count = 0
        in_method = False
        
        for i, line in enumerate(lines):
            stripped = line.strip()
            
            # Add current line
            modified_lines.append(line)
            
            # Skip empty lines and comments
            if not stripped or stripped.startswith('//') or stripped.startswith('*') or stripped.startswith('/*'):
                continue
            
            # Detect method/function patterns
            if (('(' in stripped and ')' in stripped and 
                 ('{' in stripped or (i + 1 < len(lines) and lines[i + 1].strip() == '{'))) and
                not stripped.startswith('if') and not stripped.startswith('for') and 
                not stripped.startswith('while') and not stripped.startswith('switch')):
                in_method = True
                brace_count = 0
            
            # Count braces
            if in_method:
                brace_count += line.count('{') - line.count('}')
                
                # Method is complete when brace count reaches 0
                if brace_count == 0:
                    in_method = False
                    
                    # Check if we need to add a blank line
                    next_line_idx = i + 1
                    
                    # Skip existing empty lines
                    while next_line_idx < len(lines) and not lines[next_line_idx].strip():
                        next_line_idx += 1
                    
                    # Add blank line if next line exists and is not a closing brace
                    if (next_line_idx < len(lines) and 
                        lines[next_line_idx].strip() and
                        not lines[next_line_idx].strip().startswith('}') and
                        next_line_idx == i + 1):  # No blank line already exists
                        modified_lines.append('')
        
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

def process_all_ts_files():
    """Process all TypeScript files in src/app/ directory"""
    pattern = os.path.join("src", "app", "**", "*.ts")
    files = glob.glob(pattern, recursive=True)
    
    print(f"Found {len(files)} TypeScript files in src/app/")
    print("Processing files...\n")
    
    updated_count = 0
    
    for file_path in files:
        if add_spacing_after_methods(file_path):
            updated_count += 1
    
    print(f"\n=== Summary ===")
    print(f"Processed: {len(files)} files")
    print(f"Updated: {updated_count} files")
    print(f"No changes: {len(files) - updated_count} files")

if __name__ == "__main__":
    process_all_ts_files()
