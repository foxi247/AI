'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkspaceStore } from '@/store/workspace'

export default function DemoPage() {
  const router = useRouter()
  const { createProject } = useWorkspaceStore()

  useEffect(() => {
    const p = createProject('Demo Project', 'Try DevForge AI with this demo project')
    router.replace(`/workspace/${p.id}?prompt=${encodeURIComponent('Create a beautiful landing page with hero section, features, and a CTA button. Use a dark theme with purple accents.')}`)
  }, [createProject, router])

  return (
    <div className="h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin-slow mx-auto mb-4" />
        <p className="text-[var(--text-muted)]">Loading demo...</p>
      </div>
    </div>
  )
}
