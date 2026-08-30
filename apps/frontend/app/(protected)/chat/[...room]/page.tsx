import { redirect } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { withAuth } from '@workos-inc/authkit-nextjs'
import { db } from '@/utils/neon/db'
import { rooms, memberships } from '@/utils/neon/schema'
import ChatRoom from '../_components/ChatRoom'

const RoomPage = async ({ params }: { params: Promise<{ room: string[] }> }) => {
  const { user } = await withAuth({ ensureSignedIn: true })
  const { room } = await params
  const slug = room[0]

  const [found] = await db
    .select({
      id: rooms.id,
      slug: rooms.slug,
      name: rooms.name,
      visibility: rooms.visibility,
      ownerId: rooms.ownerId,
    })
    .from(rooms)
    .where(eq(rooms.slug, slug))

  // Unknown room -> back to the room list.
  if (!found) redirect('/chat')

  const isOwner = found.ownerId === user.id

  // Ensure the visitor is a member. For public rooms this is how an invited
  // user joins simply by opening the shared link; it also grants the Ably
  // token capability for this room's channel on the next authorize(). The owner
  // can always enter their own room (and their membership is re-established
  // here if it was ever removed).
  const [existing] = await db
    .select({ userId: memberships.userId })
    .from(memberships)
    .where(and(eq(memberships.roomId, found.id), eq(memberships.userId, user.id)))

  if (!existing) {
    if (found.visibility !== 'public' && !isOwner) redirect('/chat')
    await db
      .insert(memberships)
      .values({ roomId: found.id, userId: user.id, role: isOwner ? 'owner' : 'member' })
      .onConflictDoNothing({ target: [memberships.roomId, memberships.userId] })
  }

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || user.id

  return (
    <ChatRoom
      slug={found.slug}
      roomName={found.name}
      clientId={user.id}
      displayName={displayName}
      isOwner={isOwner}
      visibility={found.visibility}
    />
  )
}

export default RoomPage
