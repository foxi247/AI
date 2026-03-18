'use client'
import { useState } from 'react'
import { X, Plus, Trash2, Search, ChevronDown, Bot, Check, Settings, Zap } from 'lucide-react'
import { useWorkspaceStore } from '@/store/workspace'
import { AIAgent, AIRole, AI_ROLES, POPULAR_MODELS } from '@/lib/types'
import Button from '@/components/ui/Button'

interface Props {
  onClose: () => void
}

export default function AIConfigPanel({ onClose }: Props) {
  const { agents, addAgent, updateAgent, removeAgent, setActiveAgent, activeAgentId } = useWorkspaceStore()
  const [showAddForm, setShowAddForm] = useState(false)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  // New agent form state
  const [newAgent, setNewAgent] = useState({
    name: '',
    provider: '',
    model: '',
    apiKey: '',
    role: 'coder' as AIRole,
    baseUrl: '',
  })

  const filteredModels = POPULAR_MODELS.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.provider.toLowerCase().includes(search.toLowerCase()) ||
      m.model.toLowerCase().includes(search.toLowerCase())
  )

  const selectModel = (m: (typeof POPULAR_MODELS)[0]) => {
    setNewAgent({
      ...newAgent,
      provider: m.provider,
      model: m.model,
      name: m.name,
      baseUrl: m.baseUrl,
    })
    setSearch(m.name)
  }

  const handleAdd = () => {
    if (!newAgent.apiKey || !newAgent.model) return
    const roleInfo = AI_ROLES[newAgent.role]
    addAgent({
      ...newAgent,
      enabled: true,
      systemPrompt: roleInfo.systemPrompt,
    })
    setNewAgent({ name: '', provider: '', model: '', apiKey: '', role: 'coder', baseUrl: '' })
    setSearch('')
    setShowAddForm(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
              <Bot className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="font-bold text-lg">AI Configuration</h2>
              <p className="text-xs text-[var(--text-muted)]">Manage your AI agents and API keys</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Current Agents */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4 text-violet-400" />
              Active Agents ({agents.length})
            </h3>

            <div className="space-y-2">
              {agents.map((agent) => {
                const role = AI_ROLES[agent.role]
                const isActive = activeAgentId === agent.id
                const isDefault = agent.id === 'default-mistral'

                return (
                  <div
                    key={agent.id}
                    className={`rounded-xl border p-4 transition-all ${
                      isActive ? 'border-violet-500/50 bg-violet-600/10' : 'border-[var(--border)] bg-[var(--surface-2)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Role icon */}
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold"
                          style={{ background: `${role.color}20`, border: `1px solid ${role.color}40`, color: role.color }}
                        >
                          {agent.name[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{agent.name}</span>
                            {isDefault && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-600/20 text-violet-400 border border-violet-500/30">
                                Default
                              </span>
                            )}
                            {isActive && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-600/20 text-green-400 border border-green-500/30">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[var(--text-muted)]">
                            {agent.model} ·{' '}
                            <span style={{ color: role.color }}>{role.label}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isActive && (
                          <Button size="sm" variant="secondary" onClick={() => setActiveAgent(agent.id)}>
                            Use
                          </Button>
                        )}
                        {isActive && (
                          <div className="flex items-center gap-1 text-xs text-green-400">
                            <Check className="w-3.5 h-3.5" />
                            Selected
                          </div>
                        )}
                        {!isDefault && (
                          <button
                            onClick={() => removeAgent(agent.id)}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Role description */}
                    <div className="mt-3 text-xs text-[var(--text-muted)] border-t border-[var(--border)] pt-3">
                      {role.description}
                    </div>

                    {/* Role switcher */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(Object.keys(AI_ROLES) as AIRole[]).map((r) => (
                        <button
                          key={r}
                          onClick={() => updateAgent(agent.id, { role: r, systemPrompt: AI_ROLES[r].systemPrompt })}
                          className={`text-[10px] px-2 py-1 rounded-md border transition-all ${
                            agent.role === r
                              ? 'text-white'
                              : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-light)]'
                          }`}
                          style={agent.role === r ? { background: AI_ROLES[r].color, borderColor: AI_ROLES[r].color } : {}}
                        >
                          {AI_ROLES[r].label}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Add new agent */}
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full border border-dashed border-[var(--border)] rounded-xl p-4 text-sm text-[var(--text-muted)] hover:border-violet-500/50 hover:text-violet-400 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add custom AI agent
            </button>
          ) : (
            <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-5 space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-violet-400" />
                Add New AI Agent
              </h3>

              {/* Model search */}
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1.5">Search AI Model</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder='e.g. GPT-4o, Claude, "open" for free models...'
                    className="w-full bg-[var(--surface-3)] border border-[var(--border)] rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>

                {!search && (
                  <p className="mt-1.5 text-[10px] text-[var(--text-muted)]">
                    Tip: type <span className="text-emerald-400 font-medium">open</span> to see free OpenRouter models — no credit card required
                  </p>
                )}

                {search && (
                  <div className="mt-1 bg-[var(--surface-3)] border border-[var(--border)] rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                    {filteredModels.map((m) => (
                      <button
                        key={`${m.provider}-${m.model}`}
                        onClick={() => selectModel(m)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-[var(--surface-2)] transition-colors text-left ${
                          newAgent.model === m.model ? 'bg-violet-600/20 text-violet-300' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium">{m.name}</span>
                          <span className="text-xs text-[var(--text-muted)]">{m.provider}</span>
                          {'isFree' in m && m.isFree && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold shrink-0">
                              FREE
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[140px] ml-2">{m.model}</span>
                      </button>
                    ))}
                    {filteredModels.length === 0 && (
                      <div className="px-3 py-2 text-xs text-[var(--text-muted)]">
                        No models found. Enter your model manually below.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Manual model input if not found */}
              {!newAgent.model && (
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1.5">Model ID (manual)</label>
                  <input
                    value={newAgent.model}
                    onChange={(e) => setNewAgent({ ...newAgent, model: e.target.value })}
                    placeholder="e.g. gpt-4o-mini, mistral-7b..."
                    className="w-full bg-[var(--surface-3)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
              )}

              {/* Base URL */}
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1.5">API Base URL</label>
                <input
                  value={newAgent.baseUrl}
                  onChange={(e) => setNewAgent({ ...newAgent, baseUrl: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                  className="w-full bg-[var(--surface-3)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              {/* API Key */}
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1.5">API Key *</label>
                <input
                  type="password"
                  value={newAgent.apiKey}
                  onChange={(e) => setNewAgent({ ...newAgent, apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full bg-[var(--surface-3)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                />
                <p className="text-[10px] text-[var(--text-muted)] mt-1">Stored locally, never sent to our servers</p>
              </div>

              {/* Role selection */}
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1.5">Assign Role</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.entries(AI_ROLES) as [AIRole, typeof AI_ROLES[AIRole]][]).map(([key, role]) => (
                    <button
                      key={key}
                      onClick={() => setNewAgent({ ...newAgent, role: key })}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        newAgent.role === key
                          ? 'border-violet-500 bg-violet-600/20'
                          : 'border-[var(--border)] hover:border-[var(--border-light)]'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ background: role.color }}
                        />
                        <span className="text-xs font-medium">{role.label}</span>
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] leading-tight">{role.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Role system prompt preview */}
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3">
                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  System prompt (auto-generated for this role)
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-3">
                  {AI_ROLES[newAgent.role].systemPrompt.slice(0, 200)}...
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => { setShowAddForm(false); setSearch(''); setNewAgent({ name: '', provider: '', model: '', apiKey: '', role: 'coder', baseUrl: '' }) }}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleAdd}
                  disabled={!newAgent.apiKey || !newAgent.model}
                >
                  <Plus className="w-4 h-4" />
                  Add Agent
                </Button>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-4 text-xs text-[var(--text-muted)] space-y-1">
            <p className="font-medium text-[var(--foreground)] mb-2">How multi-agent works</p>
            <p>• Each agent gets a specialized system prompt based on their role</p>
            <p>• The active agent handles your chat messages</p>
            <p>• Agents understand their role and collaborate effectively</p>
            <p>• API keys are stored in your browser only (localStorage)</p>
          </div>

          <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-4 text-xs space-y-1">
            <p className="font-medium text-emerald-400 mb-2 flex items-center gap-1.5">
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">FREE</span>
              OpenRouter — бесплатные модели
            </p>
            <p className="text-[var(--text-muted)]">• Зарегистрируйтесь на <span className="text-emerald-400">openrouter.ai</span> и получите API ключ</p>
            <p className="text-[var(--text-muted)]">• Ищите <span className="text-emerald-400 font-medium">open</span> в поиске — появятся 12 бесплатных моделей</p>
            <p className="text-[var(--text-muted)]">• Лучшие: Qwen3 Coder 480B, Llama 3.3 70B, Hermes 3 405B, Nemotron 3 120B</p>
            <p className="text-[var(--text-muted)]">• Лимит: ~20 req/min, 200 req/day на бесплатном плане</p>
          </div>
        </div>
      </div>
    </div>
  )
}
