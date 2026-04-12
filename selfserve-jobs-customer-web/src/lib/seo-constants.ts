export interface Emirate {
  slug: string;
  name: string;
  city: string; // exact city string used in DB
  arabicName: string;
  demonym: string; // e.g. "Dubai-based"
}

export const UAE_EMIRATES: Emirate[] = [
  { slug: 'dubai', name: 'Dubai', city: 'Dubai', arabicName: 'دبي', demonym: 'Dubai-based' },
  { slug: 'abu-dhabi', name: 'Abu Dhabi', city: 'Abu Dhabi', arabicName: 'أبوظبي', demonym: 'Abu Dhabi-based' },
  { slug: 'sharjah', name: 'Sharjah', city: 'Sharjah', arabicName: 'الشارقة', demonym: 'Sharjah-based' },
  { slug: 'ajman', name: 'Ajman', city: 'Ajman', arabicName: 'عجمان', demonym: 'Ajman-based' },
  { slug: 'ras-al-khaimah', name: 'Ras Al Khaimah', city: 'Ras Al Khaimah', arabicName: 'رأس الخيمة', demonym: 'RAK-based' },
  { slug: 'fujairah', name: 'Fujairah', city: 'Fujairah', arabicName: 'الفجيرة', demonym: 'Fujairah-based' },
  { slug: 'umm-al-quwain', name: 'Umm Al Quwain', city: 'Umm Al Quwain', arabicName: 'أم القيوين', demonym: 'UAQ-based' },
];

export interface EmploymentTypeConfig {
  slug: string;
  value: string; // DB value
  label: string;
  labelPlural: string;
}

export const EMPLOYMENT_TYPES: EmploymentTypeConfig[] = [
  { slug: 'full-time', value: 'full_time', label: 'Full-Time', labelPlural: 'Full-Time Jobs' },
  { slug: 'part-time', value: 'part_time', label: 'Part-Time', labelPlural: 'Part-Time Jobs' },
  { slug: 'contract', value: 'contract', label: 'Contract', labelPlural: 'Contract Jobs' },
  { slug: 'consulting', value: 'consulting', label: 'Consulting', labelPlural: 'Consulting Roles' },
  { slug: 'freelance', value: 'freelance', label: 'Freelance', labelPlural: 'Freelance Projects' },
  { slug: 'internship', value: 'internship', label: 'Internship', labelPlural: 'Internships' },
  { slug: 'remote', value: 'remote', label: 'Remote', labelPlural: 'Remote Jobs' },
];

export interface SkillConfig {
  slug: string;
  name: string; // exact skill name used in DB
  category: string;
}

export const TOP_SKILLS: SkillConfig[] = [
  { slug: 'project-management', name: 'Project Management', category: 'Management' },
  { slug: 'communication', name: 'Communication', category: 'Soft Skills' },
  { slug: 'microsoft-excel', name: 'Microsoft Excel', category: 'Productivity' },
  { slug: 'leadership', name: 'Leadership', category: 'Management' },
  { slug: 'problem-solving', name: 'Problem Solving', category: 'Soft Skills' },
  { slug: 'customer-service', name: 'Customer Service', category: 'Operations' },
  { slug: 'sales', name: 'Sales', category: 'Sales' },
  { slug: 'data-analysis', name: 'Data Analysis', category: 'Data' },
  { slug: 'financial-analysis', name: 'Financial Analysis', category: 'Finance' },
  { slug: 'supply-chain-management', name: 'Supply Chain Management', category: 'Operations' },
  { slug: 'business-development', name: 'Business Development', category: 'Sales' },
  { slug: 'negotiation', name: 'Negotiation', category: 'Soft Skills' },
  { slug: 'strategic-planning', name: 'Strategic Planning', category: 'Management' },
  { slug: 'human-resources', name: 'Human Resources', category: 'HR' },
  { slug: 'account-management', name: 'Account Management', category: 'Sales' },
  { slug: 'operations-management', name: 'Operations Management', category: 'Operations' },
  { slug: 'arabic-language', name: 'Arabic Language', category: 'Language' },
  { slug: 'report-writing', name: 'Report Writing', category: 'Soft Skills' },
  { slug: 'budgeting', name: 'Budgeting', category: 'Finance' },
  { slug: 'stakeholder-management', name: 'Stakeholder Management', category: 'Management' },
  { slug: 'marketing', name: 'Marketing', category: 'Marketing' },
  { slug: 'procurement', name: 'Procurement', category: 'Operations' },
  { slug: 'presentation-skills', name: 'Presentation Skills', category: 'Soft Skills' },
  { slug: 'quality-assurance', name: 'Quality Assurance', category: 'Operations' },
  { slug: 'teamwork', name: 'Teamwork', category: 'Soft Skills' },
];

// Helper to find emirate by slug
export function getEmirateBySlug(slug: string): Emirate | undefined {
  return UAE_EMIRATES.find((e) => e.slug === slug);
}

// Helper to find employment type by slug
export function getEmploymentTypeBySlug(slug: string): EmploymentTypeConfig | undefined {
  return EMPLOYMENT_TYPES.find((e) => e.slug === slug);
}

// Helper to find skill by slug
export function getSkillBySlug(slug: string): SkillConfig | undefined {
  return TOP_SKILLS.find((s) => s.slug === slug);
}
