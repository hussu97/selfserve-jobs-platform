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
  { slug: 'react', name: 'React', category: 'Frontend' },
  { slug: 'python', name: 'Python', category: 'Backend' },
  { slug: 'javascript', name: 'JavaScript', category: 'Frontend' },
  { slug: 'node-js', name: 'Node.js', category: 'Backend' },
  { slug: 'typescript', name: 'TypeScript', category: 'Frontend' },
  { slug: 'next-js', name: 'Next.js', category: 'Frontend' },
  { slug: 'aws', name: 'AWS', category: 'Cloud' },
  { slug: 'product-management', name: 'Product Management', category: 'Management' },
  { slug: 'ux-ui-design', name: 'UX/UI Design', category: 'Design' },
  { slug: 'figma', name: 'Figma', category: 'Design' },
  { slug: 'postgresql', name: 'PostgreSQL', category: 'Database' },
  { slug: 'docker', name: 'Docker', category: 'DevOps' },
  { slug: 'kubernetes', name: 'Kubernetes', category: 'DevOps' },
  { slug: 'machine-learning', name: 'Machine Learning', category: 'AI/ML' },
  { slug: 'data-analysis', name: 'Data Analysis', category: 'Data' },
  { slug: 'flutter', name: 'Flutter', category: 'Mobile' },
  { slug: 'react-native', name: 'React Native', category: 'Mobile' },
  { slug: 'java', name: 'Java', category: 'Backend' },
  { slug: 'vue-js', name: 'Vue.js', category: 'Frontend' },
  { slug: 'devops', name: 'DevOps', category: 'DevOps' },
  { slug: 'agile', name: 'Agile', category: 'Management' },
  { slug: 'cybersecurity', name: 'Cybersecurity', category: 'Security' },
  { slug: 'system-design', name: 'System Design', category: 'Architecture' },
  { slug: 'google-cloud', name: 'Google Cloud', category: 'Cloud' },
  { slug: 'azure', name: 'Azure', category: 'Cloud' },
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
