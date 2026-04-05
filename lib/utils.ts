import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMessageTime(date: Date): string {
  return format(date, 'HH:mm')
}

export function formatDateDivider(date: Date): string {
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMMM d, yyyy')
}

export function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true })
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function generateAvatarColor(str: string): string {
  const colors = [
    '#3a5a8c', '#5a3a6a', '#2a5a3a', '#8c3a3a',
    '#5a5a3a', '#3a5a5a', '#6a3a5a', '#4a3a7a',
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function detectAIMention(content: string): boolean {
  return /\@ai\b/i.test(content)
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

export function generateRoomId(): string {
  return Math.random().toString(36).substr(2, 9)
}
