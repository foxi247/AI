'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Zap } from 'lucide-react'
import Button from './ui/Button'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text">DevForge AI</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/pricing" className="text-sm text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors">Pricing</Link>
            <Link href="/docs" className="text-sm text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors">Docs</Link>
            <Link href="/templates" className="text-sm text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors">Templates</Link>
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">Get Started Free</Button>
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button className="md:hidden text-[var(--text-muted)] hover:text-[var(--foreground)]" onClick={() => setOpen(!open)}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--surface)] px-4 py-4 space-y-3">
          <Link href="/pricing" className="block text-sm text-[var(--text-muted)] hover:text-[var(--foreground)] py-2">Pricing</Link>
          <Link href="/docs" className="block text-sm text-[var(--text-muted)] hover:text-[var(--foreground)] py-2">Docs</Link>
          <Link href="/templates" className="block text-sm text-[var(--text-muted)] hover:text-[var(--foreground)] py-2">Templates</Link>
          <div className="flex gap-2 pt-2">
            <Link href="/auth/login" className="flex-1"><Button variant="secondary" size="sm" className="w-full">Sign in</Button></Link>
            <Link href="/auth/signup" className="flex-1"><Button size="sm" className="w-full">Get Started</Button></Link>
          </div>
        </div>
      )}
    </nav>
  )
}
