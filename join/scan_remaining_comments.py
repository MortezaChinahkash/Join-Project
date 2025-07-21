import os
import re
import glob

def find_inline_comments(file_path):
    """
    Find remaining inline comments in TypeScript files
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        lines = content.split('\n')
        inline_comments = []
        
        in_jsdoc = False
        in_multiline_comment = False
        
        for i, line in enumerate(lines):
            original_line = line
            
            # Check if we're in a JSDoc comment
            if line.strip().startswith('/**'):
                in_jsdoc = True
                continue
            
            if in_jsdoc and (line.strip().endswith('*/') or line.strip() == '*/'):
                in_jsdoc = False
                continue
            
            # Skip JSDoc comments
            if in_jsdoc or line.strip().startswith('*'):
                continue
            
            # Check for multiline comments that are NOT JSDoc
            if '/*' in line and not line.strip().startswith('/**'):
                in_multiline_comment = True
                inline_comments.append({
                    'line': i + 1,
                    'type': 'multiline_start',
                    'content': line.strip()
                })
                if '*/' in line:
                    in_multiline_comment = False
                continue
            
            # Skip lines that are entirely multiline comments
            if in_multiline_comment:
                if '*/' in line:
                    in_multiline_comment = False
                    inline_comments.append({
                        'line': i + 1,
                        'type': 'multiline_end',
                        'content': line.strip()
                    })
                else:
                    inline_comments.append({
                        'line': i + 1,
                        'type': 'multiline_content',
                        'content': line.strip()
                    })
                continue
            
            # Check for single line comments (//)
            if '//' in line:
                # Check if // is inside a string
                in_string = False
                quote_char = None
                i_char = 0
                comment_index = -1
                
                while i_char < len(line):
                    char = line[i_char]
                    
                    # Handle string literals
                    if not in_string and (char == '"' or char == "'" or char == '`'):
                        in_string = True
                        quote_char = char
                    elif in_string and char == quote_char and (i_char == 0 or line[i_char-1] != '\\'):
                        in_string = False
                        quote_char = None
                    
                    # Find // outside of strings
                    elif not in_string and i_char < len(line) - 1 and line[i_char:i_char+2] == '//':
                        comment_index = i_char
                        break
                    
                    i_char += 1
                
                if comment_index >= 0:
                    comment_content = line[comment_index:].strip()
                    code_before = line[:comment_index].strip()
                    
                    inline_comments.append({
                        'line': i + 1,
                        'type': 'single_line',
                        'content': comment_content,
                        'code_before': code_before
                    })
        
        return inline_comments
        
    except Exception as e:
        print(f"✗ Error processing {file_path}: {e}")
        return []

def scan_all_ts_files():
    """Scan all TypeScript files for remaining inline comments"""
    pattern = os.path.join("src", "app", "**", "*.ts")
    files = glob.glob(pattern, recursive=True)
    
    print(f"Scanning {len(files)} TypeScript files for remaining inline comments...\n")
    
    total_comments = 0
    files_with_comments = 0
    
    for file_path in files:
        comments = find_inline_comments(file_path)
        if comments:
            files_with_comments += 1
            total_comments += len(comments)
            print(f"\n📄 {file_path}")
            print("-" * 60)
            for comment in comments:
                if comment['type'] == 'single_line':
                    print(f"  Line {comment['line']:3d}: {comment['content']}")
                    if comment['code_before']:
                        print(f"           Code: {comment['code_before']}")
                elif comment['type'] == 'multiline_start':
                    print(f"  Line {comment['line']:3d}: {comment['content']} (multiline start)")
                elif comment['type'] == 'multiline_content':
                    print(f"  Line {comment['line']:3d}: {comment['content']} (multiline content)")
                elif comment['type'] == 'multiline_end':
                    print(f"  Line {comment['line']:3d}: {comment['content']} (multiline end)")
    
    print(f"\n=== Summary ===")
    print(f"Files scanned: {len(files)}")
    print(f"Files with inline comments: {files_with_comments}")
    print(f"Total inline comments found: {total_comments}")
    
    if total_comments == 0:
        print("🎉 No inline comments found in code blocks!")
    else:
        print(f"⚠️  {total_comments} inline comments still exist")

if __name__ == "__main__":
    scan_all_ts_files()
