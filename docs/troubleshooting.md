# Troubleshooting Guide

Common issues and solutions for Carrot AI PM.

## Installation Issues

### "npm install" fails

**Problem**: Dependencies fail to install
**Solutions**:
1. Ensure Node.js 18+ is installed: `node --version`
2. Clear npm cache: `npm cache clean --force`
3. Delete `node_modules` and `package-lock.json`, then retry
4. Try using yarn instead: `yarn install`

### "npm run build" fails

**Problem**: TypeScript compilation errors
**Solutions**:
1. Ensure TypeScript is installed: `npm install -g typescript`
2. Check Node.js version compatibility
3. Clear build cache: `rm -rf dist && npm run build`

## Configuration Issues

### "Project root not configured" error

**Problem**: Carrot can't find your project
**Solutions**:
1. Set environment variable: `CARROT_PROJECT_ROOT=/path/to/your/project`
2. Use absolute paths in MCP configuration
3. Ensure the path exists and is readable

**Example fix for Cursor**:
```json
{
  "mcpServers": {
    "carrot-pm": {
      "command": "node",
      "args": ["/absolute/path/to/carrot-ai-pm/dist/src/server.js"],
      "env": {
        "CARROT_PROJECT_ROOT": "/absolute/path/to/your/project"
      }
    }
  }
}
```

### "Carrot isn't responding" in AI assistant

**Problem**: AI assistant can't communicate with Carrot
**Solutions**:
1. Restart your AI assistant after configuration changes
2. Check that the server path is correct
3. Verify the server starts without errors: `npm start`
4. Check AI assistant logs for error messages

## Usage Issues

### "Command not found" when talking to AI

**Problem**: AI assistant doesn't recognize Carrot commands
**Solutions**:
1. Carrot works through your AI assistant, not terminal commands
2. Use natural language: "Create a spec for..." not "carrot create spec"
3. Ensure MCP server is properly configured and running
4. Try restarting your AI assistant

### Specifications aren't being created

**Problem**: No spec files appear in your project
**Solutions**:
1. Check that `CARROT_PROJECT_ROOT` points to the right directory
2. Ensure the directory is writable
3. Look for specs in `specs/` subdirectory
4. Check for error messages in the AI assistant

### Validation always passes/fails

**Problem**: Compliance checking seems broken
**Solutions**:
1. Ensure you have both a specification and implementation
2. Check that file paths are correct
3. Verify the specification format is valid
4. Try with a simple example first

## Performance Issues

### Validation is slow

**Problem**: Compliance checking takes too long
**Solutions**:
1. Check file sizes - very large files take longer
2. Ensure adequate system memory
3. Try validating smaller code sections
4. Check for infinite loops in code being analyzed

### High memory usage

**Problem**: Carrot uses too much RAM
**Solutions**:
1. Restart the MCP server periodically
2. Validate smaller code chunks
3. Close unused AI assistant sessions
4. Check for memory leaks in your code

## AI Assistant Specific Issues

### Cursor Issues

**Problem**: Cursor-specific problems
**Solutions**:
1. Ensure `.cursor/mcp.json` is in your project root
2. Restart Cursor after configuration changes
3. Check Cursor's MCP server logs
4. Try the configuration in a new project

### Claude Desktop Issues

**Problem**: Claude Desktop integration problems
**Solutions**:
1. Update Claude Desktop to latest version
2. Check MCP server configuration in settings
3. Restart Claude Desktop after changes
4. Verify server permissions

## Getting More Help

### Enable Debug Mode

Add debug logging to your configuration:
```json
{
  "mcpServers": {
    "carrot-pm": {
      "command": "node",
      "args": ["/path/to/carrot-ai-pm/dist/src/server.js"],
      "env": {
        "CARROT_PROJECT_ROOT": "/path/to/your/project",
        "DEBUG": "carrot:*"
      }
    }
  }
}
```

### Check Server Logs

Run Carrot manually to see detailed logs:
```bash
cd /path/to/carrot-ai-pm
CARROT_PROJECT_ROOT=/path/to/your/project npm start
```

### Common Error Messages

#### "Invalid specification format"
- Check that your spec files are valid JSON
- Ensure all required fields are present
- Validate against the schema

#### "Code analysis failed"
- Check for syntax errors in your code
- Ensure file encoding is UTF-8
- Try with a simpler code example

#### "Permission denied"
- Check file/directory permissions
- Ensure Carrot can read your project files
- Try running with appropriate permissions

### Still Need Help?

1. **Check the examples** - See working configurations in `examples/`
2. **Read the technical docs** - [technical-approach.md](technical-approach.md) has detailed info
3. **Open an issue** - [GitHub Issues](https://github.com/talvinder/carrot-ai-pm/issues) with:
   - Your operating system
   - Node.js version
   - AI assistant being used
   - Complete error messages
   - Configuration files (remove sensitive data)
4. **Join the community** - Discord/Slack for real-time help

## Frequently Asked Questions

### Q: Does Carrot work with all AI assistants?
A: Carrot works with any AI assistant that supports the Model Context Protocol (MCP). This includes Claude, Cursor, and others.

### Q: Can I use Carrot with existing projects?
A: Yes! Carrot can analyze existing code and create specifications retroactively.

### Q: Is my code sent to external servers?
A: No, all analysis happens locally. Carrot never sends your code to external services.

### Q: Can I customize the validation rules?
A: Yes, Carrot supports custom validation rules and plugins. See the technical documentation for details.

### Q: Does Carrot support languages other than TypeScript/JavaScript?
A: Currently focused on TypeScript/JavaScript, with Python and Java support planned.

---

If this guide doesn't solve your issue, please open a GitHub issue with detailed information about your problem. 