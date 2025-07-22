import os
import glob
import re

def remove_console_logs_from_file(file_path):
    """
    Remove console.log statements from JavaScript/TypeScript files
    Handles various console.log patterns while preserving code structure
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Count original console.log occurrences for reporting
        original_count = len(re.findall(r'console\.log\s*\(', content))
        
        if original_count == 0:
            return {
                'file': file_path,
                'original_logs': 0,
                'removed_logs': 0,
                'modified': False,
                'error': None
            }
        
        # Pattern 1: Simple single-line console.log statements
        # Matches: console.log('message'); or console.log(variable);
        content = re.sub(r'^\s*console\.log\s*\([^)]*\);\s*$', '', content, flags=re.MULTILINE)
        
        # Pattern 2: Console.log without semicolon at end of line
        content = re.sub(r'^\s*console\.log\s*\([^)]*\)\s*$', '', content, flags=re.MULTILINE)
        
        # Pattern 3: Console.log with complex parameters (template literals, function calls, etc.)
        # This handles multiline console.log with balanced parentheses
        def remove_multiline_console_logs(text):
            lines = text.split('\n')
            result_lines = []
            i = 0
            
            while i < len(lines):
                line = lines[i]
                stripped = line.strip()
                
                # Check if line starts with console.log
                if re.match(r'^\s*console\.log\s*\(', line):
                    # Count parentheses to find the complete statement
                    paren_count = 0
                    log_lines = []
                    j = i
                    
                    while j < len(lines):
                        current_line = lines[j]
                        log_lines.append(current_line)
                        
                        # Count parentheses in this line
                        for char in current_line:
                            if char == '(':
                                paren_count += 1
                            elif char == ')':
                                paren_count -= 1
                        
                        # If parentheses are balanced and we found at least one opening paren
                        if paren_count == 0 and len(log_lines) > 0:
                            # Skip all these lines (they form the complete console.log)
                            i = j + 1
                            break
                        
                        j += 1
                    
                    # If we couldn't balance parentheses, treat as single line
                    if paren_count != 0:
                        result_lines.append(line)
                        i += 1
                else:
                    result_lines.append(line)
                    i += 1
            
            return '\n'.join(result_lines)
        
        content = remove_multiline_console_logs(content)
        
        # Pattern 4: Inline console.log in expressions (more complex)
        # Handle: someFunction(console.log('debug'), otherParam)
        # This is trickier and might need manual review
        
        # Pattern 5: Console.log with chained methods
        # Remove: console.log().someMethod() -> .someMethod()
        content = re.sub(r'console\.log\s*\([^)]*\)\.', '', content)
        
        # Clean up excessive empty lines (more than 2 consecutive empty lines)
        content = re.sub(r'\n\s*\n\s*\n\s*\n+', '\n\n\n', content)
        
        # Count remaining console.log occurrences
        remaining_count = len(re.findall(r'console\.log\s*\(', content))
        removed_count = original_count - remaining_count
        
        # Only write back if content changed
        modified = content != original_content
        if modified:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
        
        return {
            'file': file_path,
            'original_logs': original_count,
            'removed_logs': removed_count,
            'remaining_logs': remaining_count,
            'modified': modified,
            'error': None
        }
        
    except Exception as e:
        return {
            'file': file_path,
            'original_logs': 0,
            'removed_logs': 0,
            'remaining_logs': 0,
            'modified': False,
            'error': str(e)
        }

def scan_and_remove_console_logs():
    """
    Scan all JavaScript and TypeScript files and remove console.log statements
    """
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Define file patterns to search for
    file_patterns = [
        "**/*.js",
        "**/*.ts"
    ]
    
    # Collect all files
    all_files = []
    for pattern in file_patterns:
        full_pattern = os.path.join(script_dir, pattern)
        files = glob.glob(full_pattern, recursive=True)
        all_files.extend(files)
    
    # Filter out unwanted directories
    excluded_dirs = ['node_modules', '.git', 'dist', 'build', '.angular', 'coverage', '.vscode', '.idea']
    files = []
    for file_path in all_files:
        # Check if file contains any excluded directory in its path
        should_exclude = any(excluded_dir in file_path for excluded_dir in excluded_dirs)
        if not should_exclude:
            files.append(file_path)
    
    # Prepare output content
    output_lines = []
    output_lines.append("CONSOLE.LOG REMOVAL REPORT")
    output_lines.append(f"Generated: {os.popen('date /t').read().strip()} {os.popen('time /t').read().strip()}")
    output_lines.append("=" * 80)
    output_lines.append(f"Analyzing {len(files)} JavaScript/TypeScript files for console.log removal...")
    output_lines.append(f"Search directory: {script_dir}")
    
    # Display file counts by type
    js_files = [f for f in files if f.endswith('.js')]
    ts_files = [f for f in files if f.endswith('.ts')]
    
    js_count_msg = f"JavaScript files: {len(js_files)}"
    ts_count_msg = f"TypeScript files: {len(ts_files)}"
    
    print(js_count_msg)
    print(ts_count_msg)
    output_lines.append(js_count_msg)
    output_lines.append(ts_count_msg)
    
    output_lines.append(f"Excluded directories: {', '.join(excluded_dirs)}")
    output_lines.append("")
    print(f"Excluded directories: {', '.join(excluded_dirs)}")
    print("")
    
    # Process each file
    total_original_logs = 0
    total_removed_logs = 0
    total_remaining_logs = 0
    files_modified = 0
    files_with_errors = 0
    files_with_logs = []
    
    for file_path in files:
        print(f"Processing: {os.path.basename(file_path)}")
        result = remove_console_logs_from_file(file_path)
        
        if result['error']:
            files_with_errors += 1
            error_msg = f"ERROR processing {file_path}: {result['error']}"
            print(error_msg)
            output_lines.append(error_msg)
            continue
        
        if result['original_logs'] > 0:
            files_with_logs.append(result)
            total_original_logs += result['original_logs']
            total_removed_logs += result['removed_logs']
            total_remaining_logs += result['remaining_logs']
            
            if result['modified']:
                files_modified += 1
            
            # Report on this file
            file_output = f"File: {file_path}"
            separator = "-" * 80
            
            output_lines.append(file_output)
            output_lines.append(separator)
            
            stats = f"  Original console.logs: {result['original_logs']}"
            removed = f"  Removed: {result['removed_logs']}"
            remaining = f"  Remaining: {result['remaining_logs']}"
            status = f"  Status: {'Modified' if result['modified'] else 'No changes needed'}"
            
            print(f"  {os.path.basename(file_path)}: {result['original_logs']} -> {result['remaining_logs']} console.logs")
            
            output_lines.append(stats)
            output_lines.append(removed)
            output_lines.append(remaining)
            output_lines.append(status)
            output_lines.append("")
    
    # Sort files by number of original console.logs (most first)
    files_with_logs.sort(key=lambda x: x['original_logs'], reverse=True)
    
    # Top 10 files with most console.logs
    if files_with_logs:
        top_section = "=" * 80
        top_header = "=== TOP 10 FILES WITH MOST CONSOLE.LOGS (ORIGINAL) ==="
        
        print(top_section)
        print(top_header)
        print(top_section)
        
        output_lines.append(top_section)
        output_lines.append(top_header)
        output_lines.append(top_section)
        
        for i, result in enumerate(files_with_logs[:10]):
            rank_line = f"{i+1:2d}. {os.path.basename(result['file'])} ({result['original_logs']} original, {result['removed_logs']} removed, {result['remaining_logs']} remaining)"
            file_line = f"    File: {result['file']}"
            
            print(rank_line)
            print(file_line)
            print("")
            
            output_lines.append(rank_line)
            output_lines.append(file_line)
            output_lines.append("")
    
    # Files with remaining console.logs (need manual review)
    files_with_remaining = [f for f in files_with_logs if f['remaining_logs'] > 0]
    if files_with_remaining:
        remaining_header = "=== FILES WITH REMAINING CONSOLE.LOGS (NEED MANUAL REVIEW) ==="
        print(remaining_header)
        output_lines.append(remaining_header)
        
        for result in files_with_remaining:
            remaining_line = f"• {os.path.basename(result['file'])}: {result['remaining_logs']} remaining console.logs"
            print(remaining_line)
            output_lines.append(remaining_line)
        
        output_lines.append("")
        print("")
    
    # Overall summary
    summary_header = "=== OVERALL SUMMARY ==="
    files_analyzed = f"Files analyzed: {len(files)}"
    files_with_logs_count = f"Files with console.logs: {len(files_with_logs)}"
    files_modified_count = f"Files modified: {files_modified}"
    files_errors = f"Files with errors: {files_with_errors}"
    total_logs = f"Total console.logs found: {total_original_logs}"
    total_removed_msg = f"Total console.logs removed: {total_removed_logs}"
    total_remaining_msg = f"Total console.logs remaining: {total_remaining_logs}"
    
    print(summary_header)
    print(files_analyzed)
    print(files_with_logs_count)
    print(files_modified_count)
    print(files_errors)
    print(total_logs)
    print(total_removed_msg)
    print(total_remaining_msg)
    
    output_lines.append(summary_header)
    output_lines.append(files_analyzed)
    output_lines.append(files_with_logs_count)
    output_lines.append(files_modified_count)
    output_lines.append(files_errors)
    output_lines.append(total_logs)
    output_lines.append(total_removed_msg)
    output_lines.append(total_remaining_msg)
    
    if total_removed_logs == 0:
        no_logs_msg = "No console.log statements found to remove!"
        print(no_logs_msg)
        output_lines.append(no_logs_msg)
    else:
        success_rate = (total_removed_logs / total_original_logs) * 100 if total_original_logs > 0 else 0
        success_msg = f"Removal success rate: {success_rate:.1f}%"
        print(success_msg)
        output_lines.append(success_msg)
        
        if total_remaining_logs > 0:
            manual_msg = f"Manual review needed for {len(files_with_remaining)} files with {total_remaining_logs} remaining console.logs"
            print(manual_msg)
            output_lines.append(manual_msg)
        
        # Recommendations
        recommendations = [
            "\n=== RECOMMENDATIONS ===",
            "• Files with remaining console.logs may have complex patterns that need manual review",
            "• Check for console.log statements inside template literals or complex expressions",
            "• Consider using a proper logging library instead of console.log for production code",
            "• Review removed console.logs in git diff before committing changes",
            "• Backup your files before running this script on important code"
        ]
        
        for rec in recommendations:
            print(rec)
            output_lines.append(rec)
    
    # Write to file
    output_file = "console_log_removal_report.txt"
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(output_lines))
        print(f"\nResults saved to: {output_file}")
    except Exception as e:
        print(f"\nError saving to file: {e}")

if __name__ == "__main__":
    print("🚀 Starting console.log removal process...")
    print("⚠️  WARNING: This will modify your files! Make sure you have backups.")
    
    # Ask for confirmation
    response = input("Do you want to proceed? (y/N): ").strip().lower()
    if response in ['y', 'yes']:
        scan_and_remove_console_logs()
        print("✅ Console.log removal completed!")
    else:
        print("❌ Operation cancelled.")
