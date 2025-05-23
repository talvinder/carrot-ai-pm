# Contributing to Carrot AI PM - MCP Server

First off, thank you for considering contributing to the Carrot AI PM - MCP Server! We're excited to have your help in building a powerful tool for AI-assisted software development. This project is in its early stages, and every contribution, big or small, is highly valued.

This document provides guidelines for contributing to this project. Please feel free to propose changes to this document in a pull request.

## Table of Contents

-   [Code of Conduct](#code-of-conduct)
-   [How Can I Contribute?](#how-can-i-contribute)
    -   [Reporting Bugs](#reporting-bugs)
    -   [Suggesting Enhancements](#suggesting-enhancements)
    -   [Your First Code Contribution](#your-first-code-contribution)
    -   [Pull Requests](#pull-requests)
-   [Development Setup](#development-setup)
    -   [Prerequisites](#prerequisites)
    -   [Installation](#installation)
    -   [Running the Server for Development](#running-the-server-for-development)
-   [Styleguides](#styleguides)
    -   [Git Commit Messages](#git-commit-messages)
    -   [TypeScript Styleguide](#typescript-styleguide)
    -   [Code Formatting](#code-formatting)
-   [Testing](#testing)
-   [Questions?](#questions)

## Code of Conduct

This project and everyone participating in it is governed by the [Carrot AI PM Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to talvinder27@gmail.com.


## How Can I Contribute?

### Reporting Bugs

If you encounter a bug, please help us by reporting it!

-   **Check existing issues:** Before creating a new issue, please check if the bug has already been reported in the [GitHub Issues](https://github.com/talvinder/carrot-ai-pm/issues).
-   **Create a new issue:** If it's a new bug, please open an issue. Be sure to include:
    -   A clear and descriptive title.
    -   Steps to reproduce the bug.
    -   What you expected to happen.
    -   What actually happened.
    -   Your environment (OS, Node.js version, client used if applicable).
    -   Any relevant logs or screenshots.

### Suggesting Enhancements

We love to hear your ideas for improving the Carrot AI PM - MCP Server!

-   **Check existing issues/discussions:** Your idea might already be under discussion.
-   **Create a new issue:** If it's a new idea, please open an issue with the "enhancement" label. Describe:
    -   The problem your enhancement solves.
    -   A clear description of the suggested enhancement.
    -   Any alternative solutions or features you've considered.
    -   If you're interested in implementing it yourself!
    -   For larger ideas, like the `grow_spec` expansion outlined in the README, feel free to start a discussion or detailed proposal.

### Your First Code Contribution

Unsure where to begin?
-   Look for issues tagged `good first issue` or `help wanted`.
-   Feel free to ask on an existing issue if you can take it on.
-   Start with smaller changes to get familiar with the codebase.

### Pull Requests

We use Pull Requests (PRs) for all code changes.

1.  **Fork the repository** and create your branch from `main` (or the relevant development branch).
    -   Branch naming convention: `feature/your-feature-name` or `fix/bug-description`.
2.  **Make your changes** locally.
3.  **Ensure your code lints and formats correctly:** Run `npm run format`.
4.  **Add tests** for any new functionality or bug fixes. Ensure all tests pass: `npm run test`.
5.  **Commit your changes** using a descriptive commit message (see [Git Commit Messages](#git-commit-messages)).
6.  **Push your branch** to your fork.
7.  **Open a Pull Request** against the `main` branch of the `talvinder/carrot-ai-pm` repository.
    -   Provide a clear title and description for your PR.
    -   Link to any relevant issues (e.g., "Closes #123").
    -   Explain the changes you've made and why.
    -   Be prepared for a code review and be responsive to feedback.

## Development Setup

### Prerequisites

-   Node.js (v18+ recommended)
-   npm (comes with Node.js)
-   Git
-   Python (v3.8+ for tools that interact with Python projects)
-   `ripgrep` (for the `search_code` tool)

### Installation

1.  Fork the repository: `https://github.com/talvinder/carrot-ai-pm.git`
2.  Clone your fork: `git clone https://github.com/talvinder/carrot-ai-pm.git`
3.  Navigate to the project directory: `cd carrot-ai-pm`
4.  Install dependencies: `npm install`

### Running the Server for Development

For local development with auto-rebuild on file changes:

1.  In one terminal, start the TypeScript watcher and builder:
    ```bash
    npm run watch
    ```
2.  In another terminal, run the development server (which uses the output from the watch command):
    ```bash
    npm run dev
    ```
This will typically run the server in stdio mode. To test HTTP/SSE mode, you can set the `PORT` environment variable:
```bash
PORT=3000 npm run dev
```

## Styleguides

### Git Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. This helps with automated changelog generation and makes the commit history easier to read.

Examples:
-   `feat: Add SSE transport for remote clients`
-   `fix: Correctly handle empty path array in format_code tool`
-   `docs: Update README with new configuration options`
-   `style: Apply Prettier formatting to server.ts`
-   `refactor: Improve error handling in add_route tool`
-   `test: Add unit tests for spec generation logic`
-   `chore: Update npm dependencies`

### TypeScript Styleguide

-   Follow standard TypeScript best practices.
-   Use `ESLint` and `Prettier` for code linting and formatting (configured in the project).
-   Prioritize readability and clarity.
-   Use descriptive variable and function names.
-   Comment complex logic where necessary.

### Code Formatting

We use Prettier and ESLint to enforce consistent code style. Before committing, please run:
```bash
npm run format
```
This will automatically format your code according to the project's standards. Many IDEs can be configured to run this on save.

## Testing

We aim for good test coverage.
-   Write unit tests for new functions and modules.
-   Write integration tests for tool interactions where appropriate.
-   Ensure all tests pass before submitting a PR.

Run tests using:
```bash
npm run test
```
*(This command might be configured to run Jest/Vitest for TypeScript code and potentially invoke Python tests for tools that wrap Python utilities.)*

## Questions?

If you have any questions, feel free to:
-   Open an issue on GitHub.
-   Start a discussion in the GitHub Discussions tab.

Thank you for contributing! Your efforts help make Carrot AI PM better.