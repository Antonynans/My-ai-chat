import { getInitials, generateAvatarColor } from '@/lib/utils'

interface AvatarProps {
  name: string
  photoURL?: string
  size?: number
  showPresence?: boolean
  isOnline?: boolean
  isAway?: boolean
}

export function Avatar({ name, photoURL, size = 32, showPresence, isOnline, isAway }: AvatarProps) {
  const initials = getInitials(name)
  const color = generateAvatarColor(name)
  const dotSize = Math.max(8, size * 0.28)

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {photoURL ? (
        <img
          src={photoURL} alt={name}
          style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div style={{
          width: size, height: size, borderRadius: '50%', background: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.34, fontWeight: '600', color: 'rgba(255,255,255,0.9)',
          fontFamily: 'var(--ff-display)',
        }}>
          {initials}
        </div>
      )}
      {showPresence && (
        <div style={{
          position: 'absolute', bottom: -1, right: -1,
          width: dotSize, height: dotSize, borderRadius: '50%',
          background: isOnline ? 'var(--online)' : isAway ? 'var(--away)' : 'var(--text3)',
          border: `2px solid var(--sidebar)`,
        }} />
      )}
    </div>
  )
}
