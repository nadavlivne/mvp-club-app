// Public website (joinmvpclub.com): contact details, hours and service area.
// Change these here — the pages read them from this file.

export const site = {
  url: 'https://joinmvpclub.com',
  name: 'MVP Club',
  legalName: 'MVP Home Services LLC',
  // Temporary number until MVP Club has its own line.
  phone: '513-909-9656',
  phoneDisplay: '(513) 909-9656',
  phoneHref: '+15139099656',
  address: { street: '114 E 8th St', city: 'Cincinnati', state: 'OH', zip: '45202' },
  // GUESS: weekdays only — confirm with Nadav.
  hours: { days: 'Monday–Friday', open: '8:00 AM', close: '5:00 PM', schema: 'Mo-Fr 08:00-17:00' },
  // Zip codes come from data/service_area.csv (miles from the office); only those within this radius are served.
  serviceRadiusMiles: 40,
  areaSummary: 'Greater Cincinnati, Northern Kentucky and Southeast Indiana — from Liberty Township to Florence, and from Lawrenceburg to Batavia.',
  // Housecall Pro online booking link, when we have one. Until then the buttons call or text.
  bookingUrl: null as string | null,
}
