export type LeadSource = "blog_newsletter" | "landing_cta" | "support_form";

export type LeadRecord = {
  email: string;
  source: LeadSource;
  createdAt: string;
  stage: "new" | "welcome_sent";
};

const STORAGE_KEY = "barberflow_leads";

export function captureLead(email: string, source: LeadSource): LeadRecord | null {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) return null;
  const current = getLeads();
  const existing = current.find((lead) => lead.email === normalized);
  if (existing) return existing;
  const record: LeadRecord = {
    email: normalized,
    source,
    createdAt: new Date().toISOString(),
    stage: "welcome_sent",
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([record, ...current]));
  return record;
}

export function getLeads(): LeadRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as LeadRecord[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

