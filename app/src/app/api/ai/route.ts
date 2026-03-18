import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_API_KEY = 'Ra3flT4bkJdLOkh0OoNRkEVhz1byTlaU'
const DEFAULT_BASE_URL = 'https://codestral.mistral.ai/v1'
const DEFAULT_MODEL = 'codestral-latest'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages, model, apiKey, baseUrl } = body

    const url = `${baseUrl || DEFAULT_BASE_URL}/chat/completions`
    const key = apiKey || DEFAULT_API_KEY
    const mdl = model || DEFAULT_MODEL

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: mdl,
        messages,
        stream: false,
        max_tokens: 4096,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json({ error }, { status: response.status })
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
