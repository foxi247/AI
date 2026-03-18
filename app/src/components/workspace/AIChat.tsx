'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send, Bot, User, Settings, RotateCcw, Sparkles,
  FileCode, CheckCircle2, Loader2, Eye, Circle,
  BrainCircuit, Code2, PenTool, Search, Download
} from 'lucide-react'
import { useWorkspaceStore } from '@/store/workspace'
import { AI_ROLES, AIRole, PlanItem, ToolCallEvent } from '@/lib/types'
import { chatWithAI, buildSystemPrompt, buildAgentSystemPrompt } from '@/lib/mistral'
import AIConfigPanel from '@/components/ai-config/AIConfigPanel'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDisplayContent(content: string): string {
  return content
    .replace(/```[\w]*(?::[^\n]+)?\n[\s\S]*?```/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function getAppliedFiles(content: string): string[] {
  const regex = /```(?:\w+)?:([^\n]+)\n/g
  const files: string[] = []
  let m
  while ((m = regex.exec(content)) !== null) files.push(m[1].trim().split('/').pop() || m[1])
  return files
}

const BUILD_KEYWORDS = [
  'create','build','make','develop','generate','design',
  'сделай','создай','разработай','построй','сгенерируй',
  'сайт','приложение','лендинг','страницу','проект','систему',
]
const GREETING_PATTERNS = [
  /^(привет|хай|хэй|hello|hi|hey|sup|yo)[\s!.]*$/i,
  /^(как дела|как ты|что нового|что умеешь|кто ты|расскажи о себе)[\s?!.]*$/i,
  /^(добрый (день|вечер|утро))[\s!.]*$/i,
  /^(thanks|спасибо|ок|окей|ok|okay|понял|понятно|хорошо)[\s!.]*$/i,
]

function isBuildRequest(text: string): boolean {
  const lower = text.toLowerCase().trim()
  // Short messages or greetings = NOT a build request
  if (lower.split(/\s+/).length < 4) return false
  if (GREETING_PATTERNS.some((p) => p.test(lower))) return false
  return BUILD_KEYWORDS.some((k) => lower.includes(k))
}

// Extract file names being written from partial streaming content
function getStreamingFiles(content: string): string[] {
  const regex = /```\w+:([^\n]+)\n/g
  const files: string[] = []
  let m
  while ((m = regex.exec(content)) !== null) {
    const name = m[1].trim().split('/').pop() || m[1]
    if (!files.includes(name)) files.push(name)
  }
  return files
}

function parsePlanItems(content: string): PlanItem[] {
  return content
    .split('\n')
    .filter((l) => /^\d+[.)]\s/.test(l.trim()))
    .slice(0, 6)
    .map((l) => ({ text: l.replace(/^\d+[.)]\s*/, '').trim(), done: false }))
}

const ROLE_ICONS: Record<AIRole, typeof Bot> = {
  planner: PenTool,
  coder: Code2,
  architect: BrainCircuit,
  reviewer: Search,
  fullstack: Bot,
}

// ─── Plan Display ─────────────────────────────────────────────────────────────

function PlanDisplay({ items }: { items: PlanItem[] }) {
  return (
    <div className="space-y-1.5 mt-1">
      {items.map((item, i) => (
        <div key={i} className={`flex items-start gap-2 text-xs transition-all duration-500 ${item.done ? 'opacity-60' : ''}`}>
          <div className="shrink-0 mt-0.5">
            {item.done
              ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              : <Circle className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            }
          </div>
          <span className={item.done ? 'line-through text-[var(--text-muted)]' : ''}>
            {item.text}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Agent Badge ──────────────────────────────────────────────────────────────

function AgentBadge({ name, role, isStreaming }: { name: string; role?: AIRole; isStreaming?: boolean }) {
  const roleInfo = role ? AI_ROLES[role] : AI_ROLES.fullstack
  const Icon = role ? ROLE_ICONS[role] : Bot
  return (
    <div className="flex items-center gap-1.5 mb-1">
      <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
        style={{ background: `${roleInfo.color}20`, border: `1px solid ${roleInfo.color}40` }}>
        <Icon className="w-3 h-3" style={{ color: roleInfo.color }} />
      </div>
      <span className="text-[10px] font-semibold" style={{ color: roleInfo.color }}>{name}</span>
      {isStreaming && (
        <span className="text-[9px] text-[var(--text-muted)] animate-pulse">● working...</span>
      )}
    </div>
  )
}

// ─── Streaming Bubble ─────────────────────────────────────────────────────────

function StreamingBubble({ role, agentName, content }: { role?: AIRole; agentName?: string; content: string }) {
  const [expanded, setExpanded] = useState(false)
  const files = getStreamingFiles(content)
  const label = agentName || 'AI'

  const statusText =
    role === 'planner' ? 'Составляю план...' :
    role === 'coder' ? `${label} — пишет код` :
    role === 'architect' ? `${label} — анализирует задачу` :
    `${label} — обрабатывает запрос`

  return (
    <div className="flex flex-col gap-2">
      {/* Status row */}
      <div className="flex items-center gap-2 text-violet-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
        <span className="font-medium text-xs">{statusText}</span>
      </div>

      {/* Files being written */}
      {files.length > 0 && (
        <div className="flex flex-col gap-1">
          {files.map((f, i) => (
            <div key={f} className="flex items-center gap-1.5 text-[11px]">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                i < files.length - 1 ? 'bg-green-400' : 'bg-violet-400 animate-pulse'
              }`} />
              <span className={i < files.length - 1 ? 'text-green-400' : 'text-violet-300'}>
                {i < files.length - 1 ? '✓ ' : '✍ '}{f}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Expandable raw output */}
      {content.length > 100 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-[10px] text-[var(--text-muted)] hover:text-violet-400 text-left transition-colors"
        >
          {expanded ? '▲ скрыть вывод' : '▼ показать вывод'}
        </button>
      )}
      {expanded && (
        <pre className="text-[10px] text-[var(--text-muted)] max-h-40 overflow-y-auto bg-black/20 rounded p-2 font-mono">
          {content.slice(-800)}
        </pre>
      )}

      {/* Bouncing dots */}
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-violet-300 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}

// ─── Agent Tools Definitions ──────────────────────────────────────────────────

const AGENT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read the content of a file in the current project',
      parameters: {
        type: 'object',
        properties: { path: { type: 'string', description: 'File path, e.g. index.html, style.css, script.js' } },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Create or overwrite a file in the project with complete content',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path, e.g. index.html' },
          content: { type: 'string', description: 'Complete file content — never truncated' },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_files',
      description: 'List all files currently in the project',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_file',
      description: 'Delete a file from the project',
      parameters: {
        type: 'object',
        properties: { path: { type: 'string', description: 'File path to delete' } },
        required: ['path'],
      },
    },
  },
]

const TOOL_META: Record<string, { icon: string; label: string; color: string }> = {
  read_file:   { icon: '📖', label: 'Reading',  color: '#06b6d4' },
  write_file:  { icon: '✍️',  label: 'Writing',  color: '#7c3aed' },
  list_files:  { icon: '📋', label: 'Listing',  color: '#f59e0b' },
  delete_file: { icon: '🗑️', label: 'Deleting', color: '#ef4444' },
}

// ─── Tool Call Display ─────────────────────────────────────────────────────────

function ToolCallDisplay({ events }: { events: ToolCallEvent[] }) {
  return (
    <div className="flex flex-col gap-1 my-1.5">
      {events.map((ev) => {
        const meta = TOOL_META[ev.name] || { icon: '🔧', label: ev.name, color: '#7c3aed' }
        const argStr = Object.entries(ev.args)
          .map(([k, v]) => `${k}="${String(v).length > 40 ? String(v).slice(0, 40) + '…' : String(v)}"`)
          .join(', ')
        return (
          <div key={ev.id}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-mono border transition-all"
            style={{
              borderColor: ev.status === 'done' ? '#16a34a40' : ev.status === 'error' ? '#ef444440' : `${meta.color}40`,
              background: ev.status === 'done' ? '#16a34a08' : ev.status === 'error' ? '#ef444408' : `${meta.color}08`,
            }}
          >
            <span>{meta.icon}</span>
            <span style={{ color: meta.color }} className="font-semibold">{ev.name}</span>
            <span className="text-[var(--text-muted)] truncate flex-1">({argStr})</span>
            {ev.status === 'running' && <Loader2 className="w-3 h-3 animate-spin shrink-0" style={{ color: meta.color }} />}
            {ev.status === 'done'    && <span className="text-green-400 shrink-0">✓</span>}
            {ev.status === 'error'   && <span className="text-red-400 shrink-0">✗</span>}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AIChat() {
  const {
    messages, addMessage, updateMessage, updatePlanItem, clearMessages,
    agents, activeAgentId,
    currentProject, activeFile,
    updateFileContent, addFile, deleteFile, setIsGenerating, isGenerating,
    addTerminalOutput,
  } = useWorkspaceStore()

  const [input, setInput] = useState('')
  const [showConfig, setShowConfig] = useState(false)
  const [agentMode, setAgentMode] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      const prompt = (e as CustomEvent<string>).detail
      if (prompt) sendMessage(prompt)
    }
    window.addEventListener('ai:sendPrompt', handler)
    return () => window.removeEventListener('ai:sendPrompt', handler)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const activeAgent = agents.find((a) => a.id === activeAgentId) || agents[0]
  const roleInfo = activeAgent ? AI_ROLES[activeAgent.role] : AI_ROLES.fullstack

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ─── Code parsing ───────────────────────────────────────────────────────────

  const applyCodeChanges = useCallback((content: string): string[] => {
    const regex = /```(\w+)?(?::([^\n]+))?\n([\s\S]*?)```/g
    const langToFile: Record<string, string> = {
      html: 'index.html', css: 'style.css',
      javascript: 'script.js', js: 'script.js',
      typescript: 'script.ts', ts: 'script.ts',
      python: 'main.py', py: 'main.py',
      json: 'data.json',
    }
    const extMap: Record<string, string> = {
      html: 'html', css: 'css', js: 'javascript', ts: 'typescript',
      tsx: 'typescript', jsx: 'javascript', py: 'python', json: 'json',
    }
    let m
    const applied: string[] = []
    while ((m = regex.exec(content)) !== null) {
      const lang = m[1]?.toLowerCase() || ''
      const filePath = m[2]?.trim() || langToFile[lang] || null
      const code = m[3]?.trim()
      if (!code || !currentProject || !filePath) continue
      const filename = filePath.split('/').pop() || filePath
      const ext = filename.split('.').pop()?.toLowerCase() || ''
      const existing = currentProject.files.find((f) => f.path === filePath || f.name === filename)
      if (existing) {
        updateFileContent(existing.id, code)
      } else {
        addFile({ name: filename, path: filePath, content: code, language: extMap[ext] || lang || 'plaintext' })
      }
      applied.push(filename)
    }
    return applied
  }, [currentProject, updateFileContent, addFile])

  // ─── Tool executor ──────────────────────────────────────────────────────────

  const executeTool = useCallback(async (name: string, args: Record<string, string>): Promise<string> => {
    switch (name) {
      case 'read_file': {
        if (!currentProject) return 'Error: No project open'
        const f = currentProject.files.find(
          (f) => f.path === args.path || f.name === args.path || f.name === (args.path || '').split('/').pop()
        )
        if (!f) return `Error: "${args.path}" not found. Files: ${currentProject.files.map((f) => f.path).join(', ')}`
        return f.content
      }
      case 'write_file': {
        const { path, content } = args
        if (!path || content === undefined) return 'Error: path and content required'
        const filename = path.split('/').pop() || path
        const ext = filename.split('.').pop()?.toLowerCase() || ''
        const langMap: Record<string, string> = {
          html: 'html', css: 'css', js: 'javascript', ts: 'typescript',
          tsx: 'typescript', jsx: 'javascript', py: 'python', json: 'json', md: 'markdown',
        }
        const language = langMap[ext] || 'plaintext'
        const existing = currentProject?.files.find((f) => f.path === path || f.name === filename)
        if (existing) {
          updateFileContent(existing.id, content)
        } else {
          addFile({ name: filename, path, content, language })
        }
        return `Written ${filename} (${content.length} chars)`
      }
      case 'list_files': {
        if (!currentProject?.files.length) return 'Project is empty — no files yet'
        return currentProject.files
          .map((f) => `${f.path}  (${f.content.length} chars, ${f.language})`)
          .join('\n')
      }
      case 'delete_file': {
        if (!currentProject) return 'Error: No project open'
        const f = currentProject.files.find((f) => f.path === args.path || f.name === args.path)
        if (!f) return `Error: "${args.path}" not found`
        deleteFile(f.id)
        return `Deleted ${args.path}`
      }
      default:
        return `Unknown tool: ${name}`
    }
  }, [currentProject, updateFileContent, addFile, deleteFile])

  // ─── Agentic loop ────────────────────────────────────────────────────────────

  const runAgentLoop = useCallback(async (userContent: string): Promise<boolean> => {
    if (!activeAgent) return false

    const msgId = addMessage({
      role: 'assistant', content: '',
      agentId: activeAgent.id, agentName: activeAgent.name, agentRole: activeAgent.role,
      isStreaming: true, toolCallEvents: [],
    })

    const projectContext = currentProject
      ? `\nProject: "${currentProject.name}"\nFiles: ${currentProject.files.map((f) => f.path).join(', ') || 'none (empty project)'}`
      : '\nNo project open.'

    const apiMessages: Array<Record<string, unknown>> = [
      { role: 'system', content: buildAgentSystemPrompt() + projectContext },
      ...messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: userContent },
    ]

    let iterations = 0
    const MAX = 12
    const allToolEvents: ToolCallEvent[] = []

    try {
      while (iterations < MAX) {
        iterations++

        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            model: activeAgent.model,
            apiKey: activeAgent.apiKey,
            baseUrl: activeAgent.baseUrl,
            tools: AGENT_TOOLS,
            tool_choice: 'auto',
            stream: false,
          }),
        })

        if (!res.ok) {
          const err = await res.text()
          updateMessage(msgId, `❌ Agent error: ${err}`, false)
          return true
        }

        const data = await res.json()
        const choice = data.choices?.[0]
        if (!choice) break

        const assistantMsg = choice.message
        apiMessages.push(assistantMsg)

        if (choice.finish_reason === 'tool_calls' && assistantMsg.tool_calls?.length) {
          // Add new tool calls as running
          const newEvents: ToolCallEvent[] = assistantMsg.tool_calls.map((tc: {
            id: string; function: { name: string; arguments: string }
          }) => ({
            id: tc.id,
            name: tc.function.name,
            args: (() => { try { return JSON.parse(tc.function.arguments || '{}') } catch { return {} } })(),
            status: 'running' as const,
          }))
          allToolEvents.push(...newEvents)
          updateMessage(msgId, assistantMsg.content || '', true, undefined, [...allToolEvents])

          // Execute each tool
          for (let i = 0; i < assistantMsg.tool_calls.length; i++) {
            const tc = assistantMsg.tool_calls[i]
            const evIdx = allToolEvents.length - assistantMsg.tool_calls.length + i
            const args = newEvents[i].args

            const result = await executeTool(tc.function.name, args)

            allToolEvents[evIdx] = { ...allToolEvents[evIdx], result, status: 'done' }
            updateMessage(msgId, assistantMsg.content || '', true, undefined, [...allToolEvents])

            apiMessages.push({ role: 'tool', content: result, tool_call_id: tc.id })
          }
        } else {
          // Final response
          const finalContent = assistantMsg.content || ''
          updateMessage(msgId, finalContent, false, undefined, allToolEvents)
          const applied = applyCodeChanges(finalContent)
          if (applied.length > 0 || allToolEvents.some((e) => e.name === 'write_file')) {
            setTimeout(() => window.dispatchEvent(new CustomEvent('workspace:previewReady')), 500)
          }
          break
        }
      }
    } catch (err) {
      updateMessage(msgId, `❌ Agent error: ${err instanceof Error ? err.message : 'Unknown'}`, false, undefined, allToolEvents)
    }

    return true
  }, [activeAgent, currentProject, messages, addMessage, updateMessage, executeTool, applyCodeChanges])

  // ─── Single agent call ──────────────────────────────────────────────────────

  const callAgent = useCallback(async (
    agent: typeof activeAgent,
    userContent: string,
    extraContext = '',
    onContent?: (c: string) => void
  ): Promise<string> => {
    if (!agent) return ''
    const systemPrompt = buildSystemPrompt(agent)
    const projectContext = currentProject
      ? `\n\nProject: "${currentProject.name}"\nFiles:\n${currentProject.files.map((f) =>
          `--- ${f.path} ---\n${f.content.slice(0, 400)}${f.content.length > 400 ? '...' : ''}`
        ).join('\n\n')}`
      : ''
    let full = ''
    await chatWithAI({
      messages: [
        { role: 'system', content: systemPrompt + projectContext + extraContext },
        ...messages.slice(-8).map((msg) => ({ role: msg.role as 'user' | 'assistant', content: msg.content })),
        { role: 'user', content: userContent },
      ],
      agent,
      onChunk: (chunk) => {
        full += chunk
        onContent?.(full)
      },
    })
    return full
  }, [currentProject, messages])

  // ─── Multi-agent orchestration ──────────────────────────────────────────────

  const runOrchestration = useCallback(async (userContent: string) => {
    const planner = agents.find((a) => a.role === 'planner')
    const coder = agents.find((a) => a.role === 'coder') || agents.find((a) => a.role === 'fullstack')
    const orchestrator = agents.find((a) => a.role === 'architect' && a.id !== planner?.id)
    if (!planner || !coder || agents.length < 2) return false

    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

    // ① Orchestrator intro — only show if it's a DIFFERENT agent from planner
    if (orchestrator) {
      const orchMsgId = addMessage({
        role: 'assistant', content: '',
        agentId: orchestrator.id, agentName: orchestrator.name, agentRole: orchestrator.role,
        isStreaming: true,
      })
      await delay(300)
      updateMessage(orchMsgId,
        `Понял задачу! Передаю **${planner.name}** для составления плана...`, false)
      await delay(700)
    }


    // ② Planner — creates 6-item plan
    const planMsgId = addMessage({
      role: 'assistant', content: '',
      agentId: planner.id, agentName: planner.name, agentRole: planner.role,
      isStreaming: true,
    })

    let planContent = ''
    const planSystemExtra = `
IMPORTANT: Respond with ONLY a numbered list of exactly 6 items.
Each item must be ONE short line (max 8 words). No headers, no explanations, just the list.
Example:
1. Create HTML structure with hero
2. Style navbar with glassmorphism
3. Build services grid with cards
4. Add scroll animations with AOS
5. Style contact form and footer
6. Make fully responsive for mobile`

    await chatWithAI({
      messages: [
        { role: 'system', content: AI_ROLES.planner.systemPrompt + planSystemExtra },
        { role: 'user', content: `Create a 6-step plan for: ${userContent}` },
      ],
      agent: planner,
      onChunk: (chunk) => {
        planContent += chunk
        updateMessage(planMsgId, planContent, true)
      },
    })

    const planItems = parsePlanItems(planContent)
    updateMessage(planMsgId, planContent, false, planItems.length > 0 ? planItems : undefined)

    await delay(600)

    // ③ Handoff message — planner tells coder to start
    const handoffAgent = orchestrator || planner
    const handoffId = addMessage({
      role: 'assistant', content: '',
      agentId: handoffAgent.id, agentName: handoffAgent.name, agentRole: handoffAgent.role,
      isStreaming: false,
    })
    updateMessage(handoffId,
      `✅ План готов (${planItems.length} шагов). Передаю **${coder.name}** — начинает реализацию...`, false)

    await delay(500)

    // ④ Coder — implements everything
    const coderMsgId = addMessage({
      role: 'assistant', content: '',
      agentId: coder.id, agentName: coder.name, agentRole: coder.role,
      isStreaming: true,
    })

    const coderSystemEnforcement = `\n\n## THIS IS CRITICAL — READ BEFORE RESPONDING:
ONLY output the 3 file blocks (index.html, style.css, script.js) + a short 3-5 bullet summary.
DO NOT write any markdown headers, explanations, step descriptions, or plan recaps.
DO NOT write React, TypeScript, or component files.
Just: code blocks → brief summary. Nothing else.`

    let coderContent = ''
    await chatWithAI({
      messages: [
        { role: 'system', content: buildSystemPrompt(coder) + coderSystemEnforcement },
        {
          role: 'user',
          content: `Build this completely: ${userContent}\n\nPlan:\n${planContent}\n\nGenerate ONLY index.html + style.css + script.js. No React. No explanations. Just the files + short summary.`,
        },
      ],
      agent: coder,
      onChunk: (chunk) => {
        coderContent += chunk
        updateMessage(coderMsgId, coderContent, true)
      },
    })

    const applied = applyCodeChanges(coderContent)
    updateMessage(coderMsgId, coderContent, false)

    // ⑤ Progressively check off plan items
    if (planItems.length > 0) {
      for (let i = 0; i < planItems.length; i++) {
        await delay(400)
        updatePlanItem(planMsgId, i, true)
      }
    }

    // ⑥ Dispatch preview ready
    if (applied.length > 0) {
      await delay(400)
      window.dispatchEvent(new CustomEvent('workspace:previewReady'))
    }

    return true
  }, [agents, addMessage, updateMessage, updatePlanItem, applyCodeChanges])

  // ─── Send message ───────────────────────────────────────────────────────────

  const sendMessage = async (text?: string) => {
    const content = text || input.trim()
    if (!content || isGenerating) return
    setInput('')
    setIsGenerating(true)

    addMessage({ role: 'user', content })

    try {
      // Agent mode: tool-calling loop
      if (agentMode) {
        await runAgentLoop(content)
        return
      }

      // Try multi-agent orchestration if applicable
      if (agents.length >= 2 && isBuildRequest(content)) {
        const orchestrated = await runOrchestration(content)
        if (orchestrated) return
      }

      // Single agent fallback
      const assistantId = addMessage({
        role: 'assistant', content: '',
        agentId: activeAgent?.id, agentName: activeAgent?.name, agentRole: activeAgent?.role,
        isStreaming: true,
      })

      const full = await callAgent(activeAgent, content, '', (c) => updateMessage(assistantId, c, true))
      const applied = applyCodeChanges(full)
      updateMessage(assistantId, full, false)

      if (applied.length > 0) {
        setTimeout(() => window.dispatchEvent(new CustomEvent('workspace:previewReady')), 800)
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error'
      addMessage({ role: 'assistant', content: `❌ Error: ${errMsg}\n\nPlease check your API key in AI Configuration.` })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const handleDownload = () => {
    const projectName = currentProject?.name || 'chat'
    const date = new Date().toISOString().slice(0, 10)

    // Build readable text
    const text = messages
      .filter((m) => m.role !== 'system')
      .map((m) => {
        const who = m.role === 'user' ? '👤 Вы' : `🤖 ${m.agentName || activeAgent?.name || 'AI'}`
        const time = new Date(m.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        const body = getDisplayContent(m.content) || m.content
        const plan = m.planItems?.length
          ? '\n\nПлан:\n' + m.planItems.map((p, i) => `  ${p.done ? '✅' : '☐'} ${i + 1}. ${p.text}`).join('\n')
          : ''
        return `[${time}] ${who}\n${'─'.repeat(40)}\n${body}${plan}\n`
      })
      .join('\n')

    const full = `Чат: ${projectName}\nДата: ${date}\n${'═'.repeat(50)}\n\n${text}`
    const blob = new Blob([full], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-${projectName}-${date}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [input])

  const isMultiAgent = agents.length >= 2

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-2)] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {isMultiAgent ? (
              // Multi-agent mode: show all agent avatars
              <div className="flex -space-x-1">
                {agents.slice(0, 3).map((a) => {
                  const ri = AI_ROLES[a.role]
                  const Ic = ROLE_ICONS[a.role]
                  return (
                    <div key={a.id}
                      className="w-6 h-6 rounded-md flex items-center justify-center border border-[var(--background)]"
                      style={{ background: `${ri.color}30` }}
                      title={a.name}
                    >
                      <Ic className="w-3 h-3" style={{ color: ri.color }} />
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{ background: `${roleInfo.color}20`, border: `1px solid ${roleInfo.color}40`, color: roleInfo.color }}>
                {activeAgent?.name[0] || 'A'}
              </div>
            )}
            <div>
              <div className="text-xs font-semibold flex items-center gap-1">
                {isMultiAgent ? 'Multi-Agent Team' : activeAgent?.name || 'AI Assistant'}
                {isMultiAgent && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-600/20 text-violet-400 border border-violet-500/30">
                    {agents.length} agents
                  </span>
                )}
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">
                {isMultiAgent
                  ? agents.map((a) => AI_ROLES[a.role].label).join(' → ')
                  : activeAgent?.model}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Agent Mode Toggle */}
            <button
              onClick={() => setAgentMode((v) => !v)}
              title={agentMode ? 'Agent Mode ON — click to disable' : 'Enable Agent Mode (tool use)'}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                agentMode
                  ? 'bg-violet-600/20 border-violet-500/50 text-violet-300'
                  : 'bg-transparent border-[var(--border)] text-[var(--text-muted)] hover:border-violet-500/40 hover:text-violet-400'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              Agent
            </button>
            {messages.length > 0 && (
              <>
                <button onClick={handleDownload} className="p-1.5 rounded text-[var(--text-muted)] hover:text-green-400 hover:bg-green-600/10 transition-colors" title="Скачать чат">
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button onClick={clearMessages} className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-3)] transition-colors" title="Очистить чат">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            <button onClick={() => setShowConfig(true)} className="p-1.5 rounded text-[var(--text-muted)] hover:text-violet-400 hover:bg-violet-600/10 transition-colors">
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-8">
              <div className="w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                <Bot className="w-7 h-7 text-violet-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">
                  {isMultiAgent ? 'Multi-Agent Team Ready' : 'Ask AI to build anything'}
                </h3>
                <p className="text-xs text-[var(--text-muted)] max-w-[220px]">
                  {isMultiAgent
                    ? `${agents.length} agents will collaborate: plan → build → apply`
                    : 'Describe what you want and the AI will generate the code'}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
                {['Create a landing page for a startup',
                  'Build a todo app with dark mode',
                  'Make a portfolio website with animations'].map((p) => (
                  <button key={p} onClick={() => sendMessage(p)}
                    className="text-xs px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] hover:border-violet-500/50 hover:text-violet-400 transition-all text-left">
                    <Sparkles className="w-3 h-3 inline mr-1 text-violet-400" />
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => {
            const isUser = msg.role === 'user'
            const displayContent = isUser ? msg.content : getDisplayContent(msg.content)
            const appliedFiles = !isUser && !msg.isStreaming ? getAppliedFiles(msg.content) : []
            const agentRoleInfo = msg.agentRole ? AI_ROLES[msg.agentRole] : roleInfo

            return (
              <div key={msg.id} className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                  <div className="w-6 h-6 rounded-md shrink-0 flex items-center justify-center text-xs font-bold mt-0.5"
                    style={{ background: `${agentRoleInfo.color}20`, border: `1px solid ${agentRoleInfo.color}40` }}>
                    {msg.agentName?.[0] || activeAgent?.name[0] || 'A'}
                  </div>
                )}

                <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  {/* Agent name badge */}
                  {!isUser && msg.agentName && (
                    <AgentBadge
                      name={msg.agentName}
                      role={msg.agentRole}
                      isStreaming={msg.isStreaming}
                    />
                  )}

                  {/* Message bubble */}
                  <div className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-violet-600 text-white rounded-tr-sm'
                      : 'bg-[var(--surface-2)] border border-[var(--border)] text-[var(--foreground)] rounded-tl-sm'
                  }`}>
                    {msg.isStreaming ? (
                      <StreamingBubble role={msg.agentRole} agentName={msg.agentName} content={msg.content} />
                    ) : (
                      <div>
                        <p className="whitespace-pre-wrap">
                          {displayContent || (appliedFiles.length > 0 ? '✅ Готово! Все файлы применены в редакторе.' : msg.content)}
                        </p>
                        {msg.toolCallEvents && msg.toolCallEvents.length > 0 && (
                          <ToolCallDisplay events={msg.toolCallEvents} />
                        )}
                        {msg.planItems && msg.planItems.length > 0 && (
                          <PlanDisplay items={msg.planItems} />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Applied files + preview buttons */}
                  {appliedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-1 items-center">
                      <div className="flex items-center gap-1 text-[10px] text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-2 py-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        Applied to editor
                      </div>
                      {appliedFiles.map((f) => (
                        <div key={f} className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] bg-[var(--surface-2)] border border-[var(--border)] rounded-full px-2 py-0.5">
                          <FileCode className="w-2.5 h-2.5" />{f}
                        </div>
                      ))}
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent('workspace:openPreview'))}
                        className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded-full px-2.5 py-0.5 hover:bg-amber-400/20 transition-colors font-medium"
                      >
                        <Eye className="w-3 h-3" />View Preview
                      </button>
                      {appliedFiles.includes('package.json') && (
                        <button
                          onClick={() => window.dispatchEvent(new CustomEvent('workspace:npmInstall'))}
                          className="flex items-center gap-1 text-[10px] text-blue-400 bg-blue-400/10 border border-blue-400/30 rounded-full px-2.5 py-0.5 hover:bg-blue-400/20 transition-colors font-medium"
                        >
                          <Loader2 className="w-3 h-3" />npm install + Preview
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-6 h-6 rounded-md shrink-0 flex items-center justify-center bg-[var(--surface-2)] border border-[var(--border)] mt-0.5">
                    <User className="w-3 h-3 text-[var(--text-muted)]" />
                  </div>
                )}
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-[var(--border)] bg-[var(--surface-2)] shrink-0">
          <div className="flex gap-2 items-end bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 focus-within:border-violet-500/50 transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isGenerating ? 'Agents are working...' : isMultiAgent ? 'Ask the team to build something...' : 'Ask AI to build something...'}
              disabled={isGenerating}
              rows={1}
              className="flex-1 bg-transparent text-xs resize-none outline-none placeholder:text-[var(--text-muted)] disabled:opacity-50 max-h-28 [font-size:16px] md:text-xs"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isGenerating}
              className="w-6 h-6 flex items-center justify-center rounded-lg bg-violet-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-violet-500 transition-colors shrink-0"
            >
              {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            </button>
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mt-1.5 text-center">
            {isMultiAgent
              ? `🤖 ${agents.length} agents · Auto-orchestration on build requests`
              : 'Enter to send · Shift+Enter for new line'}
          </p>
        </div>
      </div>

      {showConfig && <AIConfigPanel onClose={() => setShowConfig(false)} />}
    </>
  )
}
