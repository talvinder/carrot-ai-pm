#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { configureTools } from './dist/src/tools/index.js';
import { getProjectRoot } from './dist/src/utils/path.js';

console.log('🔍 MCP Server Diagnostic Tool');
console.log('================================');

try {
  // Test project root detection
  console.log('\n1. Testing project root detection...');
  const projectRoot = getProjectRoot();
  console.log(`✅ Project root: ${projectRoot}`);

  // Test server creation
  console.log('\n2. Testing server creation...');
  const server = new McpServer({
    name: 'Carrot-AI-PM-Debug',
    version: '1.0.0',
  });
  console.log('✅ Server created successfully');

  // Test tool configuration
  console.log('\n3. Testing tool configuration...');
  configureTools(server, projectRoot);
  
  const tools = server._registeredTools || {};
  const toolNames = Object.keys(tools);
  console.log(`✅ Tools configured: ${toolNames.length} tools`);
  console.log(`   Tools: ${toolNames.join(', ')}`);

  // Test transport creation
  console.log('\n4. Testing transport...');
  const transport = new StdioServerTransport();
  console.log('✅ Transport created successfully');

  // Test server connection
  console.log('\n5. Testing server connection...');
  await server.connect(transport);
  console.log('✅ Server connected to transport');

  console.log('\n🎉 All tests passed! MCP server is working correctly.');
  console.log('\nIf tools are not showing in Cursor, the issue is likely:');
  console.log('- Cursor MCP client cache');
  console.log('- MCP configuration path mismatch');
  console.log('- Cursor needs to be restarted completely');
  
  // Keep the server running for a few seconds to test
  console.log('\n⏳ Keeping server alive for 5 seconds...');
  setTimeout(() => {
    console.log('✅ Server test completed successfully');
    process.exit(0);
  }, 5000);

} catch (error) {
  console.error('\n❌ Error during diagnostic:');
  console.error(error);
  process.exit(1);
} 