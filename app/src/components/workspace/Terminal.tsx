'use client'
import { useEffect, useRef, useState } from 'react'
import { Terminal as TermIcon, Trash2, ChevronRight } from 'lucide-react'
import { useWorkspaceStore } from '@/store/workspace'

const COMMANDS: Record<string, string[]> = {
  'npm install': ['Installing packages...', 'added 127 packages in 2.3s', '✓ Done'],
  'npm run build': ['Building project...', '▲ Next.js 14.0', '✓ Compiled successfully'],
  'npm start': ['Starting server...', 'Server running on http://localhost:3000'],
  'npm test': ['Running tests...', 'PASS src/app.test.js', '✓ All tests passed'],
  'ls': ['index.html  style.css  script.js  package.json'],
  'pwd': ['/workspace/project'],
  'node -v': ['v20.11.0'],
  'npm -v': ['10.2.4'],
  'git init': ['Initialized empty Git repository in /workspace/project/.git/'],
  'git status': ['On branch main', 'nothing to commit, working tree clean'],
  'clear': [],
  'help': [
    'Available commands:',
    '  npm install  - Install dependencies',
    '  npm run build - Build project',
    '  npm start    - Start dev server',
    '  npm test     - Run tests',
    '  ls           - List files',
    '  clear        - Clear terminal',
    '  git init     - Initialize git repo',
  ],
}

export default function Terminal() {
  const { terminalOutput, addTerminalOutput, clearTerminal } = useWorkspaceStore()
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [terminalOutput])

  const runCommand = (cmd: string) => {
    const trimmed = cmd.trim()
    if (!trimmed) return

    addTerminalOutput(`$ ${trimmed}`)
    setHistory((h) => [trimmed, ...h])
    setHistoryIdx(-1)

    if (trimmed === 'clear') {
      clearTerminal()
      return
    }

    const known = COMMANDS[trimmed]
    if (known) {
      known.forEach((line, i) => {
        setTimeout(() => addTerminalOutput(line), i * 150)
      })
      setTimeout(() => addTerminalOutput('$ '), known.length * 150 + 100)
    } else {
      // Try partial matches
      const match = Object.keys(COMMANDS).find((k) => trimmed.startsWith(k.split(' ')[0]))
      if (match) {
        addTerminalOutput(`bash: ${trimmed}: command not found (try: ${match})`)
      } else {
        addTerminalOutput(`bash: ${trimmed}: command not found. Type 'help' for available commands.`)
      }
      addTerminalOutput('$ ')
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      runCommand(input)
      setInput('')
    } else if (e.key === 'ArrowUp') {
      const idx = Math.min(historyIdx + 1, history.length - 1)
      setHistoryIdx(idx)
      setInput(history[idx] || '')
    } else if (e.key === 'ArrowDown') {
      const idx = Math.max(historyIdx - 1, -1)
      setHistoryIdx(idx)
      setInput(idx === -1 ? '' : history[idx])
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0d0d14] font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] bg-[var(--surface-2)]">
        <div className="flex items-center gap-2 text-[var(--text-muted)]">
          <TermIcon className="w-3.5 h-3.5" />
          <span className="text-[10px] uppercase tracking-wider">Terminal</span>
        </div>
        <button onClick={clearTerminal} className="text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors" title="Clear">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Output */}
      <div
        className="flex-1 overflow-y-auto p-3 space-y-0.5 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {terminalOutput.map((line, i) => (
          <div key={i} className={`leading-5 ${
            line.startsWith('$') ? 'text-green-400' :
            line.startsWith('✓') || line.startsWith('✓') ? 'text-emerald-400' :
            line.startsWith('bash:') || line.includes('error') ? 'text-red-400' :
            line.startsWith('▲') ? 'text-violet-400' :
            'text-[#a0a0b8]'
          }`}>
            {line}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-[var(--border)]">
        <ChevronRight className="w-3.5 h-3.5 text-green-400 shrink-0" />
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          className="flex-1 bg-transparent text-[#a0a0b8] focus:outline-none text-xs placeholder:text-[var(--text-muted)]"
          placeholder="Type a command... (try: help)"
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  )
}
