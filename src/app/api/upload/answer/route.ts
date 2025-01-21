import { NextResponse } from 'next/server'

const answers: { [key: string]: RTCSessionDescriptionInit } = {}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const screen = searchParams.get('screen')

  if (!screen) {
    return NextResponse.json({ error: 'Screen parameter is required' }, { status: 400 })
  }

  const { answer } = await request.json()
  answers[screen] = answer

  return NextResponse.json({ success: true })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const screen = searchParams.get('screen')

  if (!screen) {
    return NextResponse.json({ error: 'Screen parameter is required' }, { status: 400 })
  }

  const answer = answers[screen]
  if (!answer) {
    return NextResponse.json({ error: 'No answer available for this screen' }, { status: 404 })
  }

  return NextResponse.json({ answer })
}