/**
 * Frontend-only localStorage store for university programs, org scholarships,
 * and their applications. No mock/seed data — all data comes from user actions.
 */

const STORAGE_KEYS = {
  UNIVERSITY_PROGRAMS: "eduductor_university_programs",
  PROGRAM_APPLICATIONS: "eduductor_program_applications",
  ORG_SCHOLARSHIPS: "eduductor_org_scholarships",
  SCHOLARSHIP_APPLICATIONS: "eduductor_scholarship_applications",
} as const;

export interface UniversityProgram {
  id: string;
  universityId: string;
  title: string;
  semester: string;
  applications: number;
  accepted: number;
  pending: number;
  rejected: number;
  deadline: string;
  status: string;
  courseTitle?: string;
  courseCode?: string;
  university?: string;
  country?: string;
  countryFlag?: string;
  degreeLevel?: string;
  subject?: string;
  duration?: string;
  tuitionFee?: string;
  eligibility?: string;
  description?: string;
  [key: string]: unknown;
}

export interface ProgramApplication {
  id: string;
  programId: string;
  studentId?: string;
  studentName: string;
  program: string;
  status: "pending" | "accepted" | "rejected";
  appliedDate: string;
  cgpa: string;
  email: string;
  documents: string[];
}

export interface OrgScholarship {
  id: string;
  organizationId: string;
  title: string;
  type: string;
  applications: number;
  accepted: number;
  pending: number;
  rejected: number;
  deadline: string;
  status: string;
  amount: string;
  organization?: string;
  country?: string;
  countryFlag?: string;
  [key: string]: unknown;
}

export interface ScholarshipApplication {
  id: string;
  scholarshipId: string;
  studentId?: string;
  studentName: string;
  scholarship: string;
  status: "pending" | "accepted" | "rejected";
  appliedDate: string;
  cgpa: string;
  email: string;
  documents: string[];
}

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

/** Get all university programs from storage (empty if never set). */
export function getUniversityPrograms(): UniversityProgram[] {
  return read(STORAGE_KEYS.UNIVERSITY_PROGRAMS, []);
}

/** Save university programs to storage. */
export function saveUniversityPrograms(programs: UniversityProgram[]): void {
  write(STORAGE_KEYS.UNIVERSITY_PROGRAMS, programs);
}

/** Get all program applications from storage (empty if never set). */
export function getProgramApplications(): ProgramApplication[] {
  return read(STORAGE_KEYS.PROGRAM_APPLICATIONS, []);
}

/** Save program applications to storage. */
export function saveProgramApplications(applications: ProgramApplication[]): void {
  write(STORAGE_KEYS.PROGRAM_APPLICATIONS, applications);
}

/** Get all org scholarships from storage (empty if never set). */
export function getOrgScholarships(): OrgScholarship[] {
  return read(STORAGE_KEYS.ORG_SCHOLARSHIPS, []);
}

/** Save org scholarships to storage. */
export function saveOrgScholarships(scholarships: OrgScholarship[]): void {
  write(STORAGE_KEYS.ORG_SCHOLARSHIPS, scholarships);
}

/** Get all scholarship applications from storage (empty if never set). */
export function getScholarshipApplications(): ScholarshipApplication[] {
  return read(STORAGE_KEYS.SCHOLARSHIP_APPLICATIONS, []);
}

/** Save scholarship applications to storage. */
export function saveScholarshipApplications(applications: ScholarshipApplication[]): void {
  write(STORAGE_KEYS.SCHOLARSHIP_APPLICATIONS, applications);
}

/** Generate a unique id for new items. */
export function nextId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
