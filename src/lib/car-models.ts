/**
 * Comprehensive make → model catalog.
 *
 * Unlike the make/model facets derived from live inventory, this is a curated,
 * near-exhaustive list of models each manufacturer has produced (historic +
 * current). It powers the Model filter: selecting a make (e.g. BMW) reveals
 * every known model for that make (128, Z4, Z8, …) regardless of whether a
 * matching car is currently listed.
 *
 * Keys match the make names used in `popularMakes` (and common UAE-market
 * makes). Lookups are case-insensitive and tolerant of a few common aliases
 * (see `MAKE_ALIASES`), so "Mercedes" resolves to "Mercedes-Benz".
 */

export const CAR_MODELS: Record<string, string[]> = {
  Toyota: [
    "4Runner", "86", "Alphard", "Aurion", "Avalon", "Avanza", "Aygo", "bZ4X",
    "C-HR", "Camry", "Celica", "Corolla", "Corolla Cross", "Corona", "Cressida",
    "Crown", "Echo", "FJ Cruiser", "Fortuner", "GR86", "GR Corolla", "GR Supra",
    "Granvia", "Hiace", "Highlander", "Hilux", "Innova", "Land Cruiser",
    "Land Cruiser 70", "Land Cruiser Prado", "Levin", "Mark II", "Matrix",
    "MR2", "Previa", "Prius", "Prius C", "Prius V", "RAV4", "Rush", "Sequoia",
    "Sienna", "Solara", "Starlet", "Supra", "Tacoma", "Tundra", "Urban Cruiser",
    "Venza", "Vios", "Yaris", "Yaris Cross",
  ],
  Nissan: [
    "350Z", "370Z", "Almera", "Altima", "Ariya", "Armada", "Cube", "Frontier",
    "GT-R", "Juke", "Kicks", "Leaf", "Maxima", "Micra", "Murano", "Navara",
    "Note", "NV200", "Pathfinder", "Patrol", "Patrol Safari", "Pulsar", "Qashqai",
    "Quest", "Rogue", "Sentra", "Silvia", "Skyline", "Sunny", "Sylphy", "Terra",
    "Tiida", "Titan", "Urvan", "Versa", "X-Trail", "Xterra", "Z",
  ],
  "Mercedes-Benz": [
    "190E", "A-Class", "AMG GT", "AMG GT 4-Door", "AMG ONE", "B-Class",
    "C-Class", "Citan", "CL-Class", "CLA", "CLE", "CLK", "CLS", "E-Class",
    "EQA", "EQB", "EQC", "EQE", "EQE SUV", "EQS", "EQS SUV", "EQV", "G-Class",
    "GL-Class", "GLA", "GLB", "GLC", "GLC Coupe", "GLE", "GLE Coupe", "GLK",
    "GLS", "Maybach GLS", "Maybach S-Class", "ML-Class", "R-Class", "S-Class",
    "SL", "SLC", "SLK", "SLR McLaren", "SLS AMG", "Sprinter", "V-Class", "Vito",
    "X-Class",
  ],
  BMW: [
    "1 Series", "2 Series", "2 Series Active Tourer", "2 Series Gran Coupe",
    "3 Series", "4 Series", "4 Series Gran Coupe", "5 Series", "6 Series",
    "6 Series GT", "7 Series", "8 Series", "8 Series Gran Coupe", "128",
    "1500", "1600", "1602", "2000", "2002", "2002 Turbo", "3.0 CS", "3.0 CSL",
    "i3", "i4", "i5", "i7", "i8", "iX", "iX1", "iX2", "iX3", "M2", "M3", "M4",
    "M5", "M6", "M8", "X1", "X2", "X3", "X3 M", "X4", "X4 M", "X5", "X5 M",
    "X6", "X6 M", "X7", "XM", "Z1", "Z3", "Z3 M", "Z4", "Z4 M", "Z8",
  ],
  Lexus: [
    "CT", "ES", "GS", "GX", "IS", "IS F", "LC", "LFA", "LM", "LS", "LX", "NX",
    "RC", "RC F", "RX", "RZ", "SC", "UX",
  ],
  "Land Rover": [
    "Defender", "Defender 90", "Defender 110", "Defender 130", "Discovery",
    "Discovery Sport", "Discovery 3", "Discovery 4", "Freelander",
    "Range Rover", "Range Rover Evoque", "Range Rover Sport", "Range Rover Velar",
    "Series I", "Series II", "Series III",
  ],
  Porsche: [
    "356", "718 Boxster", "718 Cayman", "718 Spyder", "911", "911 GT2",
    "911 GT3", "911 Turbo", "912", "914", "918 Spyder", "924", "928", "944",
    "959", "962", "968", "Boxster", "Carrera GT", "Cayenne", "Cayenne Coupe",
    "Cayman", "Macan", "Panamera", "Taycan",
  ],
  Audi: [
    "80", "90", "100", "200", "A1", "A3", "A4", "A4 Allroad", "A5", "A6",
    "A6 Allroad", "A7", "A8", "e-tron", "e-tron GT", "Q2", "Q3", "Q4 e-tron",
    "Q5", "Q6 e-tron", "Q7", "Q8", "Q8 e-tron", "R8", "RS3", "RS4", "RS5",
    "RS6", "RS7", "RS Q3", "RS Q8", "S3", "S4", "S5", "S6", "S7", "S8",
    "SQ5", "SQ7", "SQ8", "TT", "TT RS", "TTS",
  ],
  Ford: [
    "Bronco", "Bronco Sport", "C-Max", "Crown Victoria", "Ecosport", "Edge",
    "Escape", "Escort", "Expedition", "Explorer", "F-150", "F-250", "F-350",
    "Falcon", "Fiesta", "Figo", "Flex", "Focus", "Fusion", "Galaxy", "GT",
    "Kuga", "Maverick", "Mondeo", "Mustang", "Mustang Mach-E", "Puma", "Ranger",
    "Ranger Raptor", "Taurus", "Territory", "Thunderbird", "Tourneo", "Transit",
  ],
  Chevrolet: [
    "Astro", "Aveo", "Blazer", "Bolt", "Camaro", "Caprice", "Captiva",
    "Cavalier", "Colorado", "Corvette", "Cruze", "Equinox", "Express",
    "Impala", "Malibu", "Silverado", "Sonic", "Spark", "SS", "Suburban",
    "Tahoe", "Trailblazer", "Traverse", "Trax", "Volt",
  ],
  Honda: [
    "Accord", "City", "Civic", "Civic Type R", "Clarity", "CR-V", "CR-Z",
    "Crosstour", "Element", "Fit", "HR-V", "Insight", "Jazz", "Legend",
    "NSX", "Odyssey", "Passport", "Pilot", "Prelude", "Ridgeline", "S2000",
    "ZR-V",
  ],
  Hyundai: [
    "Accent", "Azera", "Bayon", "Creta", "Elantra", "Genesis", "Getz", "H-1",
    "i10", "i20", "i30", "i40", "Ioniq", "Ioniq 5", "Ioniq 6", "Kona", "Palisade",
    "Santa Fe", "Sonata", "Staria", "Tucson", "Veloster", "Venue", "Veracruz",
  ],
  Mitsubishi: [
    "3000GT", "ASX", "Attrage", "Colt", "Eclipse", "Eclipse Cross", "Galant",
    "Grandis", "L200", "Lancer", "Lancer Evolution", "Mirage", "Montero",
    "Montero Sport", "Outlander", "Outlander PHEV", "Pajero", "Pajero Sport",
    "Xpander",
  ],
  Mazda: [
    "2", "3", "323", "5", "6", "626", "929", "BT-50", "CX-3", "CX-30", "CX-5",
    "CX-50", "CX-60", "CX-7", "CX-9", "CX-90", "Miata", "MX-5", "MX-30", "MX-6",
    "RX-7", "RX-8", "Tribute",
  ],
  GMC: [
    "Acadia", "Canyon", "Envoy", "Hummer EV", "Jimmy", "Savana", "Sierra",
    "Terrain", "Yukon", "Yukon XL",
  ],
  Cadillac: [
    "ATS", "CT4", "CT5", "CT6", "CTS", "DeVille", "Escalade", "Escalade ESV",
    "Lyriq", "SRX", "STS", "XT4", "XT5", "XT6", "XTS",
  ],
  Jeep: [
    "Cherokee", "Commander", "Compass", "Gladiator", "Grand Cherokee",
    "Grand Cherokee L", "Grand Wagoneer", "Liberty", "Patriot", "Renegade",
    "Wagoneer", "Wrangler",
  ],
  Dodge: [
    "Avenger", "Caliber", "Challenger", "Charger", "Dart", "Durango",
    "Grand Caravan", "Journey", "Nitro", "RAM 1500", "Viper",
  ],
  Kia: [
    "Carens", "Carnival", "Cadenza", "Cerato", "EV6", "EV9", "Forte", "K5",
    "K900", "Mohave", "Niro", "Optima", "Picanto", "Rio", "Sedona", "Seltos",
    "Sonet", "Sorento", "Soul", "Sportage", "Stinger", "Telluride",
  ],
  Volkswagen: [
    "Amarok", "Arteon", "Atlas", "Beetle", "Bora", "Caddy", "CC", "Golf",
    "Golf GTI", "Golf R", "ID.3", "ID.4", "ID.5", "ID.6", "ID.Buzz", "Jetta",
    "Passat", "Polo", "Scirocco", "Sharan", "T-Cross", "T-Roc", "Teramont",
    "Tiguan", "Touareg", "Touran", "Transporter", "Up",
  ],
  Volvo: [
    "C30", "C40", "C70", "EX30", "EX90", "S40", "S60", "S80", "S90", "V40",
    "V50", "V60", "V70", "V90", "XC40", "XC60", "XC70", "XC90",
  ],
  Jaguar: [
    "E-Pace", "E-Type", "F-Pace", "F-Type", "I-Pace", "S-Type", "X-Type",
    "XE", "XF", "XJ", "XJ220", "XK", "XKR",
  ],
  Bentley: [
    "Arnage", "Azure", "Bentayga", "Brooklands", "Continental", "Continental GT",
    "Flying Spur", "Mulsanne", "Turbo R",
  ],
  "Rolls-Royce": [
    "Cullinan", "Dawn", "Ghost", "Phantom", "Silver Cloud", "Silver Seraph",
    "Silver Shadow", "Silver Spirit", "Spectre", "Wraith",
  ],
  Ferrari: [
    "296 GTB", "308", "328", "348", "360", "458", "488", "512", "550", "575",
    "599", "612", "812 Superfast", "California", "Daytona", "Enzo", "F8",
    "F12", "F40", "F50", "F355", "F430", "FF", "GTC4Lusso", "LaFerrari",
    "Portofino", "Purosangue", "Roma", "SF90 Stradale", "Testarossa",
  ],
  Lamborghini: [
    "Aventador", "Countach", "Diablo", "Espada", "Gallardo", "Huracan",
    "Jarama", "Jalpa", "Miura", "Murcielago", "Reventon", "Revuelto", "Sian",
    "Urus", "Veneno",
  ],
  Maserati: [
    "3200 GT", "Ghibli", "GranCabrio", "GranTurismo", "Grecale", "Levante",
    "MC20", "Quattroporte", "Spyder",
  ],
  Infiniti: [
    "EX", "FX", "G25", "G35", "G37", "JX", "M", "Q30", "Q50", "Q60", "Q70",
    "QX30", "QX50", "QX55", "QX56", "QX60", "QX70", "QX80",
  ],
  Tesla: ["Model 3", "Model S", "Model X", "Model Y", "Cybertruck", "Roadster"],
  Mini: [
    "Clubman", "Cooper", "Cooper S", "Countryman", "Coupe", "Hatch",
    "John Cooper Works", "Paceman", "Roadster",
  ],
  Suzuki: [
    "Baleno", "Celerio", "Ciaz", "Dzire", "Ertiga", "Grand Vitara", "Jimny",
    "Kizashi", "Liana", "Swift", "SX4", "Vitara",
  ],
  Renault: [
    "Captur", "Clio", "Duster", "Fluence", "Kadjar", "Koleos", "Laguna",
    "Megane", "Safrane", "Symbol", "Talisman", "Zoe",
  ],
  Peugeot: [
    "108", "206", "207", "208", "301", "308", "3008", "406", "407", "508",
    "5008", "Partner", "RCZ", "Rifter",
  ],
  Genesis: ["G70", "G80", "G90", "GV60", "GV70", "GV80"],
  Subaru: [
    "Ascent", "BRZ", "Crosstrek", "Forester", "Impreza", "Legacy", "Levorg",
    "Outback", "Tribeca", "WRX", "WRX STI", "XV",
  ],
  Chrysler: ["200", "300", "300C", "Pacifica", "PT Cruiser", "Sebring", "Voyager"],
  "Aston Martin": [
    "DB7", "DB9", "DB11", "DB12", "DBS", "DBX", "Rapide", "Vanquish", "Vantage",
    "Valhalla", "Valkyrie", "Virage",
  ],
  MG: [
    "3", "4", "5", "6", "GT", "HS", "Marvel R", "MG5 EV", "RX5", "RX8", "ZS",
    "ZS EV",
  ],
  RAM: ["1500", "2500", "3500", "ProMaster", "Rampage", "TRX"],
  Fiat: ["124 Spider", "500", "500L", "500X", "Doblo", "Panda", "Punto", "Tipo"],
  "Alfa Romeo": [
    "4C", "8C", "147", "156", "159", "Brera", "Giulia", "Giulietta", "GT",
    "GTV", "MiTo", "Spider", "Stelvio", "Tonale",
  ],
  Lincoln: [
    "Aviator", "Continental", "Corsair", "MKC", "MKS", "MKT", "MKX", "MKZ",
    "Nautilus", "Navigator", "Town Car",
  ],
  Acura: ["ILX", "Integra", "MDX", "NSX", "RDX", "RL", "RLX", "TL", "TLX", "TSX", "ZDX"],
  Bugatti: ["Chiron", "Divo", "EB110", "Veyron", "Mistral", "Tourbillon"],
  McLaren: [
    "540C", "570S", "600LT", "620R", "650S", "675LT", "720S", "750S", "765LT",
    "Artura", "F1", "GT", "P1", "Senna", "Speedtail",
  ],
};

/** Common alternative spellings mapped to the canonical catalog key. */
const MAKE_ALIASES: Record<string, string> = {
  mercedes: "Mercedes-Benz",
  "mercedes benz": "Mercedes-Benz",
  benz: "Mercedes-Benz",
  vw: "Volkswagen",
  landrover: "Land Rover",
  "range rover": "Land Rover",
  rolls: "Rolls-Royce",
  "rolls royce": "Rolls-Royce",
  chevy: "Chevrolet",
  "alfa romeo": "Alfa Romeo",
  "aston martin": "Aston Martin",
};

const CANONICAL_BY_LOWER: Record<string, string> = Object.fromEntries(
  Object.keys(CAR_MODELS).map((k) => [k.toLowerCase(), k]),
);

/** Resolve a make name (any casing / common alias) to its catalog key. */
export function canonicalMake(make: string): string | undefined {
  const key = make.trim().toLowerCase();
  return CANONICAL_BY_LOWER[key] ?? MAKE_ALIASES[key];
}

/** All catalog models for a single make (empty if the make is unknown). */
export function modelsForMake(make: string): string[] {
  const canon = canonicalMake(make);
  return canon ? CAR_MODELS[canon] : [];
}

export interface MakeModelGroup {
  make: string;
  models: string[];
}

/**
 * Models grouped by make for each selected make (canonicalised, unknown makes
 * dropped). The component renders one sub-section per group; each checkbox
 * value is the bare model name so it matches `listings.model` directly.
 */
export function modelGroupsForMakes(makes: string[]): MakeModelGroup[] {
  const seenMake = new Set<string>();
  const groups: MakeModelGroup[] = [];
  for (const raw of makes) {
    const canon = canonicalMake(raw);
    if (!canon || seenMake.has(canon)) continue;
    seenMake.add(canon);
    groups.push({ make: canon, models: CAR_MODELS[canon] });
  }
  return groups;
}

/** Flat, de-duplicated union of every model across the given makes. */
export function modelsForMakes(makes: string[]): string[] {
  const seen = new Set<string>();
  for (const g of modelGroupsForMakes(makes)) {
    for (const m of g.models) seen.add(m);
  }
  return Array.from(seen);
}
