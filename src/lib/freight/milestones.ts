/**
 * THE MILESTONE TAXONOMY — country-neutral keys, country-specific labels.
 *
 * This is the file that makes "UAE first, multi-country ready" real. A
 * shipment's stages are the same everywhere in substance: the car is collected,
 * it is de-registered, it clears export customs, it is loaded, it sails, it
 * lands, it clears import, it is delivered. What differs per country is the
 * NAME of the paperwork:
 *
 *     export_deregistration   AE -> "RTA Export Certificate"
 *                             JP -> "Export Certificate (輸出抹消)"
 *                             DE -> "Ausfuhrkennzeichen"
 *
 * So code always speaks the neutral key, and only the label lookup is
 * localised. Adding a market means adding labels, never touching the state
 * machine.
 *
 * No "server-only" here — the buyer's progress tracker renders these labels in
 * a client component, and this module holds nothing but constants.
 */

export type MilestoneKey =
  | "booking_confirmed"
  | "vehicle_collected"
  | "obligations_cleared"
  | "export_inspection"
  | "export_deregistration"
  | "export_customs_declaration"
  | "vin_verification"
  | "gate_in"
  | "loaded_on_board"
  | "vessel_departed"
  | "transshipment"
  | "vessel_arrived"
  | "import_customs"
  | "duty_paid"
  | "cargo_released"
  | "delivered";

export type ShipmentStatus =
  | "booked"
  | "collected"
  | "export_clearance"
  | "at_origin_port"
  | "loaded"
  | "in_transit"
  | "arrived"
  | "import_clearance"
  | "released"
  | "delivered"
  | "cancelled";

export interface MilestoneDef {
  key: MilestoneKey;
  /** DCSA-style category, so carrier feeds can map straight onto these. */
  category: "SHIPMENT" | "TRANSPORT" | "EQUIPMENT";
  /** Neutral wording used when a country has no override. */
  label: string;
  /** Short line explaining what actually happens, shown to the buyer. */
  description: string;
  /** Country-specific names for the same real-world step. */
  labelByCountry?: Record<string, string>;
  /** The projected shipment status once this is recorded as ACT. */
  projects: ShipmentStatus;
  /** Shown on the buyer's simplified tracker (vs the forwarder's full list). */
  buyerVisible: boolean;
  /** Only applies to containerised cargo — RO-RO has no container to stuff. */
  containerOnly?: boolean;
  /** Documents that normally appear at this step. */
  documents?: string[];
}

/**
 * Ordered. Index in this array is the canonical sequence for progress bars.
 */
export const MILESTONES: MilestoneDef[] = [
  {
    key: "booking_confirmed",
    category: "SHIPMENT",
    label: "Booking confirmed",
    description: "Space booked with the carrier and a booking number issued.",
    projects: "booked",
    buyerVisible: true,
  },
  {
    key: "vehicle_collected",
    category: "EQUIPMENT",
    label: "Vehicle collected",
    description: "Car picked up from the seller and moved to the export yard.",
    projects: "collected",
    buyerVisible: true,
  },
  {
    key: "obligations_cleared",
    category: "SHIPMENT",
    label: "Fines and finance cleared",
    description:
      "Outstanding tolls, traffic fines and any finance settled so the car can be de-registered.",
    labelByCountry: { AE: "Salik, fines and bank NOC cleared" },
    projects: "collected",
    buyerVisible: false,
  },
  {
    key: "export_inspection",
    category: "EQUIPMENT",
    label: "Export inspection",
    description: "Technical inspection required before export plates issue.",
    labelByCountry: { AE: "Tasjeel export inspection" },
    projects: "export_clearance",
    buyerVisible: false,
  },
  {
    key: "export_deregistration",
    category: "SHIPMENT",
    label: "Export certificate issued",
    description:
      "Vehicle de-registered from the origin country and plates surrendered.",
    labelByCountry: {
      AE: "RTA Export Certificate issued",
      JP: "Export Certificate issued",
      DE: "Ausfuhrkennzeichen issued",
      GB: "V5C export notification",
    },
    projects: "export_clearance",
    buyerVisible: true,
    documents: ["export_certificate"],
  },
  {
    key: "export_customs_declaration",
    category: "SHIPMENT",
    label: "Export customs declaration filed",
    description: "Customs export declaration lodged electronically.",
    labelByCountry: {
      AE: "Mirsal 2 declaration filed",
      DE: "EAD / MRN issued",
      JP: "Export permit issued",
    },
    projects: "export_clearance",
    buyerVisible: true,
    documents: ["customs_export_declaration"],
  },
  {
    key: "vin_verification",
    category: "EQUIPMENT",
    label: "Chassis / VIN verified",
    description:
      "Customs confirms the VIN on the car matches the declared paperwork.",
    projects: "export_clearance",
    buyerVisible: false,
  },
  {
    key: "gate_in",
    category: "EQUIPMENT",
    label: "Delivered to port",
    description: "Vehicle accepted at the terminal ahead of the sailing cut-off.",
    projects: "at_origin_port",
    buyerVisible: true,
  },
  {
    key: "loaded_on_board",
    category: "EQUIPMENT",
    label: "Loaded on board",
    description:
      "Vehicle loaded and the shipped-on-board Bill of Lading issued.",
    projects: "loaded",
    buyerVisible: true,
    documents: ["bill_of_lading"],
  },
  {
    key: "vessel_departed",
    category: "TRANSPORT",
    label: "Vessel departed",
    description: "The ship has sailed from the origin port.",
    projects: "in_transit",
    buyerVisible: true,
  },
  {
    key: "transshipment",
    category: "TRANSPORT",
    label: "Transshipment",
    description: "Cargo transferred to an onward vessel at a hub port.",
    projects: "in_transit",
    buyerVisible: false,
  },
  {
    key: "vessel_arrived",
    category: "TRANSPORT",
    label: "Arrived at destination",
    description: "The ship has docked at the destination port.",
    projects: "arrived",
    buyerVisible: true,
  },
  {
    key: "import_customs",
    category: "SHIPMENT",
    label: "Import clearance started",
    description: "Destination customs entry filed for the vehicle.",
    projects: "import_clearance",
    buyerVisible: true,
  },
  {
    key: "duty_paid",
    category: "SHIPMENT",
    label: "Duty and taxes paid",
    description: "Import duty, excise and VAT settled at destination.",
    projects: "import_clearance",
    buyerVisible: true,
  },
  {
    key: "cargo_released",
    category: "SHIPMENT",
    label: "Released from port",
    description:
      "Delivery order issued against the Bill of Lading and the car released.",
    projects: "released",
    buyerVisible: true,
  },
  {
    key: "delivered",
    category: "EQUIPMENT",
    label: "Delivered",
    description: "Vehicle handed over to the buyer at the final address.",
    projects: "delivered",
    buyerVisible: true,
  },
];

const BY_KEY = new Map(MILESTONES.map((m) => [m.key, m]));

export function getMilestone(key: string): MilestoneDef | undefined {
  return BY_KEY.get(key as MilestoneKey);
}

/** The label for a milestone in a given origin country. */
export function milestoneLabel(key: string, countryCode = "AE"): string {
  const def = BY_KEY.get(key as MilestoneKey);
  if (!def) return key.replace(/_/g, " ");
  return def.labelByCountry?.[countryCode] ?? def.label;
}

/** Milestones applicable to a mode — RO-RO skips container-only steps. */
export function milestonesForMode(mode: string): MilestoneDef[] {
  const containerised = mode.startsWith("container");
  return MILESTONES.filter((m) => !m.containerOnly || containerised);
}

/** The buyer's simplified tracker. */
export function buyerMilestones(mode: string): MilestoneDef[] {
  return milestonesForMode(mode).filter((m) => m.buyerVisible);
}

export const SHIPMENT_STATUS_LABEL: Record<ShipmentStatus, string> = {
  booked: "Booked",
  collected: "Collected",
  export_clearance: "Export clearance",
  at_origin_port: "At origin port",
  loaded: "Loaded",
  in_transit: "In transit",
  arrived: "Arrived",
  import_clearance: "Import clearance",
  released: "Released",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/**
 * Incoterm responsibility. Decides whose task queue a cost lands in and
 * whether the buyer sees freight as a separate line or baked into the price.
 */
export const INCOTERM_INFO: Record<
  string,
  { label: string; sellerPaysFreight: boolean; sellerPaysDuty: boolean; note: string }
> = {
  EXW: {
    label: "Ex Works",
    sellerPaysFreight: false,
    sellerPaysDuty: false,
    note: "Buyer arranges everything from the seller's door.",
  },
  FOB: {
    label: "Free On Board",
    sellerPaysFreight: false,
    sellerPaysDuty: false,
    note: "Seller delivers to the ship; buyer pays ocean freight onward.",
  },
  CFR: {
    label: "Cost and Freight",
    sellerPaysFreight: true,
    sellerPaysDuty: false,
    note: "Freight included. Risk still passes at the origin port.",
  },
  CIF: {
    label: "Cost, Insurance and Freight",
    sellerPaysFreight: true,
    sellerPaysDuty: false,
    note: "Freight and marine insurance included; buyer clears import.",
  },
  DAP: {
    label: "Delivered At Place",
    sellerPaysFreight: true,
    sellerPaysDuty: false,
    note: "Delivered to the destination address; buyer pays import duty.",
  },
  DDP: {
    label: "Delivered Duty Paid",
    sellerPaysFreight: true,
    sellerPaysDuty: true,
    note: "Everything included, duty as well. Quote duty carefully.",
  },
};
