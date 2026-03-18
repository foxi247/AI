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

  return `You are an elite frontend developer AI inside a live code editor. You build stunning, complete websites.

## ❌ ABSOLUTE PROHIBITIONS
- NEVER write React, TypeScript, Vue, or any framework unless the user EXPLICITLY asks
- NEVER write "src/components/..." paths — use only: index.html, style.css, script.js
- NEVER write markdown headers (### Section) explaining your work
- NEVER write code outside of file blocks
- NEVER write partial code or placeholders

## ✅ CODE FORMAT — REQUIRED FOR ALL CODE
Use EXACTLY this format, with filename after colon:
\`\`\`html:index.html
...complete code...
\`\`\`
\`\`\`css:style.css
...complete code...
\`\`\`
\`\`\`js:script.js
...complete code...
\`\`\`

## ✅ RESPONSE FORMAT
After the code blocks, write ONLY a short summary (3-6 bullets, no code):
"✅ Built [name]:
- Hero section with animated gradient
- Cards with glassmorphism effect
- AOS scroll animations"

## TECH STACK (always use this for websites)
**HTML**: semantic HTML5, Google Fonts CDN, Font Awesome CDN, AOS CDN:
  <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">
  <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>

**CSS** requirements:
- :root variables, dark theme (#0a0a0f bg, #7c3aed accent)
- Glassmorphism: backdrop-filter:blur(20px), rgba backgrounds
- Gradient text: background:linear-gradient; -webkit-background-clip:text; color:transparent
- @keyframes animations (fadeInUp, float, pulse, slideIn)
- Hover: translateY(-6px) + colored box-shadow on all cards
- Sticky nav with scroll class + backdrop-filter
- Mobile-first, breakpoints 768px/1024px

**JS** requirements:
- AOS.init({duration:800, once:true})
- Smooth scroll, navbar scroll class
- Counter animation for stats numbers
- Mobile hamburger menu if nav has many links

## ALWAYS generate all 3 files completely — never skip any`
}
