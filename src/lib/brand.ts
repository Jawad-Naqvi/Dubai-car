export const brand = {
  name: "DXB Motors",
  shortName: "DXB",
  tagline: "Dubai's Yard-Forward Automotive Marketplace",
  domain: "dxbmotors.ae",
  url: "https://dxbmotors.ae",
  email: "hello@dxbmotors.ae",
  supportEmail: "support@dxbmotors.ae",
  whatsapp: "+971500000000",
  whatsappLink: "https://wa.me/971500000000",
  socials: {
    linkedin: "https://linkedin.com/company/dxbmotors",
    instagram: "https://instagram.com/dxbmotors",
    twitter: "https://x.com/dxbmotors",
  },
} as const;

export const emirates = [
  { id: "dubai", en: "Dubai", ar: "دبي" },
  { id: "abu-dhabi", en: "Abu Dhabi", ar: "أبوظبي" },
  { id: "sharjah", en: "Sharjah", ar: "الشارقة" },
  { id: "ajman", en: "Ajman", ar: "عجمان" },
  { id: "ras-al-khaimah", en: "Ras Al Khaimah", ar: "رأس الخيمة" },
  { id: "umm-al-quwain", en: "Umm Al Quwain", ar: "أم القيوين" },
  { id: "fujairah", en: "Fujairah", ar: "الفجيرة" },
  { id: "al-ain", en: "Al Ain", ar: "العين" },
] as const;

export interface SubscriptionTier {
  id: "free" | "silver" | "gold" | "platinum";
  name: string;
  monthlyAED: number;
  listings: number;
  features: string[];
  recommended?: boolean;
}

export const subscriptionTiers: SubscriptionTier[] = [
  {
    id: "free",
    name: "Free",
    monthlyAED: 0,
    listings: 3,
    features: ["Basic dealer profile", "Standard listing position", "Email contact form"],
  },
  {
    id: "silver",
    name: "Silver",
    monthlyAED: 299,
    listings: 20,
    features: [
      "Dedicated dealer profile page",
      "Listing performance analytics",
      "Priority email support",
    ],
  },
  {
    id: "gold",
    name: "Gold",
    monthlyAED: 699,
    listings: 75,
    features: [
      "Featured dealer badge",
      "5 promoted listings / month",
      "Lead performance reports",
      "WhatsApp lead routing",
    ],
    recommended: true,
  },
  {
    id: "platinum",
    name: "Platinum",
    monthlyAED: 1499,
    listings: Infinity,
    features: [
      "Unlimited active listings",
      "Homepage exposure & top search placement",
      "B2B export module access",
      "Dedicated account manager",
      "Bulk inventory upload (CSV/Excel)",
    ],
  },
];

export const popularMakes = [
  "Toyota",
  "Nissan",
  "Mercedes-Benz",
  "BMW",
  "Lexus",
  "Land Rover",
  "Porsche",
  "Audi",
  "Ford",
  "Chevrolet",
  "Honda",
  "Hyundai",
  "Mitsubishi",
  "Mazda",
] as const;

/**
 * Full model catalogue per make (UAE-relevant lineups, current + recent).
 * Powers the Model filter: selecting a make lists its whole lineup — not only
 * the models that happen to be in inventory right now — the way cars.com does.
 * Inventory counts are merged on top at render time.
 */
export const makeModels: Record<string, string[]> = {
  Toyota: [
    "Land Cruiser", "Land Cruiser Prado", "Fortuner", "RAV4", "Highlander",
    "4Runner", "Sequoia", "Corolla", "Camry", "Yaris", "Avalon", "Hilux",
    "Tacoma", "Tundra", "Supra", "GR86", "GR Corolla", "C-HR", "Rush",
    "Innova", "Sienna", "Prius", "bZ4X", "Crown", "Raize",
  ],
  Nissan: [
    "Patrol", "X-Trail", "Kicks", "Qashqai", "Pathfinder", "Armada", "Juke",
    "Altima", "Maxima", "Sunny", "Sentra", "Micra", "Z", "GT-R", "370Z",
    "Navara", "Titan", "Murano", "Terra", "Ariya", "Leaf",
  ],
  "Mercedes-Benz": [
    "A-Class", "C-Class", "E-Class", "S-Class", "CLA", "CLS", "GLA", "GLB",
    "GLC", "GLE", "GLS", "G-Class", "GT", "AMG GT", "SL", "SLC", "EQA", "EQB",
    "EQC", "EQE", "EQS", "V-Class", "Maybach S-Class", "Maybach GLS",
  ],
  BMW: [
    "1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "6 Series",
    "7 Series", "8 Series", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "XM",
    "Z4", "M2", "M3", "M4", "M5", "M8", "i4", "i5", "i7", "iX", "iX1", "iX3",
  ],
  Lexus: [
    "IS", "ES", "GS", "LS", "UX", "NX", "RX", "GX", "LX", "RZ", "RC", "LC",
    "LM", "CT",
  ],
  "Land Rover": [
    "Range Rover", "Range Rover Sport", "Range Rover Velar", "Range Rover Evoque",
    "Defender", "Discovery", "Discovery Sport",
  ],
  Porsche: [
    "911", "718 Cayman", "718 Boxster", "Taycan", "Panamera", "Macan",
    "Cayenne", "Cayenne Coupe",
  ],
  Audi: [
    "A3", "A4", "A5", "A6", "A7", "A8", "Q2", "Q3", "Q5", "Q7", "Q8",
    "e-tron", "Q4 e-tron", "Q8 e-tron", "e-tron GT", "TT", "R8", "RS3", "RS5",
    "RS6", "RS7", "RS Q8", "S3", "S4", "S5", "S6", "S8", "SQ5", "SQ7", "SQ8",
  ],
  Ford: [
    "Mustang", "Mustang Mach-E", "F-150", "F-150 Raptor", "Ranger", "Bronco",
    "Bronco Sport", "Explorer", "Expedition", "Edge", "Escape", "EcoSport",
    "Territory", "Taurus", "Focus", "Figo", "Transit",
  ],
  Chevrolet: [
    "Tahoe", "Suburban", "Traverse", "Blazer", "Trailblazer", "Trax",
    "Equinox", "Camaro", "Corvette", "Malibu", "Impala", "Spark", "Captiva",
    "Groove", "Silverado", "Colorado",
  ],
  Honda: [
    "Civic", "Accord", "City", "CR-V", "HR-V", "ZR-V", "Pilot", "Passport",
    "Odyssey", "Jazz", "Ridgeline", "e:Ny1",
  ],
  Hyundai: [
    "Accent", "Elantra", "Sonata", "Azera", "i10", "i20", "i30", "Creta",
    "Tucson", "Santa Fe", "Palisade", "Kona", "Venue", "Staria", "Ioniq 5",
    "Ioniq 6", "Nexo",
  ],
  Mitsubishi: [
    "Attrage", "Lancer", "Mirage", "Eclipse Cross", "ASX", "Outlander",
    "Montero Sport", "Pajero", "L200", "Xpander",
  ],
  Mazda: [
    "Mazda2", "Mazda3", "Mazda6", "CX-3", "CX-30", "CX-5", "CX-60", "CX-9",
    "CX-90", "MX-5", "BT-50",
  ],
  Kia: [
    "Picanto", "Rio", "Cerato", "K5", "Stinger", "Sonet", "Seltos", "Sportage",
    "Sorento", "Telluride", "Carnival", "Niro", "EV6", "EV9",
  ],
  Volkswagen: [
    "Golf", "Polo", "Passat", "Jetta", "Arteon", "Tiguan", "Touareg", "T-Roc",
    "Teramont", "ID.4", "ID.6",
  ],
  Jeep: [
    "Wrangler", "Grand Cherokee", "Cherokee", "Compass", "Renegade",
    "Gladiator", "Grand Wagoneer", "Wagoneer",
  ],
  "Rolls-Royce": [
    "Phantom", "Ghost", "Wraith", "Dawn", "Cullinan", "Spectre",
  ],
  Bentley: [
    "Continental GT", "Flying Spur", "Bentayga", "Mulsanne",
  ],
  Ferrari: [
    "Roma", "Portofino", "296 GTB", "SF90 Stradale", "F8 Tributo", "296 GTS",
    "812 Superfast", "Purosangue", "Daytona SP3",
  ],
  Lamborghini: [
    "Huracan", "Aventador", "Urus", "Revuelto",
  ],
  "Aston Martin": [
    "Vantage", "DB11", "DB12", "DBS", "DBX", "Valkyrie",
  ],
  Maserati: [
    "Ghibli", "Quattroporte", "Levante", "Grecale", "MC20", "GranTurismo",
  ],
  Jaguar: [
    "XE", "XF", "F-Type", "E-Pace", "F-Pace", "I-Pace",
  ],
  Cadillac: [
    "CT4", "CT5", "Escalade", "XT4", "XT5", "XT6", "Lyriq",
  ],
  GMC: [
    "Sierra", "Yukon", "Acadia", "Terrain", "Hummer EV",
  ],
  Infiniti: [
    "Q50", "Q60", "QX50", "QX55", "QX60", "QX80",
  ],
};

export const bodyTypes = [
  "SUV",
  "Sedan",
  "Coupe",
  "Hatchback",
  "Convertible",
  "Pickup",
  "Van",
  "Wagon",
] as const;

export const fuelTypes = ["Petrol", "Diesel", "Hybrid", "Electric"] as const;
export const transmissions = ["Automatic", "Manual"] as const;
export const regionalSpecs = ["GCC", "American", "European", "Japanese", "Canadian", "Other"] as const;
export const conditions = ["New", "Used", "Certified Pre-Owned"] as const;

/** Drivetrain options — mirrors the cars.com facet (AWD / 4WD / FWD / RWD). */
export const drivetrains = [
  "All-wheel Drive",
  "Four-wheel Drive",
  "Front-wheel Drive",
  "Rear-wheel Drive",
] as const;

/**
 * Deal rating buckets, cars.com-style. Computed from a listing's price versus
 * the median asking price of comparable cars (same make/model, similar year).
 */
export const dealRatings = [
  { id: "Great", label: "Great Deal" },
  { id: "Good", label: "Good Deal" },
  { id: "Fair", label: "Fair Price" },
] as const;
export type DealRating = (typeof dealRatings)[number]["id"];

/**
 * Colour families used by the exterior/interior colour filters. Listing colours
 * are free-text (e.g. "Nardo Grey", "Pearl White"), so filtering matches the
 * family name as a substring rather than an exact value.
 */
export interface ColorOption {
  name: string;
  hex: string;
  /** Light swatch that needs a visible ring to read on white. */
  light?: boolean;
}

export const exteriorColors: ColorOption[] = [
  { name: "Black", hex: "#1A1A1A" },
  { name: "White", hex: "#F4F4F6", light: true },
  { name: "Silver", hex: "#C7CBD1", light: true },
  { name: "Grey", hex: "#8B9099" },
  { name: "Blue", hex: "#2456C7" },
  { name: "Red", hex: "#CE2A2A" },
  { name: "Green", hex: "#1F7A3D" },
  { name: "Brown", hex: "#6B4423" },
  { name: "Beige", hex: "#DCC9A0", light: true },
  { name: "Gold", hex: "#8136B2" },
  { name: "Orange", hex: "#E8791E" },
  { name: "Yellow", hex: "#ECC526", light: true },
  { name: "Purple", hex: "#6C2E9C" },
];

export const interiorColors: ColorOption[] = [
  { name: "Black", hex: "#1A1A1A" },
  { name: "Beige", hex: "#DCC9A0", light: true },
  { name: "Grey", hex: "#8B9099" },
  { name: "Brown", hex: "#6B4423" },
  { name: "Tan", hex: "#B8946A" },
  { name: "Red", hex: "#CE2A2A" },
  { name: "White", hex: "#F4F4F6", light: true },
];

export const cylinderOptions = [3, 4, 5, 6, 8, 10, 12] as const;
export const doorOptions = [2, 3, 4, 5] as const;

export const sellerTypes = [
  { id: "dealer", label: "Dealership" },
  { id: "private", label: "Private Seller" },
] as const;

/** Preset mileage ceilings (km) for the quick-select mileage chips. */
export const mileagePresets = [25000, 50000, 100000, 150000] as const;
