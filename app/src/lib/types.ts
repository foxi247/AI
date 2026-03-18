export type AIRole = 'planner' | 'coder' | 'architect' | 'reviewer' | 'fullstack'

export interface AIAgent {
  id: string
  name: string
  provider: string
  model: string
  apiKey: string
  role: AIRole
  baseUrl?: string
  enabled: boolean
  systemPrompt?: string
}

export interface PlanItem {
  text: string
  done: boolean
}

export interface ToolCallEvent {
  id: string
  name: string
  args: Record<string, string>
  result?: string
  status: 'running' | 'done' | 'error'
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  agentId?: string
  agentName?: string
  agentRole?: AIRole
  planItems?: PlanItem[]
  toolCallEvents?: ToolCallEvent[]
  timestamp: Date
  isStreaming?: boolean
}

export interface ProjectFile {
  id: string
  name: string
  path: string
  content: string
  language: string
}

export interface Project {
  id: string
  name: string
  description: string
  createdAt: Date
  updatedAt: Date
  files: ProjectFile[]
  isPublic: boolean
  deployUrl?: string
}

export const AI_ROLES: Record<AIRole, { label: string; description: string; color: string; systemPrompt: string }> = {
  planner: {
    label: 'Planner',
    description: 'Планирует архитектуру и разбивает задачи',
    color: '#f59e0b',
    systemPrompt: `You are a software project planner and architect. Your role is to:
- Analyze requirements and break them into actionable tasks
- Design project structure and architecture
- Define which files need to be created and their purpose
- Plan the development roadmap
- Coordinate between other AI agents
Always respond in a structured, organized manner. When given a task, create a clear plan before any implementation.`,
  },
  coder: {
    label: 'Coder',
    description: 'Пишет и изменяет код',
    color: '#10b981',
    systemPrompt: `You are an expert software engineer and coder. Your role is to:
- Write clean, efficient, production-ready code
- Implement features based on requirements
- Follow best practices and design patterns
- Generate complete file contents when requested
- Fix bugs and optimize code
When generating code, always provide complete file contents wrapped in proper code blocks with file paths.`,
  },
  architect: {
    label: 'Architect',
    description: 'Проектирует системы и структуры',
    color: '#06b6d4',
    systemPrompt: `You are a software architect. Your role is to:
- Design scalable system architectures
- Define API contracts and data models
- Evaluate technical trade-offs
- Ensure code quality and maintainability
- Review architectural decisions
Focus on big-picture thinking while providing actionable guidance.`,
  },
  reviewer: {
    label: 'Reviewer',
    description: 'Ревьюит и улучшает код',
    color: '#ec4899',
    systemPrompt: `You are a senior code reviewer. Your role is to:
- Review code for bugs, security issues, and performance problems
- Suggest improvements and best practices
- Identify potential edge cases
- Ensure code consistency and readability
- Provide constructive, actionable feedback
Be thorough but concise in your reviews.`,
  },
  fullstack: {
    label: 'Fullstack',
    description: 'Универсальный разработчик',
    color: '#7c3aed',
    systemPrompt: `You are an expert fullstack developer with deep knowledge of:
- Frontend (React, Next.js, TypeScript, CSS)
- Backend (Node.js, Python, APIs, databases)
- DevOps (Docker, CI/CD, deployment)
- UI/UX design principles

Your role is to help build complete web applications. When asked to create or modify code:
1. Understand the requirement fully
2. Generate complete, working code
3. Include all necessary files
4. Explain what you built

Always provide complete file contents in code blocks with the format:
\`\`\`typescript:path/to/file.ts
// code here
\`\`\``,
  },
}

export const POPULAR_MODELS = [
  // Paid models
  { provider: 'Mistral', model: 'codestral-latest', name: 'Codestral', baseUrl: 'https://codestral.mistral.ai/v1' },
  { provider: 'Mistral', model: 'mistral-large-latest', name: 'Mistral Large', baseUrl: 'https://api.mistral.ai/v1' },
  { provider: 'OpenAI', model: 'gpt-4o', name: 'GPT-4o', baseUrl: 'https://api.openai.com/v1' },
  { provider: 'OpenAI', model: 'gpt-4o-mini', name: 'GPT-4o Mini', baseUrl: 'https://api.openai.com/v1' },
  { provider: 'Anthropic', model: 'claude-opus-4-6', name: 'Claude Opus 4.6', baseUrl: 'https://api.anthropic.com/v1' },
  { provider: 'Anthropic', model: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', baseUrl: 'https://api.anthropic.com/v1' },
  { provider: 'Google', model: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', baseUrl: 'https://generativelanguage.googleapis.com/v1beta' },
  { provider: 'Groq', model: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B', baseUrl: 'https://api.groq.com/openai/v1' },
  // OpenRouter — Free models (requires openrouter.ai API key)
  { provider: 'OpenRouter', model: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1', baseUrl: 'https://openrouter.ai/api/v1', isFree: true },
  { provider: 'OpenRouter', model: 'deepseek/deepseek-chat-v3-0324:free', name: 'DeepSeek V3', baseUrl: 'https://openrouter.ai/api/v1', isFree: true },
  { provider: 'OpenRouter', model: 'meta-llama/llama-4-maverick:free', name: 'Llama 4 Maverick', baseUrl: 'https://openrouter.ai/api/v1', isFree: true },
  { provider: 'OpenRouter', model: 'meta-llama/llama-4-scout:free', name: 'Llama 4 Scout', baseUrl: 'https://openrouter.ai/api/v1', isFree: true },
  { provider: 'OpenRouter', model: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B', baseUrl: 'https://openrouter.ai/api/v1', isFree: true },
  { provider: 'OpenRouter', model: 'google/gemini-2.5-pro-exp-03-25:free', name: 'Gemini 2.5 Pro', baseUrl: 'https://openrouter.ai/api/v1', isFree: true },
  { provider: 'OpenRouter', model: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash', baseUrl: 'https://openrouter.ai/api/v1', isFree: true },
  { provider: 'OpenRouter', model: 'google/gemma-3-27b-it:free', name: 'Gemma 3 27B', baseUrl: 'https://openrouter.ai/api/v1', isFree: true },
  { provider: 'OpenRouter', model: 'mistralai/mistral-small-3.1-24b-instruct:free', name: 'Mistral Small 3.1', baseUrl: 'https://openrouter.ai/api/v1', isFree: true },
  { provider: 'OpenRouter', model: 'qwen/qwen2.5-coder-32b-instruct:free', name: 'Qwen 2.5 Coder 32B', baseUrl: 'https://openrouter.ai/api/v1', isFree: true },
  { provider: 'OpenRouter', model: 'nvidia/llama-3.1-nemotron-nano-8b-v1:free', name: 'Nemotron Nano 8B', baseUrl: 'https://openrouter.ai/api/v1', isFree: true },
  { provider: 'OpenRouter', model: 'mistralai/devstral-small:free', name: 'Devstral Small', baseUrl: 'https://openrouter.ai/api/v1', isFree: true },
]
