'use client'

import { useTransition } from 'react'
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
import { deleteRoomAction } from '../_actions/actions'

/**
 * Owner-only destructive action: permanently delete the room (memberships
 * cascade). `deleteRoomAction` redirects to /chat on success.
 */
export default function DeleteRoomDialog({ slug, roomName }: { slug: string; roomName: string }) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      await deleteRoomAction(slug)
    })
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="destructive">Delete</Button>} />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete “{roomName}”?</DialogTitle>
          <DialogDescription>
            This permanently deletes the room and removes everyone from it. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" type="button">Cancel</Button>} />
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? 'Deleting…' : 'Delete room'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
