// Content for the service pages (/services/...) and town pages (/areas/...).
// These pages help Google show MVP Club for searches like "furnace repair Mason OH".
// Only write what is true. No prices here: the pages show the service call only.

export type ServicePage = {
  slug: string
  trade: 'HVAC' | 'Plumbing' | 'Electrical'
  name: string // short name, used in links and town pages
  title: string // browser tab / Google title (town is not added)
  h1: string
  intro: string
  signs: string[] // "Call us if…"
  jobs: string[] // what we do
  checkup: string // how the member check-up helps
  parent?: string // slug of the trade page this belongs to
}

export const servicePages: ServicePage[] = [
  {
    slug: 'heating-and-cooling',
    trade: 'HVAC',
    name: 'Heating & cooling',
    title: 'Heating & Cooling Repair and Service in Cincinnati',
    h1: 'Heating & cooling service in Greater Cincinnati',
    intro:
      'Furnaces, air conditioners and heat pumps — repaired, tuned and replaced. Every repair is priced for you before we start, and nothing is done without your OK.',
    signs: [
      'The furnace runs but the house stays cold',
      'The AC blows warm air or keeps shutting off',
      'Strange noises, smells or a short-cycling system',
      'Water pooling around the indoor unit',
      'Energy bills climbing for no clear reason',
    ],
    jobs: [
      'Furnace and AC repair',
      'Spring AC and fall furnace tune-ups',
      'Igniters, flame sensors, capacitors, contactors and motors',
      'Thermostat and smart thermostat installs',
      'Clogged condensate drain lines',
      'Furnace, AC and heat pump replacement',
    ],
    checkup:
      'Members get the AC checked every spring and the furnace every fall, including a carbon monoxide check — so small problems are found before the first hot or cold snap.',
  },
  {
    slug: 'furnace-repair',
    trade: 'HVAC',
    parent: 'heating-and-cooling',
    name: 'Furnace repair',
    title: 'Furnace Repair in Cincinnati',
    h1: 'Furnace repair in Greater Cincinnati',
    intro:
      'No heat, weak heat or a furnace that keeps restarting? A tech finds the cause, shows you what he found and gives you the price before any work.',
    signs: [
      'No heat, or heat that comes and goes',
      'The furnace clicks but never lights',
      'Burning smell or a carbon monoxide alarm',
      'Loud banging, rattling or squealing',
      'The blower runs nonstop',
    ],
    jobs: [
      'Hot-surface igniter and flame sensor replacement',
      'Draft pressure switch and inducer motor repair',
      'Blower motor replacement',
      'Thermostat replacement',
      'Fall furnace tune-up',
      'Gas furnace replacement',
    ],
    checkup:
      'Every fall check-up covers the furnace, filter, blower and a carbon monoxide check, and records the furnace age in your home file.',
  },
  {
    slug: 'ac-repair',
    trade: 'HVAC',
    parent: 'heating-and-cooling',
    name: 'AC repair',
    title: 'AC Repair in Cincinnati',
    h1: 'Air conditioning repair in Greater Cincinnati',
    intro:
      'AC not keeping up with a Cincinnati summer? We find the problem, show you photos and price the repair before we start.',
    signs: [
      'Warm air from the vents',
      'The outdoor unit hums but the fan doesn’t spin',
      'Ice on the lines or the indoor coil',
      'Water leaking from the indoor unit',
      'The AC turns on and off every few minutes',
    ],
    jobs: [
      'Capacitor and contactor replacement',
      'Condenser fan motor replacement',
      'Refrigerant leak checks and recharge',
      'Condensate drain line clearing',
      'Spring AC tune-up',
      'AC condenser, coil and heat pump replacement',
    ],
    checkup:
      'Every spring check-up covers the AC, outdoor unit, drain line and thermostat before the heat arrives.',
  },
  {
    slug: 'plumbing',
    trade: 'Plumbing',
    name: 'Plumbing',
    title: 'Plumbing Repair and Service in Cincinnati',
    h1: 'Plumbing service in Greater Cincinnati',
    intro:
      'Leaks, clogs, running toilets, water heaters and sump pumps. You get the price before any work, and nothing is done without your OK.',
    signs: [
      'A slow or backed-up drain',
      'A toilet that runs or rocks',
      'Water stains, drips or a musty smell under a sink',
      'No hot water, or rusty hot water',
      'Low water pressure — or pressure so high the pipes bang',
    ],
    jobs: [
      'Drain and main line clearing',
      'Toilet repair and replacement',
      'Faucet, shower valve and garbage disposal replacement',
      'Shut-off valves, pressure-reducing valves and hose bibs',
      'Sump pump replacement',
      'Sewer camera inspection, sewer and water line repair',
      'Whole-house repiping',
    ],
    checkup:
      'Every check-up looks at the water heater, valves, water pressure, every faucet, toilet and drain, the main shut-off and the sump pump.',
  },
  {
    slug: 'water-heater',
    trade: 'Plumbing',
    parent: 'plumbing',
    name: 'Water heaters',
    title: 'Water Heater Repair and Replacement in Cincinnati',
    h1: 'Water heater repair and replacement in Greater Cincinnati',
    intro:
      'No hot water, a leaking tank or an old heater on borrowed time. We tell you honestly whether it’s worth fixing, with the price for each option.',
    signs: [
      'No hot water, or it runs out fast',
      'Water around the base of the tank',
      'Rusty or smelly hot water',
      'Popping or rumbling sounds',
      'The tank is more than 10 years old',
    ],
    jobs: [
      'Water heater flush and maintenance',
      '40- and 50-gallon gas water heater replacement',
      'Tankless water heater installation',
    ],
    checkup:
      'Every check-up looks at the water heater and saves its age and label photo to your home file, so a replacement is planned — not an emergency.',
  },
  {
    slug: 'electrical',
    trade: 'Electrical',
    name: 'Electrical',
    title: 'Electrical Repair and Service in Cincinnati',
    h1: 'Electrical service in Greater Cincinnati',
    intro:
      'Outlets, switches, lighting, breakers, panels, EV chargers and generators. Priced before we start, done safely, and nothing without your OK.',
    signs: [
      'Breakers that trip again and again',
      'Outlets that are dead, warm or loose',
      'Lights that flicker or dim',
      'A buzzing or warm electrical panel',
      'An older panel or wiring in an older home',
    ],
    jobs: [
      'Outlet, GFCI and switch replacement',
      'Light fixtures and ceiling fans',
      'Breaker replacement and whole-house surge protection',
      'New 120V and 240V circuits',
      'Smoke and carbon monoxide alarms',
      'Panel replacement and service upgrades',
      'EV chargers and standby generators',
    ],
    checkup:
      'Every check-up inspects the panel with the cover off, the meter base and service cable, outlets, GFCIs, smoke and CO alarms, surge protection and wiring type.',
  },
  {
    slug: 'electrical-panel',
    trade: 'Electrical',
    parent: 'electrical',
    name: 'Electrical panels',
    title: 'Electrical Panel Replacement and Upgrades in Cincinnati',
    h1: 'Electrical panel replacement and upgrades in Greater Cincinnati',
    intro:
      'An old or overloaded panel is one of the most common problems in older Cincinnati-area homes. We inspect it with the cover off, photograph what we find and price the fix.',
    signs: [
      'Breakers that trip often',
      'A panel that’s warm, buzzing or shows scorch marks',
      'Not enough room for new circuits — an EV charger, a new AC',
      'Fuses, or a 100-amp service in a modern home',
    ],
    jobs: [
      'Breaker and AFCI/GFCI breaker replacement',
      'Whole-house surge protector',
      '200-amp panel replacement',
      'Service upgrade from 100 to 200 amps, including the meter base',
    ],
    checkup:
      'Every check-up includes the panel inspected with the cover off, the meter base and the service cable, with photos saved to your home file.',
  },
  {
    slug: 'ev-charger-installation',
    trade: 'Electrical',
    parent: 'electrical',
    name: 'EV chargers',
    title: 'EV Charger Installation in Cincinnati',
    h1: 'EV charger installation in Greater Cincinnati',
    intro:
      'A Level 2 charger in your garage or driveway. We check that your panel can handle it first, then price the full job before we start.',
    signs: [
      'You just bought or ordered an electric car',
      'Charging from a regular outlet takes all night and then some',
      'You’re not sure your panel has room for a 240V circuit',
    ],
    jobs: ['Level 2 charger install on an existing circuit', 'New 240V circuit for an EV charger', 'Charger supplied and installed by us', 'Panel upgrade if needed'],
    checkup: 'Members’ check-ups record panel size and free space, so we already know what an EV charger will take.',
  },
]

// Town pages. Zips must exist in data/service_area.csv.
// Ohio only for now: Kentucky and Indiana pages wait until partners' licenses there are confirmed.
export type AreaPage = { slug: string; name: string; kind?: string; zips: string[]; region: string }

export const areaPages: AreaPage[] = [
  { slug: 'cincinnati', name: 'Cincinnati', zips: ['45202', '45203', '45206', '45219', '45220', '45223', '45229'], region: 'Central' },
  { slug: 'hyde-park', name: 'Hyde Park', kind: 'Cincinnati neighborhood', zips: ['45208'], region: 'East' },
  { slug: 'oakley', name: 'Oakley', kind: 'Cincinnati neighborhood', zips: ['45209'], region: 'East' },
  { slug: 'mariemont', name: 'Mariemont', zips: ['45227'], region: 'East' },
  { slug: 'anderson-township', name: 'Anderson Township', zips: ['45230', '45244', '45255'], region: 'East' },
  { slug: 'milford', name: 'Milford', zips: ['45150'], region: 'East' },
  { slug: 'amelia', name: 'Amelia', zips: ['45102'], region: 'East' },
  { slug: 'batavia', name: 'Batavia', zips: ['45103'], region: 'East' },
  { slug: 'indian-hill', name: 'Indian Hill', zips: ['45243'], region: 'Northeast' },
  { slug: 'madeira', name: 'Madeira', zips: ['45243'], region: 'Northeast' },
  { slug: 'blue-ash', name: 'Blue Ash', zips: ['45242'], region: 'Northeast' },
  { slug: 'montgomery', name: 'Montgomery', zips: ['45242', '45249'], region: 'Northeast' },
  { slug: 'loveland', name: 'Loveland', zips: ['45140'], region: 'Northeast' },
  { slug: 'sharonville', name: 'Sharonville', zips: ['45241'], region: 'North' },
  { slug: 'springdale', name: 'Springdale', zips: ['45246'], region: 'North' },
  { slug: 'west-chester', name: 'West Chester', zips: ['45069', '45071'], region: 'North' },
  { slug: 'liberty-township', name: 'Liberty Township', zips: ['45011', '45044', '45069'], region: 'North' },
  { slug: 'mason', name: 'Mason', zips: ['45040'], region: 'North' },
  { slug: 'fairfield', name: 'Fairfield', zips: ['45014'], region: 'North' },
  { slug: 'hamilton', name: 'Hamilton', zips: ['45011', '45013', '45015'], region: 'North' },
  { slug: 'lebanon', name: 'Lebanon', zips: ['45036'], region: 'North' },
  { slug: 'colerain-township', name: 'Colerain Township', zips: ['45239', '45247', '45251', '45252'], region: 'West' },
  { slug: 'green-township', name: 'Green Township', zips: ['45211', '45233', '45238', '45247', '45248'], region: 'West' },
  { slug: 'delhi-township', name: 'Delhi Township', zips: ['45233', '45238'], region: 'West' },
  { slug: 'harrison', name: 'Harrison', zips: ['45030'], region: 'West' },
]

export const regionNames: Record<string, string> = {
  Central: 'Downtown & central Cincinnati',
  East: 'East side',
  Northeast: 'Northeast',
  North: 'North — Butler & Warren counties',
  West: 'West side',
}

export const findService = (slug: string) => servicePages.find((s) => s.slug === slug)
export const findArea = (slug: string) => areaPages.find((a) => a.slug === slug)
export const nearbyAreas = (a: AreaPage) => areaPages.filter((o) => o.region === a.region && o.slug !== a.slug)
