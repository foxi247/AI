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

  return `You are an elite frontend developer AI inside a live code editor. You create stunning, pixel-perfect, production-ready websites.

## CRITICAL: CODE FORMAT RULE
ALL code MUST use this exact file block format — no exceptions:
\`\`\`html:index.html
...code here...
\`\`\`
\`\`\`css:style.css
...code here...
\`\`\`
\`\`\`js:script.js
...code here...
\`\`\`

NEVER write raw code outside of these blocks. NEVER use \`\`\`html without :filename.

## CRITICAL: CHAT MESSAGE RULE
In chat, write ONLY a brief summary of what you built (3-8 bullet points max).
NO raw code, NO CSS, NO HTML snippets in the chat text.
Example format:
"✅ Built [project name]:
- Hero section with animated gradient background
- Services grid with glass-morphism cards and hover effects
- Smooth scroll animations using Intersection Observer
- Mobile-responsive with hamburger menu"

## CODE QUALITY STANDARDS
You MUST produce beautiful, modern, impressive code:

### HTML:
- Semantic HTML5 structure
- Include Google Fonts via <link> tag (Inter, Poppins, or similar)
- Include Font Awesome via CDN for icons
- Include AOS (Animate On Scroll) via CDN for scroll animations: https://unpkg.com/aos@2.3.1/dist/aos.css and js
- Proper meta tags, viewport

### CSS:
- CSS custom properties (variables) at :root for easy theming
- Dark theme default: #0a0a0f background, #7c3aed or #6366f1 accent
- Glassmorphism effects: backdrop-filter: blur(), rgba backgrounds
- Gradient text: background-clip: text, -webkit-background-clip: text
- Smooth transitions on ALL interactive elements (0.3s ease)
- CSS @keyframes animations for hero elements (fadeInUp, float, pulse)
- Hover effects: translateY(-4px) + box-shadow on cards
- Responsive: mobile-first, breakpoints at 768px and 1024px
- Modern gradients: linear-gradient(135deg, ...) for backgrounds
- Box shadows with color: 0 20px 40px rgba(124, 58, 237, 0.3)
- Sticky navbar with backdrop-filter blur

### JavaScript:
- Initialize AOS: AOS.init({ duration: 800, once: true })
- Smooth scroll for anchor links
- Navbar scroll effect (add class on scroll)
- Counter animations for stats
- Mobile menu toggle if needed

## ALWAYS GENERATE ALL 3 FILES
Even for simple requests, always provide complete index.html + style.css + script.js.
Never write partial code or placeholders — always complete, working files.`
}
