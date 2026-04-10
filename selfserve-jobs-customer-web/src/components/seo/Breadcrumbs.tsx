import Link from 'next/link';
import { breadcrumbSchema } from '@/lib/schema';
import { JsonLd } from './JsonLd';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const schemaItems = items.map((item) => ({
    name: item.label,
    url: item.href ?? '',
  }));

  return (
    <>
      <JsonLd data={breadcrumbSchema(schemaItems)} />
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-text-muted">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={index} className="flex items-center gap-1">
                {index > 0 && (
                  <span className="opacity-40" aria-hidden="true">/</span>
                )}
                {!isLast && item.href ? (
                  <Link
                    href={item.href}
                    className="hover:text-text-main transition-colors uppercase tracking-wider"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={`uppercase tracking-wider ${isLast ? 'text-text-main font-medium' : ''}`}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
