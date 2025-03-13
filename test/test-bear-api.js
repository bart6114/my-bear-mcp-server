#!/usr/bin/env node
/**
 * Test script for the Bear MCP Server
 * 
 * This script tests the basic functionality of the Bear API client.
 * Run it with your Bear API token to verify that the server is working correctly.
 * 
 * Usage: node test-bear-api.js --token YOUR_BEAR_TOKEN
 */

import { BearAPI } from '../build/bear-api.js';
import { Command } from 'commander';

// Parse command-line arguments
const program = new Command();
program
  .name('test-bear-api')
  .description('Test the Bear API client')
  .version('1.0.0')
  .requiredOption('--token <token>', 'Bear API token')
  .parse(process.argv);

const options = program.opts();

// Create the Bear API client
const bearApi = new BearAPI({
  token: options.token,
});

// Test functions
async function testCreateNote() {
  console.log('Testing create note...');
  try {
    const result = await bearApi.createNote({
      title: 'Test Note from MCP Server',
      text: '# Test Note\n\nThis note was created by the Bear MCP Server test script.',
      tags: ['test', 'mcp'],
      timestamp: true,
    });
    console.log('✅ Create note test passed');
    return true;
  } catch (error) {
    console.error('❌ Create note test failed:', error);
    return false;
  }
}

async function testGetTags() {
  console.log('Testing get tags...');
  try {
    const result = await bearApi.getTags();
    console.log('✅ Get tags test passed');
    return true;
  } catch (error) {
    console.error('❌ Get tags test failed:', error);
    return false;
  }
}

async function testSearchNotes() {
  console.log('Testing search notes...');
  try {
    const result = await bearApi.searchNotes({
      term: 'Test Note',
    });
    console.log('✅ Search notes test passed');
    return true;
  } catch (error) {
    console.error('❌ Search notes test failed:', error);
    return false;
  }
}

// Run the tests
async function runTests() {
  console.log('Starting Bear API tests...');
  console.log('Using token:', options.token);
  
  let passedTests = 0;
  let totalTests = 3;
  
  if (await testCreateNote()) passedTests++;
  if (await testGetTags()) passedTests++;
  if (await testSearchNotes()) passedTests++;
  
  console.log(`\nTest results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('✅ All tests passed! The Bear MCP Server is working correctly.');
  } else {
    console.log('❌ Some tests failed. Please check the error messages above.');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});
