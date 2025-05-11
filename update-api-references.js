/**
 * API Reference Update Script
 * 
 * Run this with Node.js before deployment to find all hardcoded API URLs
 * and create a report of files that need to be updated.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const rootDir = '.'; // Current directory
const searchPattern = /['"]http:\/\/localhost:5000\/api/g;
const fileExtensions = ['.js', '.html', '.css'];
const excludeDirs = ['node_modules', '.git', 'backend'];

// Results storage
const matches = [];

// Recursively search directories
function searchDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        // Skip excluded directories
        if (stat.isDirectory()) {
            if (!excludeDirs.includes(file)) {
                searchDirectory(filePath);
            }
            continue;
        }
        
        // Check file extension
        const ext = path.extname(file).toLowerCase();
        if (!fileExtensions.includes(ext)) {
            continue;
        }
        
        // Read file content
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for matches
        const fileMatches = content.match(searchPattern);
        if (fileMatches) {
            matches.push({
                file: filePath,
                count: fileMatches.length,
                lines: findLines(content, searchPattern)
            });
        }
    }
}

// Find line numbers for matches
function findLines(content, pattern) {
    const lines = content.split('\n');
    const matchingLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(pattern)) {
            matchingLines.push({
                lineNumber: i + 1,
                content: lines[i].trim()
            });
        }
    }
    
    return matchingLines;
}

// Generate report
function generateReport() {
    console.log('API Reference Check Report');
    console.log('=========================');
    
    if (matches.length === 0) {
        console.log('✅ No hardcoded API references found!');
        return;
    }
    
    console.log(`⚠️ Found ${matches.length} files with hardcoded API references:`);
    console.log('');
    
    matches.forEach((match, index) => {
        console.log(`${index + 1}. ${match.file} (${match.count} references):`);
        
        match.lines.forEach(line => {
            console.log(`   Line ${line.lineNumber}: ${line.content}`);
        });
        
        console.log('');
    });
    
    console.log('Recommendation:');
    console.log('1. Add config.js to each HTML file that loads JavaScript with API references');
    console.log('2. Update each JavaScript file to use the apiConfig.getUrl() method');
    console.log('3. Run this script again to verify all references are updated');
}

// Main execution
try {
    searchDirectory(rootDir);
    generateReport();
} catch (error) {
    console.error('Error:', error.message);
} 