const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hirebridgeuae.com';
const SITE_NAME = 'hirebridge';

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      'A free, no-signup job board connecting talent with employers across the UAE. No fees, no algorithms, no middlemen.',
    foundingDate: '2026',
    founders: [
      { '@type': 'Person', name: 'Hussain Abbasi' },
      { '@type': 'Person', name: 'Tejasvie Subrahmanyam' },
    ],
    areaServed: {
      '@type': 'Country',
      name: 'United Arab Emirates',
    },
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description:
      'hirebridge is a free UAE job board — post jobs and talent profiles without creating an account.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/jobs?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

export function jobPostingSchema(job: {
  job_title: string;
  company_name: string;
  company_city: string;
  company_country: string;
  employment_type: string;
  description: string;
  created_at: string;
  deadline_date?: string | null;
  contact_email?: string | null;
  contact_url?: string | null;
  key_skills?: string[];
}) {
  const employmentTypeMap: Record<string, string> = {
    full_time: 'FULL_TIME',
    part_time: 'PART_TIME',
    contract: 'CONTRACTOR',
    consulting: 'CONTRACTOR',
    freelance: 'TEMPORARY',
    internship: 'INTERN',
    remote: 'OTHER',
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.job_title,
    description: job.description,
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company_name,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.company_city,
        addressCountry: job.company_country,
      },
    },
    employmentType: employmentTypeMap[job.employment_type] ?? 'OTHER',
    datePosted: job.created_at,
    ...(job.deadline_date && { validThrough: job.deadline_date }),
    ...(job.contact_email && {
      applicationContact: { '@type': 'ContactPoint', email: job.contact_email },
    }),
    ...(job.contact_url && { url: job.contact_url }),
    ...(job.key_skills?.length && { skills: job.key_skills.join(', ') }),
    jobLocationType:
      job.employment_type === 'remote' ? 'TELECOMMUTE' : undefined,
  };
}

export function personSchema(profile: {
  person_name: string;
  current_title: string;
  current_city: string;
  current_country: string;
  key_skills?: string[];
  brief?: string;
  linkedin_profile_link?: string | null;
  years_of_experience?: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: profile.person_name,
      jobTitle: profile.current_title,
      ...(profile.brief && { description: profile.brief }),
      address: {
        '@type': 'PostalAddress',
        addressLocality: profile.current_city,
        addressCountry: profile.current_country,
      },
      ...(profile.key_skills?.length && {
        knowsAbout: profile.key_skills,
      }),
      ...(profile.linkedin_profile_link && {
        sameAs: [profile.linkedin_profile_link],
      }),
    },
  };
}

export function collectionPageSchema({
  name,
  description,
  url,
  numberOfItems,
}: {
  name: string;
  description: string;
  url: string;
  numberOfItems: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: url.startsWith('http') ? url : `${SITE_URL}${url}`,
    numberOfItems,
  };
}

export function articleSchema({
  title,
  description,
  url,
  datePublished,
  dateModified,
  authorName,
}: {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  authorName: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url: url.startsWith('http') ? url : `${SITE_URL}${url}`,
    datePublished,
    dateModified: dateModified ?? datePublished,
    author: {
      '@type': 'Person',
      name: authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: `${SITE_URL}/logo.png`,
    },
  };
}

export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  };
}
