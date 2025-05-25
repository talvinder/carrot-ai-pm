# Carrot AI PM - MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Contributions Welcome](https://img.shields.io/badge/Contributions-Welcome-brightgreen.svg?style=flat)](CONTRIBUTING.md)
<!-- Add other relevant badges like build status, version, etc. -->

The Carrot AI PM - MCP (Model Context Protocol) Server is designed to empower AI agents (like Cursor, Claude Desktop, and other LLM-powered tools) to actively participate in the development and maintenance of the **Carrot** project's FastAPI codebase. It provides a structured interface for AI to understand, modify, and test the code.

**Project Status:** This project is currently under active development and is far from feature-complete. We are actively seeking contributors to help build out its capabilities and refine its logic!

## 🥕 What is Carrot? (The System this MCP Server Supports)

**Carrot is a spec-driven task engine for LLM coders.**
It allows your team to define *what needs to be built*—in structured, incremental tasks—and ensures that AI agents or assistants write code that accurately matches the intended specifications.

Think of it as:
> A single source of truth for what an AI agent should do next, expressed as structured JSON tasks.

Carrot aims to bridge the gap between natural language prompts and robust, spec-aligned code generation by:
1. Parsing natural language goals into structured **task specs** (detailing intent, scope, inputs, validations, etc.).
2. Feeding these specs to AI agents.
3. Enforcing spec alignment before code changes are applied.

It acts as a control layer between human developers, LLMs, and the codebase, bringing structure, control, and traceability to AI-assisted development.

## 🚀 MCP Server: Purpose & Scope

This MCP server specifically serves the Carrot project's internal FastAPI codebase. Its primary goal is to enable AI agents to:
*   Read and understand the existing codebase and specifications.
*   Modify code and specs in a controlled manner.
*   Execute development tasks like running tests, formatting code, and committing changes.

## ✨ Features

The MCP server exposes resources, tools, and prompts to AI agents:

### 📚 Resources (Read-only unless stated)

*   **`file://{path}`**: Accesses any source file under the `<repo-root>/carrot` directory (or the relevant project source directory).
*   **`spec://vibe.yaml`**: Provides the OpenAPI (vibe.yaml) specification that defines Carrot's API routes.
*   **`docs://README.md`**: Offers the main repository README for high-level project context.
*   **`todo://issues/{id}`**: Delivers a JSON view of GitHub issues (e.g., those labeled `carrot`). Supports pagination and filtering.
*   **`spec://<type>/{identifier}-{timestamp}.json`**: (Conceptual - see "The `grow_spec` Tool" below) Detailed JSON specifications for various artifact types (API, UI, etc.) stored in `specs/<type>/`.

### 🛠️ Tools (Mutating / Side-effecting)

All tool inputs are validated using `zod` schemas.

*   **`add_route`**:
    *   **Inputs**: `path` (string), `method` (enum: GET, POST, etc.), `handler_name` (string).
    *   **Effect**: Creates FastAPI route stubs and inserts necessary imports (e.g., into `main.py`).
*   **`grow_spec`**:
    *   **Inputs**: `endpoint` (string, e.g., `/api/users`), `summary` (string). (Current implementation)
    *   **Effect**: Appends a stub to the `vibe.yaml` (OpenAPI spec) under the correct path and HTTP verb.
    *   *(See "The `grow_spec` Tool - Vision for Expansion" section for future enhancements).*
*   **`run_tests`**:
    *   **Inputs**: None.
    *   **Effect**: Executes `pytest -q` (or a configured test runner) and returns a JSON summary of the results.
*   **`format_code`**:
    *   **Inputs**: `paths` (optional array of file/directory paths).
    *   **Effect**: Runs code formatters like `ruff --fix` and `black` on the specified paths or the entire project.
*   **`search_code`**:
    *   **Inputs**: `query` (string, using ripgrep syntax).
    *   **Effect**: Searches the codebase using `ripgrep` and returns matching line snippets.
*   **`commit_changes`**:
    *   **Inputs**: `message` (string).
    *   **Effect**: Stages all current changes and commits them using `git commit -m "message"`. Does not push.
*   **`check_spec_compliance`**:
    *   **Inputs**: `specPath` (optional), `implementationPath` (optional), `endpoint` (optional), `method` (optional), `projectPath` (optional), `watchMode` (optional), `generateReport` (optional).
    *   **Effect**: Validates implementation against OpenAPI specifications, providing real-time compliance feedback with actionable suggestions for fixes.

### 📝 Prompts (Reusable Templates)

*   **`review_diff`**: Given a `git diff`, guides the AI to produce a structured code review with sections like "Logic," "Style," and "Tests Needed."
*   **`draft_pr`**: Helps generate a Pull Request description summarizing changes and linking to relevant issues.
*   **`explain_file`**: Prompts the AI to return a concise explanation of a file's purpose and its public interface/surface area.

## ⚙️ Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/talvinder/carrot-ai-pm # Replace with your actual repo URL
    cd carrot-ai-pm
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Build the project:
    ```bash
    npm run build
    ```

## 🚀 Usage

### Standard Mode (stdio)

For use with local AI clients like Cursor that support stdio transport:
```bash
npm start
```

This will typically run the server using `node dist/src/server.js`.

### HTTP Mode (SSE)

For remote clients, CI/CD runners, or other scenarios requiring network access:
```bash
npm run start:sse
```
This starts an SSE (Server-Sent Events) server, typically at `/mcp/sse` on port 3000. The port can be configured via the `PORT` environment variable.

## 🔧 Development

For local development with auto-rebuild on file changes:

1.  In one terminal, start the watcher:
    ```bash
    npm run watch
    ```
2.  In another terminal, run the development server (which uses the watched build):
    ```bash
    npm run dev
    ```

## 🔩 Configuration

### Environment Variables

*   `PORT`: If set to a port number (e.g., `3000`), enables HTTP/SSE transport. If not set or set to `0`, defaults to stdio.
*   `GITHUB_TOKEN`: A GitHub Personal Access Token for increased API rate limits when accessing GitHub issues via the `todo://` resource.
*   `PG_DSN`: PostgreSQL connection string (e.g., `postgresql://user:password@host:port/database`) for features that might require database access.
*   `CARROT_PROJECT_ROOT`: **(REQUIRED)** Absolute path to the root of the Carrot project codebase that this MCP server will manage. The server will **not** attempt to guess this path. If it's not explicitly provided, the server will log an error and exit.

### Project Root Configuration (REQUIRED)

To use the Carrot Product Manager (Carrot-PM) MCP Server with an MCP client (e.g., Cursor), you **must** configure the server to know the **absolute path to your project directory**.

The server will **not** attempt to guess this path. If it's not explicitly provided, the server will log an error and exit.

You can provide the project root in one of two ways when setting up Carrot-PM in your MCP client's configuration file (e.g., `.cursor/mcp.json`):

1.  **Environment Variable (Recommended):**
    Set the `CARROT_PROJECT_ROOT` environment variable to the absolute path of your project.

    **Example for `.cursor/mcp.json`:**
    ```json
    {
      "mcpServers": {
        "carrot-pm": {
          "command": "node",
          "args": [
            "<path-to-your-cloned-carrot-ai-pm-repo>/dist/src/server.js"
          ],
          "env": {
            "CARROT_PROJECT_ROOT": "/Users/yourname/projects/your-actual-project-folder"
          }
        }
      }
    }
    ```

2.  **Command-Line Argument:**
    Pass the `--project-root` argument followed by the absolute path to your project.

    **Example for `.cursor/mcp.json`:**
    ```json
    {
      "mcpServers": {
        "carrot-pm": {
          "command": "node",
          "args": [
            "<path-to-your-cloned-carrot-ai-pm-repo>/dist/src/server.js",
            "--project-root", "/Users/yourname/projects/your-actual-project-folder"
          ]
        }
      }
    }
    ```

    Alternatively, you can use the `--project-root=<path>` format:
    ```json
    {
      "mcpServers": {
        "carrot-pm": {
          "command": "node",
          "args": [
            "<path-to-your-cloned-carrot-ai-pm-repo>/dist/src/server.js",
            "--project-root=/Users/yourname/projects/your-actual-project-folder"
          ]
        }
      }
    }
    ```

**IMPORTANT:**
*   Replace `/Users/yourname/projects/your-actual-project-folder` with the correct **absolute path** to the project you want Carrot-PM to operate on.
*   Replace `<path-to-your-cloned-carrot-ai-pm-repo>` with the actual absolute path to where you cloned this `carrot-ai-pm` repository.
*   The path must exist and be a directory, otherwise the server will fail to start.

### Client Configuration (e.g., Cursor)

To enable your AI client (like Cursor) to discover and use the tools provided by this MCP server, you'll need to configure it. Here's a complete example for Cursor's `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "Carrot": {
      "command": "node",
      "args": [
        "<path-to-your-cloned-carrot-ai-pm-repo>/dist/src/server.js"
      ],
      "workingDirectory": "<path-to-your-cloned-carrot-ai-pm-repo>",
      "env": {
        "CARROT_PROJECT_ROOT": "/Users/yourname/projects/your-actual-project-folder"
      }
    }
  }
}
```

## 🔍 Spec Compliance Checking - Hypothesis-Driven Development

One of the key challenges in AI-assisted development is ensuring that implementations actually follow the generated specifications. The Carrot AI PM includes a sophisticated **Spec Compliance Checker** built using Test-Driven Development (TDD) and hypothesis-driven design.

### Hypothesis

**Primary Hypothesis**: Developers need real-time feedback on whether their implementation matches the generated specifications, with actionable insights on deviations and suggestions for alignment.

### Key Features

- **Real-time Validation**: Check if route implementations match OpenAPI specs
- **Actionable Suggestions**: Get specific code fixes, not just error messages
- **Multiple Compliance Dimensions**: Validates response schemas, request validation, error handling, and route patterns
- **Progressive Enhancement**: Compliance checking integrates seamlessly with existing workflows
- **Watch Mode**: Continuous monitoring during development

### Usage Examples

```bash
# Check specific endpoint compliance
{
  "tool": "check_spec_compliance",
  "parameters": {
    "implementationPath": "routes/users.js",
    "endpoint": "/api/users",
    "method": "POST"
  }
}

# Generate project-wide compliance report
{
  "tool": "check_spec_compliance",
  "parameters": {
    "generateReport": true
  }
}

# Enable continuous monitoring
{
  "tool": "check_spec_compliance",
  "parameters": {
    "watchMode": true,
    "implementationPath": "routes/users.js"
  }
}
```

### Compliance Scoring

The tool provides weighted compliance scores:
- **90-100%**: Excellent compliance
- **80-89%**: Good compliance (considered compliant)
- **60-79%**: Needs improvement
- **Below 60%**: Significant issues requiring attention

For detailed documentation and examples, see:
- [Spec Compliance Documentation](docs/spec-compliance-checking.md)
- [Practical Demo](examples/spec-compliance-demo.md)

## 🧠 Core Logic: Understanding the Spec System

To effectively guide AI agents, Carrot MCP Server utilizes a dual-specification approach:

1.  **`vibe.yaml` (OpenAPI Spec)**:
    *   This is your standard OpenAPI (formerly Swagger) specification file.
    *   It defines the technical structure of your API: routes, HTTP methods, request/response schemas, basic descriptions.
    *   Consumed by API documentation tools, code generators, testing tools, and the AI agent to understand the API's technical contract.
    *   Primarily focused on the *what* from a technical API perspective.

2.  **`specs/*.json` (Detailed Task/Feature Specs)**:
    *   These are JSON files (potentially one per significant feature or endpoint) stored in a `specs/` directory, often organized by type (e.g., `specs/api/`, `specs/ui/`).
    *   They contain richer semantic information beyond the OpenAPI spec:
        *   Detailed feature descriptions and business logic.
        *   Implementation phases or steps.
        *   Dependencies (e.g., other services, database tables).
        *   Specific validation rules or edge cases to consider.
        *   Testing requirements beyond basic contract testing.
    *   Consumed by the AI agent to understand the *why* and *how* of implementing a feature.

**How they work together (Example Workflow):**

1.  **User Goal:** "Define a new API endpoint for user registration."
2.  **Agent Action (using `grow_spec`):**
    *   Adds a basic entry for `/api/users` (POST) to `vibe.yaml` (technical structure).
    *   Creates a detailed spec file like `specs/api/user-registration-{timestamp}.json` with initial thoughts on fields, validation, and success/error responses (implementation details).
3.  **User Goal:** "Implement the user registration endpoint."
4.  **Agent Action:**
    *   Reads `vibe.yaml` for the path, method, and basic request/response schema.
    *   Reads `specs/api/user-registration-{timestamp}.json` for detailed requirements (e.g., password hashing, duplicate email checks, welcome email sending).
    *   Generates/modifies Python/FastAPI code based on both specifications.
5.  **User Goal:** "Write tests for user registration."
6.  **Agent Action:**
    *   Uses `vibe.yaml` to generate contract tests (correct request/response).
    *   Uses `specs/api/user-registration-{timestamp}.json` to create tests for business logic, edge cases, and specific feature requirements.

This dual-spec approach helps:
*   Keep `vibe.yaml` clean, standard-compliant, and focused on the API contract.
*   Provide rich, detailed context to AI agents for more accurate and complete implementation.
*   Separate concerns between technical API structure and nuanced business/feature logic.
*   Facilitate incremental development and clearer task breakdown for AI.

## 🌱 The `grow_spec` Tool - Vision for Expansion

Currently, `grow_spec` primarily focuses on adding stubs to `vibe.yaml` for API endpoints. However, the vision is to make it a more versatile tool for specifying various types of software artifacts.

**Why the need for expansion?**
*   **Beyond APIs:** Projects involve UI components, cron jobs, data pipelines, DB schemas, CLI commands, etc. The current `grow_spec` is too API-centric.
*   **Spec Discoverability:** A flat `specs/` folder makes it hard for an agent to find the relevant detailed spec for a non-API artifact.

**Design Goal for `grow_spec` vNext:**
> One tool, `grow_spec`, should emit a single, typed spec file (e.g., JSON) for any kind of artifact. It should also (optionally) update a domain-specific aggregate file (like `vibe.yaml` for APIs) *only when relevant*.

**Proposed Interface Upgrade:**
```typescript
// Zod schema for the improved grow_spec tool
{
  type: z.enum(['api', 'ui', 'page', 'cli', 'job', 'db', 'lib']).describe('Kind of artifact'),
  identifier: z.string().min(1).describe('Path, name, or slug (e.g., /users, AddToCartButton, nightly-sync)'),
  summary: z.string().min(1).describe('Natural language description of the artifact intent'),
  projectDir: z.string().optional().describe('Relative path to the target project directory for the spec')
}
```

**Proposed Directory & File Conventions:**
```
<repo-root>/
 ├─ specs/
 │   ├─ api/
 │   │   └─ users-2025-05-20T….json
 │   ├─ ui/
 │   │   └─ add-to-cart-btn-….json
 │   ├─ db/
 │   │   └─ schema-update-….json
 │   └─ job/
 │       └─ nightly-sync-….json
 ├─ spec_index.yaml   # (Optional) A lightweight registry: {type, id, path_to_spec_file, summary}
 └─ vibe.yaml         # Exists *only* if at least one 'api' type spec is present
```

**Benefits of this approach:**
*   **Decouples spec format from OpenAPI:** OpenAPI becomes one type of aggregate.
*   **Extensibility:** Easily add new artifact types and their corresponding spec generators and scaffolding tools.
*   **Clarity for Agents:** Agents can request specs by type and identifier, leading to a more structured workflow: **Read Spec → Scaffold → Code → Test**, regardless of artifact type.

**We need your help to realize this vision!** If this sounds interesting, please check out our [CONTRIBUTING.md](CONTRIBUTING.md) guide and open an issue or PR.

## 🤝 How to Contribute

We welcome contributions of all kinds! Whether it's bug fixes, new features, documentation improvements, or helping to realize the vision for `grow_spec`, your help is appreciated.

1.  **Fork the repository.**
2.  **Create a new branch** for your feature or bug fix.
3.  **Make your changes.**
    *   Consider the existing architecture and the vision outlined above.
    *   Add tests for any new functionality.
    *   Ensure code is formatted (`npm run format`).
4.  **Push your branch and submit a Pull Request.**
5.  **Check out the [Issues](https://github.com/your-org/carrot-ai-pm/issues) tab** for existing ideas and bugs.

Please read our [CONTRIBUTING.md](CONTRIBUTING.md) (you'll need to create this file) for more detailed guidelines.

## 🛡️ Security Considerations

*   **File Operations:** Write operations are intended to be restricted to the designated project directory (`<repo-root>/carrot` or as configured).
*   **Command Execution:** Shell commands (e.g., for `git`, `pytest`, formatters) should be constructed carefully to prevent injection vulnerabilities. Parameters are generally validated.
*   **Deny-lists:** SQL and shell commands may be validated against deny-lists for potentially harmful operations.
*   **Rate Limiting:** Resource-intensive operations like `search_code` and `run_tests` may have rate limits applied (e.g., 4 calls/minute as per original spec).

## 📋 Requirements

*   Node.js 18+
*   npm (comes with Node.js)
*   Git
*   Python 3.8+ (for executing Python-based tools like `ruff`, `black`, `pytest` on the target Carrot project)
*   `ripgrep` (for the `search_code` tool)

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details (you'll need to create this file with the MIT license text).


**Next Steps for You:**

1.  **Replace Placeholders:**
    *   `https://github.com/your-org/carrot-ai-pm.git` with your actual repository URL.
    *   Any other `<path-to-your-cloned-carrot-ai-pm-repo>` or similar placeholders.
2.  **Create `CONTRIBUTING.md`:** Outline how people can contribute, coding standards, branch naming, PR process, etc.
3.  **Create `LICENSE` file:** Copy the MIT License text into it.
4.  **Review and Refine:** Read through it again. Does it accurately reflect your project and vision? Is it clear?
5.  **Add Badges:** Consider adding more badges at the top (e.g., build status from your CI, npm version if you publish it, etc.).

