export interface Program {
  id: string;
  name: string;
  university: string;
  country: string;
  countryFlag: string;
  degreeLevel: string;
  subject: string;
  duration: string;
  tuitionFee: string;
  eligibility: string;
  description: string;
  cgpa?: string;
}

export interface Scholarship {
  id: string;
  title: string;
  organization: string;
  country: string;
  countryFlag: string;
  fundingType: "Fully Funded" | "Partial" | "Tuition Waiver";
  amount: string;
  deadline: string;
  eligibility: string;
  degreeLevel: string;
  subject: string;
  cgpa?: string;
  duration?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  country: string;
  program: string;
  quote: string;
  avatar: string;
}

// No mock data — programs and scholarships come from localStorage (created by universities/orgs)
export const programs: Program[] = [];
export const scholarships: Scholarship[] = [];
export const testimonials: Testimonial[] = [];

export const subjects = [
  "All Subjects",
  "Computer Science",
  "Business",
  "Engineering",
  "Law",
  "Medicine",
  "Arts & Humanities",
  "Social Sciences",
  "Natural Sciences",
];

export const countries = [
  "All Countries",
  "Germany",
  "France",
  "Sweden",
  "United Kingdom",
  "Switzerland",
  "Netherlands",
  "United States",
  "Canada",
  "Australia",
];

export const degreeLevels = ["All Levels", "Bachelor's", "Master's", "PhD"];

export const fundingTypes = ["All Types", "Fully Funded", "Partial", "Tuition Waiver"];

export const cgpaRanges = ["All CGPA", "2.5 - 2.9", "3.0 - 3.4", "3.5 - 3.9", "4.0+"];

export const durations = ["All Durations", "1 year", "2 years", "3 years", "4+ years"];
