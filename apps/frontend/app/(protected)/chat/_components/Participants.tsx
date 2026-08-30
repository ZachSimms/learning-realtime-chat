'use client'

import type { Participant } from '../_lib/rooms'

function initials(label: string): string {
  const parts = label.trim().split(/\s+/)
  const chars = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : label.slice(0, 2)
  return chars.toUpperCase()
}

/**
 * Live indicator of who else is present in the room.
 */
export default function Participants({
  participants,
  selfClientId,
}: {
  participants: Participant[]
  selfClientId: string
}) {
  return (
    <div className="flex items-center gap-2" aria-label="Participants">
      <div className="flex -space-x-2">
        {participants.map((p) => {
          const label = p.name ?? p.clientId
          const isSelf = p.clientId === selfClientId
          return (
            <span
              key={p.clientId}
              title={isSelf ? `${label} (you)` : label}
              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary/10 text-[11px] font-medium text-primary"
            >
              {initials(label)}
            </span>
          )
        })}
      </div>
      <span className="text-muted-foreground text-sm">
        {participants.length} {participants.length === 1 ? 'participant' : 'participants'}
      </span>
    </div>
  )
}
