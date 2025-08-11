#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script to clear problematic Clerk session tokens
 * Run this when experiencing HTTP 431 errors
 */

function clearClerkTokensScript() {
  console.log('🧹 Clearing Clerk session tokens...');
  
  // Clear any potential token files (if they exist)
  const potentialPaths = [
    '.next/cache',
    'node_modules/.cache',
    '.clerk'
  ];
  
  potentialPaths.forEach(dirPath => {
    const fullPath = path.join(process.cwd(), dirPath);
    if (fs.existsSync(fullPath)) {
      try {
        fs.rmSync(fullPath, { recursive: true, force: true });
        console.log(`✅ Cleared ${dirPath}`);
      } catch (error) {
        console.log(`⚠️  Could not clear ${dirPath}:`, error.message);
      }
    }
  });
  
  console.log(`
🚀 Clerk tokens cleared! 

Next steps:
1. Close all browser tabs for localhost:3000
2. Clear your browser cache and cookies for localhost
3. Restart the dev server: npm run dev
4. Try accessing http://localhost:3000 in a fresh browser tab

If the issue persists, try opening an incognito/private browser window.
  `);
}

if (require.main === module) {
  clearClerkTokensScript();
}

module.exports = clearClerkTokensScript;