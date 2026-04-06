import api from "./api";

// Types based on server models
export interface Program {
  _id: string;
  title: string;
  university: string;
  country: string;
  degreeLevel: string;
  subjectGroups: string[];
  cgpaRequirement: number;
  description: string;
  status: string;
}

export interface Scholarship {
  _id: string;
  title: string;
  organization: string;
  country: string;
  type: string;
  amount: string;
  degreeLevel: string;
  subjectGroups: string[];
  cgpaRequirement: number;
  description: string;
  status: string;
}

// PROGRAM API METHODS
export const getPrograms = async (filters?: any) => {
  const params = new URLSearchParams(filters).toString();
  const res = await api.get(`/programs?${params}`);
  return res.data;
};

export const getProgramById = async (id: string) => {
  const res = await api.get(`/programs/${id}`);
  return res.data;
};

// SCHOLARSHIP API METHODS
export const getScholarships = async (filters?: any) => {
  const params = new URLSearchParams(filters).toString();
  const res = await api.get(`/scholarships?${params}`);
  return res.data;
};

export const getScholarshipById = async (id: string) => {
  const res = await api.get(`/scholarships/${id}`);
  return res.data;
};

// APPLICATION API METHODS
export const applyToTarget = async (targetId: string, targetType: "program" | "scholarship", documents: any[]) => {
  const res = await api.post("/applications", { targetId, targetType, documents });
  return res.data; // Note: Ensure you extract the payload via `res.data` in components
};

export const getStudentApplications = async (studentId?: string) => {
  // studentId ignored: the backend resolves via JWT token
  const res = await api.get("/applications/me");
  return res.data.data; 
};

export const getInstitutionApplications = async (institutionId?: string, type?: "program"| "scholarship") => {
  // Server-side handles the filtering via JWT
  const res = await api.get("/applications/institution");
  return res.data.data;
};

export const updateApplicationStatus = async (id: string, status: string, progress?: number) => {
  const res = await api.put(`/applications/${id}/status`, { status });
  return res.data.data;
};

// VISA GUIDES
export const getVisaGuidesForCountry = async (country: string) => {
  const res = await api.get("/visas");
  // Assuming backend doesn't filter by country natively yet, we do it here or simply return all
  return res.data.data.filter((v: any) => v.country === country || country === "All Destinations");
};

// TEMPLATES
export const getTemplates = async () => {
  const res = await api.get("/templates");
  return res.data.data;
};

// RECOMMENDATIONS API
export const getRecommendations = async () => {
  const res = await api.get("/recommendations");
  return res.data;
};

// Dummy backward compatibility for app boot (can be removed later once components are refactored)
export const saveProgram = async (programData: any) => {
  if (programData._id || programData.id) {
     const id = programData._id || programData.id;
     const res = await api.put(`/programs/${id}`, programData);
     return res.data.data;
  }
  const res = await api.post("/programs", programData);
  return res.data.data;
};
