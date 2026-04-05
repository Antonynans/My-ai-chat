'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp, signIn } from '@/lib/auth-client'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      const res = await signUp.email({ email, password, name })
      if (res.error) {
        if (res.error.code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL') {
          toast.error('An account with this email already exists')
        } else {
          toast.error(res.error.message || 'Registration failed')
        }
        return
      }
      toast.success('Account created!')
      await signIn.email({ email, password })
      router.push('/chat')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    await signIn.social({ provider: 'google', callbackURL: '/chat' })
  }

  const isValid = name.trim() && email.trim() && password.length >= 8

  const steps = [
    { label: '8+ characters', done: password.length >= 8 },
    { label: 'Name entered', done: name.trim().length > 0 },
    { label: 'Valid email', done: /\S+@\S+\.\S+/.test(email) },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--bg)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: '-15%', right: '-10%',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,169,110,0.06) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', left: '-10%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(91,156,246,0.05) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.3,
          backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />
      </div>

      {/* Form panel */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', position: 'relative', zIndex: 1,
      }}>
        <div style={{
          width: '100%', maxWidth: '400px',
          animation: 'fadeInUp 0.22s ease forwards',
        }}>
          {/* Logo */}
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
          }}>Create your account</h1>
          <p style={{
            fontSize: '13px', color: 'var(--text3)', textAlign: 'center',
            marginBottom: '28px',
          }}>Join your team on Nexus</p>

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
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '8px',
                padding: '10px 16px', borderRadius: '9px',
                border: '1px solid var(--border2)',
                background: 'var(--surface)', color: 'var(--text)',
                fontSize: '13.5px', fontFamily: 'var(--ff)',
                cursor: 'pointer', marginBottom: '20px',
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
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <span style={{ fontSize: '11px', color: 'var(--text3)', letterSpacing: '0.05em' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Field
                label="Display name"
                type="text"
                value={name}
                onChange={setName}
                placeholder="Alice Chen"
                focused={focused === 'name'}
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused(null)}
              />
              <Field
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="alice@company.com"
                focused={focused === 'email'}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
              />
              <Field
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="8+ characters"
                focused={focused === 'password'}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
              />

              {/* Password strength indicators */}
              {password.length > 0 && (
                <div style={{
                  display: 'flex', gap: '6px', marginTop: '-4px',
                }}>
                  {steps.map(({ label, done }) => (
                    <div key={label} style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      fontSize: '11px',
                      color: done ? 'var(--online)' : 'var(--text3)',
                      transition: 'color 0.2s',
                    }}>
                      <span style={{ fontSize: '10px' }}>{done ? '✓' : '·'}</span>
                      {label}
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !isValid}
                style={{
                  width: '100%', padding: '11px 16px',
                  borderRadius: '9px', border: 'none',
                  background: isValid ? 'var(--accent)' : 'var(--surface2)',
                  color: isValid ? '#0c0c0d' : 'var(--text3)',
                  fontSize: '13.5px', fontFamily: 'var(--ff)', fontWeight: '600',
                  cursor: isValid && !loading ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '8px', marginTop: '6px',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {loading
                  ? <div className="spinner" style={{ width: '14px', height: '14px', borderTopColor: '#0c0c0d', borderColor: 'rgba(0,0,0,0.15)' }} />
                  : 'Create account'
                }
              </button>
            </form>
          </div>

          <p style={{
            textAlign: 'center', fontSize: '13px',
            color: 'var(--text3)', marginTop: '20px',
          }}>
            Already have an account?{' '}
            <Link href="/auth/login" style={{
              color: 'var(--accent)', textDecoration: 'none', fontWeight: '500',
            }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right panel — decorative */}
      <div style={{
        display: 'none',
        flex: '0 0 380px',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '48px',
        borderLeft: '1px solid var(--border)',
        position: 'relative', zIndex: 1,
        gap: '32px',
      }} className="register-right-panel">
        <div>
          <div style={{
            fontSize: '11px', fontWeight: '600', letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--accent)',
            marginBottom: '12px',
          }}>What you get</div>
          <div style={{
            fontSize: '24px', fontFamily: 'var(--ff-display)', fontWeight: '700',
            lineHeight: '1.35', color: 'var(--text)', letterSpacing: '-0.4px',
          }}>
            A smarter way<br />to work together.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            {
              icon: '✦',
              title: 'AI on demand',
              desc: 'Type @ai in any message to get instant help from Nexus AI.',
              color: 'var(--ai)',
            },
            {
              icon: '#',
              title: 'Channels',
              desc: 'Organize conversations by topic, team, or project.',
              color: 'var(--accent)',
            },
            {
              icon: '⊙',
              title: 'Live presence',
              desc: 'See who\'s online and who\'s typing in real time.',
              color: 'var(--online)',
            },
          ].map(({ icon, title, desc, color }) => (
            <div key={title} style={{
              display: 'flex', gap: '14px', alignItems: 'flex-start',
            }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'var(--surface)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', color, flexShrink: 0,
              }}>{icon}</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '3px' }}>{title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text3)', lineHeight: '1.5' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (min-width: 900px) {
          .register-right-panel { display: flex !important; }
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