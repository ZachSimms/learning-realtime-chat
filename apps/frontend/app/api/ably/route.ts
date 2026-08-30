// app/api/ably/route.ts  — server
import Ably, { type capabilityOp } from 'ably';
import { db } from '@/utils/neon/db';
import { rooms, memberships } from '@/utils/neon/schema';
import { requireUser } from '@/utils/auth';
import { chatChannelName } from '@/app/(protected)/chat/_lib/rooms';
import { eq } from 'drizzle-orm';

const CHAT_OPS: capabilityOp[] = [
  'subscribe', 'publish', 'presence', 'history',
  'annotation-publish', 'annotation-subscribe', 'channel-metadata',
];
const SPACE_OPS: capabilityOp[] = ['subscribe', 'publish', 'presence', 'history'];

// The Spaces SDK derives channel names from the space name. Confirm the literal
// value once with console.log(space.channel.name) and adjust if it differs.
const spaceMain = (slug: string) => `${slug}-space`;

export async function GET() {
  const user = await requireUser();

  const mine = await db
    .select({ slug: rooms.slug, kind: rooms.kind })
    .from(memberships)
    .innerJoin(rooms, eq(rooms.id, memberships.roomId))
    .where(eq(memberships.userId, user.id));

  const cap: Record<string, capabilityOp[]> = { [`user:${user.id}`]: ['subscribe'] };
  for (const { slug, kind } of mine) {
    // @ably/chat uses a single channel per room named `${slug}::$chat`.
    if (kind === 'chat' || kind === 'both') cap[chatChannelName(slug)] = CHAT_OPS;
    if (kind === 'space' || kind === 'both') {
      cap[spaceMain(slug)] = SPACE_OPS;        // avatars, locations, locks, presence
      cap[`${spaceMain(slug)}:*`] = SPACE_OPS; // the separate live-cursors channel
    }
  }

  const rest = new Ably.Rest(process.env.ABLY_API_KEY!);
  const tokenRequest = await rest.auth.createTokenRequest({ clientId: user.id, capability: cap });
  return Response.json(tokenRequest);
}