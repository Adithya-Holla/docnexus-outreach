import { Resend } from 'resend'
import { replaceTemplateVars } from './templateEngine'
import type { Physician } from '@/types'

// ─── Config ───────────────────────────────────────────────────────────────────

// The verified "From" domain/address you set up in Resend.
// Replies go to the logged-in user's real email via Reply-To.
// If not set, emails are only logged (simulation mode).
const FROM_EMAIL  = process.env.RESEND_FROM_EMAIL  ?? ''
const resend      = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const SIMULATION  = !resend || !FROM_EMAIL

export interface SenderInfo {
  name:    string   // full name from User record
  email:   string   // User's real email — used as Reply-To
  title:   string
  company: string
}

// ─── HTML builder ─────────────────────────────────────────────────────────────

function buildHtml(body: string, dispatchId: string): string {
  const baseUrl = process.env.APP_BASE_URL ?? 'http://localhost:3000'

  const paragraphs = body
    .split('\n')
    .map((line) =>
      line.trim()
        ? `<p style="margin:0 0 14px;line-height:1.6">${line.trim()}</p>`
        : '<br/>',
    )
    .join('\n')

  const pixel = `<img src="${baseUrl}/api/track/open?dispatchId=${dispatchId}" `
    + `width="1" height="1" style="display:none;border:0" alt="" />`

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;font-size:14px;color:#1a1a1a;max-width:600px;margin:0 auto;padding:24px">
${paragraphs}
${pixel}
</body>
</html>`
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface SendResult {
  providerMessageId: string | null
  simulated:         boolean
}

export async function sendCampaignEmail(opts: {
  dispatchId:      string
  physician:       Physician
  sender:          SenderInfo
  subjectTemplate: string
  bodyTemplate:    string
}): Promise<SendResult> {
  const { dispatchId, physician, sender, subjectTemplate, bodyTemplate } = opts

  const subject = replaceTemplateVars(subjectTemplate, physician)
  const body    = replaceTemplateVars(bodyTemplate,    physician)
  const html    = buildHtml(body, dispatchId)

  if (SIMULATION) {
    // Log what would be sent — no real email goes out
    console.log(
      `[EMAIL SIMULATION]\n`
      + `  To:       ${physician.email}\n`
      + `  From:     ${sender.name} <${FROM_EMAIL || 'not-configured'}>\n`
      + `  Reply-To: ${sender.email}\n`
      + `  Subject:  ${subject}\n`
      + `  Body:     ${body.slice(0, 80)}…`,
    )
    // Return a fake provider ID so dispatch records stay consistent
    return { providerMessageId: `sim_${dispatchId}`, simulated: true }
  }

  const { data, error } = await resend!.emails.send({
    from:     `${sender.name} <${FROM_EMAIL}>`,
    to:       [physician.email],
    replyTo:  sender.email,
    subject,
    html,
  })

  if (error || !data?.id) {
    throw new Error(error?.message ?? 'Resend returned no message ID')
  }

  return { providerMessageId: data.id, simulated: false }
}
