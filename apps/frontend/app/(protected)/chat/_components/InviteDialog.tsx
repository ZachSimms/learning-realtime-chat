'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { inviteUserAction, type InviteResult } from '../_actions/actions'
import type { Visibility } from '../_lib/rooms'

/**
 * Invite people to a room. Sharing the link works for public rooms (visiting
 * auto-joins); private rooms are invite-only, so members add people by email.
 */
export default function InviteDialog({ slug, visibility }: { slug: string; visibility: Visibility }) {
  const [copied, setCopied] = useState(false)
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<InviteResult | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    if (isPending) return
    startTransition(async () => {
      const res = await inviteUserAction(slug, email)
      setResult(res)
      if (res.ok) setEmail('')
    })
  }

  return (
    <Dialog onOpenChange={() => setResult(null)}>
      <DialogTrigger render={<Button variant="outline">Invite</Button>} />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Invite people</DialogTitle>
          <DialogDescription>
            {visibility === 'private'
              ? 'This room is private. Invite people by email to let them in.'
              : 'Share the link, or invite someone directly by email.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Button variant="secondary" onClick={handleCopy}>
            {copied ? 'Link copied!' : 'Copy room link'}
          </Button>

          <form onSubmit={handleInvite}>
            <FieldGroup>
              <Field>
                <Label htmlFor="invite-email">Invite by email</Label>
                <Input
                  id="invite-email"
                  name="invite-email"
                  type="email"
                  placeholder="friend@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                />
              </Field>
            </FieldGroup>

            {result && (
              <p className={`mt-2 text-xs ${result.ok ? 'text-primary' : 'text-destructive'}`}>
                {result.ok ? result.message : result.error}
              </p>
            )}

            <DialogFooter className="mt-4">
              <DialogClose render={<Button variant="outline" type="button">Done</Button>} />
              <Button type="submit" disabled={isPending || email.trim().length === 0}>
                {isPending ? 'Inviting…' : 'Send invite'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
