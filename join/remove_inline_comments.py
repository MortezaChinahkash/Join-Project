import os
import re
import glob

def remove_inline_comments(file_path):
    """
    Remove comments inside code blocks while preserving JSDoc comments
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        lines = content.split('\n')
        modified_lines = []
        changes_made = 0
        
        in_jsdoc = False
        in_multiline_comment = False
        
        for line in lines:
            original_line = line
            
            # Check if we're starting a JSDoc comment
            if line.strip().startswith('/**'):
                in_jsdoc = True
                modified_lines.append(line)
                continue
            
            # Check if we're ending a JSDoc comment
            if in_jsdoc and (line.strip().endswith('*/') or line.strip() == '*/'):
                in_jsdoc = False
                modified_lines.append(line)
                continue
            
            # Preserve JSDoc comments
            if in_jsdoc:
                modified_lines.append(line)
                continue
            
            # Check for multiline comments that are NOT JSDoc
            if '/*' in line and not line.strip().startswith('/**'):
                in_multiline_comment = True
                # Remove the comment from this line
                before_comment = line.split('/*')[0]
                if '*/' in line:
                    # Single line multiline comment
                    after_comment = line.split('*/')[-1]
                    line = before_comment + after_comment
                    in_multiline_comment = False
                else:
                    line = before_comment
                
                # Only keep the line if it has non-whitespace content
                if line.strip():
                    modified_lines.append(line.rstrip())
                if original_line != line.rstrip():
                    changes_made += 1
                continue
            
            # Skip lines that are entirely multiline comments
            if in_multiline_comment:
                if '*/' in line:
                    in_multiline_comment = False
                    # Get content after the closing comment
                    after_comment = line.split('*/')[-1]
                    if after_comment.strip():
                        modified_lines.append(after_comment.rstrip())
                changes_made += 1
                continue
            
            # Remove single line comments (//)
            if '//' in line:
                # Check if // is inside a string
                in_string = False
                quote_char = None
                i = 0
                comment_index = -1
                
                while i < len(line):
                    char = line[i]
                    
                    # Handle string literals
                    if not in_string and (char == '"' or char == "'" or char == '`'):
                        in_string = True
                        quote_char = char
                    elif in_string and char == quote_char and (i == 0 or line[i-1] != '\\'):
                        in_string = False
                        quote_char = None
                    
                    # Find // outside of strings
                    elif not in_string and i < len(line) - 1 and line[i:i+2] == '//':
                        comment_index = i
                        break
                    
                    i += 1
                
                if comment_index >= 0:
                    line = line[:comment_index].rstrip()
                    if original_line.strip() != line.strip():
                        changes_made += 1
            
            # Only add non-empty lines or preserve indentation for empty lines in meaningful contexts
            if line.strip() or (not line.strip() and len(modified_lines) > 0 and modified_lines[-1].strip()):
                modified_lines.append(line)
            elif original_line.strip() and not line.strip():
                changes_made += 1
        
        # Remove trailing empty lines but keep one empty line at the end if file had content
        while modified_lines and not modified_lines[-1].strip():
            modified_lines.pop()
        
        if modified_lines:
            modified_lines.append('')  # Add one empty line at the end
        
        new_content = '\n'.join(modified_lines)
        
        if changes_made > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"✓ Removed {changes_made} inline comments from: {file_path}")
            return changes_made
        else:
            print(f"- No inline comments found in: {file_path}")
            return 0
            
    except Exception as e:
        print(f"✗ Error processing {file_path}: {e}")
        return 0

def process_all_ts_files():
    """Process all TypeScript files to remove inline comments"""
    pattern = os.path.join("src", "app", "**", "*.ts")
    files = glob.glob(pattern, recursive=True)
    
    print(f"Removing inline comments from {len(files)} TypeScript files...\n")
    
    total_removed = 0
    files_updated = 0
    
    for file_path in files:
        removed = remove_inline_comments(file_path)
        if removed > 0:
            files_updated += 1
            total_removed += removed
    
    print(f"\n=== Summary ===")
    print(f"Files processed: {len(files)}")
    print(f"Files updated: {files_updated}")
    print(f"Total inline comments removed: {total_removed}")
    print(f"JSDoc comments preserved: ✓")

if __name__ == "__main__":
    process_all_ts_files()
