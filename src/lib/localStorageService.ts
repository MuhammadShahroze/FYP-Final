// localStorage-based data service for programs, scholarships, and applications.
// No mock or seed data — all data comes from user actions.

export interface StoredProgram {
  id: string;
  ownerId: string;
  ownerName: string;
  title: string;
  semester: string;
  deadline: string;
  status: "active" | "draft";
  courseCode: string;
  cgpaRequirement: string;
  description: string;
  requirements: string;
  subjectGroups: string;
  courseType: string;
  semesterFee: string;
  courseDuration?: string;
  courseLanguage?: string;
  location?: string;
  applicationProcess?: string;
  eligibilityMinCgpa?: string;
  eligibilityLanguageRequirements?: {
    test: string;
    bands: string;
  }[];
  createdAt: string;
}

export interface StoredScholarship {
  id: string;
  ownerId: string;
  ownerName: string;
  title: string;
  type: "Partial" | "Fully-Funded";
  deadline: string;
  status: "active" | "draft";
  cgpaRequirement: string;
  amount: string;
  description: string;
  requirements: string;
  subjectGroups: string;
  courseType: string;
  createdAt: string;
}

export interface StoredApplication {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentCgpa: string;
  programId?: string;
  programTitle?: string;
  scholarshipId?: string;
  scholarshipTitle?: string;
  targetOwnerId: string;
  status: "pending" | "under_review" | "accepted" | "rejected";
  appliedDate: string;
  documents: string[];
}

export interface StoredVisaGuide {
  id: string;
  country: string;
  countryFlag: string;
  visaType: string;
  processingTime: string;
  cost: string;
  requirements: string[];
  steps: string[];
}

const PROGRAMS_KEY = "eduductor_programs";
const SCHOLARSHIPS_KEY = "eduductor_scholarships";
const APPLICATIONS_KEY = "eduductor_applications";
const VISA_GUIDES_KEY = "eduductor_visa_guides";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw != null && raw !== "") return JSON.parse(raw) as T;
  } catch (_e) {
    /* use fallback */
  }
  return fallback;
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_e) {
    /* ignore */
  }
}

// ---- Programs ----
export function getPrograms(): StoredProgram[] {
  return read(PROGRAMS_KEY, []);
}

export function getProgramsByOwner(ownerId: string): StoredProgram[] {
  return getPrograms().filter((p) => p.ownerId === ownerId);
}

export function getProgramById(id: string): StoredProgram | undefined {
  return getPrograms().find((p) => p.id === id);
}

export function saveProgram(program: StoredProgram): void {
  const all = getPrograms();
  all.push(program);
  write(PROGRAMS_KEY, all);
}

export function updateProgram(id: string, updates: Partial<StoredProgram>): void {
  const all = getPrograms().map((p) => (p.id === id ? { ...p, ...updates } : p));
  write(PROGRAMS_KEY, all);
}

export function deleteProgram(id: string): void {
  const all = getPrograms().filter((p) => p.id !== id);
  write(PROGRAMS_KEY, all);
  const apps = getApplications().filter((a) => a.programId !== id);
  write(APPLICATIONS_KEY, apps);
}

// ---- Scholarships ----
export function getScholarships(): StoredScholarship[] {
  return read(SCHOLARSHIPS_KEY, []);
}

export function getScholarshipsByOwner(ownerId: string): StoredScholarship[] {
  return getScholarships().filter((s) => s.ownerId === ownerId);
}

export function getScholarshipById(id: string): StoredScholarship | undefined {
  return getScholarships().find((s) => s.id === id);
}

export function saveScholarship(scholarship: StoredScholarship): void {
  const all = getScholarships();
  all.push(scholarship);
  write(SCHOLARSHIPS_KEY, all);
}

export function updateScholarship(id: string, updates: Partial<StoredScholarship>): void {
  const all = getScholarships().map((s) => (s.id === id ? { ...s, ...updates } : s));
  write(SCHOLARSHIPS_KEY, all);
}

export function deleteScholarship(id: string): void {
  const all = getScholarships().filter((s) => s.id !== id);
  write(SCHOLARSHIPS_KEY, all);
  const apps = getApplications().filter((a) => a.scholarshipId !== id);
  write(APPLICATIONS_KEY, apps);
}

// ---- Applications ----
export function getApplications(): StoredApplication[] {
  return read(APPLICATIONS_KEY, []);
}

/** Applications for programs owned by this university (targetOwnerId = university user id). */
export function getApplicationsByOwner(ownerId: string): StoredApplication[] {
  return getApplications().filter((a) => a.targetOwnerId === ownerId);
}

export function getApplicationsByStudent(studentId: string): StoredApplication[] {
  return getApplications().filter((a) => a.studentId === studentId);
}

export function saveApplication(application: StoredApplication): void {
  const all = getApplications();
  all.push(application);
  write(APPLICATIONS_KEY, all);
}

export function updateApplicationStatus(id: string, status: StoredApplication["status"]): void {
  const all = getApplications().map((a) => (a.id === id ? { ...a, status } : a));
  write(APPLICATIONS_KEY, all);
}

// ---- Visa guides ----
export function getVisaGuides(): StoredVisaGuide[] {
  return read(VISA_GUIDES_KEY, []);
}

export function saveVisaGuide(guide: StoredVisaGuide): void {
  const all = getVisaGuides();
  all.push(guide);
  write(VISA_GUIDES_KEY, all);
}

export function updateVisaGuide(id: string, updates: Partial<StoredVisaGuide>): void {
  const all = getVisaGuides().map((g) => (g.id === id ? { ...g, ...updates } : g));
  write(VISA_GUIDES_KEY, all);
}

export function deleteVisaGuide(id: string): void {
  const all = getVisaGuides().filter((g) => g.id !== id);
  write(VISA_GUIDES_KEY, all);
}
