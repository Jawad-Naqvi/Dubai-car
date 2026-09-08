/**
 * LANDED COST — what the car actually costs to get on the road at destination.
 *
 * "How much to my country, all in?" is the first question every export buyer
 * asks, and answering it over WhatsApp is what keeps these deals slow and
 * off-platform. Vehicle price is often less than half the final number: Kenya
 * adds import duty, excise and VAT on a customs value that is itself computed
 * from CIF, and Nigeria's levies can exceed the car.
 *
 * DESIGN: duty regimes are DATA (see DUTY_RULES), not branches. Adding a
 * market is one object. Every rule carries the basis it applies to, because
 * getting that wrong is the classic error — most countries tax on CIF, and
 * several apply excise on top of duty rather than alongside it.
 *
 * HONESTY: this is an ESTIMATE. Real duty depends on the customs valuation a
 * destination assigns (often a depreciated book value, not the invoice), on
 * engine size and age bands, and on whatever a clearing agent charges. Every
 * result carries `confidence` and `caveats`, and the UI shows them — an
 * estimate presented as a certainty is worse than no estimate.
 *
 * No "server-only": the calculator is pure arithmetic and runs in the browser
 * so the figure updates as the buyer types.
 */

export type DutyBasis = "cif" | "customs_value" | "duty_inclusive";

export interface DutyComponent {
  /** Shown to the buyer, e.g. "Import duty". */
  label: string;
  /** Fraction, e.g. 0.25 for 25%. */
  rate: number;
  /**
   * What the percentage applies to:
   *  cif             — vehicle + freight + insurance
   *  customs_value   — the depreciated value the customs authority assigns
   *  duty_inclusive  — CIF plus every component already accumulated (excise
   *                    and VAT usually stack this way)
   */
  basis: DutyBasis;
  note?: string;
}

export interface DutyRule {
  countryCode: string;
  countryName: string;
  currency: string;
  components: DutyComponent[];
  /**
   * Typical port/clearing/agent charges at destination, in USD, excluding
   * duty. Ranges vary by agent; this is a mid-market figure.
   */
  clearanceUSD: number;
  /** Mandatory pre-shipment inspection regime, if any. */
  inspection?: { name: string; approxUSD: number; note: string };
  /**
   * Customs frequently values a used car below its purchase price using a
   * depreciation schedule. 0.7 means "assume 70% of CIF is assessed".
   */
  customsValueFactor?: number;
  ageLimitYears?: number;
  rightHandDriveOnly?: boolean;
  confidence: "high" | "medium" | "low";
  caveats: string[];
}

/**
 * Duty regimes for the corridors UAE exporters actually serve.
 * Rates are indicative and should be reviewed against the destination customs
 * tariff before being quoted commercially.
 */
export const DUTY_RULES: Record<string, DutyRule> = {
  KE: {
    countryCode: "KE",
    countryName: "Kenya",
    currency: "KES",
    components: [
      { label: "Import duty", rate: 0.25, basis: "customs_value" },
      {
        label: "Excise duty",
        rate: 0.2,
        basis: "duty_inclusive",
        note: "Charged on customs value plus import duty.",
      },
      {
        label: "VAT",
        rate: 0.16,
        basis: "duty_inclusive",
        note: "Charged on customs value plus duty and excise.",
      },
      { label: "IDF / RDL", rate: 0.035, basis: "customs_value" },
    ],
    clearanceUSD: 600,
    inspection: {
      name: "QISJ / KEBS pre-shipment inspection",
      approxUSD: 200,
      note: "Required before loading. Skipping it means inspection at destination plus a penalty.",
    },
    customsValueFactor: 0.75,
    ageLimitYears: 8,
    rightHandDriveOnly: true,
    confidence: "medium",
    caveats: [
      "Kenya applies an 8-year age limit and accepts right-hand-drive only.",
      "KRA assesses duty on its own Current Retail Selling Price schedule, not your invoice.",
    ],
  },
  TZ: {
    countryCode: "TZ",
    countryName: "Tanzania",
    currency: "TZS",
    components: [
      { label: "Import duty", rate: 0.25, basis: "customs_value" },
      { label: "Excise duty", rate: 0.1, basis: "duty_inclusive" },
      { label: "VAT", rate: 0.18, basis: "duty_inclusive" },
    ],
    clearanceUSD: 550,
    inspection: {
      name: "TBS pre-shipment inspection",
      approxUSD: 200,
      note: "Required by Tanzania Bureau of Standards before shipment.",
    },
    customsValueFactor: 0.75,
    ageLimitYears: 10,
    rightHandDriveOnly: true,
    confidence: "medium",
    caveats: [
      "Excise rises steeply above 2000cc — verify engine size banding.",
      "Vehicles over 10 years attract an additional excise charge.",
    ],
  },
  UG: {
    countryCode: "UG",
    countryName: "Uganda",
    currency: "UGX",
    components: [
      { label: "Import duty", rate: 0.25, basis: "customs_value" },
      { label: "Excise duty", rate: 0.1, basis: "duty_inclusive" },
      { label: "VAT", rate: 0.18, basis: "duty_inclusive" },
      { label: "Withholding tax", rate: 0.06, basis: "customs_value" },
    ],
    clearanceUSD: 600,
    customsValueFactor: 0.75,
    ageLimitYears: 15,
    rightHandDriveOnly: true,
    confidence: "low",
    caveats: [
      "Environmental levy applies to older vehicles and varies by age band.",
      "Landlocked: budget inland haulage from Mombasa or Dar es Salaam.",
    ],
  },
  NG: {
    countryCode: "NG",
    countryName: "Nigeria",
    currency: "NGN",
    components: [
      { label: "Import duty", rate: 0.2, basis: "cif" },
      { label: "NAC levy", rate: 0.15, basis: "cif" },
      { label: "VAT", rate: 0.075, basis: "duty_inclusive" },
      { label: "ETLS levy", rate: 0.005, basis: "cif" },
    ],
    clearanceUSD: 900,
    inspection: {
      name: "SONCAP (Cotecna)",
      approxUSD: 350,
      note: "Product certificate required before shipment; no SONCAP means no clearance.",
    },
    ageLimitYears: 12,
    confidence: "low",
    caveats: [
      "Nigerian customs valuation and FX rate used for assessment move frequently.",
      "Terminal and demurrage charges at Lagos are a material additional cost.",
    ],
  },
  GH: {
    countryCode: "GH",
    countryName: "Ghana",
    currency: "GHS",
    components: [
      { label: "Import duty", rate: 0.2, basis: "cif" },
      { label: "VAT", rate: 0.15, basis: "duty_inclusive" },
      { label: "NHIL / GETFund", rate: 0.05, basis: "duty_inclusive" },
    ],
    clearanceUSD: 700,
    customsValueFactor: 0.8,
    confidence: "low",
    caveats: [
      "An age-based penalty applies to vehicles over 10 years.",
    ],
  },
  ZA: {
    countryCode: "ZA",
    countryName: "South Africa",
    currency: "ZAR",
    components: [
      { label: "Import duty", rate: 0.25, basis: "cif" },
      { label: "Ad valorem excise", rate: 0.07, basis: "cif" },
      { label: "VAT", rate: 0.15, basis: "duty_inclusive" },
    ],
    clearanceUSD: 700,
    confidence: "low",
    caveats: [
      "Used-vehicle imports require an ITAC permit and are heavily restricted.",
      "Most used imports are only permitted for returning residents or immigrants.",
    ],
  },
  IN: {
    countryCode: "IN",
    countryName: "India",
    currency: "INR",
    components: [
      {
        label: "Basic customs duty",
        rate: 1.0,
        basis: "cif",
        note: "Used cars attract roughly 100% BCD.",
      },
      { label: "Social welfare surcharge", rate: 0.1, basis: "duty_inclusive" },
      { label: "IGST", rate: 0.28, basis: "duty_inclusive" },
      { label: "Compensation cess", rate: 0.17, basis: "duty_inclusive" },
    ],
    clearanceUSD: 800,
    ageLimitYears: 3,
    rightHandDriveOnly: true,
    confidence: "medium",
    caveats: [
      "India permits used-car import only through Mumbai and only under strict conditions.",
      "Effective total tax commonly exceeds 150% — verify before committing.",
      "Right-hand drive, under 3 years old, and speedometer in km/h are required.",
    ],
  },
  PK: {
    countryCode: "PK",
    countryName: "Pakistan",
    currency: "PKR",
    components: [
      { label: "Customs duty", rate: 0.5, basis: "cif" },
      { label: "Sales tax", rate: 0.18, basis: "duty_inclusive" },
      { label: "Withholding tax", rate: 0.06, basis: "duty_inclusive" },
    ],
    clearanceUSD: 700,
    ageLimitYears: 3,
    rightHandDriveOnly: true,
    confidence: "low",
    caveats: [
      "Import is largely limited to gift, baggage and transfer-of-residence schemes.",
      "Duty is assessed on engine-size slabs with fixed USD amounts, not purely ad valorem.",
    ],
  },
  IQ: {
    countryCode: "IQ",
    countryName: "Iraq",
    currency: "IQD",
    components: [
      { label: "Customs duty", rate: 0.15, basis: "cif" },
      { label: "Reconstruction levy", rate: 0.05, basis: "cif" },
    ],
    clearanceUSD: 500,
    confidence: "low",
    caveats: ["Requirements vary between federal Iraq and the Kurdistan Region."],
  },
  SA: {
    countryCode: "SA",
    countryName: "Saudi Arabia",
    currency: "SAR",
    components: [
      { label: "Customs duty", rate: 0.05, basis: "cif" },
      { label: "VAT", rate: 0.15, basis: "duty_inclusive" },
    ],
    clearanceUSD: 400,
    confidence: "high",
    caveats: [
      "GCC-spec vehicles clear most easily; non-GCC spec may need modification.",
      "Vehicles must generally be under 5 years old.",
    ],
  },
  OM: {
    countryCode: "OM",
    countryName: "Oman",
    currency: "OMR",
    components: [
      { label: "Customs duty", rate: 0.05, basis: "cif" },
      { label: "VAT", rate: 0.05, basis: "duty_inclusive" },
    ],
    clearanceUSD: 350,
    confidence: "high",
    caveats: ["Overland from the UAE is usually cheaper than sea freight."],
  },
  QA: {
    countryCode: "QA",
    countryName: "Qatar",
    currency: "QAR",
    components: [{ label: "Customs duty", rate: 0.05, basis: "cif" }],
    clearanceUSD: 400,
    confidence: "high",
    caveats: ["No VAT on vehicle imports at present."],
  },
  KW: {
    countryCode: "KW",
    countryName: "Kuwait",
    currency: "KWD",
    components: [{ label: "Customs duty", rate: 0.05, basis: "cif" }],
    clearanceUSD: 400,
    confidence: "high",
    caveats: ["Vehicles over 5 years old face import restrictions."],
  },
  BH: {
    countryCode: "BH",
    countryName: "Bahrain",
    currency: "BHD",
    components: [
      { label: "Customs duty", rate: 0.05, basis: "cif" },
      { label: "VAT", rate: 0.1, basis: "duty_inclusive" },
    ],
    clearanceUSD: 350,
    confidence: "high",
    caveats: [],
  },
};

export interface LandedCostInput {
  /** Vehicle price in AED. */
  vehicleAED: number;
  /** Ocean freight in AED. Use a real quote when one exists. */
  freightAED: number;
  /** Marine insurance in AED. Defaults to 0.3% of vehicle value. */
  insuranceAED?: number;
  destCountry: string;
  /** Add the destination's pre-shipment inspection fee. */
  includeInspection?: boolean;
  /** AED per USD, for the USD-denominated clearance figures. */
  usdToAed?: number;
}

export interface LandedCostLine {
  label: string;
  amountAED: number;
  kind: "vehicle" | "freight" | "duty" | "service";
  note?: string;
}

export interface LandedCostResult {
  supported: boolean;
  countryName: string;
  lines: LandedCostLine[];
  cifAED: number;
  dutyTotalAED: number;
  totalAED: number;
  /** Duty and taxes as a share of the vehicle price — the headline shock. */
  dutyRatio: number;
  confidence: "high" | "medium" | "low";
  caveats: string[];
  restrictions: string[];
}

const DEFAULT_USD_AED = 3.6725; // AED is pegged to USD.

/**
 * Computes an itemised landed cost.
 *
 * Order matters: CIF first, then a customs value (which may be a depreciated
 * fraction of CIF), then components in declaration order — `duty_inclusive`
 * ones stack on everything accumulated so far, which is how excise and VAT
 * actually behave.
 */
export function calculateLandedCost(
  input: LandedCostInput,
): LandedCostResult {
  const rule = DUTY_RULES[input.destCountry?.toUpperCase()];
  const usdToAed = input.usdToAed ?? DEFAULT_USD_AED;

  const vehicle = Math.max(0, input.vehicleAED || 0);
  const freight = Math.max(0, input.freightAED || 0);
  const insurance =
    input.insuranceAED !== undefined
      ? Math.max(0, input.insuranceAED)
      : Math.round(vehicle * 0.003);

  const cif = vehicle + freight + insurance;

  const lines: LandedCostLine[] = [
    { label: "Vehicle price", amountAED: vehicle, kind: "vehicle" },
    { label: "Ocean freight", amountAED: freight, kind: "freight" },
    { label: "Marine insurance", amountAED: insurance, kind: "freight" },
  ];

  if (!rule) {
    return {
      supported: false,
      countryName: input.destCountry || "Unknown",
      lines,
      cifAED: cif,
      dutyTotalAED: 0,
      totalAED: cif,
      dutyRatio: 0,
      confidence: "low",
      caveats: [
        "We do not yet have a duty model for this destination. The figure above is CIF only and excludes import duty, taxes and clearance.",
      ],
      restrictions: [],
    };
  }

  const customsValue = Math.round(cif * (rule.customsValueFactor ?? 1));
  let accumulated = customsValue;
  let dutyTotal = 0;

  for (const c of rule.components) {
    const base =
      c.basis === "cif"
        ? cif
        : c.basis === "customs_value"
          ? customsValue
          : accumulated;
    const amount = Math.round(base * c.rate);
    dutyTotal += amount;
    // duty_inclusive components compound on everything charged so far.
    accumulated += amount;
    lines.push({
      label: `${c.label} (${(c.rate * 100).toFixed(c.rate < 0.1 ? 1 : 0)}%)`,
      amountAED: amount,
      kind: "duty",
      note: c.note,
    });
  }

  const clearance = Math.round(rule.clearanceUSD * usdToAed);
  lines.push({
    label: "Port handling & customs clearance",
    amountAED: clearance,
    kind: "service",
    note: "Typical agent charges at destination; varies by clearing agent.",
  });

  let inspection = 0;
  if (input.includeInspection && rule.inspection) {
    inspection = Math.round(rule.inspection.approxUSD * usdToAed);
    lines.push({
      label: rule.inspection.name,
      amountAED: inspection,
      kind: "service",
      note: rule.inspection.note,
    });
  }

  const total = cif + dutyTotal + clearance + inspection;

  const restrictions: string[] = [];
  if (rule.ageLimitYears) {
    restrictions.push(
      `${rule.countryName} restricts imports to vehicles under ${rule.ageLimitYears} years old.`,
    );
  }
  if (rule.rightHandDriveOnly) {
    restrictions.push(
      `${rule.countryName} accepts right-hand-drive vehicles only — most UAE stock is left-hand drive.`,
    );
  }
  if (rule.inspection && !input.includeInspection) {
    restrictions.push(
      `${rule.inspection.name} is required before loading and is not included above.`,
    );
  }

  return {
    supported: true,
    countryName: rule.countryName,
    lines,
    cifAED: cif,
    dutyTotalAED: dutyTotal,
    totalAED: total,
    dutyRatio: vehicle > 0 ? dutyTotal / vehicle : 0,
    confidence: rule.confidence,
    caveats: rule.caveats,
    restrictions,
  };
}

/** Destinations with a duty model, for the picker. */
export function supportedDestinations(): Array<{
  code: string;
  name: string;
  confidence: string;
}> {
  return Object.values(DUTY_RULES)
    .map((r) => ({
      code: r.countryCode,
      name: r.countryName,
      confidence: r.confidence,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Rough ocean freight when no real quote exists yet, so the calculator can
 * show something before the buyer raises an RFQ. Replaced by the real number
 * the moment a forwarder quotes.
 */
export function estimateFreightAED(
  destCountry: string,
  mode: "roro" | "container_fcl" | "container_lcl" = "roro",
): number {
  const base: Record<string, number> = {
    KE: 4800, TZ: 5000, UG: 6200, NG: 6500, GH: 6200, ZA: 5800,
    IN: 4200, PK: 3800, IQ: 4500, SA: 2200, OM: 1800, QA: 2000,
    KW: 2400, BH: 2000,
  };
  const roro = base[destCountry?.toUpperCase()] ?? 5000;
  if (mode === "container_fcl") return Math.round(roro * 1.7);
  if (mode === "container_lcl") return Math.round(roro * 1.25);
  return roro;
}
