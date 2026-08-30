'use client'

import { useCallback } from 'react'
import { UserProfile, WorkOsWidgets } from '@workos-inc/widgets'
import '@radix-ui/themes/styles.css'
import '@workos-inc/widgets/styles.css'
import { getWidgetAccessTokenAction } from '../_actions/actions'

/**
 * WorkOS User Profile widget (edit name + avatar). Rendered on its own page —
 * NOT inside our modal — because the widget is built on Radix Themes and mounts
 * its own portaled dialogs; nesting it in the base-ui Dialog forced a 100vh
 * theme root (vertical stretch) and pushed its Edit dialogs behind our modal.
 *
 * Auth uses the AuthKit session access token, fetched server-side each time the
 * widget asks (always fresh, no client token-hook setup).
 */
export default function ProfileWidget() {
  const authToken = useCallback(async () => {
    const token = await getWidgetAccessTokenAction()
    if (!token) throw new Error('No access token available')
    return token
  }, [])

  return (
    <WorkOsWidgets>
      <UserProfile authToken={authToken} />
    </WorkOsWidgets>
  )
}
