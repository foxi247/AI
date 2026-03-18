import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_API_KEY = 'xIUUS0W8ht9Wgl0pZqKPFqmzMkYXvzqx'
const DEFAULT_BASE_URL = 'https://codestral.mistral.ai/v1'
const DEFAULT_MODEL = 'codestral-latest'

function isAnthropicUrl(url: string) {
  return url.includes('anthropic.com') || url.includes('claude')
}

// Convert OpenAI-format messages to Anthropic format
function toAnthropicMessages(messages: Array<{ role: string; content: string }>) {
  const system = messages.find((m) => m.role === 'system')?.content || ''
  const chat = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
  return { system, messages: chat }
}

// Convert Anthropic response to OpenAI format
function fromAnthropicResponse(data: Record<string, unknown>) {
  const text = (data.content as Array<{ type: string; text: string }>)
    ?.find((b) => b.type === 'text')?.text || ''
  return {
    choices: [{ message: { role: 'assistant', content: text }, finish_reason: 'stop' }],
  }
}

// Convert Anthropic SSE stream to OpenAI SSE stream
async function* transformAnthropicStream(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buf = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const raw = line.slice(6)
      if (raw === '[DONE]') { yield 'data: [DONE]\n\n'; continue }
      try {
        const ev = JSON.parse(raw)
        // content_block_delta → text delta
        if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') {
          const chunk = { choices: [{ delta: { content: ev.delta.text }, finish_reason: null }] }
          yield `data: ${JSON.stringify(chunk)}\n\n`
        }
        if (ev.type === 'message_stop') {
          yield 'data: [DONE]\n\n'
        }
      } catch { /* skip malformed */ }
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages, model, apiKey, baseUrl, stream, tools, tool_choice } = body

    const resolvedBase = baseUrl || DEFAULT_BASE_URL
    const key = apiKey || DEFAULT_API_KEY
    const mdl = model || DEFAULT_MODEL
    const isAnthropic = isAnthropicUrl(resolvedBase)

    // ── Anthropic Claude ──────────────────────────────────────────────────
    if (isAnthropic) {
      const { system, messages: chatMessages } = toAnthropicMessages(messages)
      const url = resolvedBase.endsWith('/messages')
        ? resolvedBase
        : `${resolvedBase.replace(/\/$/, '')}/messages`

      const reqBody: Record<string, unknown> = {
        model: mdl,
        max_tokens: 16384,
        system,
        messages: chatMessages,
        stream: Boolean(stream),
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(reqBody),
      })

      if (!response.ok) {
        const error = await response.text()
        return NextResponse.json({ error }, { status: response.status })
      }

      if (stream && response.body) {
        const transformed = transformAnthropicStream(response.body)
        const readable = new ReadableStream({
          async pull(controller) {
            const { value, done } = await transformed.next()
            if (done) { controller.close(); return }
            controller.enqueue(new TextEncoder().encode(value))
          },
        })
        return new Response(readable, {
          headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' },
        })
      }

      const data = await response.json()
      return NextResponse.json(fromAnthropicResponse(data as Record<string, unknown>))
    }

    // ── OpenAI-compatible (Mistral, OpenAI, Groq, etc.) ──────────────────
    const url = `${resolvedBase}/chat/completions`
    const requestBody: Record<string, unknown> = {
      model: mdl,
      messages,
      stream: Boolean(stream),
      max_tokens: 16384,
      temperature: 0.7,
    }
    if (tools?.length) {
      requestBody.tools = tools
      requestBody.tool_choice = tool_choice || 'auto'
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json({ error }, { status: response.status })
    }

    if (stream && response.body) {
      return new Response(response.body, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' },
      })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
