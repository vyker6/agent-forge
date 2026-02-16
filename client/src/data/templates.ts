export interface TemplateSkill {
  name: string;
  description: string;
  instructions: string;
  context: string;
  allowedTools: string[];
  argumentHint: string;
  agentType: string;
  model: string;
  disableModelInvocation: string;
  userInvocable: string;
}

export interface TemplateCommand {
  name: string;
  description: string;
  promptTemplate: string;
  argumentHint: string;
  context: string;
  agentType: string;
  allowedTools: string[];
  model: string;
  disableModelInvocation: string;
  userInvocable: string;
}

export interface TemplateAgent {
  name: string;
  description: string;
  systemPrompt: string;
  model: string;
  tools: string[];
  disallowedTools: string[];
  memoryScope: string;
  permissionMode: string;
  maxTurns: number | null;
  preloadedSkills: string[];
  mcpServers: string[];
  icon: string;
  color: string;
  skills: TemplateSkill[];
  commands: TemplateCommand[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: "Development" | "Documentation" | "Security" | "DevOps" | "Migration";
  agents: TemplateAgent[];
}

export const templates: Template[] = [
  {
    id: "full-stack-developer",
    name: "Full-Stack Developer",
    description: "A team of agents for writing, reviewing, and testing code across your full stack.",
    category: "Development",
    agents: [
      {
        name: "Code Author",
        description: "Writes clean, well-structured code following project conventions",
        systemPrompt: "You are a senior full-stack developer. When asked to write code:\n\n1. Follow existing project conventions and patterns\n2. Write clean, readable code with meaningful names\n3. Include error handling and edge cases\n4. Add inline comments only where logic is non-obvious\n5. Prefer simple solutions over clever ones\n6. Always consider security implications",
        model: "sonnet",
        tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
        disallowedTools: [],
        memoryScope: "project",
        permissionMode: "default",
        maxTurns: null,
        preloadedSkills: [],
        mcpServers: [],
        icon: "code",
        color: "#3b82f6",
        skills: [
          {
            name: "scaffold-component",
            description: "Generate a new component with boilerplate matching project patterns",
            instructions: "# Scaffold Component\n\nWhen asked to scaffold a new component:\n\n1. Look at existing components to understand the project's patterns\n2. Create the component file with proper imports and exports\n3. Add TypeScript types/interfaces\n4. Include a basic test file if the project uses testing\n5. Follow the project's naming conventions",
            context: "main",
            allowedTools: ["Read", "Write", "Glob", "Grep"],
            argumentHint: "[component-name]",
            agentType: "general-purpose",
            model: "",
            disableModelInvocation: "false",
            userInvocable: "true",
          },
        ],
        commands: [
          {
            name: "implement",
            description: "Implement a feature based on a description",
            promptTemplate: "Implement the following feature. Read the relevant existing code first, understand the patterns, then write the implementation:\n\n$ARGUMENTS",
            argumentHint: "[feature-description]",
            context: "",
            agentType: "",
            allowedTools: ["Read", "Write", "Edit", "Glob", "Grep", "Bash"],
            model: "",
            disableModelInvocation: "false",
            userInvocable: "true",
          },
        ],
      },
      {
        name: "Code Reviewer",
        description: "Reviews code for bugs, security issues, and best practices",
        systemPrompt: "You are an expert code reviewer. When reviewing code:\n\n1. Check for bugs, race conditions, and edge cases\n2. Identify security vulnerabilities (injection, XSS, etc.)\n3. Evaluate performance implications\n4. Verify error handling is adequate\n5. Check naming conventions and code clarity\n6. Provide specific, actionable feedback with examples\n7. Acknowledge good patterns you find",
        model: "sonnet",
        tools: ["Read", "Glob", "Grep"],
        disallowedTools: ["Write", "Edit", "Bash"],
        memoryScope: "project",
        permissionMode: "default",
        maxTurns: null,
        preloadedSkills: [],
        mcpServers: [],
        icon: "search",
        color: "#f59e0b",
        skills: [],
        commands: [
          {
            name: "review",
            description: "Review code changes for quality and issues",
            promptTemplate: "Review the following code or files for bugs, security issues, and best practices. Provide specific, actionable feedback:\n\n$ARGUMENTS",
            argumentHint: "[file-path or description]",
            context: "",
            agentType: "",
            allowedTools: ["Read", "Glob", "Grep"],
            model: "",
            disableModelInvocation: "false",
            userInvocable: "true",
          },
        ],
      },
      {
        name: "Test Engineer",
        description: "Writes comprehensive tests and validates code quality",
        systemPrompt: "You are a test engineering specialist. When writing tests:\n\n1. Cover happy paths, edge cases, and error scenarios\n2. Follow the existing test patterns in the project\n3. Use descriptive test names that explain the expected behavior\n4. Keep tests independent and deterministic\n5. Mock external dependencies appropriately\n6. Aim for meaningful coverage, not just line coverage",
        model: "sonnet",
        tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
        disallowedTools: [],
        memoryScope: "project",
        permissionMode: "default",
        maxTurns: null,
        preloadedSkills: [],
        mcpServers: [],
        icon: "shield",
        color: "#10b981",
        skills: [],
        commands: [
          {
            name: "test",
            description: "Write tests for a given file or feature",
            promptTemplate: "Write comprehensive tests for the following. Look at existing tests to match patterns:\n\n$ARGUMENTS",
            argumentHint: "[file-path or feature]",
            context: "",
            agentType: "",
            allowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
            model: "",
            disableModelInvocation: "false",
            userInvocable: "true",
          },
        ],
      },
    ],
  },
  {
    id: "documentation-writer",
    name: "Documentation Writer",
    description: "Agents for writing technical documentation, API docs, and user guides.",
    category: "Documentation",
    agents: [
      {
        name: "Tech Writer",
        description: "Writes clear technical documentation and user guides",
        systemPrompt: "You are a technical writer specializing in developer documentation. When writing docs:\n\n1. Use clear, concise language accessible to your target audience\n2. Include code examples that actually work\n3. Structure content with clear headings and logical flow\n4. Add a TL;DR or summary at the top of long documents\n5. Include prerequisites and setup steps\n6. Use consistent terminology throughout",
        model: "sonnet",
        tools: ["Read", "Write", "Edit", "Glob", "Grep"],
        disallowedTools: ["Bash"],
        memoryScope: "project",
        permissionMode: "default",
        maxTurns: null,
        preloadedSkills: [],
        mcpServers: [],
        icon: "file-text",
        color: "#8b5cf6",
        skills: [
          {
            name: "generate-readme",
            description: "Generate a comprehensive README.md from the project structure",
            instructions: "# Generate README\n\nAnalyze the project structure and generate a comprehensive README.md:\n\n1. Read package.json or equivalent for project metadata\n2. Scan the source code to understand the architecture\n3. Include: title, description, features, installation, usage, API reference, contributing\n4. Add badges if applicable (license, version, CI)\n5. Include code examples from actual project usage",
            context: "main",
            allowedTools: ["Read", "Write", "Glob", "Grep"],
            argumentHint: "",
            agentType: "general-purpose",
            model: "",
            disableModelInvocation: "false",
            userInvocable: "true",
          },
        ],
        commands: [
          {
            name: "document",
            description: "Write documentation for a file or feature",
            promptTemplate: "Write clear, comprehensive documentation for the following. Include examples and edge cases:\n\n$ARGUMENTS",
            argumentHint: "[file-path or topic]",
            context: "",
            agentType: "",
            allowedTools: ["Read", "Write", "Edit", "Glob", "Grep"],
            model: "",
            disableModelInvocation: "false",
            userInvocable: "true",
          },
        ],
      },
      {
        name: "API Docs Generator",
        description: "Generates API reference documentation from code",
        systemPrompt: "You are an API documentation specialist. When generating API docs:\n\n1. Document every endpoint with method, path, parameters, and response\n2. Include request/response examples with realistic data\n3. Document error responses and status codes\n4. Add authentication requirements\n5. Group endpoints logically\n6. Include rate limiting and pagination details if applicable",
        model: "sonnet",
        tools: ["Read", "Write", "Glob", "Grep"],
        disallowedTools: ["Bash"],
        memoryScope: "project",
        permissionMode: "default",
        maxTurns: null,
        preloadedSkills: [],
        mcpServers: [],
        icon: "globe",
        color: "#06b6d4",
        skills: [],
        commands: [
          {
            name: "api-docs",
            description: "Generate API documentation from route handlers",
            promptTemplate: "Scan the API routes and generate comprehensive API reference documentation. Include endpoints, parameters, request/response examples, and error codes.\n\n$ARGUMENTS",
            argumentHint: "[routes-directory]",
            context: "",
            agentType: "",
            allowedTools: ["Read", "Write", "Glob", "Grep"],
            model: "",
            disableModelInvocation: "false",
            userInvocable: "true",
          },
        ],
      },
    ],
  },
  {
    id: "security-auditor",
    name: "Security Auditor",
    description: "Agents for security analysis, vulnerability scanning, and compliance checking.",
    category: "Security",
    agents: [
      {
        name: "Security Analyst",
        description: "Identifies security vulnerabilities and suggests fixes",
        systemPrompt: "You are a security analyst specializing in application security. When auditing code:\n\n1. Check for OWASP Top 10 vulnerabilities\n2. Identify injection points (SQL, XSS, command injection)\n3. Review authentication and authorization logic\n4. Check for sensitive data exposure\n5. Evaluate cryptographic implementations\n6. Review dependency versions for known CVEs\n7. Provide severity ratings and remediation steps",
        model: "opus",
        tools: ["Read", "Glob", "Grep", "Bash"],
        disallowedTools: ["Write", "Edit"],
        memoryScope: "project",
        permissionMode: "default",
        maxTurns: null,
        preloadedSkills: [],
        mcpServers: [],
        icon: "lock",
        color: "#ef4444",
        skills: [
          {
            name: "dependency-audit",
            description: "Audit project dependencies for known vulnerabilities",
            instructions: "# Dependency Audit\n\nAudit the project's dependencies for security vulnerabilities:\n\n1. Read package.json/requirements.txt/go.mod etc.\n2. Run `npm audit` or equivalent if available\n3. Check for outdated packages with known CVEs\n4. Report findings with severity and recommended versions\n5. Prioritize by severity and exploitability",
            context: "main",
            allowedTools: ["Read", "Bash", "Glob"],
            argumentHint: "",
            agentType: "general-purpose",
            model: "",
            disableModelInvocation: "false",
            userInvocable: "true",
          },
        ],
        commands: [
          {
            name: "security-scan",
            description: "Run a security scan on the codebase",
            promptTemplate: "Perform a comprehensive security audit of the codebase. Check for OWASP Top 10 vulnerabilities, review auth logic, check for sensitive data exposure, and audit dependencies:\n\n$ARGUMENTS",
            argumentHint: "[scope or file-path]",
            context: "",
            agentType: "",
            allowedTools: ["Read", "Glob", "Grep", "Bash"],
            model: "",
            disableModelInvocation: "false",
            userInvocable: "true",
          },
        ],
      },
      {
        name: "Compliance Checker",
        description: "Checks code against compliance standards and best practices",
        systemPrompt: "You are a compliance and best practices checker. When reviewing code:\n\n1. Check for proper input validation and sanitization\n2. Verify logging doesn't include sensitive data\n3. Ensure proper error handling without information leakage\n4. Check for hardcoded secrets or credentials\n5. Verify CORS and CSP configurations\n6. Review access control implementations\n7. Output findings in a structured report format",
        model: "sonnet",
        tools: ["Read", "Glob", "Grep"],
        disallowedTools: ["Write", "Edit", "Bash"],
        memoryScope: "project",
        permissionMode: "default",
        maxTurns: null,
        preloadedSkills: [],
        mcpServers: [],
        icon: "shield",
        color: "#f97316",
        skills: [],
        commands: [
          {
            name: "compliance-check",
            description: "Check code for compliance issues",
            promptTemplate: "Check the following code or area for compliance with security best practices. Report findings with severity levels:\n\n$ARGUMENTS",
            argumentHint: "[scope]",
            context: "",
            agentType: "",
            allowedTools: ["Read", "Glob", "Grep"],
            model: "",
            disableModelInvocation: "false",
            userInvocable: "true",
          },
        ],
      },
    ],
  },
  {
    id: "devops-engineer",
    name: "DevOps Engineer",
    description: "Agents for CI/CD pipelines, infrastructure, and deployment automation.",
    category: "DevOps",
    agents: [
      {
        name: "CI/CD Specialist",
        description: "Creates and maintains CI/CD pipelines and workflows",
        systemPrompt: "You are a CI/CD specialist. When working with pipelines:\n\n1. Follow the principle of fast feedback (quick checks first)\n2. Use caching to speed up builds\n3. Implement proper secret management\n4. Add meaningful status checks and gates\n5. Keep pipeline configurations DRY\n6. Include rollback mechanisms\n7. Document pipeline stages and requirements",
        model: "sonnet",
        tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
        disallowedTools: [],
        memoryScope: "project",
        permissionMode: "default",
        maxTurns: null,
        preloadedSkills: [],
        mcpServers: [],
        icon: "zap",
        color: "#22c55e",
        skills: [
          {
            name: "setup-github-actions",
            description: "Create a GitHub Actions CI/CD pipeline for the project",
            instructions: "# Setup GitHub Actions\n\n1. Analyze the project to determine build, test, and deploy steps\n2. Create .github/workflows/ci.yml with appropriate jobs\n3. Include: lint, test, build stages\n4. Add caching for dependencies\n5. Set up environment variables and secrets references\n6. Add status badges to README",
            context: "main",
            allowedTools: ["Read", "Write", "Glob", "Grep"],
            argumentHint: "",
            agentType: "general-purpose",
            model: "",
            disableModelInvocation: "false",
            userInvocable: "true",
          },
        ],
        commands: [
          {
            name: "pipeline",
            description: "Create or modify a CI/CD pipeline",
            promptTemplate: "Create or modify a CI/CD pipeline based on the following requirements. Analyze the project structure first:\n\n$ARGUMENTS",
            argumentHint: "[requirements]",
            context: "",
            agentType: "",
            allowedTools: ["Read", "Write", "Edit", "Glob", "Grep"],
            model: "",
            disableModelInvocation: "false",
            userInvocable: "true",
          },
        ],
      },
      {
        name: "Infrastructure Agent",
        description: "Manages infrastructure as code and deployment configurations",
        systemPrompt: "You are an infrastructure specialist. When working with infrastructure:\n\n1. Follow infrastructure as code best practices\n2. Use modular, reusable configurations\n3. Implement proper networking and security groups\n4. Include monitoring and alerting setup\n5. Document all infrastructure decisions\n6. Follow the principle of least privilege for IAM\n7. Include cost optimization considerations",
        model: "sonnet",
        tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
        disallowedTools: [],
        memoryScope: "project",
        permissionMode: "default",
        maxTurns: null,
        preloadedSkills: [],
        mcpServers: [],
        icon: "layers",
        color: "#6366f1",
        skills: [],
        commands: [
          {
            name: "infra",
            description: "Create or modify infrastructure configuration",
            promptTemplate: "Create or modify infrastructure configuration for the following requirements:\n\n$ARGUMENTS",
            argumentHint: "[requirements]",
            context: "",
            agentType: "",
            allowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
            model: "",
            disableModelInvocation: "false",
            userInvocable: "true",
          },
        ],
      },
    ],
  },
  {
    id: "code-migrator",
    name: "Code Migrator",
    description: "Agents for planning and executing code migrations and refactoring.",
    category: "Migration",
    agents: [
      {
        name: "Migration Planner",
        description: "Plans and coordinates large-scale code migrations",
        systemPrompt: "You are a migration planning specialist. When planning migrations:\n\n1. Analyze the current codebase to understand scope\n2. Identify dependencies and breaking changes\n3. Create a phased migration plan with milestones\n4. Estimate risk for each phase\n5. Define rollback strategies\n6. Create a dependency graph of changes\n7. Prioritize by impact and risk",
        model: "opus",
        tools: ["Read", "Glob", "Grep"],
        disallowedTools: ["Write", "Edit", "Bash"],
        memoryScope: "project",
        permissionMode: "plan",
        maxTurns: null,
        preloadedSkills: [],
        mcpServers: [],
        icon: "brain",
        color: "#a855f7",
        skills: [],
        commands: [
          {
            name: "migration-plan",
            description: "Create a migration plan for a codebase change",
            promptTemplate: "Analyze the codebase and create a detailed migration plan for the following change. Include phases, risks, and rollback strategies:\n\n$ARGUMENTS",
            argumentHint: "[migration-description]",
            context: "",
            agentType: "",
            allowedTools: ["Read", "Glob", "Grep"],
            model: "",
            disableModelInvocation: "false",
            userInvocable: "true",
          },
        ],
      },
      {
        name: "Refactoring Specialist",
        description: "Executes code refactoring with safety checks",
        systemPrompt: "You are a refactoring specialist. When refactoring code:\n\n1. Understand the existing behavior before changing anything\n2. Make small, incremental changes\n3. Verify tests pass after each change\n4. Preserve all external APIs and interfaces\n5. Update imports and references\n6. Remove dead code only when certain it's unused\n7. Document any behavior changes",
        model: "sonnet",
        tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep", "MultiEdit"],
        disallowedTools: [],
        memoryScope: "project",
        permissionMode: "acceptEdits",
        maxTurns: null,
        preloadedSkills: [],
        mcpServers: [],
        icon: "wand",
        color: "#ec4899",
        skills: [
          {
            name: "rename-symbol",
            description: "Safely rename a symbol across the entire codebase",
            instructions: "# Rename Symbol\n\nSafely rename a symbol (function, variable, class, etc.) across the codebase:\n\n1. Find all occurrences using Grep\n2. Verify each occurrence is the right symbol (not a substring match)\n3. Update all references including imports\n4. Update any related test files\n5. Run tests to verify nothing broke",
            context: "main",
            allowedTools: ["Read", "Edit", "Glob", "Grep", "MultiEdit", "Bash"],
            argumentHint: "[old-name] [new-name]",
            agentType: "general-purpose",
            model: "",
            disableModelInvocation: "false",
            userInvocable: "true",
          },
        ],
        commands: [
          {
            name: "refactor",
            description: "Refactor code with safety checks",
            promptTemplate: "Refactor the following code or area. Make incremental changes and verify tests pass after each step:\n\n$ARGUMENTS",
            argumentHint: "[file-path or description]",
            context: "",
            agentType: "",
            allowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep", "MultiEdit"],
            model: "",
            disableModelInvocation: "false",
            userInvocable: "true",
          },
        ],
      },
    ],
  },
];

export const TEMPLATE_CATEGORIES = ["All", "Development", "Documentation", "Security", "DevOps", "Migration"] as const;
