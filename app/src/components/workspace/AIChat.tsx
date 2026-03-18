'use client'
import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Settings, RotateCcw, Sparkles, FileCode, CheckCircle2, Loader2, Eye } from 'lucide-react'
import { useWorkspaceStore } from '@/store/workspace'
import { AI_ROLES } from '@/lib/types'
import { chatWithAI, buildSystemPrompt } from '@/lib/mistral'
import AIConfigPanel from '@/components/ai-config/AIConfigPanel'

// Strip code blocks from chat display — code goes silently to editor
function getDisplayContent(content: string): string {
  return content
    .replace(/```[\w]*(?::[^\n]+)?\n[\s\S]*?```/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Extract filenames from code blocks
function getAppliedFiles(content: string): string[] {
  const regex = /```(?:\w+)?:([^\n]+)\n/g
  const files: string[] = []
  let match
  while ((match = regex.exec(content)) !== null) {
    files.push(match[1].trim().split('/').pop() || match[1].trim())
  }
  return files
}

export default function AIChat() {
  const {
    messages, addMessage, updateMessage, clearMessages,
    agents, activeAgentId,
    currentProject, activeFile,
    updateFileContent, addFile, setIsGenerating, isGenerating,
  } = useWorkspaceStore()

  const [input, setInput] = useState('')
  const [showConfig, setShowConfig] = useState(false)
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

  // Parse AI response and apply code changes to editor
  const applyCodeChanges = (content: string): string[] => {
    const codeBlockRegex = /```(?:\w+)?(?::([^\n]+))?\n([\s\S]*?)```/g
    let match
    const applied: string[] = []

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const filePath = match[1]?.trim()
      const code = match[2]?.trim()

      if (!filePath || !code || !currentProject) continue

      const existing = currentProject.files.find(
        (f) => f.path === filePath || f.name === filePath.split('/').pop()
      )

      if (existing) {
        updateFileContent(existing.id, code)
        applied.push(filePath.split('/').pop() || filePath)
      } else {
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
        applied.push(filePath.split('/').pop() || filePath)
      }
    }

    return applied
  }

  const sendMessage = async (text?: string) => {
    const content = text || input.trim()
    if (!content || isGenerating) return

    setInput('')
    setIsGenerating(true)

    addMessage({ role: 'user', content })

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

      // Apply code to editor
      const applied = applyCodeChanges(fullContent)
      updateMessage(assistantId, fullContent, false)

      // If code was applied, dispatch preview event after short delay
      if (applied.length > 0) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('workspace:previewReady'))
        }, 800)
      }
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
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-2)] shrink-0">
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
                <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${roleInfo.color}20`, color: roleInfo.color }}>
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
            <button onClick={() => setShowConfig(true)} className="p-1.5 rounded text-[var(--text-muted)] hover:text-violet-400 hover:bg-violet-600/10 transition-colors" title="AI Configuration">
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
                <h3 className="font-semibold mb-1">Ask AI to build anything</h3>
                <p className="text-xs text-[var(--text-muted)] max-w-[200px]">
                  Describe what you want and the AI will generate the code for you
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

          {messages.map((msg) => {
            const isUser = msg.role === 'user'
            const displayContent = isUser ? msg.content : getDisplayContent(msg.content)
            const appliedFiles = !isUser && !msg.isStreaming ? getAppliedFiles(msg.content) : []

            return (
              <div key={msg.id} className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                  <div
                    className="w-6 h-6 rounded-md shrink-0 flex items-center justify-center text-xs font-bold mt-0.5"
                    style={{ background: `${roleInfo.color}20`, border: `1px solid ${roleInfo.color}40`, color: roleInfo.color }}
                  >
                    {activeAgent?.name[0] || 'A'}
                  </div>
                )}

                <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1.5`}>
                  {/* Message bubble */}
                  <div className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-violet-600 text-white rounded-tr-sm'
                      : 'bg-[var(--surface-2)] border border-[var(--border)] text-[var(--foreground)] rounded-tl-sm'
                  }`}>
                    {msg.isStreaming ? (
                      <div className="flex flex-col gap-2">
                        {/* Streaming animation */}
                        <div className="flex items-center gap-2 text-violet-400">
                          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                          <span className="font-medium">Building your app...</span>
                        </div>
                        {/* Show partial natural language if available */}
                        {getDisplayContent(msg.content) && (
                          <p className="text-[var(--text-muted)] whitespace-pre-wrap">{getDisplayContent(msg.content)}</p>
                        )}
                        {/* Animated dots */}
                        <div className="flex gap-1 mt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{displayContent || (appliedFiles.length > 0 ? 'Done! Applied changes to your project.' : msg.content)}</p>
                    )}
                  </div>

                  {/* Applied files badge + Preview button */}
                  {appliedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-1 items-center">
                      <div className="flex items-center gap-1 text-[10px] text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-2 py-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Applied to editor</span>
                      </div>
                      {appliedFiles.map((f) => (
                        <div key={f} className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] bg-[var(--surface-2)] border border-[var(--border)] rounded-full px-2 py-0.5">
                          <FileCode className="w-2.5 h-2.5" />
                          {f}
                        </div>
                      ))}
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent('workspace:openPreview'))}
                        className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded-full px-2.5 py-0.5 hover:bg-amber-400/20 transition-colors font-medium"
                      >
                        <Eye className="w-3 h-3" />
                        View Preview
                      </button>
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
              placeholder={isGenerating ? 'AI is building...' : 'Ask AI to build something...'}
              disabled={isGenerating}
              rows={1}
              className="flex-1 bg-transparent text-xs resize-none outline-none placeholder:text-[var(--text-muted)] disabled:opacity-50 max-h-28"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isGenerating}
              className="w-6 h-6 flex items-center justify-center rounded-lg bg-violet-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-violet-500 transition-colors shrink-0"
            >
              {isGenerating
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <Send className="w-3 h-3" />
              }
            </button>
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>

      {showConfig && <AIConfigPanel onClose={() => setShowConfig(false)} />}
    </>
  )
}
