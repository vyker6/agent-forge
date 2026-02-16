import { storage } from "./storage";

export async function seedDatabase() {
  const existing = await storage.getAgents();
  if (existing.length > 0) return;

  const codeReviewer = await storage.createAgent({
    name: "Code Reviewer",
    description: "Reviews code for quality, security vulnerabilities, and best practices",
    systemPrompt: `You are a meticulous code reviewer. Analyze code and provide specific, actionable feedback on:

- Code quality and readability
- Security vulnerabilities and potential exploits
- Performance bottlenecks and optimization opportunities
- Best practices and design patterns
- Error handling and edge cases

Always reference specific line numbers and provide concrete improvement suggestions. Be thorough but constructive.`,
    model: "sonnet",
    tools: ["Read", "Glob", "Grep"],
    disallowedTools: ["Write", "Edit"],
    memoryScope: "project",
    permissionMode: "acceptEdits",
    maxTurns: 20,
    icon: "shield",
    color: "#8b5cf6",
  });

  const architect = await storage.createAgent({
    name: "Architect",
    description: "Designs system architecture and provides strategic technical guidance",
    systemPrompt: `You are a senior software architect. Your role is to:

- Analyze existing system architecture and identify improvements
- Design scalable, maintainable system designs
- Evaluate technology choices and recommend alternatives
- Create architecture decision records (ADRs)
- Review designs for SOLID principles, DRY, and clean architecture

Focus on high-level design rather than implementation details. Consider scalability, maintainability, and team workflow.`,
    model: "opus",
    tools: ["Read", "Glob", "Grep", "Bash"],
    memoryScope: "user",
    permissionMode: "plan",
    maxTurns: 50,
    icon: "layers",
    color: "#3b82f6",
  });

  const testWriter = await storage.createAgent({
    name: "Test Engineer",
    description: "Writes comprehensive test suites with edge cases and mocks",
    systemPrompt: `You are a test engineering specialist. Your responsibilities include:

- Writing unit tests with proper isolation and mocking
- Creating integration tests for API endpoints
- Designing E2E test scenarios for critical user flows
- Ensuring high code coverage with meaningful tests
- Writing test fixtures and factory functions

Use the project's existing test framework. Focus on testing behavior, not implementation details.`,
    model: "sonnet",
    tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
    memoryScope: "project",
    permissionMode: "acceptEdits",
    icon: "terminal",
    color: "#22c55e",
  });

  await storage.createSkill({
    agentId: codeReviewer.id,
    name: "security-audit",
    description: "Perform a thorough security audit of the codebase",
    instructions: `# Security Audit Skill

## Process
1. Scan for hardcoded secrets and credentials
2. Check for SQL injection vulnerabilities
3. Verify input validation and sanitization
4. Review authentication and authorization logic
5. Check for XSS and CSRF vulnerabilities
6. Verify proper error handling (no stack traces in production)

## Output Format
Provide findings as a severity-ranked list with remediation steps.`,
    context: "fork",
    allowedTools: ["Read", "Grep", "Glob"],
    argumentHint: "[file-path]",
  });

  await storage.createSkill({
    agentId: architect.id,
    name: "adr-writer",
    description: "Create Architecture Decision Records for important technical decisions",
    instructions: `# ADR Writer Skill

## Template
Use the following format for each ADR:

# ADR-{number}: {title}

## Status
Proposed | Accepted | Deprecated | Superseded

## Context
What is the issue that is motivating this decision?

## Decision
What is the change that we're proposing and/or doing?

## Consequences
What becomes easier or more difficult to do because of this change?`,
    context: "main",
    allowedTools: ["Read", "Write"],
    argumentHint: "[topic]",
  });

  await storage.createCommand({
    agentId: codeReviewer.id,
    name: "review-pr",
    description: "Review the current PR for code quality issues",
    promptTemplate: `Review the changes in this PR. Focus on:
1. Code correctness and potential bugs
2. Security implications
3. Performance concerns
4. Code style and consistency
5. Test coverage

Provide a summary with severity ratings (critical/major/minor) for each finding.`,
    argumentHint: "[PR-number]",
  });

  await storage.createCommand({
    agentId: testWriter.id,
    name: "generate-tests",
    description: "Generate tests for the specified file or function",
    promptTemplate: `Generate comprehensive tests for the specified code. Include:
- Happy path tests
- Edge cases and boundary conditions
- Error handling scenarios
- Mock setup for external dependencies

Use descriptive test names that explain the expected behavior.`,
    argumentHint: "[file-path]",
    context: "fork",
  });

  await storage.createFileMapEntry({
    agentId: codeReviewer.id,
    path: "src/",
    description: "Main source code directory",
    entryType: "directory",
    sortOrder: 0,
  });

  await storage.createFileMapEntry({
    agentId: codeReviewer.id,
    path: "src/components/",
    description: "React UI components",
    entryType: "directory",
    sortOrder: 1,
  });

  await storage.createFileMapEntry({
    agentId: codeReviewer.id,
    path: "src/api/",
    description: "API route handlers and middleware",
    entryType: "directory",
    sortOrder: 2,
  });

  await storage.createFileMapEntry({
    agentId: codeReviewer.id,
    path: "package.json",
    description: "Dependencies and scripts",
    entryType: "file",
    sortOrder: 3,
  });

  const project = await storage.createProject({
    name: "Starter Web App",
    description: "A standard web application project with code review and testing agents",
    claudeMdContent: `# Starter Web App

## Overview
A full-stack web application with React frontend and Express backend.

## Architecture
- Frontend: React + TypeScript + Vite
- Backend: Express + PostgreSQL
- Testing: Jest + Playwright

## Conventions
- Use TypeScript strict mode
- Follow ESLint recommended rules
- Use conventional commits`,
  });

  await storage.addProjectAgent({ projectId: project.id, agentId: codeReviewer.id });
  await storage.addProjectAgent({ projectId: project.id, agentId: architect.id });
  await storage.addProjectAgent({ projectId: project.id, agentId: testWriter.id });

  // Rules
  await storage.createRule({
    projectId: project.id,
    name: "TypeScript Conventions",
    paths: ["src/**/*.ts", "src/**/*.tsx"],
    content: `## TypeScript Conventions

- Use strict mode with all strict compiler options enabled
- Prefer \`interface\` over \`type\` for object shapes
- Use explicit return types on exported functions
- Prefer \`const\` assertions for literal types
- Use barrel exports (index.ts) for module boundaries
- Avoid \`any\` — use \`unknown\` and narrow with type guards`,
    sortOrder: 0,
  });

  await storage.createRule({
    projectId: project.id,
    name: "Testing Standards",
    paths: ["tests/**"],
    content: `## Testing Standards

- Use descriptive test names: "should [expected behavior] when [condition]"
- One assertion per test when practical
- Use factories/fixtures instead of inline test data
- Mock external dependencies at the boundary
- Aim for >80% branch coverage on business logic`,
    sortOrder: 1,
  });

  // Project Settings
  await storage.upsertProjectSettings(project.id, {
    permissionAllow: ["Read", "Glob", "Grep"],
    defaultModel: "sonnet",
  });

  // Hooks
  await storage.createHook({
    projectId: project.id,
    event: "PreToolUse",
    matcher: "Bash(git commit*)",
    handlerType: "command",
    command: "npm run lint",
    statusMessage: "Running linter...",
    sortOrder: 0,
  });

  await storage.createHook({
    projectId: project.id,
    event: "PreToolUse",
    matcher: "Bash(git push*)",
    handlerType: "command",
    command: "npx tsc --noEmit",
    statusMessage: "Type-checking...",
    sortOrder: 1,
  });

  console.log("Database seeded successfully");
}
