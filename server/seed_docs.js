const mongoose = require('mongoose');
require('dotenv').config();
const VisaGuide = require('./models/VisaGuide');
const Template = require('./models/Template');

const visaGuidesData = [
  {
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
    country: "USA",
    countryFlag: "🇺🇸",
    visaType: "F-1 Student Visa",
    processingTime: "3-5 weeks",
    cost: "$185 (Plus $350 SEVIS fee)",
    requirements: [
      "Form I-20 from a SEVP-approved school",
      "Valid passport (6+ months)",
      "SEVIS I-901 fee payment receipt",
      "Form DS-160 confirmation page",
      "Proof of financial capability",
      "Academic transcripts & diplomas",
      "Evidence of intent to return home",
    ],
    steps: [
      "Receive Form I-20 from your US university",
      "Pay the SEVIS I-901 fee ($350)",
      "Complete the DS-160 online visa application",
      "Pay the visa application fee ($185)",
      "Schedule and attend your visa interview",
      "Submit biometrics (if required)",
      "Wait for visa delivery",
    ],
  },
  {
    country: "Canada",
    countryFlag: "🇨🇦",
    visaType: "Study Permit",
    processingTime: "8-12 weeks",
    cost: "CAD 150",
    requirements: [
      "Letter of Acceptance from a DLI",
      "Provincial Attestation Letter (PAL)",
      "Proof of funds (CAD 20,635 + tuition)",
      "Valid passport",
      "Statement of Purpose (SOP)",
      "Medical exam (if required)",
      "Police clearance certificate",
    ],
    steps: [
      "Obtain Acceptance Letter and PAL (if required)",
      "Prepare proof of financial support",
      "Apply for CAQ (if studying in Quebec)",
      "Submit study permit application online",
      "Book and attend biometrics appointment",
      "Complete medical exam (if requested)",
      "Wait for Letter of Introduction",
    ],
  },
  {
    country: "Australia",
    countryFlag: "🇦🇺",
    visaType: "Student Visa (Subclass 500)",
    processingTime: "4-8 weeks",
    cost: "AUD 710",
    requirements: [
      "Confirmation of Enrolment (CoE)",
      "Genuine Student (GS) requirement statement",
      "Proof of funds (AUD 29,710 + tuition)",
      "Overseas Student Health Cover (OSHC)",
      "Valid passport",
      "English proficiency (IELTS 6.0+)",
    ],
    steps: [
      "Receive CoE after accepting offer",
      "Organize OSHC health insurance",
      "Prepare Genuine Student (GS) documents",
      "Submit visa application online",
      "Pay the visa application fee",
      "Attend biometrics and health check",
      "Wait for grant notification",
    ],
  },
  {
    country: "France",
    countryFlag: "🇫🇷",
    visaType: "Long-stay Student Visa (VLS-TS)",
    processingTime: "2-4 weeks",
    cost: "€99",
    requirements: [
      "Acceptance letter via Campus France",
      "Valid passport (3+ months beyond stay)",
      "Proof of funds (€615/month)",
      "Proof of accommodation in France",
      "French language proficiency (if applicable)",
      "Health insurance",
    ],
    steps: [
      "Create account on Etudes en France (Campus France)",
      "Pay Campus France fee and attend interview",
      "Receive 'Accord Préalable' (Acceptance)",
      "Submit visa application via France-Visas portal",
      "Attend appointment at VFS/Embassy",
      "Validate visa (ANEF) within 3 months of arrival",
    ],
  },
  {
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

const templatesData = [
  { 
    name: "Motivation Letter Template", 
    category: "Application", 
    description: "A structured template for writing a compelling motivation letter for graduate programs.", 
    downloadCount: 1240,
    fileUrl: "/templates/motivation_letter.pdf",
    fileName: "Motivation_Letter_Template.pdf"
  },
  { 
    name: "CV/Resume Template (Academic)", 
    category: "Application", 
    description: "Academic CV format tailored for international university applications.", 
    downloadCount: 2100,
    fileUrl: "/templates/cv_academic.pdf",
    fileName: "Academic_CV_Template.pdf"
  },
  { 
    name: "Recommendation Letter Request", 
    category: "Application", 
    description: "Template for requesting recommendation letters from professors or employers.", 
    downloadCount: 890,
    fileUrl: "/templates/recommendation_request.pdf",
    fileName: "Recommendation_Letter_Request.pdf"
  },
  { 
    name: "Financial Statement Template", 
    category: "Visa", 
    description: "Template for organizing financial documents for visa applications.", 
    downloadCount: 670,
    fileUrl: "/templates/financial_statement.pdf",
    fileName: "Financial_Statement_Template.pdf"
  },
  { 
    name: "Statement of Purpose Template", 
    category: "Application", 
    description: "A guide for crafting a statement of purpose for research-based programs.", 
    downloadCount: 1560,
    fileUrl: "/templates/sop_guide.pdf",
    fileName: "Statement_of_Purpose_Guide.pdf"
  },
  { 
    name: "Visa Cover Letter Template", 
    category: "Visa", 
    description: "Professional cover letter template specifically for student visa applications.", 
    downloadCount: 430,
    fileUrl: "/templates/visa_cover_letter.pdf",
    fileName: "Visa_Cover_Letter_Template.pdf"
  },
];

async function seedDocs() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    await VisaGuide.deleteMany({});
    await Template.deleteMany({});

    await VisaGuide.insertMany(visaGuidesData);
    console.log('Inserted visa guides');

    await Template.insertMany(templatesData);
    console.log('Inserted templates');

    await mongoose.connection.close();
    console.log('Done');
  } catch (error) {
    console.error(error);
  }
}

seedDocs();
