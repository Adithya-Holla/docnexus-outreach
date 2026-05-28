import { CampaignForm } from '@/components/campaigns/CampaignForm'

interface Props {
  searchParams: { ids?: string }
}

export default function NewCampaignPage({ searchParams }: Props) {
  const physicianIds = searchParams.ids
    ?.split(',')
    .map((id) => id.trim())
    .filter(Boolean) ?? []

  return <CampaignForm physicianIds={physicianIds} />
}
