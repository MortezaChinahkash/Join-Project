import os
import re
import glob

def analyze_method_length(file_path):
    """
    Analyze method/function lengths in TypeScript files
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        lines = content.split('\n')
        long_methods = []
        
        i = 0
        while i < len(lines):
            line = lines[i]
            stripped = line.strip()
            
            # Skip empty lines, comments, and non-method lines
            if (not stripped or 
                stripped.startswith('//') or 
                stripped.startswith('*') or 
                stripped.startswith('/*') or
                stripped.startswith('export ') or
                stripped.startswith('import ') or
                stripped.startswith('@') or
                'interface' in stripped or
                'enum' in stripped or
                (stripped.startswith('class ') and '{' in stripped)):
                i += 1
                continue
            
            # Check for method/function declarations
            if is_method_declaration(stripped, lines, i):
                method_info = analyze_method_from_line(lines, i, file_path)
                if method_info and method_info['code_lines'] > 14:
                    long_methods.append(method_info)
                i = method_info['end_line'] if method_info else i + 1
            else:
                i += 1
        
        return long_methods
        
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return []

def is_method_declaration(stripped, lines, i):
    """Check if this line is a method/function declaration"""
    # Constructor
    if stripped.startswith('constructor'):
        return True
    
    # Regular method/function with parentheses and either : or {
    if ('(' in stripped and ')' in stripped and 
        ((':' in stripped and ('{' in stripped or 
         (i + 1 < len(lines) and lines[i + 1].strip() == '{'))) or
         stripped.startswith('async '))):
        return True
    
    # Angular lifecycle hooks
    if (stripped.startswith('ngOnInit') or 
        stripped.startswith('ngOnDestroy') or 
        stripped.startswith('ngOnChanges') or
        stripped.startswith('ngAfterViewInit')):
        return True
    
    return False

def analyze_method_from_line(lines, start_line, file_path):
    """Analyze a method starting from a specific line"""
    try:
        method_line = lines[start_line].strip()
        
        # Extract method name
        method_name = extract_method_name(method_line)
        if not method_name:
            return None
        
        # Find method boundaries
        brace_count = 0
        method_started = False
        code_lines = 0
        total_lines = 0
        
        i = start_line
        while i < len(lines):
            line = lines[i]
            stripped = line.strip()
            
            # Count braces to find method boundaries
            open_braces = line.count('{')
            close_braces = line.count('}')
            
            if open_braces > 0:
                method_started = True
            
            brace_count += open_braces - close_braces
            
            # Count lines
            total_lines += 1
            
            # Count actual code lines (not empty, not comments, not just braces)
            if (method_started and stripped and 
                not stripped.startswith('//') and 
                not stripped.startswith('*') and 
                not stripped.startswith('/*') and
                stripped != '{' and 
                stripped != '}'):
                code_lines += 1
            
            # Method ends when brace count returns to 0
            if method_started and brace_count <= 0:
                return {
                    'file': file_path,
                    'method_name': method_name,
                    'start_line': start_line + 1,  # 1-based line numbers
                    'end_line': i + 1,
                    'total_lines': total_lines,
                    'code_lines': code_lines,
                    'declaration': method_line
                }
            
            i += 1
        
        return None
        
    except Exception as e:
        return None

def extract_method_name(method_line):
    """Extract method name from declaration line"""
    # Constructor
    if method_line.startswith('constructor'):
        return 'constructor'
    
    # Angular lifecycle hooks
    for hook in ['ngOnInit', 'ngOnDestroy', 'ngOnChanges', 'ngAfterViewInit']:
        if method_line.startswith(hook):
            return hook
    
    # Regular methods/functions
    patterns = [
        r'(\w+)\s*\(',  # methodName(
        r'async\s+(\w+)\s*\(',  # async methodName(
        r'private\s+(\w+)\s*\(',  # private methodName(
        r'public\s+(\w+)\s*\(',  # public methodName(
        r'protected\s+(\w+)\s*\(',  # protected methodName(
        r'static\s+(\w+)\s*\(',  # static methodName(
        r'get\s+(\w+)\s*\(',  # get methodName(
        r'set\s+(\w+)\s*\(',  # set methodName(
    ]
    
    for pattern in patterns:
        match = re.search(pattern, method_line)
        if match:
            return match.group(1)
    
    return None

def scan_all_ts_files():
    """Scan all TypeScript files for long methods"""
    pattern = os.path.join("src", "app", "**", "*.ts")
    files = glob.glob(pattern, recursive=True)
    
    print(f"Analyzing {len(files)} TypeScript files for methods > 14 lines...")
    print("")
    
    all_long_methods = []
    files_with_long_methods = 0
    
    for file_path in files:
        long_methods = analyze_method_length(file_path)
        if long_methods:
            files_with_long_methods += 1
            all_long_methods.extend(long_methods)
            
            print(f"File: {file_path}")
            print("-" * 80)
            for method in long_methods:
                print(f"  Method: {method['method_name']} (Line {method['start_line']}-{method['end_line']})")
                print(f"     Code lines: {method['code_lines']} | Total lines: {method['total_lines']}")
                print(f"     Declaration: {method['declaration'][:70]}...")
                print("")
    
    # Sort by code lines (longest first)
    all_long_methods.sort(key=lambda x: x['code_lines'], reverse=True)
    
    print("=" * 80)
    print("=== TOP 10 LONGEST METHODS ===")
    print("=" * 80)
    
    for i, method in enumerate(all_long_methods[:10]):
        print(f"{i+1:2d}. {method['method_name']} ({method['code_lines']} lines)")
        print(f"    File: {method['file']}")
        print(f"    Line: {method['start_line']}-{method['end_line']}")
        print("")
    
    print("=== SUMMARY ===")
    print(f"Files analyzed: {len(files)}")
    print(f"Files with long methods: {files_with_long_methods}")
    print(f"Total methods > 14 lines: {len(all_long_methods)}")
    
    if len(all_long_methods) == 0:
        print("No methods longer than 14 lines found!")
    else:
        avg_length = sum(m['code_lines'] for m in all_long_methods) / len(all_long_methods)
        longest = max(all_long_methods, key=lambda x: x['code_lines'])
        print(f"Average length: {avg_length:.1f} lines")
        print(f"Longest method: {longest['method_name']} ({longest['code_lines']} lines)")
        print(f"Consider refactoring methods longer than 20-25 lines")

if __name__ == "__main__":
    scan_all_ts_files()
