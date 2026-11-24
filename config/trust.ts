// "Why trust us" section on the website.
// Only fill in what is TRUE and confirmed. Anything left empty is simply not shown.

export const trust = {
  // Combined years of experience of the techs / trade partners, e.g. 25. Leave null to hide.
  yearsExperience: null as number | null,
  // Set to true once all trade partners' licenses are confirmed.
  licensed: false,
  // Set to true once the insurance certificates are on file.
  insured: false,
  // Link to the Google Business Profile reviews. Leave '' until the profile is live.
  googleReviewsUrl: '',
  // Real customer reviews only, copied word for word with the customer's OK.
  reviews: [] as { name: string; town: string; text: string }[],
  // Photo of the team or a van, placed in /public (e.g. '/team.jpg'). Leave '' to hide.
  teamPhoto: '',
}

// Promises we make to every customer. These follow the business rules in CLAUDE.md.
export const promises: [string, string][] = [
  ['A price before any work', 'You see the price on your phone first. Nothing is done until you approve it.'],
  ['Photos of what we find', 'Every finding comes with a photo, so you see what the tech saw.'],
  ['No pressure', 'Each item has a color for how urgent it is. What can wait, waits — we remind you later.'],
  ['One local team', 'Heating & cooling, plumbing and electrical techs who work in Greater Cincinnati every day.'],
]

// Licensed trade partners. Any job that needs a license or permit is performed by
// the partner's licensed company. Shown in small print in the website footer.
// A partner is shown only once at least one license number is filled in.
// Add each state's license separately (Ohio, Kentucky, Indiana) — we serve all three.
export const tradePartners: { company: string; trade: string; licenses: string[] }[] = [
  { company: 'Galley Electric', trade: 'Electrical', licenses: [] }, // e.g. 'Ohio OCILB electrical #00000'
  { company: 'Renew Mechanical', trade: 'Heating & cooling', licenses: [] }, // e.g. 'Ohio OCILB HVAC #00000'
  // Plumbing partner: add once confirmed.
]
