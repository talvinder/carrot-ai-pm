# 5-Minute Quick Start Guide

Get started with Carrot AI PM in just 5 minutes! No coding knowledge required.

## What You'll Need

- Node.js installed on your computer
- An AI coding assistant (Cursor, Claude Desktop, or similar)
- A project you want to build

## Step 1: Install Carrot AI PM (2 minutes)

Open your terminal and run:

```bash
# Clone the repository
git clone https://github.com/talvinder/carrot-ai-pm.git

# Go into the directory
cd carrot-ai-pm

# Install dependencies
npm install

# Build the project
npm run build
```

## Step 2: Configure Your AI Assistant (2 minutes)

### For Cursor Users

1. In your project, create a file called `.cursor/mcp.json`
2. Copy this configuration (update the paths to match your system):

```json
{
  "mcpServers": {
    "carrot-pm": {
      "command": "node",
      "args": ["/path/to/carrot-ai-pm/dist/src/server.js"],
      "env": {
        "CARROT_PROJECT_ROOT": "/path/to/your/project"
      }
    }
  }
}
```

3. Restart Cursor

### For Claude Desktop Users

1. Open Claude Desktop settings
2. Go to MCP Servers
3. Add Carrot AI PM with the same configuration as above

## Step 3: Start Building! (1 minute)

Now you can use natural language to build your project. Here are some examples to try:

### Building an API

**You:** "Create a specification for a todo list API with create, read, update, and delete operations"

*Carrot will create a detailed API specification*

**You:** "Now implement this todo API using Express.js"

*Your AI assistant will write the code*

**You:** "Check if the implementation matches the specification"

*Carrot will validate and report any issues*

### Building a UI Component

**You:** "Create a specification for a login form component with email and password fields"

*Carrot will create a component specification*

**You:** "Build this login form in React"

*Your AI assistant will create the component*

**You:** "Validate the login form implementation"

*Carrot will check for issues*

### Creating a Database

**You:** "Design a database schema for a blog with posts, authors, and comments"

*Carrot will design the schema*

**You:** "Create the SQL for this blog database"

*Your AI assistant will write the SQL*

**You:** "Check if the database schema is correct"

*Carrot will validate the implementation*

## Common Commands to Try

### Getting Help
- "What can Carrot AI PM do?"
- "Show me what specifications I've created"
- "How do I fix the compliance issues?"

### Creating Specs
- "Create a spec for [describe what you want]"
- "Design a database for [your use case]"
- "I need a UI component that [does something]"

### Checking Code
- "Check if my code is correct"
- "Validate the implementation"
- "What's wrong with my code?"

### Improving Code
- "How can I make this more secure?"
- "What performance improvements do you suggest?"
- "Add the missing features"

## Tips for Success

### 1. Be Specific
Instead of: "Create an API"
Try: "Create a user authentication API with login, logout, and password reset"

### 2. Check Early and Often
Don't wait until you're done coding. Check compliance after each major feature.

### 3. Follow the Suggestions
When Carrot suggests improvements, ask your AI to implement them:
"Add the rate limiting that Carrot suggested"

### 4. Use Examples
Look at the examples in the `examples/` folder for inspiration.

## Troubleshooting

### "Carrot isn't responding"
- Make sure you built the project (`npm run build`)
- Check that your paths in the configuration are correct
- Restart your AI assistant

### "Command not found"
- Carrot works through your AI assistant, not directly in the terminal
- Make sure you're typing in your AI assistant's chat, not the terminal

### "Project root not configured"
- Update the `CARROT_PROJECT_ROOT` in your configuration
- Use the absolute path to your project directory

## Next Steps

Now that you're up and running:

1. **Try the examples** - Check out `examples/` for full scenarios
2. **Read the documentation** - Learn about all features
3. **Understand the technology** - See [technical-approach.md](technical-approach.md) for deep technical details
4. **Join the community** - Get help and share your experience
5. **Build something awesome** - And let us know what you create!

## Need Help?

- Check the [troubleshooting guide](troubleshooting.md)
- Open an issue on [GitHub](https://github.com/talvinder/carrot-ai-pm/issues)
- Join our Discord community

---

Remember: Carrot AI PM is here to make AI coding assistants work better for you. Just describe what you want to build, and Carrot will help ensure it's built correctly! 