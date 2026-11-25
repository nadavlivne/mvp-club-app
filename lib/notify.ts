import 'server-only'

// Office alerts by email (Resend). Nadav sets these in Vercel → Settings → Environment Variables:
//   RESEND_API_KEY      — from resend.com (free plan is enough), after verifying joinmvpclub.com there
//   OFFICE_ALERT_EMAIL  — who gets the alerts; several addresses separated by commas
//   ALERT_FROM_EMAIL    — optional sender, e.g. "MVP Club <alerts@joinmvpclub.com>"
// Without the keys nothing is sent and nothing breaks: the lead is still saved and shows in /office/leads.

export const alertsConfigured = Boolean(process.env.RESEND_API_KEY && process.env.OFFICE_ALERT_EMAIL)

export async function notifyOffice(subject: string, lines: string[]) {
  if (!alertsConfigured) return
  const to = process.env.OFFICE_ALERT_EMAIL!.split(',').map((s) => s.trim()).filter(Boolean)
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.ALERT_FROM_EMAIL || 'MVP Club <alerts@joinmvpclub.com>',
        to,
        subject,
        text: lines.filter(Boolean).join('\n'),
      }),
    })
    if (!res.ok) console.error('office alert failed', res.status, await res.text())
  } catch (e) {
    console.error('office alert failed', e)
  }
}
