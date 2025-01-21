import { NextResponse } from 'next/server'

const offers: { [key: string]: RTCSessionDescriptionInit } = {}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const screen = searchParams.get('screen')

  if (!screen) {
    return NextResponse.json({ error: 'Screen parameter is required' }, { status: 400 })
  }

  const offer = offers[screen]
  if (!offer) {
    return NextResponse.json({ error: 'No offer available for this screen' }, { status: 404 })
  }

  return NextResponse.json({ offer })
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const screen = searchParams.get('screen')

  if (!screen) {
    return NextResponse.json({ error: 'Screen parameter is required' }, { status: 400 })
  }

  const { offer } = await request.json()
  offers[screen] = offer

  return NextResponse.json({ success: true })
}