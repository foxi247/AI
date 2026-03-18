'use client'
import { useEffect, useRef, useState } from 'react'
import { RefreshCw, ExternalLink, Globe, Maximize2 } from 'lucide-react'
import { useWorkspaceStore } from '@/store/workspace'

export default function LivePreview() {
  const { currentProject } = useWorkspaceStore()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  const buildPreviewHtml = () => {
    if (!currentProject) return '<p>No project loaded</p>'

    const htmlFile = currentProject.files.find((f) => f.name.endsWith('.html'))
    const cssFile = currentProject.files.find((f) => f.name.endsWith('.css'))
    const jsFile = currentProject.files.find((f) => f.name.endsWith('.js'))

    if (htmlFile) {
      let html = htmlFile.content
      // Inject CSS
      if (cssFile && !html.includes(cssFile.path)) {
        html = html.replace('</head>', `<style>${cssFile.content}</style></head>`)
      }
      // Inject JS
      if (jsFile && !html.includes(jsFile.path)) {
        html = html.replace('</body>', `<script>${jsFile.content}</script></body>`)
      }
      return html
    }

    // If no HTML file, wrap content
    const css = cssFile?.content || ''
    const js = jsFile?.content || ''
    return `<!DOCTYPE html><html><head><style>${css}</style></head><body>${js ? `<script>${js}</script>` : ''}</body></html>`
  }

  const refresh = () => {
    setIsLoading(true)
    if (iframeRef.current) {
      const html = buildPreviewHtml()
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      iframeRef.current.src = url
      setTimeout(() => {
        URL.revokeObjectURL(url)
        setIsLoading(false)
      }, 500)
    }
  }

  useEffect(() => {
    const timer = setTimeout(refresh, 500)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject?.files])

  useEffect(() => {
    refresh()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={`flex flex-col h-full ${fullscreen ? 'fixed inset-0 z-50 bg-[var(--background)]' : ''}`}>
      {/* Preview toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] bg-[var(--surface-2)]">
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <div className="bg-[var(--surface-3)] rounded px-3 py-1 text-xs text-[var(--text-muted)] flex-1 max-w-xs">
            preview://localhost
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isLoading && <RefreshCw className="w-3.5 h-3.5 text-violet-400 animate-spin-slow" />}
          <button onClick={refresh} className="p-1.5 rounded hover:bg-[var(--surface-3)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors" title="Refresh">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setFullscreen(!fullscreen)} className="p-1.5 rounded hover:bg-[var(--surface-3)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors" title="Fullscreen">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              const html = buildPreviewHtml()
              const blob = new Blob([html], { type: 'text/html' })
              const url = URL.createObjectURL(blob)
              window.open(url, '_blank')
            }}
            className="p-1.5 rounded hover:bg-[var(--surface-3)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* iframe */}
      <div className="flex-1 bg-white relative">
        <iframe
          ref={iframeRef}
          title="Live Preview"
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
        />
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin-slow" />
          </div>
        )}
      </div>
    </div>
  )
}
