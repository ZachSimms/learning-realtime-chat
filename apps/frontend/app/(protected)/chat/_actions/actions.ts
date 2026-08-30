'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { withAuth, getWorkOS } from '@workos-inc/authkit-nextjs'
import { db } from '@/utils/neon/db'
import { rooms, memberships } from '@/utils/neon/schema'
import {
  validateRoomName,
  normalizeEmail,
  isValidEmail,
  pickUserByEmail,
  type Visibility,
} from '../_lib/rooms'

async function ensureMembership(roomId: string, userId: string, role: 'owner' | 'member') {
  await db
    .insert(memberships)
    .values({ roomId, userId, role })
    .onConflictDoNothing({ target: [memberships.roomId, memberships.userId] })
}

/**
 * Create (or join, if it already exists) a public chat room, then redirect the
 * user into it. Called from the "New Chat" dialog form.
 */
export async function createRoomAction(form: FormData) {
  const { user } = await withAuth({ ensureSignedIn: true })

  const result = validateRoomName(form.get('room-name'))
  if (!result.ok) {
    // Bubble a friendly message up to the nearest error boundary.
    throw new Error(result.error)
  }
  const { name, slug } = result

  // Upsert the room by its unique slug. If a public room with this slug already
  // exists we simply join it rather than failing.
  await db
    .insert(rooms)
    .values({ slug, name, kind: 'chat', visibility: 'public', ownerId: user.id })
    .onConflictDoNothing({ target: rooms.slug })

  const [room] = await db.select({ id: rooms.id, ownerId: rooms.ownerId }).from(rooms).where(eq(rooms.slug, slug))
  if (!room) {
    throw new Error('Failed to create room. Please try again.')
  }

  await ensureMembership(room.id, user.id, room.ownerId === user.id ? 'owner' : 'member')

  revalidatePath('/chat')
  redirect(`/chat/${slug}`)
}

/**
 * Return the current AuthKit session access token for the WorkOS widgets.
 * Server-authoritative (no client token hook), always fresh via `withAuth`.
 */
export async function getWidgetAccessTokenAction(): Promise<string> {
  const { accessToken } = await withAuth({ ensureSignedIn: true })
  return accessToken
}

async function requireRoomOwner(slug: string, userId: string) {
  const [room] = await db
    .select({ id: rooms.id, ownerId: rooms.ownerId })
    .from(rooms)
    .where(eq(rooms.slug, slug))
  if (!room) throw new Error('Room not found.')
  if (room.ownerId !== userId) throw new Error('Only the room owner can do that.')
  return room
}

async function requireRoomMember(slug: string, userId: string) {
  const [room] = await db.select({ id: rooms.id }).from(rooms).where(eq(rooms.slug, slug))
  if (!room) throw new Error('Room not found.')
  const [membership] = await db
    .select({ userId: memberships.userId })
    .from(memberships)
    .where(and(eq(memberships.roomId, room.id), eq(memberships.userId, userId)))
  if (!membership) throw new Error('You are not a member of this room.')
  return room
}

/**
 * Delete a chat room (owner only). Memberships cascade-delete via the schema
 * foreign key. Returns to the room list.
 */
export async function deleteRoomAction(slug: string) {
  const { user } = await withAuth({ ensureSignedIn: true })
  const room = await requireRoomOwner(slug, user.id)

  await db.delete(rooms).where(eq(rooms.id, room.id))

  revalidatePath('/chat')
  redirect('/chat')
}

/**
 * Set a room's visibility (owner only). Private rooms are invite-only: they no
 * longer auto-join on link visit (enforced in the room page).
 */
export async function setRoomVisibilityAction(slug: string, visibility: Visibility) {
  const { user } = await withAuth({ ensureSignedIn: true })
  const room = await requireRoomOwner(slug, user.id)

  await db.update(rooms).set({ visibility }).where(eq(rooms.id, room.id))

  revalidatePath(`/chat/${slug}`)
  revalidatePath('/chat')
}

export type InviteResult = { ok: true; message: string } | { ok: false; error: string }

/**
 * Invite an existing user (by email) into a room — the only way into a private,
 * invite-only room. The caller must be a member. Returns a friendly result so
 * the dialog can render feedback instead of throwing.
 */
export async function inviteUserAction(slug: string, rawEmail: string): Promise<InviteResult> {
  const { user } = await withAuth({ ensureSignedIn: true })

  const email = normalizeEmail(rawEmail)
  if (!isValidEmail(email)) {
    return { ok: false, error: 'Please enter a valid email address.' }
  }

  let room: { id: string }
  try {
    room = await requireRoomMember(slug, user.id)
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Not allowed.' }
  }

  const { data: matches } = await getWorkOS().userManagement.listUsers({ email })
  const invitee = pickUserByEmail(matches, email)
  if (!invitee) {
    return { ok: false, error: `No account found for ${email}. They need to sign up first.` }
  }

  await db
    .insert(memberships)
    .values({ roomId: room.id, userId: invitee.id, role: 'member' })
    .onConflictDoNothing({ target: [memberships.roomId, memberships.userId] })

  revalidatePath(`/chat/${slug}`)
  const label = invitee.firstName ? `${invitee.firstName} (${email})` : email
  return { ok: true, message: `Invited ${label}.` }
}

export type RoomMember = {
  userId: string
  role: string
  name: string
  email: string
  isOwner: boolean
}

/**
 * List a room's members with resolved names/emails (WorkOS). Caller must be a
 * member. Used by the owner's member-management dialog.
 */
export async function listRoomMembersAction(slug: string): Promise<RoomMember[]> {
  const { user } = await withAuth({ ensureSignedIn: true })

  const [room] = await db
    .select({ id: rooms.id, ownerId: rooms.ownerId })
    .from(rooms)
    .where(eq(rooms.slug, slug))
  if (!room) return []

  const rows = await db
    .select({ userId: memberships.userId, role: memberships.role })
    .from(memberships)
    .where(eq(memberships.roomId, room.id))

  if (!rows.some((r) => r.userId === user.id)) return [] // not a member

  const workos = getWorkOS()
  return Promise.all(
    rows.map(async (row) => {
      let name = row.userId
      let email = ''
      try {
        const u = await workos.userManagement.getUser(row.userId)
        name = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || row.userId
        email = u.email ?? ''
      } catch {
        /* fall back to the id if the user can't be resolved */
      }
      return { userId: row.userId, role: row.role, name, email, isOwner: row.userId === room.ownerId }
    }),
  )
}

export type RemoveMemberResult = { ok: true } | { ok: false; error: string }

/**
 * Remove a member from a room (owner only). The owner cannot be removed. This is
 * the only way a member's invitation ends — a member simply leaving the room
 * view keeps their membership.
 */
export async function removeMemberAction(slug: string, targetUserId: string): Promise<RemoveMemberResult> {
  const { user } = await withAuth({ ensureSignedIn: true })

  let room: { id: string; ownerId: string }
  try {
    room = await requireRoomOwner(slug, user.id)
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Not allowed.' }
  }

  if (targetUserId === room.ownerId) {
    return { ok: false, error: 'The owner cannot be removed. Delete the room instead.' }
  }

  await db
    .delete(memberships)
    .where(and(eq(memberships.roomId, room.id), eq(memberships.userId, targetUserId)))

  revalidatePath(`/chat/${slug}`)
  revalidatePath('/chat')
  return { ok: true }
}
