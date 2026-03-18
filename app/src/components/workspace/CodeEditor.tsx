'use client'
import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useWorkspaceStore } from '@/store/workspace'
import { Copy, RotateCcw } from 'lucide-react'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

export default function CodeEditor() {
  const { activeFile, updateFileContent } = useWorkspaceStore()
  const editorRef = useRef<unknown>(null)

  const handleEditorMount = (editor: unknown) => {
    editorRef.current = editor
  }

  if (!activeFile) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-sm">
        <div className="text-center">
          <div className="text-4xl mb-4">📄</div>
          <p>Select a file from the explorer</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-2)] px-2">
        <div className="flex items-center">
          <div className="px-4 py-2 text-xs text-[var(--foreground)] border-b-2 border-violet-500 bg-[var(--surface)] -mb-px">
            {activeFile.name}
          </div>
        </div>
        <div className="flex items-center gap-1 pr-2">
          <button
            onClick={() => navigator.clipboard.writeText(activeFile.content)}
            className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-3)] transition-colors"
            title="Copy"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => updateFileContent(activeFile.id, '')}
            className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-3)] transition-colors"
            title="Clear"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        <MonacoEditor
          height="100%"
          language={activeFile.language}
          value={activeFile.content}
          onChange={(val) => updateFileContent(activeFile.id, val || '')}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 16, bottom: 16 },
            lineNumbers: 'on',
            roundedSelection: true,
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            bracketPairColorization: { enabled: true },
          }}
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1 border-t border-[var(--border)] bg-[var(--surface-2)] text-[10px] text-[var(--text-muted)]">
        <span>{activeFile.language}</span>
        <span>{activeFile.content.split('\n').length} lines · {activeFile.content.length} chars</span>
      </div>
    </div>
  )
}
