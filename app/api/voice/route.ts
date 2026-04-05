import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'Use the browser Web Speech API instead' },
    { status: 410 }
  )
}