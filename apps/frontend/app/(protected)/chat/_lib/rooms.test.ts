import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  validateRoomName,
  chatChannelName,
  dedupePresence,
  MAX_ROOM_NAME_LENGTH,
  nextVisibility,
  normalizeEmail,
  isValidEmail,
  pickUserByEmail,
} from './rooms.ts'

test('validateRoomName trims and slugifies a valid name', () => {
  const result = validateRoomName('  Group  Project!  ')
  assert.equal(result.ok, true)
  if (result.ok) {
    assert.equal(result.name, 'Group  Project!')
    assert.equal(result.slug, 'group-project')
  }
})

test('validateRoomName rejects empty / whitespace / non-string', () => {
  for (const bad of ['', '   ', undefined, null, 42]) {
    const result = validateRoomName(bad)
    assert.equal(result.ok, false)
  }
})

test('validateRoomName rejects names with no alphanumerics', () => {
  const result = validateRoomName('!!!___!!!')
  assert.equal(result.ok, false)
})

test('validateRoomName enforces max length', () => {
  const result = validateRoomName('a'.repeat(MAX_ROOM_NAME_LENGTH + 1))
  assert.equal(result.ok, false)
})

test('chatChannelName matches the Ably Chat channel derivation', () => {
  assert.equal(chatChannelName('my-room'), 'my-room::$chat')
})

test('nextVisibility toggles between public and private', () => {
  assert.equal(nextVisibility('public'), 'private')
  assert.equal(nextVisibility('private'), 'public')
})

test('normalizeEmail trims + lowercases, tolerates non-strings', () => {
  assert.equal(normalizeEmail('  Foo@Bar.COM '), 'foo@bar.com')
  assert.equal(normalizeEmail(undefined), '')
  assert.equal(normalizeEmail(123), '')
})

test('isValidEmail accepts well-formed and rejects malformed', () => {
  assert.equal(isValidEmail('a@b.co'), true)
  assert.equal(isValidEmail('no-at-sign'), false)
  assert.equal(isValidEmail('a@b'), false)
  assert.equal(isValidEmail('a @b.co'), false)
})

test('pickUserByEmail returns the exact case-insensitive match only', () => {
  const users = [
    { id: '1', email: 'Alice@Example.com' },
    { id: '2', email: 'bob@example.com' },
  ]
  assert.equal(pickUserByEmail(users, 'alice@example.COM')?.id, '1')
  assert.equal(pickUserByEmail(users, 'nobody@example.com'), undefined)
})

test('dedupePresence collapses duplicate clientIds and extracts names', () => {
  const result = dedupePresence([
    { clientId: 'u1', data: { name: 'Alice' } },
    { clientId: 'u1', data: { name: 'Alice second tab' } },
    { clientId: 'u2', data: undefined },
    { clientId: 'u3', data: { status: 'online' } },
  ])
  assert.equal(result.length, 3)
  assert.deepEqual(result[0], { clientId: 'u1', name: 'Alice' })
  assert.deepEqual(result[1], { clientId: 'u2', name: undefined })
  assert.deepEqual(result[2], { clientId: 'u3', name: undefined })
})
