'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Zap, Eye, EyeOff } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Mock auth — replace with real auth (NextAuth/Supabase)
    await new Promise((r) => setTimeout(r, 1000))
    localStorage.setItem('auth_user', JSON.stringify({ email, name: email.split('@')[0] }))
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black gradient-text">DevForge AI</span>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8">
          <h1 className="text-2xl font-black mb-2">Welcome back</h1>
          <p className="text-[var(--text-muted)] text-sm mb-8">Sign in to continue building</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-4 py-2.5 pr-10 text-sm text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-violet-500 transition-colors"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--foreground)]">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Link href="#" className="text-xs text-violet-400 hover:text-violet-300 mt-1 block text-right">Forgot password?</Link>
            </div>

            <Button type="submit" className="w-full" loading={loading}>
              Sign in
            </Button>
          </form>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-xs text-[var(--text-muted)]">or</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          <div className="mt-4 space-y-3">
            {['GitHub', 'Google'].map((provider) => (
              <button
                key={provider}
                onClick={() => { localStorage.setItem('auth_user', JSON.stringify({ email: 'demo@devforge.ai', name: 'Demo User' })); router.push('/dashboard') }}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm hover:border-[var(--border-light)] transition-colors flex items-center justify-center gap-2"
              >
                Continue with {provider}
              </button>
            ))}
          </div>

          <p className="text-center text-sm text-[var(--text-muted)] mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-violet-400 hover:text-violet-300">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
