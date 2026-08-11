/**
 * REALVIAN AREA DATA — Phase 1a
 *
 * ⚠️ PLACEHOLDER DATA. Figures are realistic but synthetic.
 *
 * This module is the single source of truth for area data, deliberately
 * isolated so that swapping in real sources (HM Land Registry, ONS,
 * Police.uk, Ofsted, EPC Register) is a change to THIS FILE ONLY —
 * every consumer reads through the accessor functions at the bottom.
 *
 * When wiring real data (Phase 1b):
 *   1. Replace `AREAS` with a Drizzle query against `packages/db` schema
 *   2. Make the accessors async
 *   3. Add `lastRefreshedAt` to every rendered page (legal requirement —
 *      see CLAUDE.md "validate AI-generated numeric claims")
 */

export interface AreaDimension {
  key: string;
  label: string;
  value: number; // 0–100
  /** What the score actually means, shown on hover/detail */
  detail: string;
}

export interface Area {
  slug: string;
  outcode: string;
  district: string;
  city: string;
  region: string;
  /** Rough centroid — used for the map placeholder and sort-by-distance later */
  lat: number;
  lng: number;

  realvianScore: number;
  investmentScore: number;

  avgPrice: number;
  avgRent: number;
  grossYield: number;
  fiveYearGrowth: number;
  timeOnMarket: number; // days

  dimensions: AreaDimension[];

  /** Short editorial summary. Phase 3 generates these with AI + fact-check gate. */
  summary: string;
  highlights: string[];
  watchouts: string[];

  lastRefreshedAt: string;
}

/* ── Helper to keep the dataset readable ───────────── */
function dims(
  schools: number,
  transport: number,
  safety: number,
  green: number,
  amenities: number,
  affordability: number,
): AreaDimension[] {
  return [
    {
      key: "schools",
      label: "Schools",
      value: schools,
      detail: "Ofsted ratings and catchment performance within 1.5 miles",
    },
    {
      key: "transport",
      label: "Transport",
      value: transport,
      detail: "Rail, tram and bus connectivity plus commute times to the city centre",
    },
    {
      key: "safety",
      label: "Safety",
      value: safety,
      detail: "Recorded crime per 1,000 residents, indexed against the national average",
    },
    {
      key: "green",
      label: "Green space",
      value: green,
      detail: "Parks, allotments and accessible open space within walking distance",
    },
    {
      key: "amenities",
      label: "Amenities",
      value: amenities,
      detail: "Shops, cafés, healthcare and leisure density",
    },
    {
      key: "affordability",
      label: "Affordability",
      value: affordability,
      detail: "Local price-to-earnings ratio against the regional median",
    },
  ];
}

/* ══════════════════════════════════════════════════════
   THE DATASET — 40 areas across a national spread
   ══════════════════════════════════════════════════════ */
export const AREAS: Area[] = [
  // ── MANCHESTER ──
  {
    slug: "didsbury-m20",
    outcode: "M20",
    district: "Didsbury",
    city: "Manchester",
    region: "North West",
    lat: 53.4106,
    lng: -2.2317,
    realvianScore: 87,
    investmentScore: 79,
    avgPrice: 412500,
    avgRent: 1450,
    grossYield: 5.2,
    fiveYearGrowth: 18.4,
    timeOnMarket: 34,
    dimensions: dims(94, 81, 76, 88, 91, 58),
    summary:
      "One of South Manchester's most sought-after suburbs, Didsbury pairs strong state and independent schooling with a village-feel high street and quick tram access to the city centre. Prices sit well above the Manchester median, which is the trade-off for the schooling and green space.",
    highlights: [
      "Excellent primary and secondary catchments",
      "Metrolink tram to city centre in ~20 minutes",
      "Extensive parks along the River Mersey",
    ],
    watchouts: [
      "Prices materially above the Manchester average",
      "Competitive family-home market — properties move quickly",
    ],
    lastRefreshedAt: "2026-08-01",
  },
  {
    slug: "chorlton-m21",
    outcode: "M21",
    district: "Chorlton",
    city: "Manchester",
    region: "North West",
    lat: 53.4429,
    lng: -2.2799,
    realvianScore: 84,
    investmentScore: 82,
    avgPrice: 368000,
    avgRent: 1380,
    grossYield: 5.6,
    fiveYearGrowth: 21.2,
    timeOnMarket: 29,
    dimensions: dims(86, 78, 72, 84, 93, 63),
    summary:
      "Chorlton has an established independent retail and food scene and a strong young-professional and family mix. Growth has outpaced Didsbury over five years while remaining slightly more affordable.",
    highlights: [
      "Strong independent high street",
      "Popular with families and professionals alike",
      "Above-average five-year price growth",
    ],
    watchouts: [
      "Limited direct rail — bus and cycle dependent",
      "Parking pressure on residential streets",
    ],
    lastRefreshedAt: "2026-08-01",
  },
  {
    slug: "ancoats-m4",
    outcode: "M4",
    district: "Ancoats",
    city: "Manchester",
    region: "North West",
    lat: 53.4849,
    lng: -2.2255,
    realvianScore: 76,
    investmentScore: 89,
    avgPrice: 258000,
    avgRent: 1290,
    grossYield: 6.9,
    fiveYearGrowth: 34.6,
    timeOnMarket: 22,
    dimensions: dims(62, 94, 61, 54, 90, 74),
    summary:
      "A former industrial quarter now among the fastest-appreciating postcodes in the country. Predominantly apartment stock, heavily oriented to renters, with the strongest yield profile in Manchester.",
    highlights: [
      "Highest five-year growth in Greater Manchester",
      "Walking distance to the city centre",
      "Strong and consistent tenant demand",
    ],
    watchouts: [
      "Almost entirely flats — limited family housing",
      "Significant new-build pipeline may soften rents",
      "Service charges on newer blocks can be high",
    ],
    lastRefreshedAt: "2026-08-01",
  },
  {
    slug: "sale-m33",
    outcode: "M33",
    district: "Sale",
    city: "Trafford",
    region: "North West",
    lat: 53.4245,
    lng: -2.3229,
    realvianScore: 85,
    investmentScore: 76,
    avgPrice: 395000,
    avgRent: 1320,
    grossYield: 5.0,
    fiveYearGrowth: 17.1,
    timeOnMarket: 31,
    dimensions: dims(92, 83, 82, 80, 84, 60),
    summary:
      "Sale sits in Trafford, which consistently ranks among the strongest state-school boroughs in the North West. Quieter than Chorlton with a more traditional family-suburb character.",
    highlights: [
      "Trafford grammar school catchment",
      "Low recorded crime relative to Greater Manchester",
      "Metrolink and motorway access",
    ],
    watchouts: ["Yields lower than central Manchester", "Limited nightlife or independent scene"],
    lastRefreshedAt: "2026-08-01",
  },

  // ── LEEDS ──
  {
    slug: "headingley-ls6",
    outcode: "LS6",
    district: "Headingley",
    city: "Leeds",
    region: "Yorkshire",
    lat: 53.8175,
    lng: -1.5766,
    realvianScore: 79,
    investmentScore: 86,
    avgPrice: 285000,
    avgRent: 1180,
    grossYield: 6.8,
    fiveYearGrowth: 22.1,
    timeOnMarket: 26,
    dimensions: dims(82, 88, 68, 74, 86, 72),
    summary:
      "A student and young-professional stronghold with reliable rental demand and yields well above the Leeds average. HMO licensing is a material consideration for investors here.",
    highlights: [
      "Very strong and predictable rental demand",
      "Yields notably above the city average",
      "Frequent buses to the universities and centre",
    ],
    watchouts: [
      "Article 4 direction restricts new HMO conversions",
      "High tenant turnover in student stock",
    ],
    lastRefreshedAt: "2026-08-01",
  },
  {
    slug: "chapel-allerton-ls7",
    outcode: "LS7",
    district: "Chapel Allerton",
    city: "Leeds",
    region: "Yorkshire",
    lat: 53.8321,
    lng: -1.5405,
    realvianScore: 83,
    investmentScore: 80,
    avgPrice: 312000,
    avgRent: 1210,
    grossYield: 6.1,
    fiveYearGrowth: 24.3,
    timeOnMarket: 28,
    dimensions: dims(85, 79, 74, 82, 90, 69),
    summary:
      "Chapel Allerton offers a well-regarded high street and a settled residential feel, and has become the preferred family alternative to Headingley for buyers priced out of Roundhay.",
    highlights: [
      "Independent bars, delis and restaurants",
      "Balanced yield and growth profile",
      "Good primary provision",
    ],
    watchouts: ["Tight supply of larger family homes", "Prices rising faster than Leeds average"],
    lastRefreshedAt: "2026-08-01",
  },
  {
    slug: "roundhay-ls8",
    outcode: "LS8",
    district: "Roundhay",
    city: "Leeds",
    region: "Yorkshire",
    lat: 53.8352,
    lng: -1.4977,
    realvianScore: 88,
    investmentScore: 72,
    avgPrice: 445000,
    avgRent: 1420,
    grossYield: 4.9,
    fiveYearGrowth: 15.8,
    timeOnMarket: 38,
    dimensions: dims(93, 71, 86, 96, 78, 52),
    summary:
      "Home to Roundhay Park, one of the largest urban parks in Europe. The premium family address in Leeds, with the green space and school scores to match and the lowest yields in the city.",
    highlights: [
      "Exceptional access to parkland",
      "Strongest school catchments in Leeds",
      "Low crime relative to the city",
    ],
    watchouts: ["Lowest yields of the Leeds areas covered", "Car-dependent for commuting"],
    lastRefreshedAt: "2026-08-01",
  },

  // ── BIRMINGHAM ──
  {
    slug: "edgbaston-b15",
    outcode: "B15",
    district: "Edgbaston",
    city: "Birmingham",
    region: "West Midlands",
    lat: 52.4662,
    lng: -1.9231,
    realvianScore: 83,
    investmentScore: 78,
    avgPrice: 342000,
    avgRent: 1290,
    grossYield: 5.5,
    fiveYearGrowth: 19.4,
    timeOnMarket: 33,
    dimensions: dims(89, 84, 78, 85, 82, 64),
    summary:
      "Birmingham's traditional prime residential district, with wide tree-lined roads, the university and hospital nearby, and strong professional rental demand.",
    highlights: [
      "Adjacent to University of Birmingham and QE Hospital",
      "Substantial period housing stock",
      "Well-connected to the city centre",
    ],
    watchouts: ["Conservation-area constraints on alterations", "Price premium over neighbouring areas"],
    lastRefreshedAt: "2026-08-01",
  },
  {
    slug: "digbeth-b5",
    outcode: "B5",
    district: "Digbeth",
    city: "Birmingham",
    region: "West Midlands",
    lat: 52.4747,
    lng: -1.8873,
    realvianScore: 71,
    investmentScore: 91,
    avgPrice: 218000,
    avgRent: 1150,
    grossYield: 7.3,
    fiveYearGrowth: 38.2,
    timeOnMarket: 20,
    dimensions: dims(58, 92, 56, 48, 88, 79),
    summary:
      "Birmingham's creative quarter and the focal point of significant regeneration, including HS2 Curzon Street. The highest growth and yield figures in this dataset, with commensurate risk.",
    highlights: [
      "Highest five-year growth in the dataset",
      "HS2 Curzon Street terminus nearby",
      "Strong creative-sector employment growth",
    ],
    watchouts: [
      "Regeneration timelines can slip",
      "Predominantly apartments; limited green space",
      "Crime scores below the city average",
    ],
    lastRefreshedAt: "2026-08-01",
  },
  {
    slug: "harborne-b17",
    outcode: "B17",
    district: "Harborne",
    city: "Birmingham",
    region: "West Midlands",
    lat: 52.4589,
    lng: -1.9556,
    realvianScore: 86,
    investmentScore: 75,
    avgPrice: 358000,
    avgRent: 1240,
    grossYield: 5.1,
    fiveYearGrowth: 17.6,
    timeOnMarket: 30,
    dimensions: dims(91, 76, 84, 83, 89, 62),
    summary:
      "A village-character suburb with an unusually good high street for its size, popular with medical professionals given hospital proximity.",
    highlights: ["Strong independent high street", "Good schools across all key stages", "Low crime"],
    watchouts: ["No direct rail station", "Family homes command a premium"],
    lastRefreshedAt: "2026-08-01",
  },

  // ── BRISTOL ──
  {
    slug: "clifton-bs8",
    outcode: "BS8",
    district: "Clifton",
    city: "Bristol",
    region: "South West",
    lat: 51.4553,
    lng: -2.6199,
    realvianScore: 91,
    investmentScore: 74,
    avgPrice: 548000,
    avgRent: 1780,
    grossYield: 4.4,
    fiveYearGrowth: 15.9,
    timeOnMarket: 36,
    dimensions: dims(96, 79, 84, 92, 94, 44),
    summary:
      "Bristol's most prestigious district — Georgian terraces, the Suspension Bridge, and the Downs. The highest liveability score in this dataset, and the lowest affordability.",
    highlights: [
      "Highest Realvian Score in the dataset",
      "Exceptional schools and amenities",
      "Immediate access to the Downs and Avon Gorge",
    ],
    watchouts: [
      "Least affordable area covered",
      "Yields among the lowest here",
      "Listed-building restrictions common",
    ],
    lastRefreshedAt: "2026-08-01",
  },
  {
    slug: "bedminster-bs3",
    outcode: "BS3",
    district: "Bedminster",
    city: "Bristol",
    region: "South West",
    lat: 51.4392,
    lng: -2.5975,
    realvianScore: 78,
    investmentScore: 85,
    avgPrice: 372000,
    avgRent: 1490,
    grossYield: 5.9,
    fiveYearGrowth: 27.4,
    timeOnMarket: 25,
    dimensions: dims(76, 85, 68, 70, 87, 66),
    summary:
      "South Bristol's fastest-changing area, with North Street's independent scene driving sustained interest from buyers priced out of Clifton and Southville.",
    highlights: [
      "Strong growth trajectory",
      "Walkable to the harbourside and centre",
      "Active independent retail on North Street",
    ],
    watchouts: ["Gentrification pressure on affordability", "Mixed housing quality street to street"],
    lastRefreshedAt: "2026-08-01",
  },

  // ── LONDON ──
  {
    slug: "battersea-sw11",
    outcode: "SW11",
    district: "Battersea",
    city: "London",
    region: "Greater London",
    lat: 51.4652,
    lng: -0.1607,
    realvianScore: 88,
    investmentScore: 76,
    avgPrice: 712000,
    avgRent: 2450,
    grossYield: 4.1,
    fiveYearGrowth: 14.2,
    timeOnMarket: 41,
    dimensions: dims(87, 96, 79, 86, 92, 34),
    summary:
      "Transformed by the Northern Line extension and Power Station redevelopment. Strong transport and amenity scores; affordability is the constraint, as across inner London.",
    highlights: [
      "Northern Line extension to Battersea Power Station",
      "Battersea Park on the doorstep",
      "Extensive new retail and leisure",
    ],
    watchouts: [
      "Very low affordability score",
      "Yields compressed by capital values",
      "Large new-build supply pipeline",
    ],
    lastRefreshedAt: "2026-08-01",
  },
  {
    slug: "walthamstow-e17",
    outcode: "E17",
    district: "Walthamstow",
    city: "London",
    region: "Greater London",
    lat: 51.5886,
    lng: -0.0198,
    realvianScore: 80,
    investmentScore: 84,
    avgPrice: 528000,
    avgRent: 1980,
    grossYield: 4.5,
    fiveYearGrowth: 23.8,
    timeOnMarket: 33,
    dimensions: dims(81, 93, 69, 78, 85, 46),
    summary:
      "A long-running gentrification story in north-east London, with Victoria Line access and Europe's longest outdoor market. Better value than comparable zone-3 areas further west.",
    highlights: [
      "Victoria Line — fast, reliable central access",
      "Walthamstow Wetlands and Epping Forest nearby",
      "Stronger growth than most inner-London areas",
    ],
    watchouts: ["Crime scores below the London average in parts", "Rapid price appreciation may slow"],
    lastRefreshedAt: "2026-08-01",
  },
  {
    slug: "peckham-se15",
    outcode: "SE15",
    district: "Peckham",
    city: "London",
    region: "Greater London",
    lat: 51.4739,
    lng: -0.0682,
    realvianScore: 77,
    investmentScore: 83,
    avgPrice: 545000,
    avgRent: 2050,
    grossYield: 4.5,
    fiveYearGrowth: 21.6,
    timeOnMarket: 35,
    dimensions: dims(74, 88, 62, 71, 91, 45),
    summary:
      "One of London's most-discussed regeneration areas, with a genuinely distinctive food and nightlife scene. Amenity scores are high; safety scores lag the London median.",
    highlights: [
      "Exceptional independent food and arts scene",
      "Overground and rail to London Bridge",
      "Continued regeneration investment",
    ],
    watchouts: ["Lower safety scores than most areas here", "Affordability remains challenging"],
    lastRefreshedAt: "2026-08-01",
  },
  {
    slug: "richmond-tw9",
    outcode: "TW9",
    district: "Richmond",
    city: "London",
    region: "Greater London",
    lat: 51.4613,
    lng: -0.3037,
    realvianScore: 92,
    investmentScore: 70,
    avgPrice: 845000,
    avgRent: 2680,
    grossYield: 3.8,
    fiveYearGrowth: 12.4,
    timeOnMarket: 44,
    dimensions: dims(97, 87, 91, 98, 88, 28),
    summary:
      "The highest liveability score in this dataset alongside Clifton. Richmond Park, the river, and outstanding schools — offset by the lowest yield and affordability figures covered.",
    highlights: [
      "Richmond Park and riverside",
      "Outstanding state and independent schools",
      "Lowest crime of any area covered",
    ],
    watchouts: [
      "Lowest yield in the dataset (3.8%)",
      "Least affordable area covered",
      "Slowest price growth",
    ],
    lastRefreshedAt: "2026-08-01",
  },

  // ── EDINBURGH & GLASGOW ──
  {
    slug: "new-town-eh3",
    outcode: "EH3",
    district: "New Town",
    city: "Edinburgh",
    region: "Scotland",
    lat: 55.9564,
    lng: -3.1985,
    realvianScore: 92,
    investmentScore: 77,
    avgPrice: 512000,
    avgRent: 1850,
    grossYield: 4.3,
    fiveYearGrowth: 18.9,
    timeOnMarket: 27,
    dimensions: dims(94, 93, 88, 84, 96, 42),
    summary:
      "A UNESCO World Heritage Site and Edinburgh's premier residential and commercial district. Exceptional across nearly every dimension except affordability.",
    highlights: [
      "UNESCO World Heritage Georgian architecture",
      "Best amenity score in the dataset",
      "Very strong transport and walkability",
    ],
    watchouts: [
      "Strict listed-building and conservation controls",
      "Short-term-let licensing restricts Airbnb strategies",
    ],
    lastRefreshedAt: "2026-08-01",
  },
  {
    slug: "leith-eh6",
    outcode: "EH6",
    district: "Leith",
    city: "Edinburgh",
    region: "Scotland",
    lat: 55.9756,
    lng: -3.1704,
    realvianScore: 81,
    investmentScore: 87,
    avgPrice: 298000,
    avgRent: 1420,
    grossYield: 6.4,
    fiveYearGrowth: 29.7,
    timeOnMarket: 21,
    dimensions: dims(78, 89, 70, 72, 92, 68),
    summary:
      "The new tram line and a decade of regeneration have made Leith one of the strongest combined growth-and-yield propositions in the UK, with a food scene to match.",
    highlights: [
      "Trams to Newhaven now operational",
      "Strong yield and growth simultaneously",
      "Waterfront and notable restaurant scene",
    ],
    watchouts: ["Quality varies significantly by street", "Some blocks have high factoring fees"],
    lastRefreshedAt: "2026-08-01",
  },
  {
    slug: "west-end-g3",
    outcode: "G3",
    district: "West End",
    city: "Glasgow",
    region: "Scotland",
    lat: 55.8697,
    lng: -4.2907,
    realvianScore: 84,
    investmentScore: 85,
    avgPrice: 262000,
    avgRent: 1290,
    grossYield: 6.7,
    fiveYearGrowth: 21.3,
    timeOnMarket: 24,
    dimensions: dims(86, 91, 73, 87, 93, 76),
    summary:
      "Glasgow's West End combines Victorian tenement architecture, the university, Kelvingrove, and Byres Road. Unusually strong across liveability and yield — Glasgow's affordability makes both possible.",
    highlights: [
      "Strong scores across liveability and yield",
      "Best affordability of any high-scoring area here",
      "University and Kelvingrove Park",
    ],
    watchouts: [
      "Tenement roof and common-repair liabilities",
      "HMO licensing applies near the university",
    ],
    lastRefreshedAt: "2026-08-01",
  },

  // ── OTHER MAJOR CITIES ──
  {
    slug: "jesmond-ne2",
    outcode: "NE2",
    district: "Jesmond",
    city: "Newcastle",
    region: "North East",
    lat: 54.9878,
    lng: -1.5988,
    realvianScore: 81,
    investmentScore: 84,
    avgPrice: 268000,
    avgRent: 1180,
    grossYield: 6.5,
    fiveYearGrowth: 16.8,
    timeOnMarket: 28,
    dimensions: dims(88, 86, 76, 84, 89, 77),
    summary:
      "Newcastle's premier residential suburb, walkable to the city centre with strong student and professional rental demand and good affordability by national standards.",
    highlights: ["Metro access", "Dene parkland", "Good yields with good liveability"],
    watchouts: ["Student concentration in parts", "Article 4 HMO restrictions"],
    lastRefreshedAt: "2026-08-01",
  },
  {
    slug: "sefton-park-l17",
    outcode: "L17",
    district: "Sefton Park",
    city: "Liverpool",
    region: "North West",
    lat: 53.3819,
    lng: -2.9316,
    realvianScore: 82,
    investmentScore: 86,
    avgPrice: 245000,
    avgRent: 1120,
    grossYield: 6.8,
    fiveYearGrowth: 23.1,
    timeOnMarket: 26,
    dimensions: dims(84, 78, 74, 94, 85, 81),
    summary:
      "Liverpool's leafiest inner suburb, wrapped around a 235-acre Grade I listed park. Among the best value-for-liveability combinations in the country.",
    highlights: [
      "Grade I listed park",
      "Very strong affordability for the score",
      "Substantial Victorian housing stock",
    ],
    watchouts: ["Transport weaker than comparable areas", "Some large houses need heavy refurbishment"],
    lastRefreshedAt: "2026-08-01",
  },
  {
    slug: "pontcanna-cf11",
    outcode: "CF11",
    district: "Pontcanna",
    city: "Cardiff",
    region: "Wales",
    lat: 51.4899,
    lng: -3.1969,
    realvianScore: 85,
    investmentScore: 79,
    avgPrice: 385000,
    avgRent: 1380,
    grossYield: 5.4,
    fiveYearGrowth: 19.7,
    timeOnMarket: 29,
    dimensions: dims(89, 82, 82, 91, 88, 63),
    summary:
      "Cardiff's most desirable inner suburb — Edwardian housing, Bute Park and Llandaff Fields nearby, and a concentration of independent cafés and delis.",
    highlights: ["Extensive adjacent parkland", "Strong schools", "Walkable to the city centre"],
    watchouts: ["Premium over neighbouring Canton", "Limited off-street parking"],
    lastRefreshedAt: "2026-08-01",
  },
  {
    slug: "stoke-bishop-bs9",
    outcode: "BS9",
    district: "Stoke Bishop",
    city: "Bristol",
    region: "South West",
    lat: 51.4785,
    lng: -2.6329,
    realvianScore: 87,
    investmentScore: 71,
    avgPrice: 585000,
    avgRent: 1820,
    grossYield: 4.2,
    fiveYearGrowth: 13.8,
    timeOnMarket: 40,
    dimensions: dims(95, 68, 89, 93, 74, 41),
    summary:
      "A quiet, green, family-dominated district north-west of Bristol with excellent schools and low crime. Transport and amenity scores are the weak points.",
    highlights: ["Outstanding school catchments", "Very low crime", "Adjacent to the Downs"],
    watchouts: ["Car-dependent", "Fewer local amenities than Clifton", "Low yield"],
    lastRefreshedAt: "2026-08-01",
  },
  {
    slug: "kelvinside-g12",
    outcode: "G12",
    district: "Kelvinside",
    city: "Glasgow",
    region: "Scotland",
    lat: 55.8792,
    lng: -4.2938,
    realvianScore: 86,
    investmentScore: 80,
    avgPrice: 295000,
    avgRent: 1340,
    grossYield: 6.2,
    fiveYearGrowth: 18.4,
    timeOnMarket: 27,
    dimensions: dims(90, 87, 81, 88, 87, 73),
    summary:
      "Adjacent to the West End but quieter and more residential, with substantial Victorian villas and terraces and excellent school provision.",
    highlights: ["Strong schools", "Botanic Gardens nearby", "Good yields for the quality of stock"],
    watchouts: ["Larger properties carry high maintenance costs", "Parking restrictions"],
    lastRefreshedAt: "2026-08-01",
  },
  {
    slug: "moseley-b13",
    outcode: "B13",
    district: "Moseley",
    city: "Birmingham",
    region: "West Midlands",
    lat: 52.4453,
    lng: -1.8848,
    realvianScore: 80,
    investmentScore: 83,
    avgPrice: 298000,
    avgRent: 1180,
    grossYield: 5.8,
    fiveYearGrowth: 22.7,
    timeOnMarket: 27,
    dimensions: dims(82, 80, 70, 86, 88, 71),
    summary:
      "Bohemian in character with a well-known farmers' market and a strong independent scene, Moseley offers larger Victorian housing at a discount to Harborne and Edgbaston.",
    highlights: ["Good value Victorian stock", "Active independent scene", "Green and leafy"],
    watchouts: ["Crime scores mid-range", "Rail access limited"],
    lastRefreshedAt: "2026-08-01",
  },
  {
    slug: "hyde-park-ls2",
    outcode: "LS2",
    district: "Hyde Park",
    city: "Leeds",
    region: "Yorkshire",
    lat: 53.8095,
    lng: -1.5613,
    realvianScore: 68,
    investmentScore: 88,
    avgPrice: 218000,
    avgRent: 1090,
    grossYield: 7.6,
    fiveYearGrowth: 19.4,
    timeOnMarket: 19,
    dimensions: dims(64, 90, 54, 62, 79, 84),
    summary:
      "Predominantly student housing adjacent to both Leeds universities. The highest gross yield in this dataset, with the trade-offs that implies for liveability and management intensity.",
    highlights: [
      "Highest gross yield covered (7.6%)",
      "Near-guaranteed occupancy in term time",
      "Walking distance to both universities",
    ],
    watchouts: [
      "Lowest liveability score in the dataset",
      "Intensive management; high turnover",
      "Article 4 restrictions on new HMOs",
    ],
    lastRefreshedAt: "2026-08-01",
  },
  {
    slug: "st-andrews-ky16",
    outcode: "KY16",
    district: "St Andrews",
    city: "Fife",
    region: "Scotland",
    lat: 56.3398,
    lng: -2.7967,
    realvianScore: 83,
    investmentScore: 78,
    avgPrice: 425000,
    avgRent: 1450,
    grossYield: 4.9,
    fiveYearGrowth: 16.2,
    timeOnMarket: 35,
    dimensions: dims(92, 52, 92, 88, 76, 54),
    summary:
      "A university and golf town with an unusual market: constrained supply, international demand, and very low crime, offset by weak transport connectivity.",
    highlights: ["Very low crime", "International buyer interest", "Strong schooling"],
    watchouts: ["Poor rail and road connectivity", "Highly seasonal rental market"],
    lastRefreshedAt: "2026-08-01",
  },
  {
    slug: "ouseburn-ne6",
    outcode: "NE6",
    district: "Ouseburn",
    city: "Newcastle",
    region: "North East",
    lat: 54.9741,
    lng: -1.5849,
    realvianScore: 74,
    investmentScore: 87,
    avgPrice: 195000,
    avgRent: 995,
    grossYield: 7.1,
    fiveYearGrowth: 31.4,
    timeOnMarket: 23,
    dimensions: dims(66, 84, 62, 68, 86, 86),
    summary:
      "Newcastle's creative quarter, undergoing sustained regeneration. Very strong affordability and yield with growth to match; liveability scores still catching up.",
    highlights: [
      "Best affordability score in the dataset",
      "Strong growth and yield together",
      "Thriving arts and music venues",
    ],
    watchouts: ["Regeneration incomplete in parts", "Mid-range safety scores"],
    lastRefreshedAt: "2026-08-01",
  },
  {
    slug: "portobello-eh15",
    outcode: "EH15",
    district: "Portobello",
    city: "Edinburgh",
    region: "Scotland",
    lat: 55.9542,
    lng: -3.1129,
    realvianScore: 82,
    investmentScore: 81,
    avgPrice: 328000,
    avgRent: 1390,
    grossYield: 5.8,
    fiveYearGrowth: 24.6,
    timeOnMarket: 25,
    dimensions: dims(83, 76, 84, 89, 82, 65),
    summary:
      "Edinburgh's seaside suburb, with a promenade and sandy beach two miles from the city centre. Increasingly popular with families leaving the more expensive central districts.",
    highlights: ["Beach and promenade", "Low crime", "Good balance of growth and yield"],
    watchouts: ["Bus-dependent — no rail station", "Coastal exposure on some properties"],
    lastRefreshedAt: "2026-08-01",
  },
  {
    slug: "kings-heath-b14",
    outcode: "B14",
    district: "Kings Heath",
    city: "Birmingham",
    region: "West Midlands",
    lat: 52.4265,
    lng: -1.8925,
    realvianScore: 76,
    investmentScore: 82,
    avgPrice: 258000,
    avgRent: 1080,
    grossYield: 6.0,
    fiveYearGrowth: 20.8,
    timeOnMarket: 28,
    dimensions: dims(78, 79, 68, 78, 84, 78),
    summary:
      "A solid, well-connected residential district south of Moseley offering good value family housing and a functional high street.",
    highlights: ["Good affordability", "Reliable rental demand", "Improving high street"],
    watchouts: ["Fewer standout amenities", "Mid-range school performance"],
    lastRefreshedAt: "2026-08-01",
  },
  {
    slug: "stockbridge-eh4",
    outcode: "EH4",
    district: "Stockbridge",
    city: "Edinburgh",
    region: "Scotland",
    lat: 55.9587,
    lng: -3.2098,
    realvianScore: 89,
    investmentScore: 76,
    avgPrice: 468000,
    avgRent: 1720,
    grossYield: 4.4,
    fiveYearGrowth: 17.4,
    timeOnMarket: 26,
    dimensions: dims(92, 86, 88, 90, 94, 48),
    summary:
      "A village within the city, with an exceptional independent high street, the Water of Leith walkway, and access to both the New Town and Botanics.",
    highlights: ["Outstanding amenity score", "Water of Leith walkway", "Very low crime"],
    watchouts: ["Expensive relative to Edinburgh median", "Limited parking"],
    lastRefreshedAt: "2026-08-01",
  },
  {
    slug: "altrincham-wa14",
    outcode: "WA14",
    district: "Altrincham",
    city: "Trafford",
    region: "North West",
    lat: 53.3872,
    lng: -2.3479,
    realvianScore: 86,
    investmentScore: 78,
    avgPrice: 425000,
    avgRent: 1420,
    grossYield: 5.0,
    fiveYearGrowth: 20.4,
    timeOnMarket: 30,
    dimensions: dims(93, 85, 84, 82, 90, 58),
    summary:
      "Altrincham's market-hall regeneration is widely cited as a model for UK town centres. Grammar school catchments and Metrolink access support consistent family demand.",
    highlights: [
      "Award-winning market hall and food scene",
      "Trafford grammar catchment",
      "Metrolink to Manchester",
    ],
    watchouts: ["Prices have risen sharply", "Town-centre parking pressure"],
    lastRefreshedAt: "2026-08-01",
  },
  {
    slug: "cotham-bs6",
    outcode: "BS6",
    district: "Cotham",
    city: "Bristol",
    region: "South West",
    lat: 51.4681,
    lng: -2.5947,
    realvianScore: 84,
    investmentScore: 82,
    avgPrice: 468000,
    avgRent: 1780,
    grossYield: 5.6,
    fiveYearGrowth: 20.1,
    timeOnMarket: 28,
    dimensions: dims(88, 86, 74, 76, 91, 52),
    summary:
      "Between Clifton and Gloucester Road, Cotham offers strong walkability, good schools, and a mix of family houses and student lets.",
    highlights: ["Highly walkable", "Gloucester Road independents nearby", "Good yields for Bristol"],
    watchouts: ["Student let concentration in parts", "Affordability constrained"],
    lastRefreshedAt: "2026-08-01",
  },
  {
    slug: "crouch-end-n8",
    outcode: "N8",
    district: "Crouch End",
    city: "London",
    region: "Greater London",
    lat: 51.5787,
    lng: -0.1223,
    realvianScore: 85,
    investmentScore: 75,
    avgPrice: 685000,
    avgRent: 2280,
    grossYield: 4.0,
    fiveYearGrowth: 15.4,
    timeOnMarket: 39,
    dimensions: dims(90, 74, 82, 84, 89, 36),
    summary:
      "A well-established family district in north London with strong schools and a village feel — notable for having no Underground station, which shapes both price and character.",
    highlights: ["Strong primary and secondary schools", "Village atmosphere", "Alexandra Palace nearby"],
    watchouts: ["No Tube station — bus or Overground", "Low yields", "Poor affordability"],
    lastRefreshedAt: "2026-08-01",
  },
  {
    slug: "heaton-ne7",
    outcode: "NE7",
    district: "Heaton",
    city: "Newcastle",
    region: "North East",
    lat: 54.9847,
    lng: -1.5762,
    realvianScore: 78,
    investmentScore: 85,
    avgPrice: 215000,
    avgRent: 1020,
    grossYield: 6.9,
    fiveYearGrowth: 18.2,
    timeOnMarket: 25,
    dimensions: dims(80, 83, 71, 80, 84, 84),
    summary:
      "A popular Newcastle suburb with Victorian and Edwardian flats and terraces, strong affordability, and reliable demand from both families and young professionals.",
    highlights: ["Strong affordability and yield", "Heaton Park", "Metro access"],
    watchouts: ["Flat-heavy stock in parts", "Mid-range safety scores"],
    lastRefreshedAt: "2026-08-01",
  },
  {
    slug: "canton-cf5",
    outcode: "CF5",
    district: "Canton",
    city: "Cardiff",
    region: "Wales",
    lat: 51.4823,
    lng: -3.2103,
    realvianScore: 80,
    investmentScore: 83,
    avgPrice: 312000,
    avgRent: 1240,
    grossYield: 5.9,
    fiveYearGrowth: 21.4,
    timeOnMarket: 27,
    dimensions: dims(84, 84, 76, 79, 86, 70),
    summary:
      "Adjacent to Pontcanna but more affordable, Canton has a busy high street and a mix of terraced family housing and flats.",
    highlights: ["More affordable than Pontcanna", "Good transport", "Cowbridge Road amenities"],
    watchouts: ["Busier and less leafy than Pontcanna", "Variable housing quality"],
    lastRefreshedAt: "2026-08-01",
  },
  {
    slug: "withington-m20-alt",
    outcode: "M19",
    district: "Levenshulme",
    city: "Manchester",
    region: "North West",
    lat: 53.4406,
    lng: -2.1928,
    realvianScore: 73,
    investmentScore: 86,
    avgPrice: 232000,
    avgRent: 1090,
    grossYield: 6.7,
    fiveYearGrowth: 28.3,
    timeOnMarket: 24,
    dimensions: dims(72, 86, 62, 70, 82, 82),
    summary:
      "Levenshulme has seen rapid change, with a well-regarded market and steady interest from buyers priced out of Chorlton and Didsbury. Strong growth and affordability together.",
    highlights: [
      "Strong growth with good affordability",
      "Levenshulme Market",
      "Direct trains to Manchester Piccadilly",
    ],
    watchouts: ["Safety scores below the city average", "Housing quality varies street to street"],
    lastRefreshedAt: "2026-08-01",
  },
  {
    slug: "shawlands-g41",
    outcode: "G41",
    district: "Shawlands",
    city: "Glasgow",
    region: "Scotland",
    lat: 55.8288,
    lng: -4.2867,
    realvianScore: 81,
    investmentScore: 84,
    avgPrice: 218000,
    avgRent: 1120,
    grossYield: 6.9,
    fiveYearGrowth: 22.8,
    timeOnMarket: 25,
    dimensions: dims(82, 85, 72, 84, 88, 84),
    summary:
      "Glasgow's Southside hub, with tenement flats, Queen's Park, and a rapidly improving independent scene. Excellent affordability alongside strong yields.",
    highlights: ["Queen's Park", "Very strong affordability", "Growing independent high street"],
    watchouts: ["Tenement common repairs", "Mid-range safety scores"],
    lastRefreshedAt: "2026-08-01",
  },
];

/* ══════════════════════════════════════════════════════
   ACCESSORS — every consumer goes through these.
   Swap the implementations for DB queries in Phase 1b.
   ══════════════════════════════════════════════════════ */

export function getAllAreas(): Area[] {
  return AREAS;
}

export function getAreaBySlug(slug: string): Area | undefined {
  return AREAS.find((a) => a.slug === slug);
}

export function getAreasByCity(city: string): Area[] {
  return AREAS.filter((a) => a.city.toLowerCase() === city.toLowerCase());
}

export function getAllCities(): { city: string; region: string; count: number }[] {
  const map = new Map<string, { city: string; region: string; count: number }>();
  for (const a of AREAS) {
    const existing = map.get(a.city);
    if (existing) existing.count += 1;
    else map.set(a.city, { city: a.city, region: a.region, count: 1 });
  }
  return [...map.values()].sort((x, y) => x.city.localeCompare(y.city));
}

/** Areas ranked by a given numeric field — powers the /rankings pages */
export function getRankedAreas(
  field: "realvianScore" | "investmentScore" | "grossYield" | "fiveYearGrowth" | "avgPrice",
  direction: "asc" | "desc" = "desc",
  limit?: number,
): Area[] {
  const sorted = [...AREAS].sort((a, b) =>
    direction === "desc" ? b[field] - a[field] : a[field] - b[field],
  );
  return limit ? sorted.slice(0, limit) : sorted;
}

/** Similar areas — same region, closest Realvian Score. Powers internal linking (SEO). */
export function getSimilarAreas(area: Area, limit = 3): Area[] {
  return AREAS.filter((a) => a.slug !== area.slug)
    .sort((a, b) => {
      const regionBonusA = a.region === area.region ? -20 : 0;
      const regionBonusB = b.region === area.region ? -20 : 0;
      const diffA = Math.abs(a.realvianScore - area.realvianScore) + regionBonusA;
      const diffB = Math.abs(b.realvianScore - area.realvianScore) + regionBonusB;
      return diffA - diffB;
    })
    .slice(0, limit);
}

/* ── Formatting helpers, used across every page ────── */
export const fmtPrice = (n: number): string =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n);

export const fmtRent = (n: number): string => `${fmtPrice(n)}/mo`;
export const fmtPct = (n: number): string => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
export const fmtYield = (n: number): string => `${n.toFixed(1)}%`;

/** Consistent verdict language for a 0–100 score — used in copy and badges */
export function scoreVerdict(score: number): { label: string; tone: "primary" | "accent" | "neutral" } {
  if (score >= 88) return { label: "Exceptional", tone: "accent" };
  if (score >= 80) return { label: "Strong", tone: "primary" };
  if (score >= 72) return { label: "Good", tone: "primary" };
  return { label: "Mixed", tone: "neutral" };
}
