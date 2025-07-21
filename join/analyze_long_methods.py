#!/usr/bin/env python3
"""
Analysiert alle TypeScript-Dateien im /app Verzeichnis und findet 
Methoden/Funktionen mit mehr als 14 Zeilen Code.
"""

import os
import re
from typing import List, Dict, Tuple

def count_method_lines(method_content: str) -> int:
    """Zählt die Codezeilen einer Methode (ohne leere Zeilen und Kommentare)."""
    lines = method_content.split('\n')
    code_lines = 0
    
    for line in lines:
        stripped = line.strip()
        # Ignoriere leere Zeilen und reine Kommentarzeilen
        if stripped and not stripped.startswith('//') and not stripped.startswith('/*') and not stripped.startswith('*'):
            code_lines += 1
    
    return code_lines

def extract_methods_from_ts_file(file_path: str) -> List[Dict]:
    """Extrahiert alle Methoden/Funktionen aus einer TypeScript-Datei."""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
    except Exception as e:
        print(f"Fehler beim Lesen der Datei {file_path}: {e}")
        return []
    
    methods = []
    
    # Pattern für Methoden und Funktionen
    patterns = [
        # Klassenmethoden (public/private/protected)
        r'((?:public|private|protected)?\s*(?:static\s+)?(?:async\s+)?[\w\s]*?\s+(\w+)\s*\([^)]*\)\s*:\s*[^{]*\s*\{)',
        # Arrow Functions
        r'((\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>\s*\{)',
        # Function declarations
        r'(function\s+(\w+)\s*\([^)]*\)\s*\{)',
        # ngOnInit, ngOnDestroy etc.
        r'((\w+)\s*\(\s*\)\s*:\s*void\s*\{)',
    ]
    
    for pattern in patterns:
        matches = re.finditer(pattern, content, re.MULTILINE | re.DOTALL)
        
        for match in matches:
            method_start = match.start()
            method_name = match.group(2) if len(match.groups()) >= 2 else "unknown"
            
            # Finde das Ende der Methode durch Bracket-Matching
            bracket_count = 0
            method_end = method_start
            in_method = False
            
            for i, char in enumerate(content[method_start:], method_start):
                if char == '{':
                    bracket_count += 1
                    in_method = True
                elif char == '}':
                    bracket_count -= 1
                    if bracket_count == 0 and in_method:
                        method_end = i + 1
                        break
            
            if method_end > method_start:
                method_content = content[method_start:method_end]
                line_count = count_method_lines(method_content)
                
                # Finde die Zeilennummer
                line_number = content[:method_start].count('\n') + 1
                
                methods.append({
                    'name': method_name,
                    'line_count': line_count,
                    'line_number': line_number,
                    'content': method_content[:200] + '...' if len(method_content) > 200 else method_content
                })
    
    return methods

def analyze_typescript_files(root_dir: str) -> Dict:
    """Analysiert alle TypeScript-Dateien im angegebenen Verzeichnis."""
    results = {}
    
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith('.ts') and not file.endswith('.spec.ts'):
                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, root_dir)
                
                methods = extract_methods_from_ts_file(file_path)
                long_methods = [m for m in methods if m['line_count'] > 14]
                
                if long_methods:
                    results[relative_path] = long_methods
    
    return results

def main():
    """Hauptfunktion."""
    app_dir = os.path.join(os.getcwd(), 'src', 'app')
    
    if not os.path.exists(app_dir):
        print(f"Verzeichnis {app_dir} nicht gefunden!")
        return
    
    print("🔍 Analysiere TypeScript-Dateien auf lange Methoden (>14 Zeilen)...")
    print("=" * 70)
    
    results = analyze_typescript_files(app_dir)
    
    if not results:
        print("✅ Keine Methoden mit mehr als 14 Zeilen gefunden!")
        return
    
    total_long_methods = 0
    
    for file_path, methods in results.items():
        print(f"\n📁 Datei: {file_path}")
        print("-" * 50)
        
        for method in methods:
            total_long_methods += 1
            print(f"  🔴 Methode: {method['name']}")
            print(f"     Zeilen: {method['line_count']}")
            print(f"     Zeile: {method['line_number']}")
            print(f"     Vorschau: {method['content'].split('{')[0].strip()}{{")
            print()
    
    print("=" * 70)
    print(f"📊 Zusammenfassung:")
    print(f"   Dateien mit langen Methoden: {len(results)}")
    print(f"   Gesamt lange Methoden: {total_long_methods}")
    print("=" * 70)
    
    # Detaillierte Ausgabe in Datei speichern
    with open('long_methods_report.txt', 'w', encoding='utf-8') as f:
        f.write("LONG METHODS ANALYSIS REPORT\n")
        f.write("=" * 50 + "\n\n")
        
        for file_path, methods in results.items():
            f.write(f"File: {file_path}\n")
            f.write("-" * 30 + "\n")
            
            for method in methods:
                f.write(f"Method: {method['name']}\n")
                f.write(f"Lines: {method['line_count']}\n")
                f.write(f"Line Number: {method['line_number']}\n")
                f.write(f"Content Preview:\n{method['content'][:500]}...\n")
                f.write("\n" + "="*50 + "\n\n")
    
    print("📝 Detaillierter Report wurde in 'long_methods_report.txt' gespeichert.")

if __name__ == "__main__":
    main()
