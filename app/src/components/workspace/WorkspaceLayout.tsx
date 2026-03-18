'use client'
import { useState, useEffect } from 'react'
import FileExplorer from './FileExplorer'
import CodeEditor from './CodeEditor'
import AIChat from './AIChat'
import LivePreview from './LivePreview'
import Terminal from './Terminal'
import { useWorkspaceStore } from '@/store/workspace'
import { Eye, Terminal as TermIcon, Play, Globe, Zap, ChevronLeft, Rocket, PanelRight } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'

interface Props {
  projectId: string
  initialPrompt?: string
}

type BottomPanel = 'terminal' | 'preview'

export default function WorkspaceLayout({ projectId, initialPrompt }: Props) {
  const { currentProject, projects, setCurrentProject, addTerminalOutput, isGenerating } = useWorkspaceStore()
  const [bottomPanel, setBottomPanel] = useState<BottomPanel>('terminal')
  const [showLivePreview, setShowLivePreview] = useState(true)
  const [deployed, setDeployed] = useState(false)

  useEffect(() => {
    if (!currentProject || currentProject.id !== projectId) {
      const p = projects.find((p) => p.id === projectId)
      if (p) setCurrentProject(p)
    }
  }, [projectId, projects, currentProject, setCurrentProject])

  const handleRun = () => {
    addTerminalOutput('$ npm run dev')
    addTerminalOutput('Starting development server...')
    setTimeout(() => addTerminalOutput('✓ Ready on http://localhost:3000'), 800)
    setTimeout(() => addTerminalOutput('$ '), 900)
    setBottomPanel('terminal')
  }

  const handleDeploy = () => {
    addTerminalOutput('$ deploy --production')
    addTerminalOutput('Building project...')
    setTimeout(() => addTerminalOutput('✓ Build successful'), 600)
    setTimeout(() => addTerminalOutput('Uploading to CDN...'), 800)
    setTimeout(() => addTerminalOutput('✓ Deployed! https://my-app-xyz.devforge.app'), 1200)
    setTimeout(() => addTerminalOutput('$ '), 1300)
    setTimeout(() => setDeployed(true), 1200)
    setBottomPanel('terminal')
  }

  if (!currentProject) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="text-3xl mb-4">🔍</div>
          <p className="text-[var(--text-muted)] mb-4">Project not found</p>
          <Link href="/dashboard"><Button>Back to Dashboard</Button></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--background)] overflow-hidden">
      {/* Top bar */}
      <header className="h-12 flex items-center justify-between px-4 border-b border-[var(--border)] bg-[var(--surface)] shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div className="w-px h-4 bg-[var(--border)]" />
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold">{currentProject.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowLivePreview(!showLivePreview)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${showLivePreview ? 'bg-violet-600/20 text-violet-400' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'}`}
          >
            <PanelRight className="w-3.5 h-3.5" />
            Preview
          </button>
        </div>

        <div className="flex items-center gap-2">
          {deployed && (
            <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-1.5">
              <Globe className="w-3.5 h-3.5" />
              Live
            </div>
          )}
          <Button variant="secondary" size="sm" onClick={handleRun} disabled={isGenerating}>
            <Play className="w-3.5 h-3.5" />
            Run
          </Button>
          <Button size="sm" onClick={handleDeploy}>
            <Rocket className="w-3.5 h-3.5" />
            Deploy
          </Button>
        </div>
      </header>

      {/* Main workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer — fixed width */}
        <div className="w-44 shrink-0 border-r border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <FileExplorer />
        </div>

        {/* Editor + Terminal — flex grow */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Code Editor */}
          <div className="flex-1 overflow-hidden border-b border-[var(--border)]">
            <CodeEditor />
          </div>

          {/* Bottom panel tabs */}
          <div className="h-48 flex flex-col bg-[var(--surface)] border-b border-[var(--border)]">
            <div className="flex items-center border-b border-[var(--border)] bg-[var(--surface-2)] shrink-0">
              {(['terminal', 'preview'] as BottomPanel[]).map((panel) => (
                <button
                  key={panel}
                  onClick={() => setBottomPanel(panel)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs transition-colors border-b-2 ${
                    bottomPanel === panel
                      ? 'border-violet-500 text-[var(--foreground)]'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {panel === 'terminal' ? <TermIcon className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {panel.charAt(0).toUpperCase() + panel.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-hidden">
              {bottomPanel === 'terminal' ? <Terminal /> : <LivePreview />}
            </div>
          </div>
        </div>

        {/* AI Chat — fixed width */}
        <div className="w-80 shrink-0 border-l border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <AIChat />
        </div>

        {/* Live Preview panel */}
        {showLivePreview && (
          <div className="w-72 shrink-0 border-l border-[var(--border)] bg-[var(--surface)] flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)] bg-[var(--surface-2)] text-xs shrink-0">
              <Eye className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-[var(--text-muted)]">Live Preview</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <LivePreview />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
