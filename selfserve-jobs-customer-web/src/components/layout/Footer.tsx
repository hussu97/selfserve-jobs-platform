import Image from 'next/image';
import Link from 'next/link';

const EMIRATES_LINKS = [
  { href: '/jobs/in/dubai', label: 'Dubai' },
  { href: '/jobs/in/abu-dhabi', label: 'Abu Dhabi' },
  { href: '/jobs/in/sharjah', label: 'Sharjah' },
  { href: '/jobs/in/ajman', label: 'Ajman' },
  { href: '/jobs/in/ras-al-khaimah', label: 'Ras Al Khaimah' },
  { href: '/jobs/in/fujairah', label: 'Fujairah' },
];

const JOB_TYPE_LINKS = [
  { href: '/jobs/type/full-time', label: 'Full-Time' },
  { href: '/jobs/type/remote', label: 'Remote' },
  { href: '/jobs/type/contract', label: 'Contract' },
  { href: '/jobs/type/freelance', label: 'Freelance' },
  { href: '/jobs/type/internship', label: 'Internship' },
];

const SKILL_LINKS = [
  { href: '/jobs/in/dubai/sales', label: 'Sales' },
  { href: '/jobs/in/dubai/project-management', label: 'Project Management' },
  { href: '/jobs/in/dubai/customer-service', label: 'Customer Service' },
  { href: '/jobs/in/dubai/business-development', label: 'Business Development' },
  { href: '/jobs/in/dubai/marketing', label: 'Marketing' },
  { href: '/jobs/in/dubai/financial-analysis', label: 'Financial Analysis' },
];

const RESOURCE_LINKS = [
  { href: '/faq', label: 'FAQ' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
];

export function Footer() {
  return (
    <footer className="bg-surface-dim mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">

        {/* Top: Logo + link grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-2">
            <Image src="/logo.png" alt="hirebridge" width={120} height={54} style={{ width: '120px', height: '54px' }} />
            <p className="text-xs text-text-muted leading-relaxed mt-1">
              UAE&apos;s talent-first tech platform
            </p>
            <p className="text-xs text-text-muted leading-relaxed">
              Free to post · Free to browse · Always
            </p>
          </div>

          {/* Jobs by Emirate */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-3">
              Jobs by Emirate
            </p>
            <ul className="flex flex-col gap-1.5">
              {EMIRATES_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-xs text-text-muted hover:text-text-main transition-colors">
                    {label} Jobs
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Job Types */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-3">
              Job Types
            </p>
            <ul className="flex flex-col gap-1.5">
              {JOB_TYPE_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-xs text-text-muted hover:text-text-main transition-colors">
                    {label} Jobs
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-3 mt-6">
              Popular Skills
            </p>
            <ul className="flex flex-col gap-1.5">
              {SKILL_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-xs text-text-muted hover:text-text-main transition-colors">
                    {label} Jobs
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-3">
              Resources
            </p>
            <ul className="flex flex-col gap-1.5">
              {RESOURCE_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-xs text-text-muted hover:text-text-main transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border/20 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-[10px] uppercase tracking-widest text-text-muted/60">
            &copy; {new Date().getFullYear()} hirebridge · UAE Job Board
          </p>
          <p className="text-[10px] text-text-muted/50">
            Free to post · Free to browse · Always
          </p>
        </div>
      </div>
    </footer>
  );
}
