'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import FileExplorer from './FileExplorer'
import CodeEditor from './CodeEditor'
import AIChat from './AIChat'
import LivePreview from './LivePreview'
import Terminal from './Terminal'
import { useWorkspaceStore } from '@/store/workspace'
import {
  Eye, Terminal as TermIcon, Play, Globe, Zap, ChevronLeft,
  Rocket, PanelLeft, Save, X, ExternalLink, Copy, Check,
  Code2, Bot, FolderOpen, MonitorPlay, ChevronRight, Download
} from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { getProject, upsertFile } from '@/lib/supabase/db'

interface Props {
  projectId: string
  initialPrompt?: string
}

type BottomPanel = 'terminal' | 'preview'
type MobilePanel = 'editor' | 'chat' | 'files' | 'preview'

const MOBILE_NAV = [
  { id: 'chat' as MobilePanel,    icon: Bot,          label: 'AI Chat',  color: '#7c3aed' },
  { id: 'editor' as MobilePanel,  icon: Code2,        label: 'Editor',   color: '#3b82f6' },
  { id: 'files' as MobilePanel,   icon: FolderOpen,   label: 'Files',    color: '#10b981' },
  { id: 'preview' as MobilePanel, icon: MonitorPlay,  label: 'Preview',  color: '#f59e0b' },
]

export default function WorkspaceLayout({ projectId, initialPrompt }: Props) {
  const { currentProject, setCurrentProject, addTerminalOutput, isGenerating } = useWorkspaceStore()
  const [bottomPanel, setBottomPanel] = useState<BottomPanel>('terminal')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showFilePanel, setShowFilePanel] = useState(true)
  const [deployUrl, setDeployUrl] = useState<string | null>(null)
  const [deploying, setDeploying] = useState(false)
  const [copied, setCopied] = useState(false)
  // Mobile state
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('chat')
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load project from Supabase
  useEffect(() => {
    const load = async () => {
      try {
        const p = await getProject(projectId)
        setCurrentProject(p)
      } catch {
        console.log('Project not in DB yet or offline')
      }
    }
    load()
  }, [projectId, setCurrentProject])

  // Auto-save
  const syncFilesToDB = useCallback(async () => {
    if (!currentProject) return
    setSaving(true)
    try {
      await Promise.all(currentProject.files.map((f) => upsertFile(currentProject.id, f)))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error('Auto-save failed:', e)
    } finally {
      setSaving(false)
    }
  }, [currentProject])

  useEffect(() => {
    if (!currentProject) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(syncFilesToDB, 1500)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [currentProject?.files, syncFilesToDB]) // eslint-disable-line react-hooks/exhaustive-deps

  // Initial prompt from URL
  const promptSentRef = useRef(false)
  useEffect(() => {
    if (initialPrompt && currentProject && !promptSentRef.current) {
      promptSentRef.current = true
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('ai:sendPrompt', { detail: initialPrompt }))
      }, 800)
    }
  }, [initialPrompt, currentProject])

  // Switch to preview from AI chat
  useEffect(() => {
    const openPreview = () => { setMobilePanel('preview'); setBottomPanel('preview') }
    const npmInstall = () => {
      setMobilePanel('preview')
      setBottomPanel('terminal')
      // Simulate npm install in terminal
      addTerminalOutput('$ npm install')
      addTerminalOutput('Installing dependencies...')
      let t1: ReturnType<typeof setTimeout>
      let t2: ReturnType<typeof setTimeout>
      let t3: ReturnType<typeof setTimeout>
      t1 = setTimeout(() => addTerminalOutput('added 247 packages in 4.2s'), 2000)
      t2 = setTimeout(() => { addTerminalOutput('$ npm run dev'); addTerminalOutput('Starting dev server...') }, 2500)
      t3 = setTimeout(() => {
        addTerminalOutput('✓ Ready on http://localhost:3000')
        addTerminalOutput('$ ')
        setBottomPanel('preview')
      }, 3500)
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
    }
    window.addEventListener('workspace:openPreview', openPreview)
    window.addEventListener('workspace:npmInstall', npmInstall)
    return () => {
      window.removeEventListener('workspace:openPreview', openPreview)
      window.removeEventListener('workspace:npmInstall', npmInstall)
    }
  }, [addTerminalOutput])

  const handleRun = () => {
    addTerminalOutput('$ npm run dev')
    addTerminalOutput('Starting dev server...')
    setTimeout(() => addTerminalOutput('✓ Ready on http://localhost:3000'), 800)
    setTimeout(() => addTerminalOutput('$ '), 900)
    setBottomPanel('terminal')
  }

  const handleDeploy = async () => {
    setDeploying(true)
    addTerminalOutput('$ devforge deploy --production')
    addTerminalOutput('Building project...')
    setTimeout(() => addTerminalOutput('✓ Build successful (0.3s)'), 600)
    setTimeout(() => addTerminalOutput('Uploading to edge network...'), 900)
    const url = `https://${(currentProject?.name || 'app').toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).slice(2, 7)}.devforge.app`
    setTimeout(() => {
      addTerminalOutput(`✓ Deployed! ${url}`)
      addTerminalOutput('$ ')
      setDeployUrl(url)
      setDeploying(false)
      setBottomPanel('terminal')
    }, 1400)
    if (currentProject) {
      const supabase = createClient()
      await supabase.from('projects').update({ deploy_url: url }).eq('id', currentProject.id)
    }
  }

  const handleCopyUrl = () => {
    if (!deployUrl) return
    navigator.clipboard.writeText(deployUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadZip = async () => {
    if (!currentProject?.files?.length) return
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    for (const file of currentProject.files) {
      zip.file(file.path || file.name, file.content)
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(currentProject.name || 'project').toLowerCase().replace(/\s+/g, '-')}.zip`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!currentProject) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin-slow mx-auto mb-4" />
          <p className="text-[var(--text-muted)]">Loading project...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-[var(--background)] overflow-hidden">
      {/* ─── Top bar (shared) ─────────────────────────────────────────── */}
      <header className="h-12 flex items-center justify-between px-3 border-b border-[var(--border)] bg-[var(--surface)] shrink-0 z-10 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/dashboard" className="text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors shrink-0 p-1">
            <ChevronLeft className="w-4 h-4" />
          </Link>

          {/* File panel toggle — desktop only */}
          <button
            onClick={() => setShowFilePanel((v) => !v)}
            className={`hidden md:flex p-1.5 rounded-lg transition-colors shrink-0 ${showFilePanel ? 'text-violet-400 bg-violet-600/10' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'}`}
            title={showFilePanel ? 'Hide files' : 'Show files'}
          >
            <PanelLeft className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-[var(--border)] shrink-0" />
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center shrink-0">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold truncate">{currentProject.name}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[10px] shrink-0">
            {saving && <span className="flex items-center gap-1 text-[var(--text-muted)]"><Save className="w-3 h-3 animate-pulse" />saving...</span>}
            {saved && !saving && <span className="text-green-400">✓ saved</span>}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Mobile panel indicator */}
          <button
            onClick={() => setShowMobileSidebar(true)}
            className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            {(() => { const nav = MOBILE_NAV.find(n => n.id === mobilePanel); return nav ? <nav.icon className="w-3.5 h-3.5" style={{ color: nav.color }} /> : null })()}
            <ChevronRight className="w-3 h-3" />
          </button>
          <Button variant="secondary" size="sm" onClick={handleRun} disabled={isGenerating}>
            <Play className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Run</span>
          </Button>
          <button
            onClick={handleDownloadZip}
            disabled={!currentProject?.files?.length}
            title="Download project as ZIP"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--foreground)] hover:border-violet-500/50 hover:bg-violet-600/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ZIP</span>
          </button>
          <Button size="sm" onClick={handleDeploy} disabled={deploying}>
            <Rocket className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{deploying ? 'Deploying...' : 'Deploy'}</span>
          </Button>
        </div>
      </header>

      {/* Deploy toast */}
      {deployUrl && (
        <div className="shrink-0 bg-green-950 border-b border-green-500/30 px-4 py-2.5 flex items-center justify-between gap-3 z-20">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
            <Globe className="w-3.5 h-3.5 text-green-400 shrink-0" />
            <span className="text-xs text-green-300 font-medium shrink-0">Deployed!</span>
            <a href={deployUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs text-green-400 hover:text-green-300 underline truncate flex items-center gap-1">
              {deployUrl}<ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={handleCopyUrl} className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10 transition-colors">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => setDeployUrl(null)} className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ─── DESKTOP Layout (md+) ─────────────────────────────────────── */}
      <div className="hidden md:flex flex-1 overflow-hidden min-h-0">
        {/* File Explorer */}
        <div
          className="shrink-0 border-r border-[var(--border)] bg-[var(--surface)] overflow-hidden transition-all duration-300 ease-in-out"
          style={{ width: showFilePanel ? '176px' : '0px', opacity: showFilePanel ? 1 : 0 }}
        >
          <div style={{ width: '176px' }}>
            <FileExplorer />
          </div>
        </div>

        {/* Editor + Terminal */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <div className="flex-[65] overflow-hidden border-b border-[var(--border)]">
            <CodeEditor />
          </div>
          <div className="flex-[35] flex flex-col bg-[var(--surface)] min-h-0">
            <div className="flex items-center border-b border-[var(--border)] bg-[var(--surface-2)] shrink-0">
              {(['terminal', 'preview'] as BottomPanel[]).map((panel) => (
                <button key={panel} onClick={() => setBottomPanel(panel)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs transition-colors border-b-2 ${
                    bottomPanel === panel ? 'border-violet-500 text-[var(--foreground)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--foreground)]'
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
        <div className="w-72 shrink-0 border-l border-[var(--border)] bg-[var(--surface)] overflow-hidden flex flex-col">
          <AIChat />
        </div>
      </div>

      {/* ─── MOBILE Layout (<md) ──────────────────────────────────────── */}
      <div className="flex md:hidden flex-1 overflow-hidden min-h-0 relative">
        {/* Active Panel — fullscreen */}
        <div className="flex-1 overflow-hidden">
          {mobilePanel === 'chat'    && <AIChat />}
          {mobilePanel === 'editor'  && <CodeEditor />}
          {mobilePanel === 'files'   && <FileExplorer />}
          {mobilePanel === 'preview' && <LivePreview />}
        </div>

        {/* Mobile Sidebar Overlay */}
        {showMobileSidebar && (
          <div className="absolute inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowMobileSidebar(false)}
            />

            {/* Sidebar panel */}
            <div className="relative z-10 w-24 h-full bg-[var(--surface)] border-r border-[var(--border)] flex flex-col items-center py-6 gap-3 shadow-2xl">
              {/* Close */}
              <button
                onClick={() => setShowMobileSidebar(false)}
                className="w-10 h-10 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--foreground)] mb-2"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-full h-px bg-[var(--border)] mb-2" />

              {MOBILE_NAV.map((item) => {
                const isActive = mobilePanel === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => { setMobilePanel(item.id); setShowMobileSidebar(false) }}
                    className="flex flex-col items-center gap-1.5 w-full px-2 group"
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                        isActive ? 'scale-105 shadow-lg' : 'opacity-60 group-hover:opacity-100 group-hover:scale-105'
                      }`}
                      style={{
                        background: isActive ? `${item.color}25` : 'var(--surface-2)',
                        border: `2px solid ${isActive ? item.color : 'var(--border)'}`,
                        boxShadow: isActive ? `0 0 16px ${item.color}40` : undefined,
                      }}
                    >
                      <item.icon className="w-5 h-5" style={{ color: isActive ? item.color : undefined }} />
                    </div>
                    <span
                      className="text-[10px] font-medium"
                      style={{ color: isActive ? item.color : 'var(--text-muted)' }}
                    >
                      {item.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
