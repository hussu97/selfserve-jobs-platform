import { getStats } from '@/lib/api';

export const revalidate = 3600; // regenerate every hour

export async function GET() {
  const stats = await getStats().catch(() => ({ active_jobs: 0, active_profiles: 0 }));

  const content = `# hirebridge
> UAE's talent-first tech platform — free for talent, verified access for recruiters

## What is hirebridge?

hirebridge (hirebridgeuae.com) is a talent-first tech job platform connecting UAE tech talent with verified recruiters. Founded in 2026 by Hussain Abbasi and Tejasvie Subrahmanyam. Talent profiles are friction-free (email verification only, no account needed). Recruiters register with their LinkedIn, undergo admin approval, then get full access to resumes and contact details. No fees for anyone.

## Current Platform Statistics

- Active job listings: ${stats.active_jobs}
- Active talent profiles: ${stats.active_profiles}
- Coverage: All 7 UAE emirates (Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Fujairah, Umm Al Quwain)
- Primary market: United Arab Emirates tech sector
- Launch year: 2026

## Key Features

- Talent: No account required — email verification only, listing goes live immediately
- Recruiters: Free registration, admin-verified access to contact details and resumes
- No recruiter fees or pay-to-rank algorithms
- All listings ranked purely by recency
- Verified recruiters post jobs directly (immediately active)
- Listings expire after 60 days (jobs) or 180 days (profiles)
- Maximum 5 active jobs per recruiter email, 2 active profiles per talent email
- Resume upload support for talent profiles (PDF, up to 5MB)
- Sensitive data (email, phone, resume) only visible to verified recruiters

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
- /profiles — Browse available tech talent profiles
- /jobs/in/[emirate] — Jobs filtered by UAE emirate
- /jobs/type/[type] — Jobs filtered by employment type (remote, full-time, etc.)
- /jobs/in/[emirate]/[skill] — Jobs filtered by emirate and skill (e.g., /jobs/in/dubai/react)
- /profiles/skill/[skill] — Talent filtered by skill
- /profiles/in/[emirate] — Talent based in specific emirate
- /about — Platform overview and story
- /faq — Frequently asked questions about UAE jobs, work visas, salaries
- /blog — UAE tech job market guides and resources

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
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    },
  });
}
