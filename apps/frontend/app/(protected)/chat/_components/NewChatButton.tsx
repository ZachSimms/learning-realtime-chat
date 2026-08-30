"use client"

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
} from "@/components/ui/dialog"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// import { revalidatePath } from 'next/cache'
// import { redirect } from 'next/navigation'
import React from 'react'
import { createRoomAction } from '../_actions/actions'

const NewChatButton = () => {

  return (
    <>
      <Dialog>
        <DialogTrigger render={<Button variant="default">New Chat</Button>} />
        <DialogContent className="sm:max-w-sm">
          <form
            action={createRoomAction}
          >
            <DialogHeader>
              <DialogTitle>Create New Chat Room</DialogTitle>
              <DialogDescription>
                Create a new public chat room for you and your friends!
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <Label htmlFor="name-1">Room Name</Label>
                <Input id="name-1" name="room-name" defaultValue="Group Project" />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <DialogClose render={<Button variant="outline">Cancel</Button>} />
              <Button type='submit'>Create Room</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default NewChatButton