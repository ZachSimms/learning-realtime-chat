// utils/auth.ts — WorkOS AuthKit
import { withAuth } from '@workos-inc/authkit-nextjs';

export async function requireUser() {
  const { user } = await withAuth();                                  // null when signed out
  if (!user) throw new Response('Unauthorized', { status: 401 });     // thrown Response -> 401
  return user; // full WorkOS user: id, email, firstName, … ; user.id becomes the token clientId
}