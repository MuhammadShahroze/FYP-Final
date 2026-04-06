export interface Application {
  id: string;
  programId: string;
  programName: string;
  university: string;
  country: string;
  countryFlag: string;
  status: "draft" | "submitted" | "under_review" | "accepted" | "rejected" | "documents_requested";
  appliedDate: string;
  lastUpdated: string;
  documentsSubmitted: string[];
  documentsRequired: string[];
}

export interface VisaGuide {
  id: string;
  country: string;
  countryFlag: string;
  visaType: string;
  processingTime: string;
  cost: string;
  requirements: string[];
  steps: string[];
}

export interface DocumentTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  downloadCount: number;
  fileUrl?: string;
  fileName?: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  category: string;
  completed: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

// No mock data — student applications come from localStorage (getApplicationsByStudent)
export const applications: Application[] = [];

export const visaGuides: VisaGuide[] = [
  {
    id: "v1",
    country: "Germany",
    countryFlag: "🇩🇪",
    visaType: "Student Visa (National Visa)",
    processingTime: "6-12 weeks",
    cost: "€75",
    requirements: [
      "Valid passport (6+ months)",
      "University admission letter",
      "Proof of financial resources (€11,208/year)",
      "Health insurance coverage",
      "Motivation letter",
      "Academic transcripts & certificates",
    ],
    steps: [
      "Receive university admission letter",
      "Open a blocked account (Sperrkonto) with €11,208",
      "Purchase health insurance valid in Germany",
      "Book an appointment at the German embassy/consulate",
      "Submit all required documents",
      "Attend visa interview",
      "Wait for visa processing (6-12 weeks)",
    ],
  },
  {
    id: "v2",
    country: "United Kingdom",
    countryFlag: "🇬🇧",
    visaType: "Student Visa (Tier 4)",
    processingTime: "3-4 weeks",
    cost: "£363",
    requirements: [
      "CAS (Confirmation of Acceptance for Studies)",
      "Proof of funds (£1,334/month London, £1,023 outside)",
      "Valid passport",
      "TB test results (if applicable)",
      "IELTS/English proficiency proof",
      "Passport-size photographs",
    ],
    steps: [
      "Receive CAS from your university",
      "Gather proof of financial support",
      "Complete online visa application form",
      "Pay visa fee and Immigration Health Surcharge",
      "Book and attend biometrics appointment",
      "Submit documents and wait for decision",
    ],
  },
  {
    id: "v3",
    country: "Sweden",
    countryFlag: "🇸🇪",
    visaType: "Residence Permit for Studies",
    processingTime: "4-8 weeks",
    cost: "SEK 1,500",
    requirements: [
      "Letter of acceptance from Swedish university",
      "Valid passport",
      "Proof of comprehensive health insurance",
      "Proof of financial means (SEK 8,568/month)",
      "Passport photographs",
    ],
    steps: [
      "Receive admission letter from university",
      "Apply online at migrationsverket.se",
      "Pay the application fee",
      "Visit Swedish embassy for photos and fingerprints",
      "Wait for decision",
      "Collect residence permit card",
    ],
  },
  {
    id: "v4",
    country: "Netherlands",
    countryFlag: "🇳🇱",
    visaType: "MVV + Residence Permit",
    processingTime: "2-4 weeks",
    cost: "€210",
    requirements: [
      "University admission letter",
      "Valid passport",
      "Proof of sufficient financial means",
      "Health insurance",
      "Proof of accommodation",
    ],
    steps: [
      "University applies for your residence permit (TEV procedure)",
      "Receive approval letter from IND",
      "Collect MVV from Dutch embassy",
      "Travel to the Netherlands",
      "Register at municipality and collect residence permit",
    ],
  },
];

export const documentTemplates: DocumentTemplate[] = [
  { id: "dt1", name: "Motivation Letter Template", category: "Application", description: "A structured template for writing a compelling motivation letter for graduate programs.", downloadCount: 1240 },
  { id: "dt2", name: "CV/Resume Template (Academic)", category: "Application", description: "Academic CV format tailored for international university applications.", downloadCount: 2100 },
  { id: "dt3", name: "Recommendation Letter Request", category: "Application", description: "Template for requesting recommendation letters from professors or employers.", downloadCount: 890 },
  { id: "dt4", name: "Financial Statement Template", category: "Visa", description: "Template for organizing financial documents for visa applications.", downloadCount: 670 },
  { id: "dt5", name: "Statement of Purpose Template", category: "Application", description: "A guide for crafting a statement of purpose for research-based programs.", downloadCount: 1560 },
  { id: "dt6", name: "Visa Cover Letter Template", category: "Visa", description: "Professional cover letter template specifically for student visa applications.", downloadCount: 430 },
];

export const defaultChecklist: ChecklistItem[] = [
  { id: "c1", label: "Complete university application", category: "Application", completed: true },
  { id: "c2", label: "Submit all required documents", category: "Application", completed: true },
  { id: "c3", label: "Receive admission letter", category: "Application", completed: true },
  { id: "c4", label: "Open blocked bank account", category: "Financial", completed: false },
  { id: "c5", label: "Arrange health insurance", category: "Financial", completed: false },
  { id: "c6", label: "Book visa appointment", category: "Visa", completed: false },
  { id: "c7", label: "Prepare visa documents", category: "Visa", completed: false },
  { id: "c8", label: "Attend visa interview", category: "Visa", completed: false },
  { id: "c9", label: "Book flight tickets", category: "Travel", completed: false },
  { id: "c10", label: "Arrange accommodation", category: "Travel", completed: false },
];

export const subscriptionPlans = [
  {
    id: "basic",
    name: "Basic",
    price: "Free",
    period: "",
    description: "Get started with program discovery",
    features: [
      { text: "Browse all programs & scholarships", included: true },
      { text: "Save up to 5 programs to shortlist", included: true },
      { text: "Basic program matching", included: true },
      { text: "Email alerts for new programs", included: true },
      { text: "Direct application submission", included: false },
      { text: "AI chatbot guidance", included: false },
      { text: "Visa documentation support", included: false },
      { text: "Priority matching algorithm", included: false },
      { text: "Unlimited shortlist", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$9.99",
    period: "/month",
    description: "Everything you need for your study abroad journey",
    features: [
      { text: "Browse all programs & scholarships", included: true },
      { text: "Unlimited shortlist", included: true },
      { text: "Priority program matching", included: true },
      { text: "Email & push alerts", included: true },
      { text: "Direct application submission", included: true },
      { text: "AI chatbot guidance 24/7", included: true },
      { text: "Visa documentation support", included: true },
      { text: "Document templates library", included: true },
      { text: "Personal checklist tracking", included: true },
    ],
  },
];

export const chatFAQs = [
  "How do I apply to a program?",
  "What documents do I need for a student visa?",
  "How does the matching algorithm work?",
  "What's included in the Pro plan?",
  "How do I track my application status?",
];
