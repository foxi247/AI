import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_API_KEY = 'xIUUS0W8ht9Wgl0pZqKPFqmzMkYXvzqx'
const DEFAULT_BASE_URL = 'https://codestral.mistral.ai/v1'
const DEFAULT_MODEL = 'codestral-latest'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages, model, apiKey, baseUrl, stream, tools, tool_choice } = body

    const url = `${baseUrl || DEFAULT_BASE_URL}/chat/completions`
    const key = apiKey || DEFAULT_API_KEY
    const mdl = model || DEFAULT_MODEL

    const requestBody: Record<string, unknown> = {
      model: mdl,
      messages,
      stream: Boolean(stream),
      max_tokens: 32768,
      temperature: 0.7,
    }
    if (tools?.length) {
      requestBody.tools = tools
      requestBody.tool_choice = tool_choice || 'auto'
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json({ error }, { status: response.status })
    }

    // Proxy streaming response directly
    if (stream && response.body) {
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'X-Accel-Buffering': 'no',
        },
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
