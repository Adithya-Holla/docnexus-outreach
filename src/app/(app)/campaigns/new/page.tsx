import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSession, COOKIE_NAME } from '@/lib/auth'
import { CampaignForm } from '@/components/campaigns/CampaignForm'

interface Props {
  searchParams: { ids?: string }
}

export default async function NewCampaignPage({ searchParams }: Props) {
  const token = cookies().get(COOKIE_NAME)?.value
  const user  = token ? await getSession(token) : null
  if (!user) redirect('/login')

  const physicianIds = searchParams.ids
    ?.split(',')
    .map((id) => id.trim())
    .filter(Boolean) ?? []

  return <CampaignForm physicianIds={physicianIds} user={user} />
}
