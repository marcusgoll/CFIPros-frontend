#!/usr/bin/env node

/**
 * Test script to verify API connection to the v1.2 backend
 * Run with: node scripts/test-api-connection.js
 */

const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

const API_BASE_URL = process.env.BACKEND_API_URL || process.env.API_BASE_URL;

if (!API_BASE_URL) {
  console.error('❌ Error: BACKEND_API_URL or API_BASE_URL environment variable is required');
  process.exit(1);
}

console.log('🔗 Testing API connection to:', API_BASE_URL);

async function testEndpoint(endpoint, method = 'GET', body = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`\n🧪 Testing ${method} ${endpoint}`);
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CFIPros-Frontend-Test/1.0',
      },
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const text = await response.text();
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Headers:`, Object.fromEntries(response.headers.entries()));
    
    if (text) {
      try {
        const data = JSON.parse(text);
        console.log(`   Response:`, JSON.stringify(data, null, 2));
      } catch {
        console.log(`   Response (text):`, text.substring(0, 200));
      }
    }

    return {
      success: response.ok,
      status: response.status,
      data: text,
    };
  } catch (error) {
    console.log(`   ❌ Error:`, error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function testFileUpload() {
  console.log(`\n📁 Testing file upload (POST /v1/aktr)`);
  
  // Create a small test file
  const testContent = Buffer.from('Test PDF content for AKTR upload');
  
  const formData = new FormData();
  const blob = new Blob([testContent], { type: 'application/pdf' });
  formData.append('files', blob, 'test-aktr.pdf');

  try {
    const response = await fetch(`${API_BASE_URL}/v1/aktr`, {
      method: 'POST',
      headers: {
        'User-Agent': 'CFIPros-Frontend-Test/1.0',
      },
      body: formData,
    });

    const text = await response.text();
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (text) {
      try {
        const data = JSON.parse(text);
        console.log(`   Response:`, JSON.stringify(data, null, 2));
        return data.batchId || null;
      } catch {
        console.log(`   Response (text):`, text.substring(0, 200));
      }
    }

    return null;
  } catch (error) {
    console.log(`   ❌ Error:`, error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting API connection tests...\n');

  const results = [];

  // Test 1: Health check (if available)
  results.push(await testEndpoint('/health'));
  results.push(await testEndpoint('/v1/health'));

  // Test 2: File upload test
  const batchId = await testFileUpload();
  
  // Test 3: Batch status (if we got a batch ID)
  if (batchId) {
    results.push(await testEndpoint(`/v1/batches/${batchId}`));
  }

  // Test 4: Test other endpoints
  results.push(await testEndpoint('/v1/batches/test-batch-id'));
  
  // Summary
  const successful = results.filter(r => r && r.success).length;
  const total = results.filter(r => r).length;
  
  console.log('\n📊 Test Results Summary:');
  console.log(`   Total tests: ${total}`);
  console.log(`   Successful: ${successful}`);
  console.log(`   Failed: ${total - successful}`);

  if (successful > 0) {
    console.log('\n✅ API connection is working!');
    console.log('🎯 Backend URL:', API_BASE_URL);
    if (batchId) {
      console.log('🆔 Test Batch ID:', batchId);
    }
  } else {
    console.log('\n❌ API connection failed');
    console.log('🔍 Please check:');
    console.log('   - Backend server is running');
    console.log('   - BACKEND_API_URL is correct');
    console.log('   - Network connectivity');
    console.log('   - CORS configuration');
  }
}

// Add global fetch if not available (Node.js < 18)
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
  global.FormData = require('form-data');
  global.Blob = require('buffer').Blob;
}

runTests().catch(console.error);