// Relative (not the `@/` alias) so this leaf module + its unit test run under
// `node --test` with no path-alias tooling.
import { toSlug } from '../../../../lib/utils.ts'

export const MAX_ROOM_NAME_LENGTH = 60

export type RoomNameValidation =
  | { ok: true; name: string; slug: string }
  | { ok: false; error: string }

/**
 * Validate + normalize a user-supplied room name at the system boundary.
 * Returns a discriminated result instead of throwing so callers (server
 * actions) can surface friendly errors.
 */
export function validateRoomName(raw: unknown): RoomNameValidation {
  if (typeof raw !== 'string') {
    return { ok: false, error: 'Room name is required.' }
  }

  const name = raw.trim()
  if (name.length === 0) {
    return { ok: false, error: 'Room name is required.' }
  }
  if (name.length > MAX_ROOM_NAME_LENGTH) {
    return { ok: false, error: `Room name must be ${MAX_ROOM_NAME_LENGTH} characters or fewer.` }
  }

  let slug: string
  try {
    slug = toSlug(name)
  } catch {
    return { ok: false, error: 'Room name needs at least one letter or number.' }
  }

  return { ok: true, name, slug }
}

/**
 * The Ably Chat SDK (v1.4) derives its single per-room channel name from the
 * room name as `${name}::$chat`. Token capabilities must target this exact
 * channel, so keep the derivation in one place.
 */
export function chatChannelName(slug: string): string {
  return `${slug}::$chat`
}

export type Visibility = 'public' | 'private'

/** Toggle a room between public and private. */
export function nextVisibility(current: Visibility): Visibility {
  return current === 'public' ? 'private' : 'public'
}

/** Normalize an email for comparison / lookup. */
export function normalizeEmail(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim().toLowerCase() : ''
}

/** Lightweight email shape check for the invite boundary. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Pick the exact (case-insensitive) email match from a list of users. WorkOS'
 * `listUsers({ email })` filters server-side, but we defensively confirm an
 * exact match so a partial/loose result can never invite the wrong person.
 */
export function pickUserByEmail<T extends { email: string }>(users: readonly T[], email: string): T | undefined {
  const target = normalizeEmail(email)
  return users.find((u) => normalizeEmail(u.email) === target)
}

export type Participant = {
  clientId: string
  name?: string
}

/**
 * Ably presence can report the same clientId more than once (multiple tabs /
 * devices). Collapse to one entry per clientId for a clean participant list.
 */
export function dedupePresence(
  members: ReadonlyArray<{ clientId: string; data?: unknown }>,
): Participant[] {
  const byClientId = new Map<string, Participant>()
  for (const member of members) {
    if (byClientId.has(member.clientId)) continue
    const data = member.data
    const name =
      data && typeof data === 'object' && 'name' in data && typeof (data as { name: unknown }).name === 'string'
        ? (data as { name: string }).name
        : undefined
    byClientId.set(member.clientId, { clientId: member.clientId, name })
  }
  return [...byClientId.values()]
}
