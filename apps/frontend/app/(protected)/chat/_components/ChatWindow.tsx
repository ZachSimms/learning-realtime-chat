'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChatMessageAction, ChatMessageEventType, type Message } from '@ably/chat'
import { useMessages, usePresence, usePresenceListener } from '@ably/chat/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { dedupePresence, type Visibility } from '../_lib/rooms'
import Participants from './Participants'
import RoomBar from './RoomBar'

type ChatWindowProps = {
  slug: string
  roomName: string
  clientId: string
  displayName: string
  isOwner: boolean
  visibility: Visibility
}

function upsertMessage(list: Message[], incoming: Message): Message[] {
  const idx = list.findIndex((m) => m.serial === incoming.serial)
  const next = idx === -1 ? [...list, incoming] : list.map((m, i) => (i === idx ? m.with(incoming) : m))
  // Deterministic order by serial (chronological).
  return next.sort((a, b) => (a.serial < b.serial ? -1 : a.serial > b.serial ? 1 : 0))
}

export default function ChatWindow({
  slug,
  roomName,
  clientId,
  displayName,
  isOwner,
  visibility,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const { sendMessage, historyBeforeSubscribe } = useMessages({
    listener: (event) => {
      setMessages((prev) => {
        switch (event.type) {
          case ChatMessageEventType.Created:
          case ChatMessageEventType.Updated:
          case ChatMessageEventType.Deleted:
            return upsertMessage(prev, event.message)
          default:
            return prev
        }
      })
    },
  })

  // Auto-enter presence with a friendly display name.
  usePresence({ initialData: { name: displayName } })
  const { presenceData } = usePresenceListener()
  const participants = useMemo(() => dedupePresence(presenceData), [presenceData])
  const nameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of participants) if (p.name) map.set(p.clientId, p.name)
    return map
  }, [participants])

  // Load the messages that existed before we subscribed.
  useEffect(() => {
    if (!historyBeforeSubscribe) return
    let cancelled = false
    historyBeforeSubscribe({ limit: 100 })
      .then((result) => {
        if (cancelled) return
        setMessages((prev) => {
          let merged = prev
          for (const m of result.items) merged = upsertMessage(merged, m)
          return merged
        })
      })
      .catch(() => {
        /* history is best-effort; ignore */
      })
    return () => {
      cancelled = true
    }
  }, [historyBeforeSubscribe])

  // Keep the view pinned to the latest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  const handleSend = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const text = draft.trim()
      if (!text || sending) return
      setSending(true)
      try {
        // Carry the sender's name on the message so authors stay named even in
        // history or once they've left presence (presence only covers who is
        // currently online).
        await sendMessage({ text, metadata: { name: displayName } })
        setDraft('')
      } catch {
        /* keep the draft so the user can retry */
      } finally {
        setSending(false)
      }
    },
    [draft, sending, sendMessage, displayName],
  )

  return (
    <div className="flex h-screen flex-col">
      <RoomBar slug={slug} roomName={roomName} isOwner={isOwner} visibility={visibility} />

      <main className="flex flex-1 justify-center overflow-hidden p-4">
        <div className="flex w-full max-w-2xl flex-col rounded-lg border">
          <div className="border-b px-4 py-3">
            <Participants participants={participants} selfClientId={clientId} />
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <p className="text-muted-foreground text-center text-sm">No messages yet. Say hello 👋</p>
            ) : (
              messages.map((m) => {
                const isSelf = m.clientId === clientId
                const isDeleted = m.action === ChatMessageAction.MessageDelete
                // Prefer the name stored on the message, then live presence, then the id.
                const metaName = typeof m.metadata?.name === 'string' ? m.metadata.name : undefined
                const author = isSelf ? 'You' : metaName ?? nameById.get(m.clientId) ?? m.clientId
                return (
                  <div key={m.serial} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                    <span className="text-muted-foreground text-xs">{author}</span>
                    <div
                      className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                        isSelf ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}
                    >
                      {isDeleted ? <em className="opacity-70">message deleted</em> : m.text}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <form onSubmit={handleSend} className="flex gap-2 border-t p-4">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message…"
              aria-label="Message"
              autoComplete="off"
            />
            <Button type="submit" disabled={sending || draft.trim().length === 0}>
              Send
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
