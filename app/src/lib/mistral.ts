import { AIAgent, Message } from './types'

const DEFAULT_MISTRAL_API_KEY = 'Ra3flT4bkJdLOkh0OoNRkEVhz1byTlaU'
const DEFAULT_BASE_URL = 'https://codestral.mistral.ai/v1'
const DEFAULT_MODEL = 'codestral-latest'

export interface ChatRequest {
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[]
  agent?: AIAgent
  onChunk?: (chunk: string) => void
}

export async function chatWithAI(request: ChatRequest): Promise<string> {
  const { messages, agent, onChunk } = request

  const apiKey = agent?.apiKey || DEFAULT_MISTRAL_API_KEY
  const baseUrl = agent?.baseUrl || DEFAULT_BASE_URL
  const model = agent?.model || DEFAULT_MODEL

  const url = `${baseUrl}/chat/completions`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream: Boolean(onChunk),
        max_tokens: 4096,
        temperature: 0.7,
      }),
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
