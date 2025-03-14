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
  }
}

// Test searching for a single character
function testSearchSingleCharacter() {
  console.log('\nTesting search for a single character...');
  try {
    // Search for notes containing the letter 'a'
    const searchTerm = 'a';
    const notes = bearDb.searchNotes({ term: searchTerm });
    console.log(`✅ Search test passed. Found ${notes.length} notes containing '${searchTerm}'.`);
    return true;
  } catch (error) {
    console.error('❌ Search test failed:', error);
    return false;
  }
}

// Test searching for notes with a tag
function testSearchByTag() {
  console.log('\nTesting search by tag...');
  try {
    // Get all tags first
    const tags = bearDb.getTags();
    
    if (tags.length === 0) {
      console.log('⚠️ No tags found to test with. Skipping tag search test.');
      return true;
    }
    
    // Use the first tag for testing
    const tagToSearch = tags[0].name;
    const notes = bearDb.searchNotes({ tag: tagToSearch });
    console.log(`✅ Tag search test passed. Found ${notes.length} notes with tag '${tagToSearch}'.`);
    return true;
  } catch (error) {
    console.error('❌ Tag search test failed:', error);
    return false;
  }
}

// Test fetching a single note after search
function testFetchSingleNote() {
  console.log('\nTesting fetching a single note after search...');
  try {
    // Search for notes containing the letter 'a'
    const searchTerm = 'a';
    const notes = bearDb.searchNotes({ term: searchTerm });
    
    if (notes.length === 0) {
      console.log('⚠️ No notes found to test with. Skipping single note fetch test.');
      return true;
    }
    
    // Take the first note from search results
    const firstNote = notes[0];
    
    // Fetch the complete note by its ID
    const completeNote = bearDb.getNoteByIdOrTitle({ id: firstNote.identifier });
    
    // Verify the note structure
    if (!completeNote) {
      console.error('❌ Failed to fetch the complete note');
      return false;
    }
    
    // Check that the note has the expected properties
    const hasExpectedStructure = 
      typeof completeNote.note === 'string' &&
      typeof completeNote.title === 'string' &&
      typeof completeNote.id === 'string' &&
      typeof completeNote.creation_date === 'number' &&
      typeof completeNote.modification_date === 'number';
    
    if (!hasExpectedStructure) {
      console.error('❌ Note does not have the expected structure:', completeNote);
      return false;
    }
    
    // Verify that the IDs match
    if (completeNote.id !== firstNote.identifier) {
      console.error(`❌ Note ID mismatch: ${completeNote.id} vs ${firstNote.identifier}`);
      return false;
    }
    
    // Verify that the titles match
    if (completeNote.title !== firstNote.title) {
      console.error(`❌ Note title mismatch: ${completeNote.title} vs ${firstNote.title}`);
      return false;
    }
    
    console.log('✅ Single note fetch test passed. Note structure is as expected.');
    return true;
  } catch (error) {
    console.error('❌ Single note fetch test failed:', error);
    return false;
  }
}

// Run the tests
console.log('Starting Bear API tests...');
const connectionTestPassed = testDatabaseConnection();
const searchTestPassed = testSearchSingleCharacter();
const tagSearchTestPassed = testSearchByTag();
const singleNoteTestPassed = testFetchSingleNote();

// Close the database connection after all tests
bearDb.close();

// Report results
if (connectionTestPassed && searchTestPassed && tagSearchTestPassed && singleNoteTestPassed) {
  console.log('\n✅ All tests passed! The Bear MCP Server is working correctly.');
} else {
  console.log('\n❌ Some tests failed. Please check the error messages above.');
  process.exit(1);
}
