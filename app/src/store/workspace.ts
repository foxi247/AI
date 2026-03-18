'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AIAgent, Message, Project, ProjectFile, AI_ROLES } from '@/lib/types'

interface WorkspaceState {
  // Projects
  projects: Project[]
  currentProject: Project | null
  activeFile: ProjectFile | null

  // Messages — persisted per project
  messages: Message[]
  messagesByProjectId: Record<string, Message[]>

  // AI Agents
  agents: AIAgent[]
  activeAgentId: string | null

  // UI state
  activePanel: 'editor' | 'preview' | 'terminal'
  terminalOutput: string[]
  isGenerating: boolean
  previewHtml: string

  // Actions
  createProject: (name: string, description?: string) => Project
  setCurrentProject: (project: Project) => void
  setActiveFile: (file: ProjectFile) => void
  updateFileContent: (fileId: string, content: string) => void
  addFile: (file: Omit<ProjectFile, 'id'>) => void
  deleteFile: (fileId: string) => void

  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => string
  updateMessage: (id: string, content: string, isStreaming?: boolean, planItems?: import('@/lib/types').PlanItem[], toolCallEvents?: import('@/lib/types').ToolCallEvent[]) => void
  updatePlanItem: (messageId: string, index: number, done: boolean) => void
  clearMessages: () => void

  addAgent: (agent: Omit<AIAgent, 'id'>) => void
  updateAgent: (id: string, updates: Partial<AIAgent>) => void
  removeAgent: (id: string) => void
  setActiveAgent: (id: string | null) => void

  setActivePanel: (panel: 'editor' | 'preview' | 'terminal') => void
  addTerminalOutput: (line: string) => void
  clearTerminal: () => void
  setIsGenerating: (v: boolean) => void
  setPreviewHtml: (html: string) => void
}

const DEFAULT_FILES: ProjectFile[] = [
  {
    id: 'f1',
    name: 'index.html',
    path: 'index.html',
    language: 'html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My App</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #0a0a0f;
      color: #e8e8f0;
    }
    .container { text-align: center; }
    h1 { font-size: 2.5rem; margin-bottom: 1rem; }
    p { color: #6b6b8a; }
  </style>
</head>
<body>
  <div class="container">
    <h1>✨ Hello, World!</h1>
    <p>Start by describing what you want to build in the AI chat →</p>
  </div>
</body>
</html>`,
  },
  {
    id: 'f2',
    name: 'style.css',
    path: 'style.css',
    language: 'css',
    content: `/* Your styles here */`,
  },
  {
    id: 'f3',
    name: 'script.js',
    path: 'script.js',
    language: 'javascript',
    content: `// Your JavaScript here
console.log('App started');`,
  },
]

const DEFAULT_AGENT: AIAgent = {
  id: 'default-mistral',
  name: 'Mistral Codestral',
  provider: 'Mistral',
  model: 'codestral-latest',
  apiKey: 'Ra3flT4bkJdLOkh0OoNRkEVhz1byTlaU',
  role: 'fullstack',
  baseUrl: 'https://codestral.mistral.ai/v1',
  enabled: true,
  systemPrompt: AI_ROLES.fullstack.systemPrompt,
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProject: null,
      activeFile: null,
      messages: [],
      messagesByProjectId: {},
      agents: [DEFAULT_AGENT],
      activeAgentId: DEFAULT_AGENT.id,
      activePanel: 'editor',
      terminalOutput: ['Welcome to AI Builder Terminal', '$ '],
      isGenerating: false,
      previewHtml: '',

      createProject: (name, description = '') => {
        const project: Project = {
          id: crypto.randomUUID(),
          name,
          description,
          createdAt: new Date(),
          updatedAt: new Date(),
          files: DEFAULT_FILES.map((f) => ({ ...f, id: crypto.randomUUID() })),
          isPublic: false,
        }
        set((s) => ({ projects: [...s.projects, project], currentProject: project, activeFile: project.files[0] }))
        return project
      },

      setCurrentProject: (project) => set((s) => ({
        currentProject: project,
        activeFile: project.files[0],
        // Restore this project's messages (filter out streaming state)
        messages: (s.messagesByProjectId[project.id] || []).map((m) => ({ ...m, isStreaming: false })),
      })),

      setActiveFile: (file) => set({ activeFile: file }),

      updateFileContent: (fileId, content) =>
        set((s) => {
          if (!s.currentProject) return {}
          const files = s.currentProject.files.map((f) => (f.id === fileId ? { ...f, content } : f))
          const updatedProject = { ...s.currentProject, files, updatedAt: new Date() }
          const activeFile = s.activeFile?.id === fileId ? { ...s.activeFile, content } : s.activeFile
          return {
            currentProject: updatedProject,
            activeFile,
            projects: s.projects.map((p) => (p.id === updatedProject.id ? updatedProject : p)),
          }
        }),

      addFile: (file) =>
        set((s) => {
          if (!s.currentProject) return {}
          const newFile = { ...file, id: crypto.randomUUID() }
          const files = [...s.currentProject.files, newFile]
          const updatedProject = { ...s.currentProject, files, updatedAt: new Date() }
          return {
            currentProject: updatedProject,
            activeFile: newFile,
            projects: s.projects.map((p) => (p.id === updatedProject.id ? updatedProject : p)),
          }
        }),

      deleteFile: (fileId) =>
        set((s) => {
          if (!s.currentProject) return {}
          const files = s.currentProject.files.filter((f) => f.id !== fileId)
          const updatedProject = { ...s.currentProject, files, updatedAt: new Date() }
          return {
            currentProject: updatedProject,
            activeFile: files[0] || null,
            projects: s.projects.map((p) => (p.id === updatedProject.id ? updatedProject : p)),
          }
        }),

      addMessage: (msg) => {
        const id = crypto.randomUUID()
        set((s) => {
          const newMsg = { ...msg, id, timestamp: new Date() }
          const newMessages = [...s.messages, newMsg]
          const pid = s.currentProject?.id
          return {
            messages: newMessages,
            messagesByProjectId: pid
              ? { ...s.messagesByProjectId, [pid]: newMessages }
              : s.messagesByProjectId,
          }
        })
        return id
      },

      updateMessage: (id, content, isStreaming, planItems, toolCallEvents) =>
        set((s) => {
          const newMessages = s.messages.map((m) =>
            m.id === id
              ? {
                  ...m, content, isStreaming: isStreaming ?? false,
                  ...(planItems !== undefined ? { planItems } : {}),
                  ...(toolCallEvents !== undefined ? { toolCallEvents } : {}),
                }
              : m
          )
          const pid = s.currentProject?.id
          return {
            messages: newMessages,
            messagesByProjectId: pid
              ? { ...s.messagesByProjectId, [pid]: newMessages }
              : s.messagesByProjectId,
          }
        }),

      updatePlanItem: (messageId, index, done) =>
        set((s) => {
          const newMessages = s.messages.map((m) =>
            m.id === messageId && m.planItems
              ? { ...m, planItems: m.planItems.map((p, i) => (i === index ? { ...p, done } : p)) }
              : m
          )
          const pid = s.currentProject?.id
          return {
            messages: newMessages,
            messagesByProjectId: pid
              ? { ...s.messagesByProjectId, [pid]: newMessages }
              : s.messagesByProjectId,
          }
        }),

      clearMessages: () =>
        set((s) => {
          const pid = s.currentProject?.id
          return {
            messages: [],
            messagesByProjectId: pid
              ? { ...s.messagesByProjectId, [pid]: [] }
              : s.messagesByProjectId,
          }
        }),

      addAgent: (agent) => {
        const id = crypto.randomUUID()
        set((s) => ({ agents: [...s.agents, { ...agent, id }] }))
      },

      updateAgent: (id, updates) =>
        set((s) => ({ agents: s.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)) })),

      removeAgent: (id) =>
        set((s) => ({
          agents: s.agents.filter((a) => a.id !== id),
          activeAgentId: s.activeAgentId === id ? s.agents[0]?.id || null : s.activeAgentId,
        })),

      setActiveAgent: (id) => set({ activeAgentId: id }),

      setActivePanel: (panel) => set({ activePanel: panel }),

      addTerminalOutput: (line) => set((s) => ({ terminalOutput: [...s.terminalOutput, line] })),

      clearTerminal: () => set({ terminalOutput: ['Terminal cleared', '$ '] }),

      setIsGenerating: (v) => set({ isGenerating: v }),

      setPreviewHtml: (html) => set({ previewHtml: html }),
    }),
    {
      name: 'ai-builder-workspace',
      partialize: (s) => ({
        projects: s.projects,
        agents: s.agents,
        activeAgentId: s.activeAgentId,
        messagesByProjectId: s.messagesByProjectId,
      }),
    }
  )
)
