"use client"

import { useEffect, useMemo, useRef, useState, KeyboardEvent } from 'react'

interface OrderMessage {
  id: string
  order_id: string
  sender_id: string | null
  sender_role: string | null
  sender?: string | null
  body: string
  created_at?: string
  visible_to_user?: boolean | null
}

interface Props {
  orderId: string
  initialMessages: OrderMessage[]
}

type Status = 'pending' | 'sent' | 'failed'

type LocalMessage = OrderMessage & { __status?: Status; __tempId?: string; __error?: string }

export function AdminMessagesPanel({ orderId, initialMessages }: Props) {
  const [messages, setMessages] = useState<LocalMessage[]>(() => initialMessages || [])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())
  }, [messages])

  useEffect(() => {
    const el = containerRef.current
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }
  }, [sortedMessages.length])

  const sendMessage = async (bodyInput: string, internal: boolean) => {
    const text = bodyInput.trim()
    if (!text) return

    const tempId = `temp-${Date.now()}`
    const optimistic: LocalMessage = {
      id: tempId,
      __tempId: tempId,
      __status: 'pending',
      order_id: orderId,
      sender_role: internal ? 'internal' : 'admin',
      sender: internal ? 'internal' : 'admin',
      sender_id: null,
      body: text,
      visible_to_user: internal ? false : true,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, optimistic])
    setIsSending(true)

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text, internal }),
      })

      const responseText = await res.text()
      let payload: any = {}
      try {
        payload = responseText ? JSON.parse(responseText) : {}
      } catch (e) {
        console.warn('Failed to parse response JSON', responseText)
      }

      if (!res.ok) {
        const msg = payload.detail || payload.error || responseText || 'Failed to send message'
        console.warn('Admin message send failed', { status: res.status, statusText: res.statusText, text: responseText, payload })
        throw new Error(msg)
      }

      const saved: LocalMessage = { ...(payload.message || {}), __status: 'sent' }
      setMessages((prev) => prev.map((m) => (m.id === tempId ? saved : m)))
    } catch (err: any) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, __status: 'failed', __error: err?.message || 'Failed to send' } : m)))
    } finally {
      setIsSending(false)
      setInput('')
    }
  }

  const retryMessage = (message: LocalMessage) => {
    const internal = message.visible_to_user === false
    // Keep body intact and re-send
    sendMessage(message.body, internal)
    setMessages((prev) => prev.filter((m) => m.id !== message.id))
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>, internal: boolean) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input, internal)
    }
  }

  return (
    <div className="space-y-3">
      <div ref={containerRef} className="h-80 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
        {sortedMessages.length === 0 && (
          <div className="text-sm text-slate-500 text-center py-6">No messages yet</div>
        )}
        {sortedMessages.map((m) => {
          const isAdmin = (m.sender_role || m.sender) === 'admin'
          const isInternal = m.visible_to_user === false || m.sender_role === 'internal'
          const alignment = isAdmin ? 'justify-end' : 'justify-start'
          const bubbleStyles = isAdmin
            ? 'bg-slate-900 text-white border border-slate-800'
            : 'bg-white text-slate-900 border border-slate-200'
          const timestamp = m.created_at ? new Date(m.created_at).toLocaleString() : ''

          if (isInternal) {
            return (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[80%] rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
                    <span className="rounded-full bg-amber-200 px-2 py-0.5">Internal note</span>
                    <span>{timestamp}</span>
                  </div>
                  <div className="mt-1 whitespace-pre-wrap leading-relaxed">{m.body}</div>
                  {m.__status === 'failed' && (
                    <div className="mt-2 text-xs text-red-700">Failed to send: {m.__error || 'Unknown error'}</div>
                  )}
                </div>
              </div>
            )
          }

          return (
            <div key={m.id} className={`flex ${alignment}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 border shadow-sm ${bubbleStyles}`}>
                <div className="flex items-center justify-between gap-3 mb-1 text-xs uppercase tracking-wide font-semibold">
                  <span className={isAdmin ? 'text-white/80' : 'text-slate-500'}>{isAdmin ? 'NexSupply' : 'User'}</span>
                  <span className={isAdmin ? 'text-white/60' : 'text-slate-400'}>{timestamp}</span>
                </div>
                <div className="text-sm whitespace-pre-wrap leading-relaxed">{m.body}</div>
                {m.__status === 'failed' && (
                  <div className="mt-2 text-xs text-red-200 flex items-center gap-2">
                    <span>Failed to send.</span>
                    <button
                      type="button"
                      onClick={() => retryMessage(m)}
                      className="rounded border border-red-200 px-2 py-1 text-xs text-red-100 hover:bg-white/10"
                    >
                      Retry
                    </button>
                  </div>
                )}
                {m.__status === 'pending' && (
                  <div className="mt-2 text-xs text-white/70">Sending…</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-800">Send message</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => onKeyDown(e, false)}
          placeholder="Type a message"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          rows={3}
        />
        <div className="flex gap-2">
          <button
            onClick={() => sendMessage(input, false)}
            disabled={isSending || !input.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? 'Sending…' : 'Send'}
          </button>
          <button
            onClick={() => sendMessage(input, true)}
            disabled={isSending || !input.trim()}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? 'Saving…' : 'Add internal note'}
          </button>
        </div>
        <p className="text-xs text-slate-500">Enter to send, Shift+Enter for newline.</p>
      </div>
    </div>
  )
}
