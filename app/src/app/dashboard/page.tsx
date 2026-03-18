'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Zap, Code2, Clock, Globe, Trash2, ExternalLink, LogOut, Search, LayoutGrid, Shield } from 'lucide-react'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { createProject, deleteProject, getUserProjects } from '@/lib/supabase/db'
import { useWorkspaceStore } from '@/store/workspace'
import { Project } from '@/lib/types'

const DEFAULT_FILES = [
  { name: 'index.html', path: 'index.html', language: 'html', content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My App</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <div class="container">\n    <h1>✨ Hello, World!</h1>\n    <p>Start by describing what you want to build in the AI chat →</p>\n  </div>\n  <script src="script.js"></script>\n</body>\n</html>` },
  { name: 'style.css', path: 'style.css', language: 'css', content: `body {\n  font-family: system-ui, sans-serif;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  min-height: 100vh;\n  margin: 0;\n  background: #0a0a0f;\n  color: #e8e8f0;\n}\n\n.container { text-align: center; }\nh1 { font-size: 2.5rem; margin-bottom: 1rem; }\np { color: #6b6b8a; }` },
  { name: 'script.js', path: 'script.js', language: 'javascript', content: `// Your JavaScript here\nconsole.log('App started');` },
]

const TEMPLATES = [
  { name: 'Todo App', desc: 'Task manager with dark mode', icon: '✅', prompt: 'Create a beautiful todo app with dark mode, animations, and local storage persistence' },
  { name: 'Landing Page', desc: 'Modern SaaS landing page', icon: '🚀', prompt: 'Create a modern SaaS landing page with hero section, features, pricing, and contact form' },
  { name: 'Dashboard', desc: 'Analytics dashboard with charts', icon: '📊', prompt: 'Create an analytics dashboard with charts, stats cards, and a sidebar navigation' },
  { name: 'Chat App', desc: 'Real-time chat interface', icon: '💬', prompt: 'Create a chat app UI with message bubbles, emoji support, and smooth animations' },
]

export default function DashboardPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [search, setSearch] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const { setCurrentProject } = useWorkspaceStore()

  const loadProjects = useCallback(async (uid: string) => {
    try {
      const data = await getUserProjects(uid)
      setProjects(data)
    } catch (e) {
      console.error('Failed to load projects:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)
      setUserName(user.user_metadata?.name || user.email?.split('@')[0] || 'User')

      // Load role from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (profile?.role === 'admin') setIsAdmin(true)

      loadProjects(user.id)
    }
    init()
  }, [router, loadProjects])

  const handleCreate = async (name: string = newName || 'My App', description = '', prompt = '') => {
    if (!userId) return
    setCreating(true)
    try {
      const p = await createProject(userId, name, description, DEFAULT_FILES)
      setProjects((prev) => [p, ...prev])
      setShowNewModal(false)
      setNewName('')
      setCurrentProject(p)
      const url = `/workspace/${p.id}${prompt ? `?prompt=${encodeURIComponent(prompt)}` : ''}`
      router.push(url)
    } catch (e) {
      console.error('Failed to create project:', e)
    } finally {
      setCreating(false)
    }
  }

  const handleOpen = (p: Project) => {
    setCurrentProject(p)
    router.push(`/workspace/${p.id}`)
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Delete this project?')) return
    await deleteProject(id)
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const filtered = projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="glass border-b border-[var(--border)] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold gradient-text">DevForge AI</span>
          </Link>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-600/20 border border-violet-500/40 text-violet-400 text-xs font-semibold">
                <Shield className="w-3 h-3" />
                Admin
              </span>
            )}
            <span className="text-sm text-[var(--text-muted)]">{userName}</span>
            <button onClick={logout} className="text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-black mb-1">
              Welcome back, <span className="gradient-text">{userName}</span>
            </h1>
            <p className="text-[var(--text-muted)]">
              {isAdmin ? 'Admin — unlimited projects & AI requests' : 'Your projects are saved to the cloud'}
            </p>
          </div>
          <Button onClick={() => setShowNewModal(true)} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>

        {/* Templates (shown when no projects) */}
        {!loading && projects.length === 0 && (
          <div className="mb-12">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-violet-400" />
              Start from a template
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {TEMPLATES.map((t) => (
                <button
                  key={t.name}
                  onClick={() => handleCreate(t.name, t.desc, t.prompt)}
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 text-left hover:border-violet-500/50 hover:bg-[var(--surface-2)] transition-all"
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
              Your Projects {!loading && `(${projects.length})`}
            </h2>
            {projects.length > 0 && (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 animate-pulse">
                  <div className="w-10 h-10 rounded-lg bg-[var(--surface-3)] mb-3" />
                  <div className="h-4 bg-[var(--surface-3)] rounded w-3/4 mb-2" />
                  <div className="h-3 bg-[var(--surface-3)] rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
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
                <div key={p.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 hover:border-violet-500/40 transition-all group cursor-pointer" onClick={() => handleOpen(p)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600/30 to-purple-600/20 border border-violet-500/30 flex items-center justify-center">
                      <Code2 className="w-5 h-5 text-violet-400" />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {p.deployUrl && (
                        <a href={p.deployUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-green-400 transition-colors">
                          <Globe className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button onClick={(e) => handleDelete(e, p.id)}
                        className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-red-400 transition-colors">
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
                    <span className="flex items-center gap-1 text-xs text-violet-400">
                      Open <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}

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
                  <button key={t.name}
                    onClick={() => handleCreate(t.name, t.desc, t.prompt)}
                    disabled={creating}
                    className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-3 text-left hover:border-violet-500/40 transition-colors text-xs disabled:opacity-50">
                    <span className="mr-1">{t.icon}</span> {t.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowNewModal(false)}>Cancel</Button>
              <Button className="flex-1" onClick={() => handleCreate()} loading={creating}>
                <Plus className="w-4 h-4" />
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
