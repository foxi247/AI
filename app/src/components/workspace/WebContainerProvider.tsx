'use client'
import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react'
import type { WebContainer, WebContainerProcess } from '@webcontainer/api'
import { useWorkspaceStore } from '@/store/workspace'

interface WCContext {
  ready: boolean
  booting: boolean
  serverUrl: string | null
  runCommand: (cmd: string, onOutput: (data: string) => void) => Promise<void>
  writeFiles: () => Promise<void>
  killAll: () => void
}

const Ctx = createContext<WCContext | null>(null)

export function useWebContainer() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useWebContainer must be used inside WebContainerProvider')
  return ctx
}

// Module-level singleton — WebContainer allows only ONE instance per origin.
// Storing outside React AND using globalThis prevents reset on HMR/Strict Mode.
declare global { var __wcInstance: WebContainer | null; var __wcBootPromise: Promise<WebContainer | null> | null }
if (typeof globalThis.__wcInstance === 'undefined') { globalThis.__wcInstance = null }
if (typeof globalThis.__wcBootPromise === 'undefined') { globalThis.__wcBootPromise = null }

export async function getWebContainer(): Promise<WebContainer | null> {
  if (globalThis.__wcInstance) return globalThis.__wcInstance
  if (globalThis.__wcBootPromise) return globalThis.__wcBootPromise

  globalThis.__wcBootPromise = (async () => {
    try {
      const { WebContainer } = await import('@webcontainer/api')
      const wc = await WebContainer.boot()
      globalThis.__wcInstance = wc
      return wc
    } catch (e) {
      console.error('WebContainer boot failed:', e)
      globalThis.__wcBootPromise = null
      return null
    }
  })()

  return globalThis.__wcBootPromise
}

export default function WebContainerProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [booting, setBooting] = useState(false)
  const [serverUrl, setServerUrl] = useState<string | null>(null)
  const processRef = useRef<WebContainerProcess | null>(null)
  const { currentProject } = useWorkspaceStore()

  useEffect(() => {
    let cancelled = false
    setBooting(true)

    getWebContainer().then((wc) => {
      if (cancelled || !wc) { setBooting(false); return }

      wc.on('server-ready', (port, url) => {
        if (!cancelled) setServerUrl(url)
      })

      setReady(true)
      setBooting(false)
    })

    return () => { cancelled = true }
  }, [])

  const writeFiles = useCallback(async () => {
    if (!globalThis.__wcInstance || !currentProject) return
    const files: Record<string, { file: { contents: string } }> = {}
    for (const f of currentProject.files) {
      files[f.path] = { file: { contents: f.content } }
    }
    await globalThis.__wcInstance.mount(files)
  }, [currentProject])

  useEffect(() => {
    if (ready && currentProject) writeFiles()
  }, [ready, currentProject, writeFiles])

  const runCommand = useCallback(async (cmd: string, onOutput: (data: string) => void) => {
    if (!globalThis.__wcInstance) {
      onOutput('\r\n⚠️  WebContainer not ready\r\n')
      return
    }
    if (processRef.current) processRef.current.kill()

    const [command, ...args] = cmd.split(' ')
    try {
      const process = await globalThis.__wcInstance.spawn(command, args, {
        env: { PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin' },
      })
      processRef.current = process
      process.output.pipeTo(new WritableStream({ write(data) { onOutput(data) } }))
      await process.exit
    } catch {
      onOutput(`\r\nbash: ${command}: command not found\r\n`)
    }
  }, [])

  const killAll = useCallback(() => {
    processRef.current?.kill()
    processRef.current = null
  }, [])

  return (
    <Ctx.Provider value={{ ready, booting, serverUrl, runCommand, writeFiles, killAll }}>
      {children}
    </Ctx.Provider>
  )
}
