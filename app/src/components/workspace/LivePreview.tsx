'use client'
import { useEffect, useRef, useState } from 'react'
import { RefreshCw, ExternalLink, Globe, Maximize2, Zap } from 'lucide-react'
import { useWorkspaceStore } from '@/store/workspace'

export default function LivePreview() {
  const { currentProject } = useWorkspaceStore()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [wcUrl, setWcUrl] = useState<string | null>(null)
  const [mode, setMode] = useState<'static' | 'webcontainer'>('static')

  useEffect(() => {
    const stored = sessionStorage.getItem('wc_server_url')
    if (stored) { setWcUrl(stored); setMode('webcontainer') }
    const interval = setInterval(() => {
      const url = sessionStorage.getItem('wc_server_url')
      if (url && url !== wcUrl) { setWcUrl(url); setMode('webcontainer') }
    }, 1000)
    return () => clearInterval(interval)
  }, [wcUrl])

  const buildPreviewHtml = () => {
    if (!currentProject) return '<p style="font-family:sans-serif;padding:2rem;color:#888">No project loaded</p>'

    const htmlFile = currentProject.files.find((f) => f.name.endsWith('.html'))
    const cssFiles = currentProject.files.filter((f) => f.name.endsWith('.css'))
    const jsFiles = currentProject.files.filter((f) => f.name.endsWith('.js'))

    let html = htmlFile?.content || '<!DOCTYPE html><html><head></head><body></body></html>'

    // Remove external CSS/JS links — they don't resolve in blob URL context
    html = html.replace(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi, '')
    html = html.replace(/<link[^>]+\.css[^>]*>/gi, '')
    html = html.replace(/<script[^>]+src=["'][^"']*\.js["'][^>]*><\/script>/gi, '')

    // Inline all CSS files
    if (cssFiles.length > 0) {
      const allCss = cssFiles.map((f) => f.content).join('\n')
      if (html.includes('</head>')) {
        html = html.replace('</head>', `<style>${allCss}</style></head>`)
      } else {
        html = `<style>${allCss}</style>` + html
      }
    }

    // Inline all JS files
    if (jsFiles.length > 0) {
      const allJs = jsFiles.map((f) => f.content).join('\n')
      if (html.includes('</body>')) {
        html = html.replace('</body>', `<script>${allJs}<\/script></body>`)
      } else {
        html += `<script>${allJs}<\/script>`
      }
    }

    return html
  }

  const loadStatic = () => {
    setIsLoading(true)
    if (!iframeRef.current) return
    const html = buildPreviewHtml()
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    iframeRef.current.src = url
    const timer = setTimeout(() => {
      URL.revokeObjectURL(url)
      setIsLoading(false)
    }, 400)
    return () => clearTimeout(timer)
  }

  const refresh = () => {
    if (mode === 'webcontainer' && wcUrl && iframeRef.current) {
      setIsLoading(true)
      iframeRef.current.src = wcUrl
      setTimeout(() => setIsLoading(false), 800)
    } else {
      loadStatic()
    }
  }

  useEffect(() => {
    if (mode === 'static') {
      const t = setTimeout(loadStatic, 600)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject?.files, mode])

  useEffect(() => {
    if (mode === 'webcontainer' && wcUrl && iframeRef.current) {
      setIsLoading(true)
      iframeRef.current.src = wcUrl
      setTimeout(() => setIsLoading(false), 1000)
    }
  }, [wcUrl, mode])

  useEffect(() => { loadStatic() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const openExternal = () => {
    if (mode === 'webcontainer' && wcUrl) { window.open(wcUrl, '_blank'); return }
    const html = buildPreviewHtml()
    const blob = new Blob([html], { type: 'text/html' })
    window.open(URL.createObjectURL(blob), '_blank')
  }

  return (
    <div className={`flex flex-col h-full ${fullscreen ? 'fixed inset-0 z-50 bg-[var(--background)]' : ''}`}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] bg-[var(--surface-2)] shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Globe className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
          <div className="bg-[var(--surface-3)] rounded px-3 py-1 text-xs text-[var(--text-muted)] truncate flex-1">
            {mode === 'webcontainer' && wcUrl ? wcUrl : 'preview://localhost'}
          </div>
          {mode === 'webcontainer' && (
            <span className="flex items-center gap-1 text-[10px] text-green-400 shrink-0">
              <Zap className="w-2.5 h-2.5" />WC
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          {isLoading && <RefreshCw className="w-3.5 h-3.5 text-violet-400 animate-spin-slow" />}
          <button onClick={refresh} className="p-1.5 rounded hover:bg-[var(--surface-3)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors" title="Refresh">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setFullscreen(!fullscreen)} className="p-1.5 rounded hover:bg-[var(--surface-3)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={openExternal} className="p-1.5 rounded hover:bg-[var(--surface-3)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors">
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white relative overflow-hidden">
        <iframe
          ref={iframeRef}
          title="Live Preview"
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
        />
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center pointer-events-none">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin-slow" />
          </div>
        )}
      </div>
    </div>
  )
}
