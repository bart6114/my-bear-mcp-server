#!/usr/bin/env node
/**
 * Test script for the Bear MCP Server
 * 
 * This script tests the SQLite database connection functionality.
 * 
 * Usage: node test-bear-api.js
 */

import { BearDB } from '../build/bear-db.js';

// Create the Bear DB client
const bearDb = new BearDB();

// Test SQLite database connection
function testDatabaseConnection() {
  console.log('Testing SQLite database connection...');
  try {
    // Try to get tags to verify connection works
    const tags = bearDb.getTags();
    console.log(`✅ Database connection test passed. Found ${tags.length} tags.`);
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  } finally {
    // Close the database connection
    bearDb.close();
  }
}

// Run the test
console.log('Starting Bear SQLite database test...');
const passed = testDatabaseConnection();

if (passed) {
  console.log('\n✅ Test passed! The Bear MCP Server can connect to the SQLite database.');
} else {
  console.log('\n❌ Test failed. Please check the error messages above.');
  process.exit(1);
}
