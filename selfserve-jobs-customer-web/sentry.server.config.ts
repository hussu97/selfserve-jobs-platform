import * as Sentry from '@sentry/nextjs';

const tracesSampleRate = Number.parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0');

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? tracesSampleRate : 1.0,
  enabled: process.env.NODE_ENV === 'production',
});
