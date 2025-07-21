import os
import re
import glob

def find_missing_jsdoc(file_path):
    """
    Find methods/functions without JSDoc comments in TypeScript files
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        lines = content.split('\n')
        missing_jsdoc = []
        
        for i, line in enumerate(lines):
            stripped = line.strip()
            
            # Skip empty lines and comments
            if not stripped or stripped.startswith('//') or stripped.startswith('*') or stripped.startswith('/*'):
                continue
            
            # Check for method/function declarations
            if (('(' in stripped and ')' in stripped and ':' in stripped and
                 (stripped.endswith('{') or (i + 1 < len(lines) and lines[i + 1].strip() == '{'))) or
                (stripped.startswith('async ') and '(' in stripped and ')' in stripped)):
                
                # Skip constructors, getters, setters, and simple property assignments
                if (stripped.startswith('constructor') or 
                    stripped.startswith('get ') or 
                    stripped.startswith('set ') or
                    '=' in stripped.split('(')[0] or
                    stripped.startswith('export ') or
                    stripped.startswith('@') or
                    'interface' in stripped or
                    'class' in stripped or
                    'enum' in stripped):
                    continue
                
                # Check if previous non-empty line is JSDoc comment
                prev_line_idx = i - 1
                while prev_line_idx >= 0 and not lines[prev_line_idx].strip():
                    prev_line_idx -= 1
                
                has_jsdoc = False
                if prev_line_idx >= 0:
                    prev_line = lines[prev_line_idx].strip()
                    if prev_line == '*/' or prev_line.startswith('*/'):
                        # Check if there's a /** comment above
                        j = prev_line_idx - 1
                        while j >= 0 and lines[j].strip().startswith('*'):
                            j -= 1
                        if j >= 0 and lines[j].strip().startswith('/**'):
                            has_jsdoc = True
                
                if not has_jsdoc:
                    # Extract method name
                    method_match = re.search(r'(\w+)\s*\(', stripped)
                    method_name = method_match.group(1) if method_match else 'unknown'
                    missing_jsdoc.append({
                        'line': i + 1,
                        'method': method_name,
                        'code': stripped
                    })
        
        return missing_jsdoc
        
    except Exception as e:
        print(f"✗ Error processing {file_path}: {e}")
        return []

def analyze_all_ts_files():
    """Analyze all TypeScript files for missing JSDoc comments"""
    pattern = os.path.join("src", "app", "**", "*.ts")
    files = glob.glob(pattern, recursive=True)
    
    print(f"Analyzing {len(files)} TypeScript files for missing JSDoc comments...\n")
    
    total_missing = 0
    files_with_missing = 0
    
    for file_path in files:
        missing = find_missing_jsdoc(file_path)
        if missing:
            files_with_missing += 1
            total_missing += len(missing)
            print(f"\n📄 {file_path}")
            print("-" * 50)
            for item in missing:
                print(f"  Line {item['line']:3d}: {item['method']}")
                print(f"           {item['code'][:80]}...")
    
    print(f"\n=== Summary ===")
    print(f"Files analyzed: {len(files)}")
    print(f"Files with missing JSDoc: {files_with_missing}")
    print(f"Total missing JSDoc comments: {total_missing}")
    
    if total_missing == 0:
        print("🎉 All methods have JSDoc comments!")
    else:
        print(f"⚠️  {total_missing} methods need JSDoc comments")

if __name__ == "__main__":
    analyze_all_ts_files()
