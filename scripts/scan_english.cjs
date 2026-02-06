const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

function walk(dir, callback) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filepath = path.join(dir, file);
        const stats = fs.statSync(filepath);
        if (stats.isDirectory()) {
            walk(filepath, callback);
        } else if (stats.isFile()) {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                callback(filepath);
            }
        }
    });
}

const warnings = [];

// Simple heuristic: match strings that look like UI text (capitalized, spaces)
// and don't contain Chinese characters.
// Also match JSX text content
const jsxTextRegex = />([^<{}]+)</g;

walk(srcDir, (filepath) => {
    const content = fs.readFileSync(filepath, 'utf-8');
    const relativePath = path.relative(srcDir, filepath);

    let match;
    // Check JSX text
    while ((match = jsxTextRegex.exec(content)) !== null) {
        const text = match[1].trim();
        if (text && !/[\u4e00-\u9fa5]/.test(text) && /[a-zA-Z]/.test(text)) {
            // Filter out common non-UI text
            if (!/^[0-9\s\.\-,:%°\(\)]+$/.test(text)) {
                 warnings.push({
                    file: relativePath,
                    line: getLineNumber(content, match.index),
                    text: text
                });
            }
        }
    }

    // Check string literals (more noisy, but useful)
    // We only check for specific patterns that look like messages
    const stringLiterals = content.matchAll(/(['"`])(.*?)\1/g);
    for (const m of stringLiterals) {
        const str = m[2];
        // Heuristics for UI strings:
        // - Contains spaces
        // - Starts with capital letter
        // - No chinese
        // - Length > 2
        if (str.length > 2 && str.includes(' ') && /^[A-Z]/.test(str) && !/[\u4e00-\u9fa5]/.test(str)) {
             // Exclude imports
            if (!content.includes(`import ${m[0]}`) && !content.includes(`from ${m[0]}`) && !content.includes(`from ${m[1]}${str}${m[1]}`)) {
                 // Exclude common tech strings
                 if (!str.includes('http') && !str.includes('px') && !str.includes('var(')) {
                    warnings.push({
                        file: relativePath,
                        line: getLineNumber(content, m.index),
                        text: str,
                        type: 'literal'
                    });
                 }
            }
        }
    }
});

function getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
}

console.log('--- Potential English UI Text Found ---');
warnings.forEach(w => {
    console.log(`${w.file}:${w.line} [${w.type || 'jsx'}] "${w.text}"`);
});

if (warnings.length === 0) {
    console.log('No obvious English UI text found.');
}
