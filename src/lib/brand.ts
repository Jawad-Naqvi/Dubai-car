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
