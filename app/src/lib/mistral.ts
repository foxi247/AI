import { AIAgent, Message } from './types'

const DEFAULT_MODEL = 'codestral-latest'

export interface ChatRequest {
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[]
  agent?: AIAgent
  onChunk?: (chunk: string) => void
}

export async function chatWithAI(request: ChatRequest): Promise<string> {
  const { messages, agent, onChunk } = request

  const body: Record<string, unknown> = {
    messages,
    model: agent?.model || DEFAULT_MODEL,
    stream: Boolean(onChunk),
  }
  if (agent?.apiKey) body.apiKey = agent.apiKey
  if (agent?.baseUrl) body.baseUrl = agent.baseUrl

  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`AI API Error ${response.status}: ${error}`)
    }

    if (onChunk && response.body) {
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '))

        for (const line of lines) {
          const data = line.slice(6)
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content || ''
            if (content) {
              fullContent += content
              onChunk(content)
            }
          } catch {}
        }
      }
      return fullContent
    } else {
      const data = await response.json()
      return data.choices?.[0]?.message?.content || ''
    }
  } catch (error) {
    throw new Error(`Failed to connect to AI: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export function buildSystemPrompt(agent?: AIAgent): string {
  if (agent?.systemPrompt) return agent.systemPrompt

  return `You are an expert fullstack developer AI assistant integrated into an AI-powered code editor platform.

Your capabilities:
- Generate complete, production-ready web applications
- Write React/Next.js, TypeScript, Python, and other languages
- Create project structure and file contents
- Fix bugs and improve code
- Explain your changes clearly

When generating code files, use this format:
\`\`\`language:path/to/filename.ext
// your code here
\`\`\`

Always generate complete, working code. Be concise but thorough.`
}
