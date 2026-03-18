'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import FileExplorer from './FileExplorer'
import CodeEditor from './CodeEditor'
import AIChat from './AIChat'
import LivePreview from './LivePreview'
import Terminal from './Terminal'
import { useWorkspaceStore } from '@/store/workspace'
import { Eye, Terminal as TermIcon, Play, Globe, Zap, ChevronLeft, Rocket, PanelRight, Save } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { getProject, upsertFile } from '@/lib/supabase/db'

interface Props {
  projectId: string
  initialPrompt?: string
}

type BottomPanel = 'terminal' | 'preview'

export default function WorkspaceLayout({ projectId, initialPrompt }: Props) {
  const { currentProject, setCurrentProject, addTerminalOutput, isGenerating } = useWorkspaceStore()
  const [bottomPanel, setBottomPanel] = useState<BottomPanel>('terminal')
  const [showLivePreview, setShowLivePreview] = useState(true)
  const [deployed, setDeployed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load project from Supabase on mount
  useEffect(() => {
    const load = async () => {
      try {
        // Try Supabase first
        const p = await getProject(projectId)
        setCurrentProject(p)
      } catch {
        // Fallback: might be a new project already in store
        console.log('Project not in DB yet or offline')
      }
    }
    load()
  }, [projectId, setCurrentProject])

  // Auto-save files to Supabase with debounce
  const syncFilesToDB = useCallback(async () => {
    if (!currentProject) return
    setSaving(true)
    try {
      await Promise.all(
        currentProject.files.map((f) => upsertFile(currentProject.id, f))
      )
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error('Auto-save failed:', e)
    } finally {
      setSaving(false)
    }
  }, [currentProject])

  // Debounced auto-save when files change
  useEffect(() => {
    if (!currentProject) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(syncFilesToDB, 1500)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [currentProject?.files, syncFilesToDB]) // eslint-disable-line react-hooks/exhaustive-deps

  // Send initial prompt to AI if provided via URL
  const promptSentRef = useRef(false)
  useEffect(() => {
    if (initialPrompt && currentProject && !promptSentRef.current) {
      promptSentRef.current = true
      // Small delay to let the workspace render fully
      setTimeout(() => {
        const event = new CustomEvent('ai:sendPrompt', { detail: initialPrompt })
        window.dispatchEvent(event)
      }, 800)
    }
  }, [initialPrompt, currentProject])

  const handleRun = () => {
    addTerminalOutput('$ npm run dev')
    addTerminalOutput('Starting dev server...')
    setTimeout(() => addTerminalOutput('✓ Ready on http://localhost:3000'), 800)
    setTimeout(() => addTerminalOutput('$ '), 900)
    setBottomPanel('terminal')
  }

  const handleDeploy = async () => {
    addTerminalOutput('$ devforge deploy --production')
    addTerminalOutput('Building project...')
    setTimeout(() => addTerminalOutput('✓ Build successful (0.3s)'), 600)
    setTimeout(() => addTerminalOutput('Uploading to edge network...'), 900)
    const deployUrl = `https://${currentProject?.name.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).slice(2, 7)}.devforge.app`
    setTimeout(() => addTerminalOutput(`✓ Deployed! ${deployUrl}`), 1400)
    setTimeout(() => addTerminalOutput('$ '), 1500)
    setTimeout(() => setDeployed(true), 1400)

    // Save deploy URL to DB
    if (currentProject) {
      const supabase = createClient()
      await supabase.from('projects').update({ deploy_url: deployUrl }).eq('id', currentProject.id)
    }

    setBottomPanel('terminal')
  }

  if (!currentProject) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin-slow mx-auto mb-4" />
          <p className="text-[var(--text-muted)]">Loading project...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--background)] overflow-hidden">
      {/* Top bar */}
      <header className="h-12 flex items-center justify-between px-4 border-b border-[var(--border)] bg-[var(--surface)] shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard" className="text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors shrink-0">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div className="w-px h-4 bg-[var(--border)] shrink-0" />
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center shrink-0">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold truncate">{currentProject.name}</span>
          </div>
          {/* Save indicator */}
          <div className="flex items-center gap-1 text-[10px] shrink-0">
            {saving && <span className="flex items-center gap-1 text-[var(--text-muted)]"><Save className="w-3 h-3 animate-pulse" />saving...</span>}
            {saved && !saving && <span className="text-green-400">✓ saved</span>}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setShowLivePreview(!showLivePreview)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${showLivePreview ? 'bg-violet-600/20 text-violet-400' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'}`}
          >
            <PanelRight className="w-3.5 h-3.5" />
            Preview
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
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
        {/* File Explorer */}
        <div className="w-44 shrink-0 border-r border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <FileExplorer />
        </div>

        {/* Editor + Terminal */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Code Editor — takes 65% */}
          <div className="flex-[65] overflow-hidden border-b border-[var(--border)]">
            <CodeEditor />
          </div>

          {/* Bottom Panel — takes 35% */}
          <div className="flex-[35] flex flex-col bg-[var(--surface)] min-h-0">
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

        {/* AI Chat */}
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
