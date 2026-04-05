import { NextRequest, NextResponse } from 'next/server'
import { auth as betterAuth } from '@/lib/auth'
import admin from '@/lib/firebase-admin'

export async function GET(req: NextRequest) {
  try {
    const session = await betterAuth.api.getSession({
      headers: req.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const firebaseToken = await admin.auth().createCustomToken(session.user.id, {
      email: session.user.email,
      name: session.user.name,
    })

    return NextResponse.json({ token: firebaseToken })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error('Firebase token error:', errorMessage)
    console.error('Full error:', err)
    return NextResponse.json({ error: 'Failed to create token', details: errorMessage }, { status: 500 })
  }
}