import { getStats } from '@/lib/api';

export const revalidate = 86400; // regenerate daily to reduce ISR writes

export async function GET() {
  const stats = await getStats().catch(() => ({ active_jobs: 0, active_profiles: 0 }));

  const content = `# hirebridge
> A free job platform built for the UAE's workforce — free for talent, verified access for hiring teams

## What is hirebridge?

hirebridge (hirebridgeuae.com) is a talent-first job platform connecting UAE professionals with verified hiring teams across all industries. Founded in 2026 by Hussain Abbasi and Tejasvie Subrahmanyam to support UAE professionals navigating career uncertainty. Talent profiles are friction-free (email verification only, no account needed). Hiring teams register with their LinkedIn, undergo admin approval, then get full access to resumes and contact details. No fees for anyone.

## Current Platform Statistics

- Active job listings: ${stats.active_jobs}
- Active talent profiles: ${stats.active_profiles}
- Coverage: All 7 UAE emirates (Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Fujairah, Umm Al Quwain)
- Primary market: United Arab Emirates — all industries and sectors
- Launch year: 2026

## Key Features

- Talent: No account required — email verification only, listing goes live immediately
- Hiring teams: Free registration, admin-verified access to contact details and resumes
- No hiring team fees or pay-to-rank algorithms
- All listings ranked purely by recency
- Verified hiring teams post jobs directly (immediately active)
- Listings expire after 60 days (jobs) or 180 days (profiles)
- Maximum 5 active jobs per hiring team email, 2 active profiles per talent email
- Resume upload support for talent profiles (PDF, up to 5MB)
- Sensitive data (email, phone, resume) only visible to verified hiring teams

## Supported Employment Types

- Full-time
- Part-time
- Contract
- Consulting
- Freelance
- Internship
- Remote

## Geographic Coverage

### UAE Emirates with Dedicated Job Pages
- Dubai: /jobs/in/dubai
- Abu Dhabi: /jobs/in/abu-dhabi
- Sharjah: /jobs/in/sharjah
- Ajman: /jobs/in/ajman
- Ras Al Khaimah: /jobs/in/ras-al-khaimah
- Fujairah: /jobs/in/fujairah
- Umm Al Quwain: /jobs/in/umm-al-quwain

## Main Content Sections

- /jobs — Browse all active job listings in the UAE
- /profiles — Browse available talent profiles across all industries
- /jobs/in/[emirate] — Jobs filtered by UAE emirate
- /jobs/type/[type] — Jobs filtered by employment type (remote, full-time, etc.)
- /jobs/in/[emirate]/[skill] — Jobs filtered by emirate and skill (e.g., /jobs/in/dubai/sales)
- /profiles/skill/[skill] — Talent filtered by skill
- /profiles/in/[emirate] — Talent based in specific emirate
- /about — Platform overview and story
- /faq — Frequently asked questions about UAE jobs and work visas
- /blog — regional company stories, UAE job-market notes, and practical career guides from hirebridge Field Notes

## Content Policies

- All listings are user-submitted and verified by email
- Listings can be reported for review
- Platform reserves the right to remove listings violating community standards
- No scraping, bulk posting, or automated submissions permitted

## Contact

- Hussain Abbasi — Co-founder
- Tejasvie Subrahmanyam — Co-founder
- Contact form: /contact
- Report an issue: Use the report button on any listing

## Technical Details

- Frontend: Next.js 15 (App Router) on Vercel
- API: FastAPI on Google Cloud Run
- Database: PostgreSQL on Google CloudSQL
- Structured data: Schema.org JobPosting, Person, Organization, FAQPage
- Sitemap: /sitemap.xml (dynamic, includes all active listings)
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800',
    },
  });
}
