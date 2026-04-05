'use client'
import { useMemo } from 'react'

interface MessageContentProps {
  content: string
  isStreaming?: boolean
}

function parseContent(content: string): string {
  // Escape HTML
  let html = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Code blocks
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
    `<pre><code class="language-${lang}">${code.trim()}</code></pre>`
  )

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

  // Italic
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')

  // @ai mention
  html = html.replace(/(@ai)/gi, '<span class="ai-mention">$1</span>')

  // @user mention
  html = html.replace(/@([a-zA-Z0-9_]+)/g, '<span class="user-mention">@$1</span>')

  // Numbered list
  html = html.replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
  html = html.replace(/(<li>.*<\/li>(\n)?)+/g, (m) => `<ol>${m}</ol>`)

  // Bullet list
  html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>(?!.*<ol).*<\/li>(\n)?)+/g, (m) => `<ul>${m}</ul>`)

  // Line breaks (not inside pre blocks)
  html = html.replace(/\n/g, '<br>')
  // But fix inside pre blocks
  html = html.replace(/<pre>([\s\S]*?)<\/pre>/g, (_, code) =>
    `<pre>${code.replace(/<br>/g, '\n')}</pre>`
  )

  return html
}

export function MessageContent({ content, isStreaming }: MessageContentProps) {
  const html = useMemo(() => parseContent(content), [content])

  return (
    <div className="msg-content" style={{ display: 'inline' }}>
      <span dangerouslySetInnerHTML={{ __html: html }} />
      {isStreaming && (
        <span style={{ display: 'inline-flex', gap: '3px', alignItems: 'center', marginLeft: '4px', verticalAlign: 'middle' }}>
          <span className="streaming-dot" />
          <span className="streaming-dot" />
          <span className="streaming-dot" />
        </span>
      )}
    </div>
  )
}
