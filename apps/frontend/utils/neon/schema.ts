import { pgTable, uuid, text, timestamp, primaryKey } from 'drizzle-orm/pg-core';

export const rooms = pgTable('rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),          // the Ably resource base
  name: text('name').notNull(),
  kind: text('kind').$type<'chat' | 'space' | 'both'>().notNull(),
  visibility: text('visibility').$type<'public' | 'private'>().notNull().default('public'),
  ownerId: text('owner_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const memberships = pgTable('memberships', {
  roomId: uuid('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  role: text('role').notNull().default('member'),
}, (t) => [primaryKey({ columns: [t.roomId, t.userId] })]);