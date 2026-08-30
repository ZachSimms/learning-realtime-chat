
import React from 'react'
import Link from 'next/link';
import { withAuth, signOut } from '@workos-inc/authkit-nextjs';
import { Button, buttonVariants } from '@/components/ui/button';
import NewChatButton from './_components/NewChatButton';
import { db } from '@/utils/neon/db';
import { rooms, memberships } from '@/utils/neon/schema';
import { eq, desc, or, inArray } from 'drizzle-orm';



const Chat = async () => {
  // If the user isn't signed in, they will be automatically redirected to AuthKit
  const { user } = await withAuth({ ensureSignedIn: true });

  // Rooms the user belongs to (so private, invite-only rooms they've joined
  // still appear in their list alongside all public rooms).
  const memberRoomIds = (
    await db
      .select({ roomId: memberships.roomId })
      .from(memberships)
      .where(eq(memberships.userId, user.id))
  ).map((m) => m.roomId);

  const list = await db
    .select({
      slug: rooms.slug,
      name: rooms.name,
      kind: rooms.kind,
      visibility: rooms.visibility,
      ownerId: rooms.ownerId,
    })
    .from(rooms)
    .where(
      or(
        eq(rooms.visibility, 'public'),
        eq(rooms.ownerId, user.id), // owners always see their own rooms, even private ones they've left
        memberRoomIds.length ? inArray(rooms.id, memberRoomIds) : undefined,
      ),
    )
    .orderBy(desc(rooms.createdAt));


  return (
    <div className="flex flex-col h-screen items-center place-content-center">
      <div className="flex flex-col items-center gap-4 min-w-xl">
        <div className="flex justify-between w-full">
          <form
            action={async () => {
              'use server';
              await signOut();
            }}
          // className="item-start"
          >
            <Button type="submit" variant="outline">Sign out</Button>
          </form>
          <p>Welcome {user.firstName}</p>
          <div className="flex items-center gap-2">
            <Link href="/chat/profile" className={buttonVariants({ variant: 'outline' })}>
              Profile
            </Link>
            <NewChatButton />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {list.map((room) => {
            return (
              <a
                key={room.slug}
                href={`/chat/${room.slug}`}
                className="flex flex-col gap-1 border-2 rounded-sm p-4"
              >
                <span>{room.name}</span>
                <span className="flex gap-1 text-xs text-muted-foreground">
                  {room.visibility === 'private' && <span>Private</span>}
                  {room.ownerId === user.id && <span>· Owner</span>}
                </span>
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Chat