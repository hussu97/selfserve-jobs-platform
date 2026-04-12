import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { faqSchema } from '@/lib/schema';

export const metadata: Metadata = {
  title: 'FAQ — UAE Jobs, Visa Sponsorship & Working in the UAE',
  description:
    'Answers to the most common questions about finding jobs in the UAE, visa sponsorship, working in Dubai and Abu Dhabi, and how hirebridge works.',
  alternates: { canonical: '/faq' },
};

interface FaqItem {
  question: string;
  answer: string;
  links?: { label: string; href: string }[];
}

interface FaqSection {
  title: string;
  items: FaqItem[];
}

const FAQ_SECTIONS: FaqSection[] = [
  {
    title: 'About hirebridge',
    items: [
      {
        question: 'What is hirebridge?',
        answer:
          "hirebridge is a free, talent-first job platform built for the UAE's workforce. It operates a dual model: professionals create talent profiles through a simple email-verification flow (no account needed), while recruiters register for a verified account to post jobs and access sensitive candidate data. Browsing is always free and open to everyone.",
        links: [{ label: 'Learn more about us', href: '/about' }],
      },
      {
        question: 'Is hirebridge free to use?',
        answer:
          'Yes, completely. Browsing jobs and talent profiles is free for everyone. Creating a talent profile is free. Recruiter registration and job posting are free. There are no premium tiers, no pay-to-rank features, and no plans to introduce them. Listings are ranked purely by recency.',
      },
      {
        question: 'How long do listings stay active?',
        answer:
          'Job listings are active for 60 days. Talent profiles are active for 180 days (6 months). Both can be manually removed at any time using the management link sent to your email when you post.',
      },
      {
        question: 'How many listings can I post?',
        answer:
          'Each recruiter account can have up to 5 active job listings at any given time. Each email address can have up to 2 active talent profiles. Once a listing expires or is removed, you can post a new one.',
      },
    ],
  },
  {
    title: 'For Talent',
    items: [
      {
        question: 'How do I find jobs in Dubai or Abu Dhabi?',
        answer:
          'Browse all UAE listings at /jobs, or go directly to location-specific pages for Dubai (/jobs/in/dubai) or Abu Dhabi (/jobs/in/abu-dhabi). You can filter by employment type, skills, and more.',
        links: [
          { label: 'Jobs in Dubai', href: '/jobs/in/dubai' },
          { label: 'Jobs in Abu Dhabi', href: '/jobs/in/abu-dhabi' },
        ],
      },
      {
        question: 'How do I create a talent profile to get found by recruiters?',
        answer:
          'Go to /profiles/new and fill in your details — current title, location, skills, a brief bio, and optionally a resume PDF. Verify your email and your profile goes live immediately. No account registration is required. Approved recruiters can then find and contact you directly.',
        links: [{ label: 'Create your profile', href: '/profiles/new' }],
      },
      {
        question: 'Who can see my contact details and resume?',
        answer:
          'Your public profile (title, skills, location, bio) is visible to anyone browsing the platform. However, sensitive details — your email address, phone number, and resume — are only accessible to recruiters who have completed registration and received admin approval. This ensures your contact information reaches legitimate hiring parties only.',
      },
      {
        question: 'Do I need to create an account to post a talent profile?',
        answer:
          'No. You only need to verify your email address to create a talent profile. hirebridge does not store passwords or require any registration for talent. Your management link (sent by email) is how you edit or remove your profile.',
      },
      {
        question: 'Do I need a UAE visa to work in the UAE?',
        answer:
          'Yes — unless you are a UAE or GCC national, you need a work visa to be legally employed in the UAE. Work visas are typically sponsored by your employer as part of the hiring process. Most companies posting on hirebridge expect to sponsor visas for suitable candidates.',
      },
      {
        question: 'What is visa sponsorship in the UAE?',
        answer:
          'Visa sponsorship means the employer handles and pays for your UAE work visa (also called an employment visa or residence permit). This includes the medical test, Emirates ID, and residence visa. Most full-time roles in the UAE include visa sponsorship. Contract and freelance roles may require you to be on your own freelance permit or visa.',
      },
      {
        question: 'What are free zones in the UAE, and do they matter for jobs?',
        answer:
          'Free zones are special economic areas (like Dubai Internet City, DIFC, Abu Dhabi Global Market) where companies get 100% foreign ownership and other benefits. Many companies across technology, finance, media, and consulting operate from free zones. As an employee, being in a free zone vs. mainland company generally makes little practical difference — both offer standard UAE employment contracts and visa sponsorship.',
      },
      {
        question: 'What is the UAE Golden Visa, and can a job help me get one?',
        answer:
          'The UAE Golden Visa is a long-term residency visa (5 or 10 years) available to exceptional professionals, investors, and entrepreneurs. Employed professionals earning above AED 30,000/month with a recognised employer may qualify under the "skilled employees" category. Your employer would typically assist with this application.',
      },
      {
        question: 'What are professional salaries like in Dubai?',
        answer:
          'Dubai salaries are tax-free and highly competitive by global standards. A mid-level professional typically earns AED 12,000–25,000 per month depending on industry and seniority. Finance and consulting roles often command AED 20,000–40,000+. Sales, operations, and HR roles typically range from AED 8,000–20,000. All figures are gross income — there is no income tax in the UAE.',
      },
      {
        question: 'Can I work remotely from the UAE?',
        answer:
          "Yes. The UAE offers a Remote Work Visa (Virtual Work Programme) for professionals employed by foreign companies. Many UAE companies also offer hybrid arrangements. The UAE's central timezone (GMT+4) makes it excellent for working with teams in Europe, Asia, and Africa.",
        links: [{ label: 'Browse remote jobs', href: '/jobs/type/remote' }],
      },
    ],
  },
  {
    title: 'For Recruiters',
    items: [
      {
        question: 'How do I post a job on hirebridge?',
        answer:
          'Job posting requires a recruiter account. Register at /recruiters/register with your name, company, work email, and LinkedIn profile. Once your account is approved (typically 1–2 business days), you can post jobs and access talent contact details.',
        links: [{ label: 'Register as a recruiter', href: '/recruiters/register' }],
      },
      {
        question: 'How long does recruiter approval take?',
        answer:
          'We review recruiter applications within 1–2 business days. We manually check submitted information to verify that applicants represent legitimate hiring organisations. You will receive an email once your account is approved.',
      },
      {
        question: 'Is recruiter registration free?',
        answer:
          'Yes, completely free. There are no fees to register, no subscription charges, and no pay-to-rank features. Listings are shown in chronological order.',
      },
      {
        question: 'What information do I need to register as a recruiter?',
        answer:
          'You need to provide your full name, company name, work email address, and a LinkedIn profile URL. This information is used to verify your identity and ensure talent data is accessed responsibly. It is stored securely and is not displayed publicly.',
      },
      {
        question: 'What talent data can I access as an approved recruiter?',
        answer:
          "Once approved, you can view a candidate's full profile including their email address, phone number, and resume PDF (if uploaded). Public profile information — title, skills, location, and bio — is visible to everyone. Sensitive contact details are gated behind recruiter approval.",
      },
      {
        question: 'How do candidates contact me after seeing my job listing?',
        answer:
          'You choose your preferred contact method when posting — either a direct email address or an application URL (such as your own careers page or LinkedIn posting). Candidates contact you directly; there is no in-platform messaging system.',
      },
      {
        question: 'Can I edit or remove my job listing after it goes live?',
        answer:
          'Yes. When your listing is verified, you receive a management link by email. Use that link to edit details, extend the listing (if approaching expiry), or remove it entirely.',
      },
      {
        question: 'How long will my job listing appear?',
        answer:
          'Job listings are active for 60 days from the date of posting. After 60 days, they automatically expire and are no longer visible to candidates. You can post a new listing at any time.',
      },
      {
        question: 'Can I post multiple jobs?',
        answer:
          'Yes — each recruiter account can have up to 5 active job listings at a time.',
      },
    ],
  },
  {
    title: 'Working Across the UAE Emirates',
    items: [
      {
        question: 'Which UAE emirate has the most jobs?',
        answer:
          'Dubai has by far the largest job market in the UAE, with the most active hiring across all industries — from finance and hospitality to sales, logistics, and professional services. Abu Dhabi is the fastest-growing alternative, with strong demand in government, healthcare, and the energy sector. Sharjah is growing steadily, particularly in manufacturing, education, and media.',
        links: [
          { label: 'Jobs in Dubai', href: '/jobs/in/dubai' },
          { label: 'Jobs in Abu Dhabi', href: '/jobs/in/abu-dhabi' },
        ],
      },
      {
        question: 'Can I live in Sharjah and work in Dubai?',
        answer:
          'Yes — this is very common. Sharjah is significantly cheaper than Dubai for housing, and many professionals commute from Sharjah to Dubai (20–40 minutes depending on traffic). Many UAE employers are comfortable with this arrangement.',
      },
      {
        question: 'What is the cost of living in the UAE?',
        answer:
          'Dubai and Abu Dhabi have the highest costs of living among UAE emirates. A comfortable single-professional lifestyle in Dubai typically costs AED 8,000–15,000 per month including rent, food, transport, and leisure. Sharjah, Ajman, and the northern emirates are considerably more affordable, with similar costs running AED 5,000–9,000.',
      },
      {
        question: 'Are there blockchain and Web3 jobs in the UAE?',
        answer:
          "Yes — the UAE has actively positioned itself as a crypto-friendly jurisdiction. RAK Digital Assets Oasis (RAK DAO) in Ras Al Khaimah is dedicated to Web3 and digital asset companies. Dubai's VARA (Virtual Assets Regulatory Authority) has licensed hundreds of crypto firms, many of which hire actively.",
        links: [{ label: 'Jobs in Ras Al Khaimah', href: '/jobs/in/ras-al-khaimah' }],
      },
    ],
  },
];

const ALL_FAQS = FAQ_SECTIONS.flatMap((s) => s.items.map(({ question, answer }) => ({ question, answer })));

export default function FaqPage() {
  return (
    <>
      <JsonLd data={faqSchema(ALL_FAQS)} />

      <div className="hero-gradient">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4">
          <Breadcrumbs items={[{ label: 'FAQ' }]} />
          <div className="mb-8">
            <span className="text-xs font-semibold uppercase tracking-widest text-secondary mb-3 block">
              Help Centre
            </span>
            <h1 className="font-heading text-3xl sm:text-4xl text-primary mb-3">
              Frequently Asked <em>Questions</em>
            </h1>
            <p className="text-text-muted text-base">
              Everything you need to know about finding jobs in the UAE, visa sponsorship, working across the Emirates, and how hirebridge works.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Section nav */}
        <nav className="flex flex-wrap gap-2 mb-10">
          {FAQ_SECTIONS.map((section) => (
            <a
              key={section.title}
              href={`#${section.title.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-xs uppercase tracking-wider px-3 py-1.5 rounded-full bg-surface text-text-muted hover:text-text-main hover:bg-surface-container-high transition-colors"
            >
              {section.title}
            </a>
          ))}
        </nav>

        {/* Sections */}
        <div className="space-y-12">
          {FAQ_SECTIONS.map((section) => (
            <section key={section.title} id={section.title.toLowerCase().replace(/\s+/g, '-')}>
              <h2 className="font-heading text-xl text-primary mb-6 pb-3 border-b border-border/20">
                {section.title}
              </h2>
              <div className="space-y-3">
                {section.items.map(({ question, answer, links }) => (
                  <details key={question} className="group rounded-2xl bg-surface-lowest shadow-ambient p-5">
                    <summary className="font-semibold text-sm text-text-main cursor-pointer list-none flex items-center justify-between gap-3">
                      {question}
                      <span className="text-text-muted group-open:rotate-180 transition-transform shrink-0 text-base leading-none">▾</span>
                    </summary>
                    <div className="mt-3">
                      <p className="text-sm text-text-muted leading-relaxed">{answer}</p>
                      {links && links.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {links.map(({ label, href }) => (
                            <Link
                              key={href}
                              href={href}
                              className="text-xs uppercase tracking-wider text-secondary hover:text-secondary-hover transition-colors underline underline-offset-2"
                            >
                              {label} →
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-2xl bg-primary p-8 text-white text-center">
          <h2 className="font-heading text-xl mb-2">Ready to get started?</h2>
          <p className="text-sm opacity-80 mb-6">
            Browse UAE jobs, create a talent profile, or register as a recruiter — all free.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/jobs"
              className="px-6 py-2.5 rounded-full bg-white text-primary font-semibold text-sm hover:bg-surface transition-colors"
            >
              Browse Jobs
            </Link>
            <Link
              href="/profiles/new"
              className="px-6 py-2.5 rounded-full bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-colors"
            >
              Create Profile
            </Link>
            <Link
              href="/recruiters/register"
              className="px-6 py-2.5 rounded-full bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-colors"
            >
              Recruiter Register
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
