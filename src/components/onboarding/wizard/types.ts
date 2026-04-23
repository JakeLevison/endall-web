export type StepId =
  | "identity"
  | "company"
  | "services"
  | "service-area"
  | "tech-roster"
  | "pricing"
  | "integrations"
  | "review";

export const STEP_ORDER: StepId[] = [
  "identity",
  "company",
  "services",
  "service-area",
  "tech-roster",
  "pricing",
  "integrations",
  "review",
];

export const STEP_LABELS: Record<StepId, string> = {
  identity: "Confirm identity",
  company: "Company details",
  services: "Services and trade",
  "service-area": "Service area",
  "tech-roster": "Tech roster",
  pricing: "Pricing inputs",
  integrations: "Integrations",
  review: "Review and finish",
};

export const STEP_ENDPOINTS: Record<Exclude<StepId, "identity" | "review">, string> = {
  company: "/api/onboarding/company-details",
  services: "/api/onboarding/services",
  "service-area": "/api/onboarding/service-area",
  "tech-roster": "/api/onboarding/technicians",
  pricing: "/api/onboarding/pricing",
  integrations: "/api/onboarding/integrations/quickbooks",
};

export type TradeCode =
  | "electrical"
  | "mechanical"
  | "plumbing"
  | "controls"
  | "low-voltage"
  | "fire-life-safety"
  | "other";

export const TRADE_OPTIONS: { value: TradeCode; label: string }[] = [
  { value: "electrical", label: "Electrical" },
  { value: "mechanical", label: "Mechanical" },
  { value: "plumbing", label: "Plumbing" },
  { value: "controls", label: "Controls" },
  { value: "low-voltage", label: "Low voltage" },
  { value: "fire-life-safety", label: "Fire / life safety" },
  { value: "other", label: "Other" },
];

export type ServiceType =
  | "residential"
  | "light-commercial"
  | "heavy-commercial"
  | "industrial"
  | "data-center";

export const SERVICE_TYPE_OPTIONS: { value: ServiceType; label: string }[] = [
  { value: "residential", label: "Residential" },
  { value: "light-commercial", label: "Light commercial" },
  { value: "heavy-commercial", label: "Heavy commercial" },
  { value: "industrial", label: "Industrial" },
  { value: "data-center", label: "Data center" },
];

export type SkillTag =
  | "apprentice"
  | "journeyman-electrician"
  | "master-electrician"
  | "foreman"
  | "nate"
  | "epa-608"
  | "osha-10"
  | "osha-30"
  | "bicsi"
  | "nicet"
  | "other";

export const SKILL_OPTIONS: { value: SkillTag; label: string }[] = [
  { value: "apprentice", label: "Apprentice" },
  { value: "journeyman-electrician", label: "Journeyman Electrician" },
  { value: "master-electrician", label: "Master Electrician" },
  { value: "foreman", label: "Foreman" },
  { value: "nate", label: "NATE" },
  { value: "epa-608", label: "EPA 608" },
  { value: "osha-10", label: "OSHA-10" },
  { value: "osha-30", label: "OSHA-30" },
  { value: "bicsi", label: "BICSI" },
  { value: "nicet", label: "NICET" },
  { value: "other", label: "Other" },
];

export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export const DAYS: { value: DayOfWeek; label: string }[] = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
];

export type DaySchedule = {
  enabled: boolean;
  start: string; // "HH:mm"
  end: string;
};

export type Technician = {
  id: string;
  name: string;
  email: string;
  phone: string;
  trades: TradeCode[];
  vehicle: string;
  standardHours: Record<DayOfWeek, DaySchedule>;
  skillsTags: SkillTag[];
};

export type PaymentTerms = "receipt" | "net_15" | "net_30" | "net_45" | "net_60";

export const PAYMENT_TERMS_OPTIONS: { value: PaymentTerms; label: string }[] = [
  { value: "receipt", label: "Due on receipt" },
  { value: "net_15", label: "NET 15" },
  { value: "net_30", label: "NET 30" },
  { value: "net_45", label: "NET 45" },
  { value: "net_60", label: "NET 60" },
];

export type PricingTier = "apprentice" | "journeyman" | "master" | "foreman";

export const PRICING_TIERS: PricingTier[] = [
  "apprentice",
  "journeyman",
  "master",
  "foreman",
];

export type WizardState = {
  identity: {
    confirmedAt: string | null;
  };
  company: {
    legalName: string;
    dba: string;
    ein: string;
    mailingAddress: string;
    licensedJurisdictions: string[];
  };
  services: {
    primaryTrade: TradeCode | "";
    secondaryTrades: TradeCode[];
    serviceTypes: ServiceType[];
  };
  "service-area": {
    baseLocation: string;
    serviceRadiusMiles: number;
    secondaryCoverageZones: string[];
  };
  "tech-roster": {
    technicians: Technician[];
  };
  pricing: {
    laborRates: Record<TradeCode, Partial<Record<PricingTier, string>>>;
    markupPercent: string;
    overheadPercent: string;
    defaultPaymentTerms: PaymentTerms;
    salesTaxRate: string;
  };
  integrations: {
    quickbooksConnected: boolean;
    quickbooksCompanyId: string | null;
    phoneNumberConfirmed: boolean;
  };
  review: {
    completedAt: string | null;
  };
};

function defaultSchedule(): Record<DayOfWeek, DaySchedule> {
  return {
    mon: { enabled: true, start: "08:00", end: "17:00" },
    tue: { enabled: true, start: "08:00", end: "17:00" },
    wed: { enabled: true, start: "08:00", end: "17:00" },
    thu: { enabled: true, start: "08:00", end: "17:00" },
    fri: { enabled: true, start: "08:00", end: "17:00" },
    sat: { enabled: false, start: "08:00", end: "17:00" },
    sun: { enabled: false, start: "08:00", end: "17:00" },
  };
}

export function newTechnician(): Technician {
  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `tech-${Math.random().toString(36).slice(2, 10)}`,
    name: "",
    email: "",
    phone: "",
    trades: [],
    vehicle: "",
    standardHours: defaultSchedule(),
    skillsTags: [],
  };
}

export function initialWizardState(): WizardState {
  const laborRates = TRADE_OPTIONS.reduce(
    (acc, t) => ({ ...acc, [t.value]: {} }),
    {} as Record<TradeCode, Partial<Record<PricingTier, string>>>
  );
  return {
    identity: { confirmedAt: null },
    company: {
      legalName: "",
      dba: "",
      ein: "",
      mailingAddress: "",
      licensedJurisdictions: [],
    },
    services: {
      primaryTrade: "",
      secondaryTrades: [],
      serviceTypes: [],
    },
    "service-area": {
      baseLocation: "",
      serviceRadiusMiles: 50,
      secondaryCoverageZones: [],
    },
    "tech-roster": {
      technicians: [newTechnician()],
    },
    pricing: {
      laborRates,
      markupPercent: "20",
      overheadPercent: "10",
      defaultPaymentTerms: "net_30",
      salesTaxRate: "0",
    },
    integrations: {
      quickbooksConnected: false,
      quickbooksCompanyId: null,
      phoneNumberConfirmed: false,
    },
    review: { completedAt: null },
  };
}

export const STORAGE_KEY_PREFIX = "endall.onboarding.v1";

export function storageKey(tenantId: string | null): string {
  return `${STORAGE_KEY_PREFIX}.${tenantId || "anon"}`;
}
