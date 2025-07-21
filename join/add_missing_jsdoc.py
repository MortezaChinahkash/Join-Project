import os
import re
import glob

def add_basic_jsdoc(file_path):
    """
    Add basic JSDoc comments to methods that are missing them
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        lines = content.split('\n')
        modified_lines = []
        changes_made = 0
        
        i = 0
        while i < len(lines):
            line = lines[i]
            stripped = line.strip()
            
            # Check for method/function declarations that need JSDoc
            if should_add_jsdoc(stripped, lines, i):
                # Check if previous non-empty line is already JSDoc
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
                    # Generate JSDoc comment
                    jsdoc = generate_jsdoc_comment(stripped, line)
                    if jsdoc:
                        # Add JSDoc comment before the method
                        indent = line[:len(line) - len(line.lstrip())]
                        for jsdoc_line in jsdoc:
                            modified_lines.append(indent + jsdoc_line)
                        changes_made += 1
            
            modified_lines.append(line)
            i += 1
        
        if changes_made > 0:
            new_content = '\n'.join(modified_lines)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"✓ Added {changes_made} JSDoc comments to: {file_path}")
            return changes_made
        else:
            return 0
            
    except Exception as e:
        print(f"✗ Error processing {file_path}: {e}")
        return 0

def should_add_jsdoc(stripped, lines, i):
    """Check if this line should get a JSDoc comment"""
    # Skip certain patterns
    if (not stripped or 
        stripped.startswith('//') or 
        stripped.startswith('*') or 
        stripped.startswith('/*') or
        stripped.startswith('constructor') or 
        stripped.startswith('get ') or 
        stripped.startswith('set ') or
        '=' in stripped.split('(')[0] or
        stripped.startswith('export ') or
        stripped.startswith('@') or
        'interface' in stripped or
        'class' in stripped or
        'enum' in stripped or
        stripped.startswith('} catch') or
        stripped.startswith('catch')):
        return False
    
    # Check for method/function patterns
    return (('(' in stripped and ')' in stripped and ':' in stripped and
             (stripped.endswith('{') or (i + 1 < len(lines) and lines[i + 1].strip() == '{'))) or
            (stripped.startswith('async ') and '(' in stripped and ')' in stripped) or
            stripped.startswith('ngOnInit') or
            stripped.startswith('ngOnDestroy') or
            stripped.startswith('ngOnChanges'))

def generate_jsdoc_comment(method_line, full_line):
    """Generate a basic JSDoc comment for a method"""
    try:
        # Extract method name
        method_match = re.search(r'(\w+)\s*\(', method_line)
        if not method_match:
            return None
        
        method_name = method_match.group(1)
        
        # Extract parameters
        param_match = re.search(r'\(([^)]*)\)', method_line)
        params = []
        if param_match:
            param_str = param_match.group(1).strip()
            if param_str:
                # Parse parameters
                for param in param_str.split(','):
                    param = param.strip()
                    if param and ':' in param:
                        param_name = param.split(':')[0].strip()
                        if param_name and not param_name.startswith('...'):
                            params.append(param_name)
        
        # Extract return type
        return_match = re.search(r'\):\s*([^{]+)', method_line)
        return_type = return_match.group(1).strip() if return_match else 'void'
        
        # Generate JSDoc
        jsdoc_lines = ['/**']
        
        # Add description based on method name
        description = generate_description(method_name)
        jsdoc_lines.append(f' * {description}')
        
        # Add parameters
        for param in params:
            jsdoc_lines.append(f' * @param {param} - {param.capitalize()} parameter')
        
        # Add return type if not void
        if return_type != 'void' and return_type != '':
            if 'Promise' in return_type:
                jsdoc_lines.append(' * @returns Promise that resolves when operation completes')
            elif 'boolean' in return_type:
                jsdoc_lines.append(' * @returns Boolean result')
            elif 'string' in return_type:
                jsdoc_lines.append(' * @returns String result')
            elif 'number' in return_type:
                jsdoc_lines.append(' * @returns Numeric result')
            else:
                jsdoc_lines.append(f' * @returns {return_type}')
        
        jsdoc_lines.append(' */')
        return jsdoc_lines
        
    except Exception as e:
        print(f"Error generating JSDoc for {method_line}: {e}")
        return None

def generate_description(method_name):
    """Generate a description based on method name"""
    # Common patterns
    if method_name.startswith('ng'):
        if method_name == 'ngOnInit':
            return 'Angular lifecycle hook - component initialization.'
        elif method_name == 'ngOnDestroy':
            return 'Angular lifecycle hook - component cleanup.'
        elif method_name == 'ngOnChanges':
            return 'Angular lifecycle hook - handles input changes.'
        else:
            return f'Angular lifecycle hook - {method_name}.'
    
    if method_name.startswith('on'):
        return f'Handles {method_name[2:].lower()} events.'
    
    if method_name.startswith('get'):
        return f'Gets {method_name[3:].lower()} value.'
    
    if method_name.startswith('set'):
        return f'Sets {method_name[3:].lower()} value.'
    
    if method_name.startswith('is') or method_name.startswith('has'):
        return f'Checks if {method_name[2:].lower()}.'
    
    if method_name.startswith('toggle'):
        return f'Toggles {method_name[6:].lower()} state.'
    
    if method_name.startswith('create'):
        return f'Creates {method_name[6:].lower()}.'
    
    if method_name.startswith('update'):
        return f'Updates {method_name[6:].lower()}.'
    
    if method_name.startswith('delete') or method_name.startswith('remove'):
        return f'Deletes {method_name[6:].lower()}.'
    
    if method_name.startswith('validate'):
        return f'Validates {method_name[8:].lower()}.'
    
    if method_name.startswith('handle'):
        return f'Handles {method_name[6:].lower()}.'
    
    if method_name.startswith('process'):
        return f'Processes {method_name[7:].lower()}.'
    
    # Default
    return f'Handles {method_name} functionality.'

def process_all_files():
    """Process all TypeScript files to add missing JSDoc comments"""
    pattern = os.path.join("src", "app", "**", "*.ts")
    files = glob.glob(pattern, recursive=True)
    
    print(f"Adding JSDoc comments to {len(files)} TypeScript files...\n")
    
    total_added = 0
    files_updated = 0
    
    for file_path in files:
        added = add_basic_jsdoc(file_path)
        if added > 0:
            files_updated += 1
            total_added += added
    
    print(f"\n=== Summary ===")
    print(f"Files processed: {len(files)}")
    print(f"Files updated: {files_updated}")
    print(f"Total JSDoc comments added: {total_added}")

if __name__ == "__main__":
    process_all_files()
