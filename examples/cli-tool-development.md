# CLI Tool Development

This example shows how to build command-line tools through natural language conversations with your AI assistant.

## Scenario: DevOps Deployment Tool

Let's create a deployment CLI tool by talking to our AI assistant.

## Step 1: Create CLI Tool Specification

**You:** "Create a specification for a deployment CLI tool that can deploy to different environments, run database migrations, and manage rollbacks"

**AI Assistant:** "I'll create a comprehensive specification for your deployment CLI tool."

**Carrot AI PM creates** a specification in `specs/cli/deploy-{timestamp}.json` including:
- Command structure and subcommands
- Options and arguments
- Environment management
- Migration handling
- Rollback capabilities
- Help documentation

## Step 2: Review the CLI Design

**You:** "Show me what commands this tool will support"

**AI Assistant:** "Your deployment tool will have these commands:

**Main Commands:**
```
deploy              Deploy application to an environment
deploy init         Initialize deployment configuration
deploy status       Check deployment status
deploy rollback     Rollback to previous version
deploy migrate      Run database migrations
deploy config       Manage deployment configurations
deploy logs         View deployment logs
```

**Key Features:**
- Multiple environment support (dev, staging, prod)
- Dry-run mode for safety
- Interactive confirmations for production
- Colored output for better readability
- Progress indicators for long operations
- Comprehensive error messages
- Shell completion support"

## Step 3: Implement the CLI Tool

**You:** "Implement the main deploy command with environment selection and safety checks"

**AI Assistant:** "I'll create the deployment CLI tool following the specification."

*The AI implements:*
- Command parsing with proper libraries
- Environment validation
- Configuration loading
- Safety prompts for production
- Progress tracking
- Error handling with helpful messages

## Step 4: Check CLI Compliance

**You:** "Check if the CLI implementation matches the specification"

**Carrot AI PM analyzes and reports:**

```
CLI Tool Compliance Report
==========================

Overall Score: 93% ✅

✅ Command Structure
   - All main commands implemented
   - Subcommands properly nested
   - Aliases working correctly

✅ Arguments & Options
   - Required arguments validated
   - Optional flags have defaults
   - Mutually exclusive options handled

✅ User Experience
   - Help text clear and comprehensive
   - Error messages actionable
   - Progress indicators for long tasks
   - Colored output for clarity

⚠️  Suggestions:
   - Add --json flag for scripting
   - Implement shell completion scripts
   - Add verbose logging option

❌ Missing:
   - No configuration file validation
   - Missing dry-run for rollback command
```

## Step 5: Improve Based on Feedback

**You:** "Add the --json output flag for automation"

**AI Assistant:** "I'll add JSON output support for scripting and automation."

*AI implements JSON output*

**You:** "Also add shell completion for bash and zsh"

**AI Assistant:** "I'll add shell completion scripts for better developer experience."

*AI creates completion scripts*

## Step 6: Create Usage Examples

**You:** "Show me common usage scenarios for this tool"

**AI Assistant:** "Here are typical deployment scenarios:

**Development Deployment:**
```bash
# Quick deploy to dev
deploy dev

# Deploy specific branch
deploy dev --branch feature/new-ui

# Dry run to see what would happen
deploy dev --dry-run
```

**Production Deployment:**
```bash
# Deploy to production with confirmations
deploy prod --version v2.1.0

# Deploy with migrations
deploy prod --version v2.1.0 --migrate

# Emergency rollback
deploy rollback prod --to-version v2.0.9
```

**Database Operations:**
```bash
# Run migrations only
deploy migrate prod --up

# Rollback last migration
deploy migrate prod --down 1

# Check migration status
deploy migrate status prod
```

**Monitoring:**
```bash
# Check deployment status
deploy status prod

# View recent logs
deploy logs prod --lines 100

# Follow logs in real-time
deploy logs prod --follow
```"

## Common CLI Conversations

**You:** "How can I make deployments safer?"

**AI + Carrot:** "Your CLI already has safety features, but here are more:

**Implemented:**
- ✅ Production confirmation prompts
- ✅ Dry-run mode
- ✅ Version validation
- ✅ Environment checks

**Additional Safety Measures:**
1. **Pre-flight Checks** - Test connections before deploying
2. **Backup Creation** - Auto-backup before changes
3. **Health Checks** - Verify app health after deploy
4. **Gradual Rollout** - Deploy to % of servers first
5. **Automatic Rollback** - Revert on health check failure"

**You:** "What about team collaboration features?"

**AI + Carrot:** "Consider adding these collaboration features:

**Deployment Notifications:**
- Slack/Discord webhooks
- Email notifications
- Deployment log to shared database

**Access Control:**
- Environment-based permissions
- Approval workflow for production
- Audit trail of who deployed what

**Team Features:**
- Deployment locks to prevent conflicts
- Shared configuration management
- Team-specific environment variables"

**You:** "How do I handle secrets securely?"

**AI + Carrot:** "Here's how to manage secrets safely:

**Never in Code:**
- ❌ Don't hardcode secrets
- ❌ Don't commit .env files
- ❌ Don't log sensitive data

**Secure Approaches:**
1. **Environment Variables** - From secure sources
2. **Secret Managers** - AWS Secrets, Vault
3. **Encrypted Files** - GPG encrypted configs
4. **Runtime Injection** - Fetch at deploy time

**Implementation:**
```bash
# Use secret manager
deploy prod --secrets-from aws-secrets

# Encrypted config
deploy prod --config secrets.gpg

# Environment injection
DEPLOY_KEY=$SECRET deploy prod
```"

## Advanced CLI Features

**You:** "Add support for multi-region deployments"

**AI Assistant:** "I'll extend the CLI to support deploying to multiple regions:

**New Commands:**
```bash
# Deploy to specific regions
deploy prod --regions us-east-1,eu-west-1

# Deploy to all regions
deploy prod --all-regions

# Rolling deployment across regions
deploy prod --rolling --region-delay 5m

# Region-specific status
deploy status prod --region us-east-1
```

**Features Added:**
- Parallel region deployments
- Region health checks
- Cross-region synchronization
- Region-specific rollbacks"

## Testing the CLI

**You:** "Create tests for the CLI commands"

**AI Assistant:** "I'll create comprehensive CLI tests:

**Test Categories:**
1. **Command Parsing** - Argument validation
2. **Error Handling** - Invalid inputs
3. **Integration Tests** - Real deployments
4. **User Experience** - Output formatting

**Example Test Output:**
```
✓ deploy command requires environment
✓ --dry-run prevents actual deployment
✓ production requires confirmation
✓ invalid version shows helpful error
✓ progress bar updates correctly
✓ JSON output is valid
✓ completion scripts work
```"

## CLI Best Practices Highlighted

### 1. User-Friendly Design
Clear commands, helpful errors, and intuitive options make the tool easy to use.

### 2. Safety First
Production safeguards, dry-run mode, and confirmations prevent accidents.

### 3. Automation Support
JSON output, exit codes, and quiet mode enable scripting.

### 4. Great Documentation
Built-in help, examples, and man pages guide users.

### 5. Progressive Disclosure
Simple commands for common tasks, advanced options when needed.

## Next Steps

**You:** "What other features would make this deployment tool better?"

**AI + Carrot:** "Consider adding these advanced features:

1. **Deployment Strategies**
   - Blue-green deployments
   - Canary releases
   - Feature flags integration

2. **Monitoring Integration**
   - Datadog/New Relic markers
   - Custom metrics publishing
   - Automated smoke tests

3. **Pipeline Support**
   - CI/CD integration
   - Webhook triggers
   - Status badges

4. **Advanced Rollback**
   - Database rollback coordination
   - Asset rollback
   - Configuration rollback

5. **Cost Optimization**
   - Resource usage reports
   - Cost estimates before deploy
   - Cleanup old deployments"

This example shows how Carrot AI PM helps build better CLI tools by:
- Designing intuitive command structures
- Ensuring comprehensive help documentation
- Validating safety features are implemented
- Suggesting improvements for team use
- Making tools that developers actually want to use 