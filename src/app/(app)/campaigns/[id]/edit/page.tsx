import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { getSession, COOKIE_NAME } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CampaignForm } from '@/components/campaigns/CampaignForm'

interface Props {
  params:       { id: string }
  searchParams: { ids?: string }
}

export default async function EditCampaignPage({ params, searchParams }: Props) {
  const token = cookies().get(COOKIE_NAME)?.value
  const user  = token ? await getSession(token) : null
  if (!user) redirect('/login')

  const campaign = await prisma.campaign.findUnique({
    where:   { id: params.id },
    include: { sequences: { orderBy: { stepNumber: 'asc' } } },
  })

  if (!campaign) notFound()
  if (campaign.userId && campaign.userId !== user.id) notFound()
  if (campaign.status !== 'draft') redirect(`/campaigns/${params.id}`)

  const physicianIds = searchParams.ids
    ?.split(',')
    .map((id) => id.trim())
    .filter(Boolean) ?? []

  const initialValues = {
    name:      campaign.name,
    type:      campaign.type as 'cold_outbound' | 'reengagement' | 'conference_followup',
    sequences: campaign.sequences.map((s) => ({
      stepNumber:      s.stepNumber,
      delayDays:       s.delayDays,
      subjectTemplate: s.subjectTemplate,
      bodyTemplate:    s.bodyTemplate,
    })),
  }

  return (
    <CampaignForm
      physicianIds={physicianIds}
      user={user}
      campaignId={params.id}
      initialValues={initialValues}
    />
  )
}
