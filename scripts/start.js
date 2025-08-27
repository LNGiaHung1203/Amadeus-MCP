#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if .env file exists
import { existsSync } from 'fs';
import { readFileSync } from 'fs';

const envPath = join(__dirname, '..', '.env');
if (!existsSync(envPath)) {
  console.error('❌ .env file not found!');
  console.log('Please copy env.example to .env and add your Amadeus API credentials.');
  console.log('cp env.example .env');
  process.exit(1);
}

// Check if required environment variables are set
const envContent = readFileSync(envPath, 'utf8');
const requiredVars = ['AMADEUS_CLIENT_ID', 'AMADEUS_CLIENT_SECRET'];

for (const varName of requiredVars) {
  if (!envContent.includes(`${varName}=`) || envContent.includes(`${varName}=your_amadeus_`)) {
    console.error(`❌ ${varName} not properly configured in .env file!`);
    console.log('Please add your Amadeus API credentials to the .env file.');
    process.exit(1);
  }
}

console.log('✅ Environment variables configured');
console.log('🚀 Starting Amadeus MCP Server...\n');

// Start the server
const server = spawn('node', ['dist/server.js'], {
  stdio: 'inherit',
  cwd: join(__dirname, '..')
});

server.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Server exited with code ${code}`);
    process.exit(code);
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGTERM');
});
