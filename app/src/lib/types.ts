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
  // OpenRouter — Free models (verified via API 2026-03-18, requires openrouter.ai key)
  { provider: 'OpenRouter', model: 'qwen/qwen3-coder:free', name: 'Qwen3 Coder 480B', baseUrl: 'https://openrouter.ai/api/v1', isFree: true },
  { provider: 'OpenRouter', model: 'qwen/qwen3-next-80b-a3b-instruct:free', name: 'Qwen3 Next 80B', baseUrl: 'https://openrouter.ai/api/v1', isFree: true },
  { provider: 'OpenRouter', model: 'qwen/qwen3-4b:free', name: 'Qwen3 4B', baseUrl: 'https://openrouter.ai/api/v1', isFree: true },
  { provider: 'OpenRouter', model: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B', baseUrl: 'https://openrouter.ai/api/v1', isFree: true },
  { provider: 'OpenRouter', model: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B', baseUrl: 'https://openrouter.ai/api/v1', isFree: true },
  { provider: 'OpenRouter', model: 'nousresearch/hermes-3-llama-3.1-405b:free', name: 'Hermes 3 405B', baseUrl: 'https://openrouter.ai/api/v1', isFree: true },
  { provider: 'OpenRouter', model: 'nvidia/nemotron-3-super-120b-a12b:free', name: 'Nemotron 3 Super 120B', baseUrl: 'https://openrouter.ai/api/v1', isFree: true },
  { provider: 'OpenRouter', model: 'nvidia/nemotron-3-nano-30b-a3b:free', name: 'Nemotron 3 Nano 30B', baseUrl: 'https://openrouter.ai/api/v1', isFree: true },
  { provider: 'OpenRouter', model: 'nvidia/nemotron-nano-12b-v2-vl:free', name: 'Nemotron Nano 12B VL', baseUrl: 'https://openrouter.ai/api/v1', isFree: true },
  { provider: 'OpenRouter', model: 'nvidia/nemotron-nano-9b-v2:free', name: 'Nemotron Nano 9B', baseUrl: 'https://openrouter.ai/api/v1', isFree: true },
  { provider: 'OpenRouter', model: 'openai/gpt-oss-120b:free', name: 'GPT-OSS 120B', baseUrl: 'https://openrouter.ai/api/v1', isFree: true },
  { provider: 'OpenRouter', model: 'openai/gpt-oss-20b:free', name: 'GPT-OSS 20B', baseUrl: 'https://openrouter.ai/api/v1', isFree: true },
  { provider: 'OpenRouter', model: 'mistralai/mistral-small-3.1-24b-instruct:free', name: 'Mistral Small 3.1 24B', baseUrl: 'https://openrouter.ai/api/v1', isFree: true },
  { provider: 'OpenRouter', model: 'google/gemma-3-27b-it:free', name: 'Gemma 3 27B', baseUrl: 'https://openrouter.ai/api/v1', isFree: true },
  { provider: 'OpenRouter', model: 'google/gemma-3-12b-it:free', name: 'Gemma 3 12B', baseUrl: 'https://openrouter.ai/api/v1', isFree: true },
  { provider: 'OpenRouter', model: 'google/gemma-3-4b-it:free', name: 'Gemma 3 4B', baseUrl: 'https://openrouter.ai/api/v1', isFree: true },
  { provider: 'OpenRouter', model: 'google/gemma-3n-e4b-it:free', name: 'Gemma 3n 4B', baseUrl: 'https://openrouter.ai/api/v1', isFree: true },
  { provider: 'OpenRouter', model: 'google/gemma-3n-e2b-it:free', name: 'Gemma 3n 2B', baseUrl: 'https://openrouter.ai/api/v1', isFree: true },
  { provider: 'OpenRouter', model: 'arcee-ai/trinity-large-preview:free', name: 'Arcee Trinity Large', baseUrl: 'https://openrouter.ai/api/v1', isFree: true },
  { provider: 'OpenRouter', model: 'arcee-ai/trinity-mini:free', name: 'Arcee Trinity Mini', baseUrl: 'https://openrouter.ai/api/v1', isFree: true },
  { provider: 'OpenRouter', model: 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free', name: 'Dolphin Mistral 24B', baseUrl: 'https://openrouter.ai/api/v1', isFree: true },
  { provider: 'OpenRouter', model: 'liquid/lfm-2.5-1.2b-instruct:free', name: 'LFM2.5 1.2B Instruct', baseUrl: 'https://openrouter.ai/api/v1', isFree: true },
  { provider: 'OpenRouter', model: 'liquid/lfm-2.5-1.2b-thinking:free', name: 'LFM2.5 1.2B Thinking', baseUrl: 'https://openrouter.ai/api/v1', isFree: true },
  { provider: 'OpenRouter', model: 'stepfun/step-3.5-flash:free', name: 'Step 3.5 Flash', baseUrl: 'https://openrouter.ai/api/v1', isFree: true },
  { provider: 'OpenRouter', model: 'z-ai/glm-4.5-air:free', name: 'GLM 4.5 Air', baseUrl: 'https://openrouter.ai/api/v1', isFree: true },
]
