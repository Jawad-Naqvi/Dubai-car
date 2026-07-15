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
  { name: "White", hex: "#F3F1E9", light: true },
  { name: "Silver", hex: "#C7CBD1", light: true },
  { name: "Grey", hex: "#8B9099" },
  { name: "Blue", hex: "#2456C7" },
  { name: "Red", hex: "#CE2A2A" },
  { name: "Green", hex: "#1F7A3D" },
  { name: "Brown", hex: "#6B4423" },
  { name: "Beige", hex: "#DCC9A0", light: true },
  { name: "Gold", hex: "#F0941F" },
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
  { name: "White", hex: "#F3F1E9", light: true },
];

export const cylinderOptions = [3, 4, 5, 6, 8, 10, 12] as const;
export const doorOptions = [2, 3, 4, 5] as const;

export const sellerTypes = [
  { id: "dealer", label: "Dealership" },
  { id: "private", label: "Private Seller" },
] as const;

/** Preset mileage ceilings (km) for the quick-select mileage chips. */
export const mileagePresets = [25000, 50000, 100000, 150000] as const;
