export interface PopularAgent {
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
}

export const popularAgents: PopularAgent[] = [
  {
    name: "Code Reviewer",
    description: "Reviews code for bugs, security issues, and best practices",
    icon: "search",
    color: "#8B5CF6",
    category: "Development",
  },
  {
    name: "Test Writer",
    description: "Generates unit and integration tests for your code",
    icon: "flask-conical",
    color: "#10B981",
    category: "Development",
  },
  {
    name: "Documentation Writer",
    description: "Creates clear documentation, READMEs, and API docs",
    icon: "file-text",
    color: "#3B82F6",
    category: "Writing",
  },
  {
    name: "Refactoring Assistant",
    description: "Suggests and applies code improvements and refactoring",
    icon: "wrench",
    color: "#F59E0B",
    category: "Development",
  },
  {
    name: "Bug Fixer",
    description: "Diagnoses and fixes bugs with systematic debugging",
    icon: "bug",
    color: "#EF4444",
    category: "Development",
  },
  {
    name: "API Designer",
    description: "Designs RESTful APIs with schemas, routes, and documentation",
    icon: "globe",
    color: "#06B6D4",
    category: "Architecture",
  },
  {
    name: "Security Auditor",
    description: "Scans code for vulnerabilities and suggests security fixes",
    icon: "shield",
    color: "#DC2626",
    category: "Security",
  },
  {
    name: "Performance Optimizer",
    description: "Identifies bottlenecks and optimizes code performance",
    icon: "zap",
    color: "#F97316",
    category: "Development",
  },
  {
    name: "Git Assistant",
    description: "Helps with git workflows, commits, branches, and PRs",
    icon: "git-branch",
    color: "#6366F1",
    category: "DevOps",
  },
  {
    name: "Database Expert",
    description: "Designs schemas, writes queries, and optimizes databases",
    icon: "database",
    color: "#0EA5E9",
    category: "Architecture",
  },
  {
    name: "TypeScript Helper",
    description: "Helps with TypeScript types, generics, and best practices",
    icon: "code",
    color: "#3178C6",
    category: "Development",
  },
  {
    name: "Accessibility Checker",
    description: "Audits UI components for WCAG compliance and accessibility",
    icon: "eye",
    color: "#8B5CF6",
    category: "Design",
  },
  {
    name: "Migration Assistant",
    description: "Helps migrate codebases between frameworks or versions",
    icon: "arrow-right-left",
    color: "#14B8A6",
    category: "Development",
  },
  {
    name: "DevOps Helper",
    description: "Sets up CI/CD pipelines, Docker configs, and deployment",
    icon: "server",
    color: "#64748B",
    category: "DevOps",
  },
  {
    name: "Code Explainer",
    description: "Explains complex code in simple, beginner-friendly language",
    icon: "message-circle",
    color: "#A855F7",
    category: "Learning",
  },
];
