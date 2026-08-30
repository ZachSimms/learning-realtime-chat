'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { listRoomMembersAction, removeMemberAction, type RoomMember } from '../_actions/actions'

/**
 * Owner-only member management. Lists everyone with a membership (invited or
 * joined) and lets the owner remove them — the only way an invitation ends.
 */
export default function MembersDialog({ slug }: { slug: string }) {
  const [members, setMembers] = useState<RoomMember[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, startLoading] = useTransition()
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null)

  const load = () => {
    setError(null)
    startLoading(async () => {
      setMembers(await listRoomMembersAction(slug))
    })
  }

  const handleOpenChange = (open: boolean) => {
    if (open) load()
    else setMembers(null)
  }

  const handleRemove = async (userId: string) => {
    setPendingRemoval(userId)
    setError(null)
    const res = await removeMemberAction(slug, userId)
    setPendingRemoval(null)
    if (res.ok) {
      setMembers((prev) => prev?.filter((m) => m.userId !== userId) ?? null)
    } else {
      setError(res.error)
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline">Members</Button>} />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Members</DialogTitle>
          <DialogDescription>People with access to this room.</DialogDescription>
        </DialogHeader>

        {error && <p className="text-destructive text-xs">{error}</p>}

        {isLoading && !members ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {members?.map((m) => (
              <li key={m.userId} className="flex items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{m.name}</p>
                  {m.email && <p className="text-muted-foreground truncate text-xs">{m.email}</p>}
                </div>
                {m.isOwner ? (
                  <span className="text-muted-foreground shrink-0 text-xs">Owner</span>
                ) : (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemove(m.userId)}
                    disabled={pendingRemoval === m.userId}
                  >
                    {pendingRemoval === m.userId ? 'Removing…' : 'Remove'}
                  </Button>
                )}
              </li>
            ))}
            {members && members.length === 0 && (
              <li className="text-muted-foreground py-2 text-sm">No members yet.</li>
            )}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
