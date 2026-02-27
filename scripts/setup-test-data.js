#!/usr/bin/env node

/**
 * Setup Test Data Script
 * 设置测试数据脚本
 * 
 * This script initializes the database with test data for development and testing
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Setting up test data for Uniy Market...\n');

// Check if TypeScript is available
try {
    execSync('npx tsc --version', { stdio: 'ignore' });
} catch (error) {
    console.error('❌ TypeScript not found. Please install it first:');
    console.error('npm install -g typescript');
    process.exit(1);
}

// Check if ts-node is available
try {
    execSync('npx ts-node --version', { stdio: 'ignore' });
} catch (error) {
    console.error('❌ ts-node not found. Please install it first:');
    console.error('npm install -g ts-node');
    process.exit(1);
}

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('📁 Created data directory');
}

// Run the TypeScript seeding script
try {
    console.log('📊 Running database seeding script...\n');
    
    const scriptPath = path.join(__dirname, '../src/scripts/seedTestData.ts');
    execSync(`npx ts-node "${scriptPath}"`, { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
    });
    
    console.log('\n✅ Test data setup completed successfully!');
    console.log('\n🎯 Next steps:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Open http://localhost:3000/public/test-login.html');
    console.log('3. Select a test user to login');
    console.log('4. Test all the features!');
    
} catch (error) {
    console.error('\n❌ Error setting up test data:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure you have installed all dependencies: npm install');
    console.error('2. Check if the database file is writable');
    console.error('3. Ensure TypeScript and ts-node are installed');
    process.exit(1);
}