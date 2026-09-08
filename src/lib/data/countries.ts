import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { countries, kycRequirements, identityDocuments } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import type { OrgType } from "@/lib/data/orgs";

/**
 * COUNTRY PACKS — how "UAE-first" stays "multi-country-ready".
 *
 * The UAE is the launch market and the only pack seeded. What makes a second
 * market cheap is that nothing here branches on the country: which documents a
 * party must supply, what they are called, and whether they need a two-sided
 * capture are all ROWS in kyc_requirements. Adding Japan is an INSERT, not a
 * refactor, and no UI or route needs to change.
 *
 * This is why `users.emirates_id_number` was the wrong shape: it hardcoded one
 * country's identity document as a column. Its replacement is a row
 * (AE, dealer, national_id, "Emirates ID").
 */

export interface CountryOption {
  code: string;
  name: string;
  currency: string;
  dialCode: string | null;
}

export interface KycRequirement {
  id: string;
  docType: string;
  label: string;
  helpText: string | null;
  required: boolean;
  twoSided: boolean;
}

/** Countries a car can be listed FROM. UAE only at launch. */
export async function getOriginCountries(): Promise<CountryOption[]> {
  if (!isDbEnabled()) return [FALLBACK_UAE];
  const rows = await db
    .select()
    .from(countries)
    .where(eq(countries.originEnabled, true))
    .orderBy(asc(countries.name));
  return rows.length ? rows.map(toOption) : [FALLBACK_UAE];
}

/** Countries a car can be shipped TO — the freight destination list. */
export async function getDestinationCountries(): Promise<CountryOption[]> {
  if (!isDbEnabled()) return [];
  const rows = await db
    .select()
    .from(countries)
    .where(eq(countries.destinationEnabled, true))
    .orderBy(asc(countries.name));
  return rows.map(toOption);
}

/**
 * The documents this party type must supply in this country. Drives the
 * onboarding form — the form renders whatever comes back, so it is correct for
 * any country without a code change.
 */
export async function getKycRequirements(
  countryCode: string,
  partyType: OrgType,
): Promise<KycRequirement[]> {
  if (!isDbEnabled()) return [];
  const rows = await db
    .select()
    .from(kycRequirements)
    .where(
      and(
        eq(kycRequirements.countryCode, countryCode),
        eq(kycRequirements.partyType, partyType),
      ),
    )
    .orderBy(asc(kycRequirements.sortOrder));
  return rows.map((r) => ({
    id: r.id,
    docType: r.docType,
    label: r.label,
    helpText: r.helpText,
    required: r.required,
    twoSided: r.twoSided,
  }));
}

export interface KycProgress {
  requirements: KycRequirement[];
  submitted: Record<string, { status: string; rejectionReason: string | null }>;
  /** Every required document is present (whatever its review verdict). */
  complete: boolean;
  /** Nothing supplied yet — the "skipped for now" state. */
  empty: boolean;
}

/**
 * What this org still owes. Powers the "pending / add later" banner: a user is
 * always allowed to skip, and this is what makes the skip visible rather than
 * silently leaving the account half-built.
 */
export async function getKycProgress(
  countryCode: string,
  partyType: OrgType,
  opts: { orgId?: string; userId?: string },
): Promise<KycProgress> {
  const requirements = await getKycRequirements(countryCode, partyType);
  if (!isDbEnabled() || (!opts.orgId && !opts.userId)) {
    return { requirements, submitted: {}, complete: false, empty: true };
  }

  const where = opts.orgId
    ? eq(identityDocuments.orgId, opts.orgId)
    : eq(identityDocuments.userId, opts.userId!);
  const docs = await db.select().from(identityDocuments).where(where);

  const submitted: KycProgress["submitted"] = {};
  for (const d of docs) {
    submitted[d.docType] = {
      status: d.status,
      rejectionReason: d.rejectionReason,
    };
  }

  const required = requirements.filter((r) => r.required);
  return {
    requirements,
    submitted,
    complete:
      required.length > 0 && required.every((r) => !!submitted[r.docType]),
    empty: docs.length === 0,
  };
}

const FALLBACK_UAE: CountryOption = {
  code: "AE",
  name: "United Arab Emirates",
  currency: "AED",
  dialCode: "+971",
};

function toOption(r: typeof countries.$inferSelect): CountryOption {
  return {
    code: r.code,
    name: r.name,
    currency: r.currency,
    dialCode: r.dialCode,
  };
}
