export interface CommunitySkill {
  name: string;
  slug: string;
  description: string;
  category: string;
  repo: { owner: string; name: string; label: string };
}

const anthropics = { owner: "anthropics", name: "skills", label: "anthropics/skills" };
const obra = { owner: "obra", name: "superpowers", label: "obra/superpowers" };
const trailofbits = { owner: "trailofbits", name: "skills", label: "trailofbits/skills" };

export const communitySkills: CommunitySkill[] = [
  // anthropics/skills (16)
  { name: "Algorithmic Art", slug: "algorithmic-art", description: "Generate algorithmic and generative art with code", category: "Creative", repo: anthropics },
  { name: "Brand Guidelines", slug: "brand-guidelines", description: "Create and enforce brand identity guidelines", category: "Design", repo: anthropics },
  { name: "Canvas Design", slug: "canvas-design", description: "Design interactive canvas-based visualizations", category: "Creative", repo: anthropics },
  { name: "Doc Co-authoring", slug: "doc-coauthoring", description: "Collaboratively write and edit documents", category: "Documentation", repo: anthropics },
  { name: "DOCX Export", slug: "docx", description: "Generate and manipulate Word documents", category: "Export", repo: anthropics },
  { name: "Frontend Design", slug: "frontend-design", description: "Create polished, production-grade frontend interfaces", category: "Frontend", repo: anthropics },
  { name: "Internal Comms", slug: "internal-comms", description: "Draft internal communications and announcements", category: "Writing", repo: anthropics },
  { name: "MCP Builder", slug: "mcp-builder", description: "Build Model Context Protocol servers and tools", category: "Development", repo: anthropics },
  { name: "PDF Generation", slug: "pdf", description: "Generate and manipulate PDF documents", category: "Export", repo: anthropics },
  { name: "PPTX Export", slug: "pptx", description: "Generate PowerPoint presentations", category: "Export", repo: anthropics },
  { name: "Skill Creator", slug: "skill-creator", description: "Create new Claude Code skills from scratch", category: "Development", repo: anthropics },
  { name: "Slack GIF Creator", slug: "slack-gif-creator", description: "Create animated GIFs for Slack", category: "Creative", repo: anthropics },
  { name: "Theme Factory", slug: "theme-factory", description: "Generate consistent UI themes and design tokens", category: "Design", repo: anthropics },
  { name: "Web Artifacts Builder", slug: "web-artifacts-builder", description: "Build interactive web artifacts and demos", category: "Frontend", repo: anthropics },
  { name: "Webapp Testing", slug: "webapp-testing", description: "Test web applications with automated workflows", category: "Testing", repo: anthropics },
  { name: "XLSX Export", slug: "xlsx", description: "Generate and manipulate Excel spreadsheets", category: "Export", repo: anthropics },

  // obra/superpowers (14)
  { name: "Brainstorming", slug: "brainstorming", description: "Structured creative brainstorming before implementation", category: "Process", repo: obra },
  { name: "Dispatching Parallel Agents", slug: "dispatching-parallel-agents", description: "Coordinate multiple agents working on independent tasks", category: "Process", repo: obra },
  { name: "Executing Plans", slug: "executing-plans", description: "Systematically execute implementation plans with checkpoints", category: "Process", repo: obra },
  { name: "Finishing a Dev Branch", slug: "finishing-a-development-branch", description: "Guide completion of development work with merge/PR options", category: "Process", repo: obra },
  { name: "Receiving Code Review", slug: "receiving-code-review", description: "Process code review feedback with technical rigor", category: "Process", repo: obra },
  { name: "Requesting Code Review", slug: "requesting-code-review", description: "Verify work meets requirements before merging", category: "Process", repo: obra },
  { name: "Subagent-Driven Development", slug: "subagent-driven-development", description: "Execute plans using independent subagent tasks", category: "Process", repo: obra },
  { name: "Systematic Debugging", slug: "systematic-debugging", description: "Methodical debugging with root cause analysis", category: "Debugging", repo: obra },
  { name: "Test-Driven Development", slug: "test-driven-development", description: "Write tests first, then implement to pass them", category: "Testing", repo: obra },
  { name: "Using Git Worktrees", slug: "using-git-worktrees", description: "Create isolated git worktrees for feature work", category: "Git", repo: obra },
  { name: "Using Superpowers", slug: "using-superpowers", description: "Introduction to finding and using skills effectively", category: "Process", repo: obra },
  { name: "Verification Before Completion", slug: "verification-before-completion", description: "Run verification commands before claiming work is done", category: "Process", repo: obra },
  { name: "Writing Plans", slug: "writing-plans", description: "Create detailed implementation plans before coding", category: "Process", repo: obra },
  { name: "Writing Skills", slug: "writing-skills", description: "Create, edit, and verify Claude Code skills", category: "Development", repo: obra },

  // trailofbits/skills (27)
  { name: "Ask Questions if Underspecified", slug: "ask-questions-if-underspecified", description: "Prompt for clarification when requirements are ambiguous", category: "Process", repo: trailofbits },
  { name: "Audit Context Building", slug: "audit-context-building", description: "Build context for security audits systematically", category: "Security", repo: trailofbits },
  { name: "Building Secure Contracts", slug: "building-secure-contracts", description: "Develop smart contracts with security best practices", category: "Security", repo: trailofbits },
  { name: "Burp Suite Project Parser", slug: "burpsuite-project-parser", description: "Parse and analyze Burp Suite project files", category: "Security", repo: trailofbits },
  { name: "Chrome Troubleshooting", slug: "claude-in-chrome-troubleshooting", description: "Troubleshoot Claude in Chrome browser issues", category: "Debugging", repo: trailofbits },
  { name: "Constant Time Analysis", slug: "constant-time-analysis", description: "Analyze code for constant-time execution properties", category: "Security", repo: trailofbits },
  { name: "Culture Index", slug: "culture-index", description: "Assess and improve engineering culture metrics", category: "Process", repo: trailofbits },
  { name: "Debug Buttercup", slug: "debug-buttercup", description: "Debug Buttercup password manager issues", category: "Debugging", repo: trailofbits },
  { name: "Devcontainer Setup", slug: "devcontainer-setup", description: "Configure VS Code devcontainers for development", category: "DevOps", repo: trailofbits },
  { name: "Differential Review", slug: "differential-review", description: "Perform differential security reviews of code changes", category: "Security", repo: trailofbits },
  { name: "DWARF Expert", slug: "dwarf-expert", description: "Analyze DWARF debugging information in binaries", category: "Security", repo: trailofbits },
  { name: "Entry Point Analyzer", slug: "entry-point-analyzer", description: "Identify and analyze application entry points", category: "Security", repo: trailofbits },
  { name: "Firebase APK Scanner", slug: "firebase-apk-scanner", description: "Scan Android APKs for Firebase misconfigurations", category: "Security", repo: trailofbits },
  { name: "GitHub CLI", slug: "gh-cli", description: "Advanced GitHub CLI workflows and automation", category: "DevOps", repo: trailofbits },
  { name: "Git Cleanup", slug: "git-cleanup", description: "Clean up git history, branches, and repository state", category: "Git", repo: trailofbits },
  { name: "Insecure Defaults", slug: "insecure-defaults", description: "Identify insecure default configurations", category: "Security", repo: trailofbits },
  { name: "Modern Python", slug: "modern-python", description: "Apply modern Python best practices and patterns", category: "Development", repo: trailofbits },
  { name: "Property-Based Testing", slug: "property-based-testing", description: "Write property-based tests for thorough coverage", category: "Testing", repo: trailofbits },
  { name: "Second Opinion", slug: "second-opinion", description: "Get a second opinion on code and architectural decisions", category: "Process", repo: trailofbits },
  { name: "Semgrep Rule Creator", slug: "semgrep-rule-creator", description: "Create custom Semgrep rules for static analysis", category: "Security", repo: trailofbits },
  { name: "Semgrep Rule Variant Creator", slug: "semgrep-rule-variant-creator", description: "Create variants of existing Semgrep rules", category: "Security", repo: trailofbits },
  { name: "Sharp Edges", slug: "sharp-edges", description: "Identify dangerous APIs and sharp edges in code", category: "Security", repo: trailofbits },
  { name: "Spec-to-Code Compliance", slug: "spec-to-code-compliance", description: "Verify code implementation matches specifications", category: "Testing", repo: trailofbits },
  { name: "Static Analysis", slug: "static-analysis", description: "Run and configure static analysis tools", category: "Security", repo: trailofbits },
  { name: "Testing Handbook Skills", slug: "testing-handbook-skills", description: "Apply Trail of Bits testing handbook practices", category: "Testing", repo: trailofbits },
  { name: "Variant Analysis", slug: "variant-analysis", description: "Find variants of known vulnerabilities in codebases", category: "Security", repo: trailofbits },
  { name: "YARA Authoring", slug: "yara-authoring", description: "Write YARA rules for malware detection", category: "Security", repo: trailofbits },
];

export const communitySkillCategories = Array.from(new Set(communitySkills.map((s) => s.category))).sort();
