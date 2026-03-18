'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Zap, Code2, Clock, Globe, Trash2, ExternalLink, LogOut, Search, LayoutGrid } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useWorkspaceStore } from '@/store/workspace'
import { Project } from '@/lib/types'

const TEMPLATES = [
  { name: 'Todo App', desc: 'Simple task manager with dark mode', icon: '✅', prompt: 'Create a beautiful todo app with dark mode, animations, and local storage persistence' },
  { name: 'Landing Page', desc: 'Modern SaaS landing page', icon: '🚀', prompt: 'Create a modern SaaS landing page with hero section, features, pricing, and contact form' },
  { name: 'Dashboard', desc: 'Analytics dashboard with charts', icon: '📊', prompt: 'Create an analytics dashboard with charts, stats cards, and a sidebar navigation' },
  { name: 'Chat App', desc: 'Real-time chat interface', icon: '💬', prompt: 'Create a chat app UI with message bubbles, emoji support, and smooth animations' },
]

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [search, setSearch] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)
  const [newName, setNewName] = useState('')
  const { projects, createProject, setCurrentProject } = useWorkspaceStore()

  useEffect(() => {
    const u = localStorage.getItem('auth_user')
    if (!u) { router.push('/auth/login'); return }
    setUser(JSON.parse(u))
  }, [router])

  const filtered = projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))

  const handleCreate = (name: string = newName || 'My App') => {
    const p = createProject(name)
    setShowNewModal(false)
    setNewName('')
    router.push(`/workspace/${p.id}`)
  }

  const handleOpen = (p: Project) => {
    setCurrentProject(p)
    router.push(`/workspace/${p.id}`)
  }

  const logout = () => {
    localStorage.removeItem('auth_user')
    router.push('/')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Top bar */}
      <header className="glass border-b border-[var(--border)] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold gradient-text">DevForge AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-sm text-[var(--text-muted)]">
              {user.name}
            </div>
            <button onClick={logout} className="text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Welcome */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-black mb-1">
              Welcome back, <span className="gradient-text">{user.name}</span>
            </h1>
            <p className="text-[var(--text-muted)]">Your projects and workspace</p>
          </div>
          <Button onClick={() => setShowNewModal(true)} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>

        {/* Templates */}
        {projects.length === 0 && (
          <div className="mb-12">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-violet-400" />
              Start from a template
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {TEMPLATES.map((t) => (
                <button
                  key={t.name}
                  onClick={() => {
                    const p = createProject(t.name, t.desc)
                    router.push(`/workspace/${p.id}?prompt=${encodeURIComponent(t.prompt)}`)
                  }}
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 text-left hover:border-violet-500/50 hover:bg-[var(--surface-2)] transition-all group"
                >
                  <div className="text-3xl mb-3">{t.icon}</div>
                  <div className="font-semibold text-sm mb-1">{t.name}</div>
                  <div className="text-xs text-[var(--text-muted)]">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Code2 className="w-4 h-4 text-violet-400" />
              Your Projects ({projects.length})
            </h2>
            {projects.length > 0 && (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search projects..."
                  className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
            )}
          </div>

          {projects.length === 0 ? (
            <div className="bg-[var(--surface)] border border-dashed border-[var(--border)] rounded-2xl p-16 text-center">
              <div className="text-5xl mb-4">🚀</div>
              <h3 className="font-bold text-lg mb-2">No projects yet</h3>
              <p className="text-[var(--text-muted)] text-sm mb-6">Create your first project or pick a template above</p>
              <Button onClick={() => setShowNewModal(true)}>
                <Plus className="w-4 h-4" />
                Create your first project
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((p) => (
                <div key={p.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 hover:border-violet-500/40 transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600/30 to-purple-600/20 border border-violet-500/30 flex items-center justify-center">
                      <Code2 className="w-5 h-5 text-violet-400" />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {p.deployUrl && (
                        <a href={p.deployUrl} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-green-400 transition-colors">
                          <Globe className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-semibold mb-1">{p.name}</h3>
                  {p.description && <p className="text-xs text-[var(--text-muted)] mb-3 line-clamp-2">{p.description}</p>}

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                      <Clock className="w-3 h-3" />
                      {new Date(p.updatedAt).toLocaleDateString()}
                    </div>
                    <button
                      onClick={() => handleOpen(p)}
                      className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      Open
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add new card */}
              <button
                onClick={() => setShowNewModal(true)}
                className="border border-dashed border-[var(--border)] rounded-xl p-5 hover:border-violet-500/50 hover:bg-[var(--surface)] transition-all flex flex-col items-center justify-center gap-2 text-[var(--text-muted)] hover:text-violet-400 min-h-[140px]"
              >
                <Plus className="w-6 h-6" />
                <span className="text-sm">New Project</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* New project modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-6">New Project</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Project name</label>
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="My Awesome App"
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            <div className="mb-6">
              <div className="text-sm font-medium mb-2 text-[var(--text-muted)]">Or start from template</div>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => {
                      const p = createProject(t.name, t.desc)
                      setShowNewModal(false)
                      router.push(`/workspace/${p.id}?prompt=${encodeURIComponent(t.prompt)}`)
                    }}
                    className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-3 text-left hover:border-violet-500/40 transition-colors text-xs"
                  >
                    <span className="mr-1">{t.icon}</span> {t.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowNewModal(false)}>Cancel</Button>
              <Button className="flex-1" onClick={() => handleCreate()}>
                <Plus className="w-4 h-4" />
                Create Project
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
