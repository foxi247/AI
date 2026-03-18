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

export default function WebContainerProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [booting, setBooting] = useState(false)
  const [serverUrl, setServerUrl] = useState<string | null>(null)
  const wcRef = useRef<WebContainer | null>(null)
  const processRef = useRef<WebContainerProcess | null>(null)
  const { currentProject } = useWorkspaceStore()

  const boot = useCallback(async () => {
    if (wcRef.current || booting) return
    setBooting(true)
    try {
      const { WebContainer } = await import('@webcontainer/api')
      const wc = await WebContainer.boot()
      wcRef.current = wc

      // Listen for server ready
      wc.on('server-ready', (port, url) => {
        console.log(`WebContainer server ready on port ${port}: ${url}`)
        setServerUrl(url)
      })

      setReady(true)
    } catch (e) {
      console.error('WebContainer boot failed:', e)
    } finally {
      setBooting(false)
    }
  }, [booting])

  useEffect(() => {
    boot()
    return () => {
      // WebContainer cleanup
      wcRef.current = null
    }
  }, [boot])

  // Mount project files whenever they change
  const writeFiles = useCallback(async () => {
    if (!wcRef.current || !currentProject) return
    const files: Record<string, { file: { contents: string } }> = {}
    for (const f of currentProject.files) {
      files[f.path] = { file: { contents: f.content } }
    }
    await wcRef.current.mount(files)
  }, [currentProject])

  useEffect(() => {
    if (ready && currentProject) {
      writeFiles()
    }
  }, [ready, currentProject, writeFiles])

  const runCommand = useCallback(async (cmd: string, onOutput: (data: string) => void) => {
    if (!wcRef.current) {
      onOutput('\r\n⚠️  WebContainer not ready\r\n')
      return
    }

    // Kill previous process
    if (processRef.current) {
      processRef.current.kill()
    }

    const parts = cmd.split(' ')
    const command = parts[0]
    const args = parts.slice(1)

    try {
      const process = await wcRef.current.spawn(command, args, {
        env: { PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin' },
      })
      processRef.current = process

      process.output.pipeTo(
        new WritableStream({
          write(data) { onOutput(data) },
        })
      )

      await process.exit
    } catch (e) {
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
