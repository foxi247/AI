'use client'
import { useEffect, useRef, useState } from 'react'
import { Terminal as TermIcon, Trash2, ChevronRight, Wifi, WifiOff } from 'lucide-react'
import { useWorkspaceStore } from '@/store/workspace'

// Safe import: WebContainer only works in browser with COOP/COEP headers
let wcProvider: typeof import('./WebContainerProvider') | null = null
if (typeof window !== 'undefined') {
  import('./WebContainerProvider').then((m) => { wcProvider = m }).catch(() => {})
}

// Fallback simulated commands when WebContainer is not available
const SIMULATED: Record<string, string[]> = {
  'ls': ['index.html  style.css  script.js  package.json'],
  'pwd': ['/workspace'],
  'node -v': ['v20.11.0'],
  'npm -v': ['10.2.4'],
  'npm install': ['npm warn idealTree already exists', 'added 0 packages in 0.3s'],
  'npm run dev': ['> dev', '> vite', 'VITE v5.0.0  ready in 300ms', '➜  Local:   http://localhost:5173/'],
  'git init': ['Initialized empty Git repository in /workspace/.git/'],
  'git status': ['On branch main', 'nothing to commit, working tree clean'],
  'clear': [],
  'help': [
    'Available commands (WebContainer mode):',
    '  npm install   Install packages',
    '  npm run dev   Start dev server',
    '  npm run build Build project',
    '  node script.js  Run a script',
    '  ls / pwd / cat  File operations',
    '  clear           Clear terminal',
  ],
}

function SimulatedTerminal() {
  const { terminalOutput, addTerminalOutput, clearTerminal } = useWorkspaceStore()
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [terminalOutput])

  const run = (cmd: string) => {
    const t = cmd.trim()
    if (!t) return
    addTerminalOutput(`$ ${t}`)
    setHistory((h) => [t, ...h])
    setHistoryIdx(-1)
    if (t === 'clear') { clearTerminal(); return }
    const out = SIMULATED[t]
    if (out) {
      out.forEach((l, i) => setTimeout(() => addTerminalOutput(l), i * 80))
      setTimeout(() => addTerminalOutput('$ '), out.length * 80 + 80)
    } else {
      addTerminalOutput(`bash: ${t}: command not found. Type 'help'`)
      addTerminalOutput('$ ')
    }
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { run(input); setInput('') }
    else if (e.key === 'ArrowUp') { const i = Math.min(historyIdx + 1, history.length - 1); setHistoryIdx(i); setInput(history[i] || '') }
    else if (e.key === 'ArrowDown') { const i = Math.max(historyIdx - 1, -1); setHistoryIdx(i); setInput(i === -1 ? '' : history[i]) }
  }

  return (
    <div className="flex flex-col h-full bg-[#0d0d14] font-mono text-xs">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] bg-[var(--surface-2)]">
        <div className="flex items-center gap-2 text-[var(--text-muted)]">
          <TermIcon className="w-3.5 h-3.5" />
          <span className="text-[10px] uppercase tracking-wider">Terminal</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-3)] text-yellow-500">simulated</span>
        </div>
        <button onClick={clearTerminal} className="text-[var(--text-muted)] hover:text-[var(--foreground)]"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-0.5 cursor-text" onClick={() => inputRef.current?.focus()}>
        {terminalOutput.map((line, i) => (
          <div key={i} className={`leading-5 ${line.startsWith('$') ? 'text-green-400' : line.startsWith('✓') ? 'text-emerald-400' : line.includes('error') || line.startsWith('bash:') ? 'text-red-400' : 'text-[#a0a0b8]'}`}>
            {line}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-center gap-2 px-3 py-2 border-t border-[var(--border)]">
        <ChevronRight className="w-3.5 h-3.5 text-green-400 shrink-0" />
        <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey}
          className="flex-1 bg-transparent text-[#a0a0b8] focus:outline-none text-xs placeholder:text-[var(--text-muted)]"
          placeholder="Type a command... (help)" spellCheck={false} autoComplete="off" />
      </div>
    </div>
  )
}

function RealTerminal() {
  const [lines, setLines] = useState<{ text: string; type: 'output' | 'input' | 'error' | 'info' }[]>([
    { text: '⚡ WebContainer booting...', type: 'info' },
  ])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const [wcReady, setWcReady] = useState(false)
  const [wcError, setWcError] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const runCommandRef = useRef<((cmd: string, cb: (d: string) => void) => Promise<void>) | null>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [lines])

  useEffect(() => {
    const tryBoot = async () => {
      try {
        const { WebContainer } = await import('@webcontainer/api')
        const wc = await WebContainer.boot()
        runCommandRef.current = async (cmd: string, onData: (d: string) => void) => {
          const parts = cmd.trim().split(/\s+/)
          const proc = await wc.spawn(parts[0], parts.slice(1))
          proc.output.pipeTo(new WritableStream({ write(d) { onData(d) } }))
          await proc.exit
        }
        wc.on('server-ready', (port, url) => {
          setLines((l) => [...l, { text: `✓ Server ready: ${url}`, type: 'info' }])
        })
        setWcReady(true)
        setLines((l) => [...l, { text: '✓ WebContainer ready! Real Node.js environment.', type: 'info' }, { text: '$ ', type: 'input' }])
      } catch (e) {
        setWcError(true)
        setLines((l) => [...l, { text: `⚠️  WebContainer unavailable: ${e}`, type: 'error' }, { text: 'Tip: Requires Chrome/Edge with HTTPS and COOP/COEP headers.', type: 'info' }])
      }
    }
    tryBoot()
  }, [])

  const addLine = (text: string, type: typeof lines[0]['type'] = 'output') =>
    setLines((l) => [...l, { text, type }])

  const run = async (cmd: string) => {
    const t = cmd.trim()
    if (!t) return
    addLine(`$ ${t}`, 'input')
    setHistory((h) => [t, ...h])
    setHistoryIdx(-1)

    if (t === 'clear') { setLines([]); return }

    if (wcReady && runCommandRef.current) {
      let buf = ''
      try {
        await runCommandRef.current(t, (data) => {
          buf += data
          // Stream output line by line
          const parts = buf.split('\n')
          buf = parts.pop() || ''
          parts.forEach((p) => p && addLine(p, 'output'))
        })
        if (buf) addLine(buf, 'output')
      } catch {
        addLine(`bash: ${t.split(' ')[0]}: command not found`, 'error')
      }
    } else {
      // Fallback to simulated
      const out = SIMULATED[t]
      if (out) { out.forEach((l) => addLine(l, 'output')) }
      else { addLine(`bash: ${t.split(' ')[0]}: command not found`, 'error') }
    }
    addLine('$ ', 'input')
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { run(input); setInput('') }
    else if (e.key === 'ArrowUp') { const i = Math.min(historyIdx + 1, history.length - 1); setHistoryIdx(i); setInput(history[i] || '') }
    else if (e.key === 'ArrowDown') { const i = Math.max(historyIdx - 1, -1); setHistoryIdx(i); setInput(i === -1 ? '' : history[i]) }
  }

  return (
    <div className="flex flex-col h-full bg-[#0d0d14] font-mono text-xs">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] bg-[var(--surface-2)]">
        <div className="flex items-center gap-2 text-[var(--text-muted)]">
          <TermIcon className="w-3.5 h-3.5" />
          <span className="text-[10px] uppercase tracking-wider">Terminal</span>
          {wcReady
            ? <span className="flex items-center gap-1 text-[10px] text-green-400"><Wifi className="w-2.5 h-2.5" />WebContainer</span>
            : wcError
            ? <span className="flex items-center gap-1 text-[10px] text-yellow-500"><WifiOff className="w-2.5 h-2.5" />Simulated</span>
            : <span className="text-[10px] text-[var(--text-muted)]">booting...</span>
          }
        </div>
        <button onClick={() => setLines([])} className="text-[var(--text-muted)] hover:text-[var(--foreground)]"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-0.5 cursor-text" onClick={() => inputRef.current?.focus()}>
        {lines.map((l, i) => (
          <div key={i} className={`leading-5 whitespace-pre-wrap ${
            l.type === 'input' ? 'text-green-400' :
            l.type === 'error' ? 'text-red-400' :
            l.type === 'info' ? 'text-violet-400' :
            'text-[#a0a0b8]'
          }`}>
            {l.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 px-3 py-2 border-t border-[var(--border)]">
        <ChevronRight className="w-3.5 h-3.5 text-green-400 shrink-0" />
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          disabled={!wcReady && !wcError}
          className="flex-1 bg-transparent text-[#a0a0b8] focus:outline-none text-xs placeholder:text-[var(--text-muted)] disabled:opacity-40"
          placeholder={wcReady ? 'npm install, node script.js, ls...' : 'Booting WebContainer...'}
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  )
}

export default function Terminal() {
  // Use real WebContainer terminal (with fallback built-in)
  return <RealTerminal />
}
