'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '@/lib/auth-client'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn.email({ email, password })
      router.push('/chat')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    try {
      await signIn.social({ provider: 'google', callbackURL: '/chat' })
    } catch {
      toast.error('Google sign-in failed')
      setGoogleLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--bg)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient background orbs */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-20%', left: '-10%',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,169,110,0.06) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', right: '-10%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(91,156,246,0.05) 0%, transparent 70%)',
        }} />
        {/* Fine grid */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.3,
          backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />
      </div>

      {/* Left panel — branding */}
      <div style={{
        display: 'none',
        flex: '0 0 420px',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px',
        borderRight: '1px solid var(--border)',
        position: 'relative', zIndex: 1,
      }} className="login-left-panel">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', background: 'var(--accent)',
            borderRadius: '8px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '15px', fontWeight: '800',
            color: '#0c0c0d', fontFamily: 'var(--ff-display)',
            flexShrink: 0,
          }}>N</div>
          <span style={{ fontFamily: 'var(--ff-display)', fontWeight: '700', fontSize: '16px' }}>Nexus</span>
        </div>

        {/* Quote */}
        <div>
          <div style={{
            fontSize: '28px', fontFamily: 'var(--ff-display)', fontWeight: '700',
            lineHeight: '1.3', color: 'var(--text)', marginBottom: '16px',
            letterSpacing: '-0.5px',
          }}>
            Your team,<br />
            <span style={{ color: 'var(--accent)' }}>in sync.</span>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text3)', lineHeight: '1.6' }}>
            Real-time messaging with an AI teammate that joins when you need it. No noise, just signal.
          </p>
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { icon: '⚡', text: 'Real-time messaging' },
            { icon: '✦', text: 'AI assistant via @ai mention' },
            { icon: '🎤', text: 'Voice messages' },
          ].map(({ icon, text }) => (
            <div key={text} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)',
            }}>
              <span style={{ fontSize: '14px' }}>{icon}</span>
              <span style={{ fontSize: '13px', color: 'var(--text2)' }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', position: 'relative', zIndex: 1,
      }}>
        <div style={{
          width: '100%', maxWidth: '400px',
          animation: 'fadeInUp 0.22s ease forwards',
        }}>
          {/* Mobile logo */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '8px', marginBottom: '36px',
          }}>
            <div style={{
              width: '30px', height: '30px', background: 'var(--accent)',
              borderRadius: '7px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '14px', fontWeight: '800',
              color: '#0c0c0d', fontFamily: 'var(--ff-display)',
            }}>N</div>
            <span style={{ fontFamily: 'var(--ff-display)', fontWeight: '700', fontSize: '15px' }}>Nexus</span>
          </div>

          <h1 style={{
            fontFamily: 'var(--ff-display)', fontSize: '22px', fontWeight: '700',
            textAlign: 'center', marginBottom: '6px', letterSpacing: '-0.3px',
          }}>Welcome back</h1>
          <p style={{
            fontSize: '13px', color: 'var(--text3)', textAlign: 'center',
            marginBottom: '28px',
          }}>Sign in to continue to your workspace</p>

          {/* Card */}
          <div style={{
            background: 'var(--sidebar)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          }}>
            {/* Google */}
            <button
              onClick={handleGoogle}
              disabled={googleLoading}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '8px',
                padding: '10px 16px', borderRadius: '9px',
                border: '1px solid var(--border2)',
                background: 'var(--surface)', color: 'var(--text)',
                fontSize: '13.5px', fontFamily: 'var(--ff)',
                cursor: googleLoading ? 'default' : 'pointer',
                marginBottom: '20px',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--border3)'
                e.currentTarget.style.background = 'var(--surface2)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border2)'
                e.currentTarget.style.background = 'var(--surface)'
              }}
            >
              {googleLoading ? (
                <div className="spinner" style={{ width: '14px', height: '14px' }} />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continue with Google
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <span style={{ fontSize: '11px', color: 'var(--text3)', letterSpacing: '0.05em' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Field
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@company.com"
                focused={focused === 'email'}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
              />
              <Field
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                focused={focused === 'password'}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
              />

              <button
                type="submit"
                disabled={loading || !email || !password}
                style={{
                  width: '100%', padding: '11px 16px',
                  borderRadius: '9px', border: 'none',
                  background: email && password ? 'var(--accent)' : 'var(--surface2)',
                  color: email && password ? '#0c0c0d' : 'var(--text3)',
                  fontSize: '13.5px', fontFamily: 'var(--ff)', fontWeight: '600',
                  cursor: email && password && !loading ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '8px', marginTop: '4px',
                  transition: 'background 0.15s, color 0.15s, opacity 0.15s',
                }}
              >
                {loading
                  ? <div className="spinner" style={{ width: '14px', height: '14px', borderTopColor: '#0c0c0d', borderColor: 'rgba(0,0,0,0.15)' }} />
                  : 'Sign in'
                }
              </button>
            </form>
          </div>

          <p style={{
            textAlign: 'center', fontSize: '13px',
            color: 'var(--text3)', marginTop: '20px',
          }}>
            No account?{' '}
            <Link href="/auth/register" style={{
              color: 'var(--accent)', textDecoration: 'none', fontWeight: '500',
            }}>
              Create one
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (min-width: 768px) {
          .login-left-panel { display: flex !important; }
        }
      `}</style>
    </div>
  )
}

function Field({
  label, type, value, onChange, placeholder, focused, onFocus, onBlur,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  focused: boolean
  onFocus: () => void
  onBlur: () => void
}) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: '12px', fontWeight: '500',
        color: focused ? 'var(--accent)' : 'var(--text2)',
        marginBottom: '6px', transition: 'color 0.15s',
      }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required
        onFocus={onFocus}
        onBlur={onBlur}
        style={{
          width: '100%', padding: '10px 12px',
          borderRadius: '8px',
          border: `1px solid ${focused ? 'var(--accent)' : 'var(--border2)'}`,
          background: focused ? 'rgba(200,169,110,0.04)' : 'var(--surface)',
          color: 'var(--text)', fontSize: '13.5px',
          fontFamily: 'var(--ff)', outline: 'none',
          transition: 'border-color 0.15s, background 0.15s',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}