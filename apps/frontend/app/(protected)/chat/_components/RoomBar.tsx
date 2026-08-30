'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { setRoomVisibilityAction } from '../_actions/actions'
import { nextVisibility, type Visibility } from '../_lib/rooms'
import InviteDialog from './InviteDialog'
import DeleteRoomDialog from './DeleteRoomDialog'
import MembersDialog from './MembersDialog'

type RoomBarProps = {
  slug: string
  roomName: string
  isOwner: boolean
  visibility: Visibility
}

/**
 * Top bar: room title + visibility badge, Invite, owner-only Members / visibility
 * toggle / Delete, plus Leave (which just returns to the room list — it does NOT
 * remove membership, so an invited member stays invited until the owner removes
 * them).
 */
export default function RoomBar({ slug, roomName, isOwner, visibility }: RoomBarProps) {
  const router = useRouter()
  const [isTogglingVisibility, startToggling] = useTransition()

  const handleToggleVisibility = () => {
    startToggling(async () => {
      await setRoomVisibilityAction(slug, nextVisibility(visibility))
    })
  }

  return (
    <header className="flex items-center justify-between border-b px-4 py-3">
      <div className="flex items-center gap-2">
        <h1 className="truncate text-lg font-semibold">{roomName}</h1>
        {visibility === 'private' && (
          <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">Private</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <InviteDialog slug={slug} visibility={visibility} />

        {isOwner && <MembersDialog slug={slug} />}

        {isOwner && (
          <Button variant="outline" onClick={handleToggleVisibility} disabled={isTogglingVisibility}>
            {isTogglingVisibility
              ? 'Saving…'
              : visibility === 'public'
                ? 'Make private'
                : 'Make public'}
          </Button>
        )}

        <Button variant="outline" onClick={() => router.push('/chat')}>
          Leave
        </Button>

        {isOwner && <DeleteRoomDialog slug={slug} roomName={roomName} />}
      </div>
    </header>
  )
}
