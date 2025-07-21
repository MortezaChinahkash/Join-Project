const fs = require('fs');
const path = require('path');
const glob = require('glob');

/**
 * Script to add spacing after methods in TypeScript files
 * Adds a blank line after each method/function to separate them from JSDoc comments
 */

function addSpacingAfterMethods(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        const modifiedLines = [];
        
        let braceCount = 0;
        let inMethod = false;
        let methodIndentLevel = 0;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            
            // Skip empty lines and comments
            if (trimmedLine === '' || trimmedLine.startsWith('//') || trimmedLine.startsWith('*') || trimmedLine.startsWith('/*')) {
                modifiedLines.push(line);
                continue;
            }
            
            // Detect method/function start
            if (!inMethod && (
                (trimmedLine.includes('(') && trimmedLine.includes(')') && trimmedLine.includes('{')) ||
                (trimmedLine.includes('(') && trimmedLine.includes(')') && (i + 1 < lines.length && lines[i + 1].trim().startsWith('{')))
            )) {
                // This looks like a method/function declaration
                inMethod = true;
                methodIndentLevel = line.length - line.trimStart().length;
                braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
            }
            
            // Count braces when in a method
            if (inMethod) {
                braceCount += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
            }
            
            modifiedLines.push(line);
            
            // Check if method is complete
            if (inMethod && braceCount <= 0) {
                inMethod = false;
                
                // Check if next non-empty line exists and is not already a blank line
                let nextNonEmptyIndex = i + 1;
                while (nextNonEmptyIndex < lines.length && lines[nextNonEmptyIndex].trim() === '') {
                    nextNonEmptyIndex++;
                }
                
                // Add blank line only if next line exists, is not already blank, 
                // and is not a closing brace of the class
                if (nextNonEmptyIndex < lines.length && 
                    lines[i + 1] && lines[i + 1].trim() !== '' &&
                    !lines[nextNonEmptyIndex].trim().startsWith('}')) {
                    modifiedLines.push('');
                }
            }
        }
        
        const newContent = modifiedLines.join('\n');
        
        // Only write if content actually changed
        if (newContent !== content) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`✓ Updated: ${filePath}`);
            return true;
        } else {
            console.log(`- No changes needed: ${filePath}`);
            return false;
        }
    } catch (error) {
        console.error(`✗ Error processing ${filePath}:`, error.message);
        return false;
    }
}

function processAllFiles() {
    const pattern = 'src/app/**/*.ts';
    const files = glob.sync(pattern, { cwd: process.cwd() });
    
    console.log(`Found ${files.length} TypeScript files in src/app/`);
    console.log('Processing files...\n');
    
    let processedCount = 0;
    let updatedCount = 0;
    
    files.forEach(file => {
        const fullPath = path.resolve(file);
        processedCount++;
        
        if (addSpacingAfterMethods(fullPath)) {
            updatedCount++;
        }
    });
    
    console.log(`\n=== Summary ===`);
    console.log(`Processed: ${processedCount} files`);
    console.log(`Updated: ${updatedCount} files`);
    console.log(`No changes: ${processedCount - updatedCount} files`);
}

// Check if glob is available, if not provide instructions
try {
    require('glob');
    processAllFiles();
} catch (error) {
    console.log('glob package not found. Installing...');
    console.log('Please run: npm install glob');
    console.log('Then run this script again with: node add-spacing-after-methods.js');
}
