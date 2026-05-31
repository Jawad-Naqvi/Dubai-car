/**
 * Mock listings used during development before Meilisearch + DB are wired live.
 * Production reads from Drizzle/Meilisearch via the same shape.
 */
export interface MockListing {
  id: string;
  slug: string;
  make: string;
  model: string;
  trim?: string;
  year: number;
  kms: number;
  priceAED: number;
  bodyType: string;
  fuel: string;
  transmission: string;
  regionalSpec: string;
  exteriorColor: string;
  emirate: string;
  dealer: {
    id: string;
    slug: string;
    name: string;
    isVerified: boolean;
    rating: number;
    reviewCount: number;
  };
  isFeatured: boolean;
  isInspected: boolean;
  isExportReady: boolean;
  isNew: boolean;
  status: "active" | "reserved" | "sold";
  imageUrl: string;
  imageUrls: string[];
  description: string;
  features: string[];
}

/**
 * Verified-working Unsplash car photos. Each ID has been HEAD-checked to return
 * HTTP 200. Update this list if a photo is removed upstream.
 */
const u = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;

const STOCK_PHOTOS: Record<string, string> = {
  // SUV — Toyota Land Cruiser (white off-roader)
  "Toyota Land Cruiser": u("1583121274602-3e2820c69888"),
  // SUV — Nissan Patrol (silver SUV)
  "Nissan Patrol": u("1593941707882-a5bba14938c7"),
  // SUV/coupe — Mercedes G63 / AMG yellow
  "Mercedes-Benz G63": u("1605559424843-9e4c228bf1c2"),
  // Coupe — BMW M4
  "BMW M4": u("1555215695-3004980ad54e"),
  // SUV — Porsche Cayenne (dark Porsche)
  "Porsche Cayenne Turbo": u("1606664515524-ed2f786a0bd6"),
  // Coupe — Porsche 911
  "Porsche 911 Carrera S": u("1503376780353-7e6692767b70"),
  Porsche: u("1503376780353-7e6692767b70"),
  // SUV — Range Rover
  "Land Rover Range Rover": u("1494976388531-d1058494cdd8"),
  "Land Rover": u("1494976388531-d1058494cdd8"),
  // SUV — Lexus LX 600
  "Lexus LX 600": u("1568844293986-8d0400bd4745"),
  Lexus: u("1568844293986-8d0400bd4745"),
  // Pickup — Toyota Hilux
  "Toyota Hilux": u("1565891741441-64926e441838"),
  // Coupe — Ford Mustang
  "Ford Mustang": u("1567808291548-fc3ee04dbcf0"),
  // Wagon — Audi RS6
  "Audi RS6": u("1606220588913-b3aacb4d2f46"),
  Audi: u("1606220588913-b3aacb4d2f46"),

  // Generic make fallbacks
  Toyota: u("1621007947382-bb3c3994e3fb"),
  Nissan: u("1612825173281-9a193378527e"),
  "Mercedes-Benz": u("1605559424843-9e4c228bf1c2"),
  BMW: u("1555215695-3004980ad54e"),
  Ford: u("1567808291548-fc3ee04dbcf0"),

  // Last-resort default
  default: u("1568605114967-8130f3a36994"),
};

function img(make: string, model: string) {
  return (
    STOCK_PHOTOS[`${make} ${model}`] ||
    STOCK_PHOTOS[make] ||
    STOCK_PHOTOS.default
  );
}

export const mockListings: MockListing[] = [
  {
    id: "L-001",
    slug: "2023-toyota-land-cruiser-vxr-gcc",
    make: "Toyota",
    model: "Land Cruiser",
    trim: "VXR 3.5 Twin Turbo",
    year: 2023,
    kms: 18500,
    priceAED: 385000,
    bodyType: "SUV",
    fuel: "Petrol",
    transmission: "Automatic",
    regionalSpec: "GCC",
    exteriorColor: "Pearl White",
    emirate: "Dubai",
    dealer: {
      id: "D-01",
      slug: "al-futtaim-motors",
      name: "Al Futtaim Motors",
      isVerified: true,
      rating: 4.8,
      reviewCount: 412,
    },
    isFeatured: true,
    isInspected: true,
    isExportReady: true,
    isNew: false,
    status: "active",
    imageUrl: img("Toyota", "Land Cruiser"),
    imageUrls: [img("Toyota", "Land Cruiser")],
    description:
      "Single owner, full service history at Al Futtaim, factory warranty until 2026. GCC spec, pearl white over chestnut leather.",
    features: ["Sunroof", "360 Camera", "Heads-up Display", "Apple CarPlay", "Adaptive Cruise"],
  },
  {
    id: "L-002",
    slug: "2022-mercedes-benz-g63-amg-european",
    make: "Mercedes-Benz",
    model: "G63",
    trim: "AMG 4.0L V8 BiTurbo",
    year: 2022,
    kms: 12200,
    priceAED: 895000,
    bodyType: "SUV",
    fuel: "Petrol",
    transmission: "Automatic",
    regionalSpec: "European",
    exteriorColor: "Obsidian Black",
    emirate: "Abu Dhabi",
    dealer: {
      id: "D-02",
      slug: "project-one-motors",
      name: "Project One Motors",
      isVerified: true,
      rating: 4.9,
      reviewCount: 268,
    },
    isFeatured: true,
    isInspected: true,
    isExportReady: true,
    isNew: false,
    status: "active",
    imageUrl: img("Mercedes-Benz", "G63"),
    imageUrls: [img("Mercedes-Benz", "G63")],
    description:
      "G63 AMG with full Designo interior, carbon trim, AMG performance exhaust. Imported European spec, ready for export.",
    features: ["AMG Performance", "Designo Interior", "Carbon Trim", "Burmester 3D"],
  },
  {
    id: "L-003",
    slug: "2024-porsche-cayenne-turbo-gcc",
    make: "Porsche",
    model: "Cayenne Turbo",
    trim: "4.0 V8 BiTurbo",
    year: 2024,
    kms: 4800,
    priceAED: 620000,
    bodyType: "SUV",
    fuel: "Petrol",
    transmission: "Automatic",
    regionalSpec: "GCC",
    exteriorColor: "Carrara White",
    emirate: "Sharjah",
    dealer: {
      id: "D-03",
      slug: "approved-automotive",
      name: "Approved Automotive",
      isVerified: true,
      rating: 4.7,
      reviewCount: 524,
    },
    isFeatured: false,
    isInspected: true,
    isExportReady: false,
    isNew: true,
    status: "active",
    imageUrl: img("Porsche", "911"),
    imageUrls: [img("Porsche", "911")],
    description:
      "Almost new Porsche Cayenne Turbo, balance of factory warranty and service. GCC spec, pristine condition.",
    features: ["PASM", "Sport Chrono", "BOSE Surround", "Panorama Roof"],
  },
  {
    id: "L-004",
    slug: "2023-nissan-patrol-platinum-gcc",
    make: "Nissan",
    model: "Patrol",
    trim: "Platinum 5.6 V8",
    year: 2023,
    kms: 22000,
    priceAED: 285000,
    bodyType: "SUV",
    fuel: "Petrol",
    transmission: "Automatic",
    regionalSpec: "GCC",
    exteriorColor: "Galaxy Black",
    emirate: "Dubai",
    dealer: {
      id: "D-01",
      slug: "al-futtaim-motors",
      name: "Al Futtaim Motors",
      isVerified: true,
      rating: 4.8,
      reviewCount: 412,
    },
    isFeatured: false,
    isInspected: true,
    isExportReady: true,
    isNew: false,
    status: "active",
    imageUrl: img("Nissan", "Patrol"),
    imageUrls: [img("Nissan", "Patrol")],
    description:
      "Patrol Platinum top trim, full options, immaculate condition. Popular export model to Africa.",
    features: ["Around View Monitor", "Cooled Seats", "Rear Entertainment", "Bose Audio"],
  },
  {
    id: "L-005",
    slug: "2022-bmw-m4-competition-gcc",
    make: "BMW",
    model: "M4",
    trim: "Competition xDrive",
    year: 2022,
    kms: 15800,
    priceAED: 395000,
    bodyType: "Coupe",
    fuel: "Petrol",
    transmission: "Automatic",
    regionalSpec: "GCC",
    exteriorColor: "Sao Paulo Yellow",
    emirate: "Dubai",
    dealer: {
      id: "D-04",
      slug: "elite-motors-dxb",
      name: "Elite Motors DXB",
      isVerified: true,
      rating: 4.6,
      reviewCount: 187,
    },
    isFeatured: true,
    isInspected: false,
    isExportReady: false,
    isNew: false,
    status: "active",
    imageUrl: img("BMW", "M4"),
    imageUrls: [img("BMW", "M4")],
    description:
      "BMW M4 Competition xDrive in striking Sao Paulo Yellow. Full M Performance package.",
    features: ["M Carbon Bucket Seats", "M Driver's Package", "Harman Kardon", "M Performance Exhaust"],
  },
  {
    id: "L-006",
    slug: "2023-range-rover-autobiography-european",
    make: "Land Rover",
    model: "Range Rover",
    trim: "Autobiography LWB",
    year: 2023,
    kms: 8200,
    priceAED: 745000,
    bodyType: "SUV",
    fuel: "Petrol",
    transmission: "Automatic",
    regionalSpec: "European",
    exteriorColor: "Santorini Black",
    emirate: "Abu Dhabi",
    dealer: {
      id: "D-02",
      slug: "project-one-motors",
      name: "Project One Motors",
      isVerified: true,
      rating: 4.9,
      reviewCount: 268,
    },
    isFeatured: false,
    isInspected: true,
    isExportReady: true,
    isNew: false,
    status: "reserved",
    imageUrl: img("Range Rover", ""),
    imageUrls: [img("Range Rover", "")],
    description:
      "New shape Range Rover Autobiography LWB. Executive rear seating, panoramic roof, full options.",
    features: ["Executive Rear Seats", "Massage Seats", "Meridian Signature", "Panoramic Roof"],
  },
  {
    id: "L-007",
    slug: "2024-toyota-hilux-adventure-gcc",
    make: "Toyota",
    model: "Hilux",
    trim: "Adventure 4.0 V6",
    year: 2024,
    kms: 6500,
    priceAED: 145000,
    bodyType: "Pickup",
    fuel: "Petrol",
    transmission: "Automatic",
    regionalSpec: "GCC",
    exteriorColor: "Attitude Black",
    emirate: "Sharjah",
    dealer: {
      id: "D-03",
      slug: "approved-automotive",
      name: "Approved Automotive",
      isVerified: true,
      rating: 4.7,
      reviewCount: 524,
    },
    isFeatured: false,
    isInspected: true,
    isExportReady: true,
    isNew: true,
    status: "active",
    imageUrl: img("Toyota", "Hilux"),
    imageUrls: [img("Toyota", "Hilux")],
    description:
      "Toyota Hilux Adventure 4x4, top spec with full options. Africa's most-imported pickup.",
    features: ["Bed Liner", "Tow Hitch", "Off-road Pack", "JBL Audio"],
  },
  {
    id: "L-008",
    slug: "2022-ford-mustang-gt-5-0-gcc",
    make: "Ford",
    model: "Mustang",
    trim: "GT 5.0 Premium",
    year: 2022,
    kms: 24000,
    priceAED: 175000,
    bodyType: "Coupe",
    fuel: "Petrol",
    transmission: "Automatic",
    regionalSpec: "GCC",
    exteriorColor: "Race Red",
    emirate: "Dubai",
    dealer: {
      id: "D-04",
      slug: "elite-motors-dxb",
      name: "Elite Motors DXB",
      isVerified: true,
      rating: 4.6,
      reviewCount: 187,
    },
    isFeatured: false,
    isInspected: false,
    isExportReady: false,
    isNew: false,
    status: "active",
    imageUrl: img("Ford", "Mustang"),
    imageUrls: [img("Ford", "Mustang")],
    description:
      "Mustang GT Premium with active exhaust, magnetic ride control, Recaro seats.",
    features: ["Active Exhaust", "MagneRide", "Recaro Seats", "12-inch Digital Cluster"],
  },
  {
    id: "L-009",
    slug: "2023-lexus-lx-600-vip-gcc",
    make: "Lexus",
    model: "LX 600",
    trim: "VIP 4-Seat",
    year: 2023,
    kms: 11500,
    priceAED: 695000,
    bodyType: "SUV",
    fuel: "Petrol",
    transmission: "Automatic",
    regionalSpec: "GCC",
    exteriorColor: "Sonic Quartz",
    emirate: "Dubai",
    dealer: {
      id: "D-05",
      slug: "lexus-platinum",
      name: "Lexus Platinum Dubai",
      isVerified: true,
      rating: 4.9,
      reviewCount: 198,
    },
    isFeatured: true,
    isInspected: true,
    isExportReady: true,
    isNew: false,
    status: "active",
    imageUrl: img("Lexus", "LX"),
    imageUrls: [img("Lexus", "LX")],
    description:
      "Lexus LX 600 VIP 4-seat configuration, executive rear lounge with refrigerator, Mark Levinson surround.",
    features: ["VIP 4-seat", "Rear Refrigerator", "Mark Levinson", "Massage Seats"],
  },
  {
    id: "L-010",
    slug: "2024-audi-rs6-avant-european",
    make: "Audi",
    model: "RS6",
    trim: "Avant Performance",
    year: 2024,
    kms: 3200,
    priceAED: 685000,
    bodyType: "Wagon",
    fuel: "Petrol",
    transmission: "Automatic",
    regionalSpec: "European",
    exteriorColor: "Nardo Grey",
    emirate: "Abu Dhabi",
    dealer: {
      id: "D-06",
      slug: "ag-performance",
      name: "AG Performance",
      isVerified: true,
      rating: 4.8,
      reviewCount: 142,
    },
    isFeatured: false,
    isInspected: true,
    isExportReady: false,
    isNew: true,
    status: "active",
    imageUrl: img("Audi", "RS"),
    imageUrls: [img("Audi", "RS")],
    description:
      "Brand new Audi RS6 Avant Performance, ceramic brakes, dynamic package plus.",
    features: ["Ceramic Brakes", "Dynamic Plus", "B&O Advanced", "RS Design Pack"],
  },
  {
    id: "L-011",
    slug: "2023-toyota-land-cruiser-gr-sport-gcc",
    make: "Toyota",
    model: "Land Cruiser",
    trim: "GR Sport 3.5 Twin Turbo",
    year: 2023,
    kms: 14500,
    priceAED: 415000,
    bodyType: "SUV",
    fuel: "Petrol",
    transmission: "Automatic",
    regionalSpec: "GCC",
    exteriorColor: "Volcanic Red",
    emirate: "Dubai",
    dealer: {
      id: "D-01",
      slug: "al-futtaim-motors",
      name: "Al Futtaim Motors",
      isVerified: true,
      rating: 4.8,
      reviewCount: 412,
    },
    isFeatured: true,
    isInspected: true,
    isExportReady: true,
    isNew: false,
    status: "active",
    imageUrl: img("Toyota", "Land Cruiser"),
    imageUrls: [img("Toyota", "Land Cruiser")],
    description:
      "Land Cruiser GR Sport, performance-tuned variant. Bilstein dampers, e-KDSS, GR aero kit.",
    features: ["GR Sport Pack", "e-KDSS", "Bilstein Suspension", "GR Interior"],
  },
  {
    id: "L-012",
    slug: "2024-porsche-911-carrera-s-european",
    make: "Porsche",
    model: "911 Carrera S",
    trim: "Carrera S Coupe",
    year: 2024,
    kms: 2100,
    priceAED: 825000,
    bodyType: "Coupe",
    fuel: "Petrol",
    transmission: "Automatic",
    regionalSpec: "European",
    exteriorColor: "GT Silver",
    emirate: "Dubai",
    dealer: {
      id: "D-06",
      slug: "ag-performance",
      name: "AG Performance",
      isVerified: true,
      rating: 4.8,
      reviewCount: 142,
    },
    isFeatured: false,
    isInspected: true,
    isExportReady: true,
    isNew: true,
    status: "active",
    imageUrl: img("Porsche", "911"),
    imageUrls: [img("Porsche", "911")],
    description:
      "Almost new 911 Carrera S, Sport Chrono, Sport Exhaust, full leather interior.",
    features: ["Sport Chrono", "Sport Exhaust", "PASM", "Burmester High-End"],
  },
];

export const mockDealers = [
  {
    id: "D-01",
    slug: "al-futtaim-motors",
    name: "Al Futtaim Motors",
    tagline: "Authorised Toyota, Lexus dealer in the UAE since 1955.",
    logoUrl: "https://api.dicebear.com/9.x/initials/svg?seed=AF&backgroundColor=D4AF37",
    coverUrl: "",
    emirate: "Dubai",
    rating: 4.8,
    reviewCount: 412,
    listingCount: 1240,
    isVerified: true,
    isFeatured: true,
  },
  {
    id: "D-02",
    slug: "project-one-motors",
    name: "Project One Motors",
    tagline: "Luxury and exotic European imports.",
    logoUrl: "https://api.dicebear.com/9.x/initials/svg?seed=PO&backgroundColor=0B3B2E",
    coverUrl: "",
    emirate: "Abu Dhabi",
    rating: 4.9,
    reviewCount: 268,
    listingCount: 320,
    isVerified: true,
    isFeatured: true,
  },
  {
    id: "D-03",
    slug: "approved-automotive",
    name: "Approved Automotive",
    tagline: "Inspection-backed used cars at every price point.",
    logoUrl: "https://api.dicebear.com/9.x/initials/svg?seed=AA&backgroundColor=C97B45",
    coverUrl: "",
    emirate: "Sharjah",
    rating: 4.7,
    reviewCount: 524,
    listingCount: 880,
    isVerified: true,
    isFeatured: false,
  },
  {
    id: "D-04",
    slug: "elite-motors-dxb",
    name: "Elite Motors DXB",
    tagline: "Sports cars, M-cars, and tuner specials.",
    logoUrl: "https://api.dicebear.com/9.x/initials/svg?seed=EM&backgroundColor=16A34A",
    coverUrl: "",
    emirate: "Dubai",
    rating: 4.6,
    reviewCount: 187,
    listingCount: 145,
    isVerified: true,
    isFeatured: false,
  },
  {
    id: "D-05",
    slug: "lexus-platinum",
    name: "Lexus Platinum Dubai",
    tagline: "Certified Lexus pre-owned with extended warranty.",
    logoUrl: "https://api.dicebear.com/9.x/initials/svg?seed=LP&backgroundColor=D4AF37",
    coverUrl: "",
    emirate: "Dubai",
    rating: 4.9,
    reviewCount: 198,
    listingCount: 210,
    isVerified: true,
    isFeatured: true,
  },
  {
    id: "D-06",
    slug: "ag-performance",
    name: "AG Performance",
    tagline: "Audi, Porsche, BMW performance specialists.",
    logoUrl: "https://api.dicebear.com/9.x/initials/svg?seed=AG&backgroundColor=F0CE5C",
    coverUrl: "",
    emirate: "Abu Dhabi",
    rating: 4.8,
    reviewCount: 142,
    listingCount: 180,
    isVerified: true,
    isFeatured: false,
  },
];

export function findListingBySlug(slug: string) {
  return mockListings.find((l) => l.slug === slug);
}

export function findListingById(id: string) {
  return mockListings.find((l) => l.id === id);
}

export function findDealerBySlug(slug: string) {
  return mockDealers.find((d) => d.slug === slug);
}
