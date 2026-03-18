'use client'
import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Settings, Paperclip, RotateCcw, ChevronDown, Sparkles } from 'lucide-react'
import { useWorkspaceStore } from '@/store/workspace'
import { AI_ROLES } from '@/lib/types'
import { chatWithAI, buildSystemPrompt } from '@/lib/mistral'
import AIConfigPanel from '@/components/ai-config/AIConfigPanel'

const QUICK_PROMPTS = [
  'Add a dark mode toggle',
  'Create a contact form',
  'Add smooth animations',
  'Make it responsive for mobile',
  'Add a navigation menu',
  'Create a login form with validation',
]

export default function AIChat() {
  const {
    messages, addMessage, updateMessage, clearMessages,
    agents, activeAgentId,
    currentProject, activeFile,
    updateFileContent, addFile, setIsGenerating, isGenerating,
  } = useWorkspaceStore()

  const [input, setInput] = useState('')
  const [showConfig, setShowConfig] = useState(false)
  const [showQuick, setShowQuick] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Listen for prompt events from WorkspaceLayout (initial prompt from URL)
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

  // Parse AI response and apply code changes
  const applyCodeChanges = (content: string) => {
    // Match code blocks with file path: ```language:path/to/file
    const codeBlockRegex = /```(?:\w+)?(?::([^\n]+))?\n([\s\S]*?)```/g
    let match
    let applied = false

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const filePath = match[1]?.trim()
      const code = match[2]?.trim()

      if (!filePath || !code || !currentProject) continue

      // Find existing file or create new one
      const existing = currentProject.files.find(
        (f) => f.path === filePath || f.name === filePath.split('/').pop()
      )

      if (existing) {
        updateFileContent(existing.id, code)
        applied = true
      } else {
        // Create new file
        const ext = filePath.split('.').pop()?.toLowerCase() || ''
        const langMap: Record<string, string> = {
          html: 'html', css: 'css', js: 'javascript', ts: 'typescript',
          tsx: 'typescript', jsx: 'javascript', py: 'python', json: 'json', md: 'markdown',
        }
        addFile({
          name: filePath.split('/').pop() || filePath,
          path: filePath,
          content: code,
          language: langMap[ext] || 'plaintext',
        })
        applied = true
      }
    }

    return applied
  }

  const sendMessage = async (text?: string) => {
    const content = text || input.trim()
    if (!content || isGenerating) return

    setInput('')
    setShowQuick(false)
    setIsGenerating(true)

    // Add user message
    addMessage({ role: 'user', content })

    // Build context
    const systemPrompt = buildSystemPrompt(activeAgent)
    const projectContext = currentProject
      ? `\n\nCurrent project: "${currentProject.name}"\nActive file: ${activeFile?.name || 'none'}\n\nCurrent files:\n${currentProject.files.map((f) => `--- ${f.path} ---\n${f.content.slice(0, 500)}${f.content.length > 500 ? '...' : ''}`).join('\n\n')}`
      : ''

    const assistantId = addMessage({ role: 'assistant', content: '', isStreaming: true })

    try {
      const apiMessages = [
        { role: 'system' as const, content: systemPrompt + projectContext },
        ...messages.slice(-10).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user' as const, content },
      ]

      let fullContent = ''
      await chatWithAI({
        messages: apiMessages,
        agent: activeAgent,
        onChunk: (chunk) => {
          fullContent += chunk
          updateMessage(assistantId, fullContent, true)
        },
      })

      updateMessage(assistantId, fullContent, false)
      applyCodeChanges(fullContent)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error'
      updateMessage(assistantId, `❌ Error: ${errMsg}\n\nPlease check your API key in AI Configuration.`, false)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [input])

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-2)]">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: `${roleInfo.color}20`, border: `1px solid ${roleInfo.color}40`, color: roleInfo.color }}
            >
              {activeAgent?.name[0] || 'A'}
            </div>
            <div>
              <div className="text-xs font-semibold flex items-center gap-1">
                {activeAgent?.name || 'AI Assistant'}
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded-full"
                  style={{ background: `${roleInfo.color}20`, color: roleInfo.color }}
                >
                  {roleInfo.label}
                </span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">{activeAgent?.model}</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button onClick={clearMessages} className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-3)] transition-colors" title="Clear chat">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setShowConfig(true)}
              className="p-1.5 rounded text-[var(--text-muted)] hover:text-violet-400 hover:bg-violet-600/10 transition-colors"
              title="AI Configuration"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                <Bot className="w-7 h-7 text-violet-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Ask AI to build anything</h3>
                <p className="text-xs text-[var(--text-muted)] max-w-[200px]">
                  Describe what you want and the AI will generate the code
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
                {['Create a todo app', 'Add a dark mode toggle', 'Build a contact form'].map((p) => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    className="text-xs px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] hover:border-violet-500/50 hover:text-violet-400 transition-all text-left"
                  >
                    <Sparkles className="w-3 h-3 inline mr-1 text-violet-400" />
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div
                  className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold mt-0.5"
                  style={{ background: `${roleInfo.color}20`, border: `1px solid ${roleInfo.color}40`, color: roleInfo.color }}
                >
                  {activeAgent?.name[0] || 'A'}
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-violet-600/20 border border-violet-500/30 text-[var(--foreground)]'
                    : 'bg-[var(--surface-2)] border border-[var(--border)] text-[var(--foreground)]'
                }`}
              >
                <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed">
                  {msg.content}
                  {msg.isStreaming && <span className="cursor-blink ml-0.5 text-violet-400">▋</span>}
                </pre>
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-[var(--surface-3)] border border-[var(--border)] shrink-0 flex items-center justify-center mt-0.5">
                  <User className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                </div>
              )}
            </div>
          ))}

          {isGenerating && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-violet-600/20 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-3">
                <div className="flex gap-1 items-center">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-violet-400"
                      style={{ animation: `blink 1.4s ${i * 0.2}s ease-in-out infinite` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts */}
        {showQuick && (
          <div className="px-3 pb-2 grid grid-cols-1 gap-1">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                className="text-xs px-3 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] hover:border-violet-500/50 text-[var(--text-muted)] hover:text-violet-400 transition-all text-left"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="border-t border-[var(--border)] p-3">
          <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl overflow-hidden focus-within:border-violet-500 transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to build..."
              rows={1}
              className="w-full bg-transparent px-4 pt-3 pb-2 text-sm resize-none focus:outline-none text-[var(--foreground)] placeholder:text-[var(--text-muted)] leading-relaxed"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            <div className="flex items-center justify-between px-3 pb-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowQuick(!showQuick)}
                  className="p-1.5 rounded text-[var(--text-muted)] hover:text-violet-400 transition-colors"
                  title="Quick prompts"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
                <button className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors" title="Attach file">
                  <Paperclip className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isGenerating}
                className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                {isGenerating ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin-slow" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
          <p className="text-[10px] text-[var(--text-muted)] text-center mt-2">
            Enter to send · Shift+Enter for newline · AI changes code automatically
          </p>
        </div>
      </div>

      {showConfig && <AIConfigPanel onClose={() => setShowConfig(false)} />}
    </>
  )
}
