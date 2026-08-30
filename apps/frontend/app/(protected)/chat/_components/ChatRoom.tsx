'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChatClient } from '@ably/chat'
import { ChatClientProvider, ChatRoomProvider } from '@ably/chat/react'
import { getAblyClient } from '@/providers/ClientAblyProvider'
import ChatWindow from './ChatWindow'
import type { Visibility } from '../_lib/rooms'

type ChatRoomProps = {
  slug: string
  roomName: string
  clientId: string
  displayName: string
  isOwner: boolean
  visibility: Visibility
}

/**
 * Client entrypoint for a room. Before mounting the chat providers we force a
 * token refresh (`auth.authorize`) so the freshly-joined room's capability is
 * present in the token — the Ably client is created once at app load, before
 * any membership existed, so its cached token would otherwise omit this room.
 */
export default function ChatRoom({ slug, roomName, clientId, displayName, isOwner, visibility }: ChatRoomProps) {
  const realtime = getAblyClient()
  const [status, setStatus] = useState<'authorizing' | 'ready' | 'error'>('authorizing')

  useEffect(() => {
    if (!realtime) return
    let cancelled = false
    realtime.auth
      .authorize()
      .then(() => {
        if (!cancelled) setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [realtime])

  const chatClient = useMemo(() => (realtime ? new ChatClient(realtime) : undefined), [realtime])

  if (!realtime || !chatClient) {
    return <CenteredMessage>Connecting…</CenteredMessage>
  }
  if (status === 'authorizing') {
    return <CenteredMessage>Joining “{roomName}”…</CenteredMessage>
  }
  if (status === 'error') {
    return <CenteredMessage>Could not connect to this room. Try refreshing the page.</CenteredMessage>
  }

  return (
    <ChatClientProvider client={chatClient}>
      <ChatRoomProvider name={slug}>
        <ChatWindow
          slug={slug}
          roomName={roomName}
          clientId={clientId}
          displayName={displayName}
          isOwner={isOwner}
          visibility={visibility}
        />
      </ChatRoomProvider>
    </ChatClientProvider>
  )
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-muted-foreground text-sm">{children}</p>
    </div>
  )
}
