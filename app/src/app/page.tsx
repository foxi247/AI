import Link from 'next/link'
import { ArrowRight, Zap, Code2, Globe, Users, Sparkles, Terminal, Play, Bot, GitBranch, Lock, Unlock } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Button from '@/components/ui/Button'

const features = [
  { icon: Bot, title: 'AI-First Interface', desc: 'Describe what you want in plain language. Our multi-agent AI system plans, codes, and reviews your app.' },
  { icon: Code2, title: 'Smart Code Editor', desc: 'Monaco editor (VS Code engine) with AI assistance, multi-file support, and real-time syntax highlighting.' },
  { icon: Play, title: 'Instant Preview', desc: 'See your app running live as you build. Zero configuration, zero waiting.' },
  { icon: Terminal, title: 'Integrated Terminal', desc: 'Run commands, install packages, and debug without leaving the browser.' },
  { icon: Globe, title: 'One-Click Deploy', desc: 'Deploy to a public URL instantly. Share your app with anyone in seconds.' },
  { icon: Users, title: 'Collaboration', desc: 'Invite teammates to work together in real-time. Like Google Docs, but for code.' },
]

const steps = [
  { n: '01', title: 'Describe your app', desc: 'Type what you want to build in plain language. "Create a todo app with dark mode and animations"' },
  { n: '02', title: 'AI builds it', desc: 'Our AI agents plan the architecture, write the code, and show you the result in under 60 seconds.' },
  { n: '03', title: 'Customize & deploy', desc: 'Edit the code, add your API keys, and deploy with one click. Share with anyone.' },
]

const stats = [
  { value: '< 60s', label: 'Time to first app' },
  { value: '0', label: 'Installations needed' },
  { value: '∞', label: 'Possible apps' },
  { value: '100%', label: 'Browser-based' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden grid-bg">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-violet-400 mb-6 border border-violet-500/30">
            <Sparkles className="w-3 h-3" />
            Powered by Mistral Codestral + Multi-Agent AI
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight">
            Build apps with<br />
            <span className="gradient-text">AI in seconds</span>
          </h1>

          <p className="text-lg md:text-xl text-[var(--text-muted)] max-w-2xl mx-auto mb-10 leading-relaxed">
            The AI-powered platform where you describe your idea and get a working app instantly.
            No installs, no config — just you and your AI team.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/signup">
              <Button size="lg" className="gap-2">
                Start building for free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/workspace/demo">
              <Button variant="secondary" size="lg">
                <Play className="w-4 h-4" />
                Live demo
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-20 max-w-3xl mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-black gradient-text mb-1">{s.value}</div>
                <div className="text-xs text-[var(--text-muted)]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App preview mockup */}
      <section className="px-4 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl border border-[var(--border)] overflow-hidden shadow-2xl shadow-violet-500/10">
            <div className="bg-[var(--surface-2)] border-b border-[var(--border)] px-4 py-3 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <div className="flex-1 bg-[var(--surface-3)] rounded px-3 py-1 text-xs text-[var(--text-muted)] max-w-xs mx-auto text-center">
                devforge.ai/workspace/my-project
              </div>
            </div>
            <div className="bg-[var(--surface)] h-[420px] flex">
              <div className="w-48 border-r border-[var(--border)] p-3 text-xs">
                <div className="text-[var(--text-muted)] uppercase tracking-wider text-[10px] mb-2">Files</div>
                {['index.html', 'style.css', 'script.js', 'api.js'].map((f, i) => (
                  <div key={f} className={`px-2 py-1.5 rounded cursor-pointer flex items-center gap-2 ${i === 0 ? 'bg-violet-600/20 text-violet-300' : 'text-[var(--text-muted)]'}`}>
                    <Code2 className="w-3 h-3" />
                    {f}
                  </div>
                ))}
              </div>
              <div className="flex-1 border-r border-[var(--border)] p-4 font-mono text-xs leading-relaxed overflow-hidden">
                <div className="text-[var(--text-muted)] mb-1">{'<!-- index.html -->'}</div>
                <div><span className="text-violet-400">{'<html'}</span><span className="text-[var(--text-muted)]">{' lang='}</span><span className="text-green-400">{'"en"'}</span><span className="text-violet-400">{'>'}</span></div>
                <div className="ml-2"><span className="text-violet-400">{'<body>'}</span></div>
                <div className="ml-4 text-cyan-400">{'  <div class="app">'}</div>
                <div className="ml-6 text-[var(--foreground)]">{'    <h1>Hello World ✨</h1>'}</div>
                <div className="ml-4 text-cyan-400">{'  </div>'}</div>
                <div className="ml-2"><span className="text-violet-400">{'</body>'}</span></div>
                <div className="text-violet-400">{'</html>'}</div>
              </div>
              <div className="w-64 border-r border-[var(--border)] flex flex-col">
                <div className="p-3 border-b border-[var(--border)] text-xs font-medium flex items-center gap-2">
                  <Bot className="w-3 h-3 text-violet-400" />
                  AI Assistant
                </div>
                <div className="flex-1 p-3 space-y-3 text-xs">
                  <div className="bg-[var(--surface-2)] rounded-lg p-2 text-[var(--text-muted)]">Create a todo app with dark mode</div>
                  <div className="bg-violet-600/20 border border-violet-500/30 rounded-lg p-2 text-violet-200">
                    I&apos;ll build that for you! Creating the project structure...
                  </div>
                </div>
                <div className="p-2 border-t border-[var(--border)]">
                  <div className="bg-[var(--surface-2)] rounded px-2 py-1.5 text-xs text-[var(--text-muted)]">Type your request...</div>
                </div>
              </div>
              <div className="flex-1 bg-white flex items-center justify-center">
                <div className="text-center text-gray-800">
                  <div className="text-4xl mb-2">✨</div>
                  <div className="text-lg font-bold">Hello World</div>
                  <div className="text-sm text-gray-500">Live Preview</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Everything you need to build</h2>
            <p className="text-[var(--text-muted)] text-lg">A complete development environment, powered by AI</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 hover:border-violet-500/50 transition-all duration-300 hover:bg-[var(--surface-2)] group">
                <div className="w-10 h-10 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mb-4 group-hover:bg-violet-600/30 transition-colors">
                  <Icon className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 bg-[var(--surface)] border-y border-[var(--border)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">From idea to app in 3 steps</h2>
            <p className="text-[var(--text-muted)]">No setup required. Start building immediately.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.n} className="relative">
                <div className="text-7xl font-black text-violet-600/10 mb-4">{step.n}</div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-[var(--text-muted)] leading-relaxed">{step.desc}</p>
                {i < 2 && <div className="hidden md:block absolute top-8 -right-4 text-[var(--border)] text-2xl">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Agents highlight */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-600/20 border border-violet-500/30 text-xs text-violet-400 mb-6">
                <Sparkles className="w-3 h-3" />
                Multi-Agent AI System
              </div>
              <h2 className="text-4xl font-black mb-6">Your personal AI development team</h2>
              <p className="text-[var(--text-muted)] leading-relaxed mb-8">
                Use our built-in Mistral Codestral agent, or bring your own AI models.
                Assign roles — Planner, Coder, Architect, Reviewer — and let them collaborate to build your app.
              </p>
              <div className="space-y-3">
                {[
                  { icon: Lock, text: 'Default: Mistral Codestral (ready to use)' },
                  { icon: Unlock, text: 'Add your own OpenAI, Claude, Gemini API keys' },
                  { icon: Bot, text: 'Assign specialized roles to each agent' },
                  { icon: GitBranch, text: 'Agents coordinate automatically' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 text-sm">
                    <Icon className="w-4 h-4 text-violet-400 shrink-0" />
                    <span className="text-[var(--text-muted)]">{text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { role: 'Planner', color: '#f59e0b', model: 'GPT-4o', desc: 'Designs architecture' },
                { role: 'Coder', color: '#10b981', model: 'Codestral', desc: 'Writes the code' },
                { role: 'Architect', color: '#06b6d4', model: 'Claude', desc: 'System design' },
                { role: 'Reviewer', color: '#ec4899', model: 'Mistral', desc: 'Code quality' },
              ].map((agent) => (
                <div key={agent.role} className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-4 hover:border-violet-500/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg mb-3 flex items-center justify-center text-xs font-bold"
                    style={{ background: `${agent.color}20`, border: `1px solid ${agent.color}40`, color: agent.color }}>
                    {agent.role[0]}
                  </div>
                  <div className="font-semibold text-sm mb-1">{agent.role}</div>
                  <div className="text-xs text-[var(--text-muted)] mb-2">{agent.desc}</div>
                  <div className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-3)] text-[var(--text-muted)] inline-block">{agent.model}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-violet-900/40 to-purple-900/20 border border-violet-500/30 rounded-3xl p-12">
            <h2 className="text-4xl font-black mb-4">Start building today</h2>
            <p className="text-[var(--text-muted)] mb-8">Free plan includes 50 AI requests/month, 3 projects, and instant preview.</p>
            <Link href="/auth/signup">
              <Button size="lg">
                Create your first app — it&apos;s free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold gradient-text">DevForge AI</span>
          </div>
          <div className="flex gap-6 text-sm text-[var(--text-muted)]">
            <Link href="/pricing" className="hover:text-[var(--foreground)] transition-colors">Pricing</Link>
            <Link href="/docs" className="hover:text-[var(--foreground)] transition-colors">Docs</Link>
            <Link href="/templates" className="hover:text-[var(--foreground)] transition-colors">Templates</Link>
          </div>
          <div className="text-xs text-[var(--text-muted)]">© 2026 DevForge AI</div>
        </div>
      </footer>
    </div>
  )
}
