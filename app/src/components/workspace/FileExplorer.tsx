'use client'
import { useState } from 'react'
import { File, Plus, Trash2, ChevronRight } from 'lucide-react'
import { useWorkspaceStore } from '@/store/workspace'
import { ProjectFile } from '@/lib/types'

const LANG_COLORS: Record<string, string> = {
  html: '#e34c26',
  css: '#264de4',
  javascript: '#f7df1e',
  typescript: '#3178c6',
  python: '#3776ab',
  json: '#292929',
  markdown: '#083fa1',
}

export default function FileExplorer() {
  const { currentProject, activeFile, setActiveFile, addFile, deleteFile } = useWorkspaceStore()
  const [showNew, setShowNew] = useState(false)
  const [newFileName, setNewFileName] = useState('')

  const getLanguage = (name: string): string => {
    const ext = name.split('.').pop()?.toLowerCase() || ''
    const map: Record<string, string> = {
      html: 'html', css: 'css', js: 'javascript', ts: 'typescript',
      tsx: 'typescript', jsx: 'javascript', py: 'python', json: 'json', md: 'markdown',
    }
    return map[ext] || 'plaintext'
  }

  const handleAddFile = () => {
    if (!newFileName.trim()) return
    addFile({
      name: newFileName,
      path: newFileName,
      content: '',
      language: getLanguage(newFileName),
    })
    setNewFileName('')
    setShowNew(false)
  }

  if (!currentProject) return (
    <div className="p-4 text-xs text-[var(--text-muted)]">No project open</div>
  )

  return (
    <div className="flex flex-col h-full select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          {currentProject.name}
        </span>
        <button
          onClick={() => setShowNew(true)}
          className="text-[var(--text-muted)] hover:text-violet-400 transition-colors"
          title="New file"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* New file input */}
      {showNew && (
        <div className="px-2 py-1.5 border-b border-[var(--border)]">
          <input
            autoFocus
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddFile()
              if (e.key === 'Escape') setShowNew(false)
            }}
            placeholder="filename.js"
            className="w-full bg-[var(--surface-2)] border border-violet-500 rounded px-2 py-1 text-xs focus:outline-none"
          />
        </div>
      )}

      {/* Files */}
      <div className="flex-1 overflow-y-auto py-1">
        {currentProject.files.map((file: ProjectFile) => {
          const isActive = activeFile?.id === file.id
          const color = LANG_COLORS[file.language] || '#6b6b8a'

          return (
            <div
              key={file.id}
              onClick={() => setActiveFile(file)}
              className={`flex items-center justify-between px-3 py-1.5 cursor-pointer group transition-colors ${
                isActive
                  ? 'bg-violet-600/20 text-violet-300'
                  : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <ChevronRight className="w-2.5 h-2.5 opacity-0" />
                <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: color }} />
                <span className="text-xs truncate">{file.name}</span>
              </div>
              {currentProject.files.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); deleteFile(file.id) }}
                  className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer stats */}
      <div className="px-3 py-2 border-t border-[var(--border)] text-[10px] text-[var(--text-muted)]">
        {currentProject.files.length} files
      </div>
    </div>
  )
}
