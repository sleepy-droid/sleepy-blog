import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { CheckoutClient } from './CheckoutClient'

export default async function CheckoutPage() {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect('/auth/login?next=/checkout')
  }

  const accountName =
    currentUser.profile?.display_name ||
    currentUser.profile?.username ||
    currentUser.email?.split('@')[0] ||
    'Miembro'

  const accountEmail = currentUser.email || currentUser.profile?.email || ''

  return (
    <CheckoutClient
      accountUser={{
        id: currentUser.id,
        name: accountName,
        email: accountEmail,
        username: currentUser.profile?.username || null,
        avatarUrl: currentUser.profile?.avatar_url || null,
      }}
    />
  )
}
