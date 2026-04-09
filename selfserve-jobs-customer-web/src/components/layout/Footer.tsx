import Image from 'next/image';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-surface-dim mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">

          <div className="flex flex-col gap-1.5">
            <Image src="/logo.png" alt="hirebridge" width={120} height={54} unoptimized />
            <p className="text-xs text-text-muted leading-relaxed">
              No signup required · No middlemen
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/about" className="text-xs uppercase tracking-widest text-text-muted hover:text-text-main transition-colors">
              About
            </Link>
            <Link href="/privacy" className="text-xs uppercase tracking-widest text-text-muted hover:text-text-main transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-xs uppercase tracking-widest text-text-muted hover:text-text-main transition-colors">
              Terms of Service
            </Link>
            <Link href="/contact" className="text-xs uppercase tracking-widest text-text-muted hover:text-text-main transition-colors">
              Contact
            </Link>
          </div>
        </div>

        <div className="mt-10 pt-6">
          <p className="text-[10px] uppercase tracking-widest text-text-muted/60">
            &copy; {new Date().getFullYear()} hirebridge
          </p>
        </div>
      </div>
    </footer>
  );
}
