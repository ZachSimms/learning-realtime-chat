import Link from 'next/link'
import { withAuth } from '@workos-inc/authkit-nextjs'
import { buttonVariants } from '@/components/ui/button'
import ProfileWidget from './ProfileWidget'

const ProfilePage = async () => {
  await withAuth({ ensureSignedIn: true })

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Your profile</h1>
        <Link href="/chat" className={buttonVariants({ variant: 'outline' })}>
          Back to rooms
        </Link>
      </div>
      <ProfileWidget />
    </div>
  )
}

export default ProfilePage
