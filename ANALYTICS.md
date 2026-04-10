# Analytics Implementation Plan — Umami

> **Status:** Not started — this document defines the full event tracking, funnel, and goal strategy for hirebridge using [Umami Cloud](https://umami.is) (Hobby tier).

## Current State

- Umami Cloud tracking script is installed in `layout.tsx` via Next.js rewrites (ad-blocker resistant proxy through `/stats/`)
- **Page views** are tracked automatically — no custom events exist yet
- Vercel Analytics and Speed Insights are also active (separate from Umami; not covered here)

## Umami Cloud Hobby Tier Constraints

| Limit | Value |
|-------|-------|
| Monthly events | 100,000 |
| Websites | 3 |
| Data retention | Unlimited |
| Custom event data | Each property stored counts as 1 event toward the 100K limit |
| Event name max length | 50 chars (recommended) |
| Event data string values | Max 500 chars |
| Event data properties | Max 50 per event |

**Budget math:** At ~1,000 daily visitors with an average of 4 page views each, page views alone consume ~120K/month — already over the free tier. Custom events will add to this. Options if we exceed 100K:
1. Self-host Umami (unlimited events, ~$5/mo VPS)
2. Upgrade to Umami Pro ($20/mo, 1M events)
3. Be selective — track only high-signal events and disable page-view tracking for low-value pages (e.g., static content pages)

**Recommendation:** Start with the events marked **P0** below. Add P1/P2 only after confirming we're within budget after 1 week.

---

## Event Naming Convention

All custom events use **kebab-case** with a `{entity}-{action}` pattern:

```
job-form-start          ← user begins filling the job form
job-form-submit         ← user clicks submit
job-apply-click         ← visitor clicks the apply button on a job
profile-form-submit     ← user submits a profile
recruiter-register      ← recruiter submits registration
```

Event data properties use **snake_case** to match our API conventions:

```ts
umami.track('job-form-submit', {
  employment_type: 'full_time',
  has_salary: true,
  skill_count: 5,
})
```

---

## Engineering: Tracking Utility

Create a thin wrapper to avoid calling `window.umami` directly and to handle the case where the script hasn't loaded or is blocked.

### File: `selfserve-jobs-customer-web/src/lib/analytics.ts`

```ts
type EventData = Record<string, string | number | boolean>;

export function trackEvent(name: string, data?: EventData): void {
  if (typeof window !== 'undefined' && typeof window.umami !== 'undefined') {
    window.umami.track(name, data);
  }
}
```

### File: `selfserve-jobs-customer-web/src/types/umami.d.ts`

```ts
interface UmamiTracker {
  track(event: string, data?: Record<string, string | number | boolean>): void;
  identify(data: Record<string, string | number | boolean>): void;
}

interface Window {
  umami?: UmamiTracker;
}
```

---

## Event Catalog

### P0 — Core Conversion Events (implement first)

These are the minimum events needed to build meaningful funnels.

| Event Name | Trigger Location | Event Data | Purpose |
|---|---|---|---|
| `job-form-start` | `JobForm.tsx` — on first field focus | `{ source: 'recruiter' \| 'direct' }` | Top of job-posting funnel |
| `job-form-submit` | `JobForm.tsx` — on successful API response | `{ employment_type, has_salary, skill_count, source }` | Job creation conversion |
| `job-form-error` | `JobForm.tsx` — on validation failure | `{ field: string }` | Identify friction in form |
| `profile-form-start` | `ProfileForm.tsx` — on first field focus | — | Top of talent funnel |
| `profile-form-submit` | `ProfileForm.tsx` — on successful API response | `{ has_resume, skill_count, experience_years }` | Profile creation conversion |
| `profile-form-error` | `ProfileForm.tsx` — on validation failure | `{ field: string }` | Identify friction in form |
| `recruiter-register-start` | `recruiter/register/page.tsx` — on first field focus | — | Top of recruiter funnel |
| `recruiter-register-submit` | `recruiter/register/page.tsx` — on successful API response | — | Recruiter registration conversion |
| `email-verify-success` | `verify/page.tsx` — on successful verification | `{ entity_type: 'job' \| 'profile' \| 'recruiter' }` | Verification conversion |
| `email-verify-fail` | `verify/page.tsx` — on error | `{ reason: string }` | Identify expired/invalid links |
| `job-apply-click` | `JobDetail.tsx` — on apply button click | `{ method: 'email' \| 'url' }` | Key engagement signal — did browsing lead to action? |
| `resume-download` | `ProfileDetail.tsx` — on resume button click | — | Recruiter engagement signal |

### P1 — Engagement & Discovery Events

| Event Name | Trigger Location | Event Data | Purpose |
|---|---|---|---|
| `job-search` | `JobFilters.tsx` — on filter apply / search submit | `{ query, country, type, has_skills_filter }` | Understand what users search for |
| `profile-search` | `ProfileFilters.tsx` — on filter apply | `{ query, country, has_skills_filter }` | Understand recruiter search patterns |
| `job-card-click` | `JobCard.tsx` — on card click | `{ job_code, position_in_list }` | CTR from browse to detail |
| `profile-card-click` | `ProfileCard.tsx` — on card click | `{ profile_code, position_in_list }` | CTR from browse to detail |
| `share-click` | `ShareButton.tsx` — on share button click | `{ entity_type, method: 'copy' \| 'native' }` | Virality signal |
| `login-start` | `login/page.tsx` — on form submit | — | Login funnel entry |
| `login-success` | `login/callback/page.tsx` — on successful auth | `{ user_type }` | Login completion |
| `report-submit` | `report/page.tsx` — on successful report | `{ entity_type, reason }` | Abuse signal tracking |

### P2 — Lifecycle & Retention Events

| Event Name | Trigger Location | Event Data | Purpose |
|---|---|---|---|
| `listing-edit` | `manage/[entityType]/[code]/page.tsx` — on save | `{ entity_type }` | Post-creation engagement |
| `listing-deactivate` | `account/page.tsx` — on deactivate click | `{ entity_type }` | Churn signal |
| `listing-reactivate` | `account/page.tsx` — on activate click | `{ entity_type }` | Win-back signal |
| `listing-delete` | `account/page.tsx` — on confirmed delete | `{ entity_type }` | Hard churn |
| `cta-homepage` | `page.tsx` (homepage) — on CTA click | `{ cta: 'post_job' \| 'create_profile' \| 'register_recruiter' \| 'browse_jobs' \| 'browse_talent' }` | Which homepage CTAs drive action |
| `recruiter-approved` | `recruiter/pending/page.tsx` — when poll detects active | — | End of recruiter onboarding funnel |

---

## Funnels to Configure in Umami Dashboard

Umami funnels accept a sequence of **URL paths** and/or **custom event names** as steps. Each step filters visitors who completed all prior steps. Configure these in the Umami Cloud dashboard under **Reports → Funnel**.

### Funnel 1: Talent Profile Creation

Measures: How many visitors who land on the profile form actually create and verify a profile?

| Step | Type | Value |
|------|------|-------|
| 1 | URL | `/profiles/new` |
| 2 | Event | `profile-form-start` |
| 3 | Event | `profile-form-submit` |
| 4 | Event | `email-verify-success` (filter: `entity_type = profile`) |

**Key questions this answers:**
- What % of visitors to `/profiles/new` actually start filling the form?
- What % abandon after starting?
- What % verify their email after submitting?

### Funnel 2: Recruiter Onboarding

Measures: Full recruiter journey from registration to first job post.

| Step | Type | Value |
|------|------|-------|
| 1 | URL | `/recruiter/register` |
| 2 | Event | `recruiter-register-start` |
| 3 | Event | `recruiter-register-submit` |
| 4 | Event | `email-verify-success` (filter: `entity_type = recruiter`) |
| 5 | Event | `recruiter-approved` |
| 6 | Event | `job-form-submit` (filter: `source = recruiter`) |

**Key questions this answers:**
- Where is the biggest recruiter drop-off? (registration vs. verification vs. approval wait vs. first post)
- How many approved recruiters actually post a job?

### Funnel 3: Job Discovery → Application

Measures: Does browsing jobs lead to applications?

| Step | Type | Value |
|------|------|-------|
| 1 | URL | `/jobs` |
| 2 | Event | `job-card-click` |
| 3 | Event | `job-apply-click` |

### Funnel 4: Direct Job Posting (non-recruiter)

Measures: Visitor → job poster conversion for users posting without a recruiter account.

| Step | Type | Value |
|------|------|-------|
| 1 | URL | `/jobs/new` |
| 2 | Event | `job-form-start` (filter: `source = direct`) |
| 3 | Event | `job-form-submit` (filter: `source = direct`) |
| 4 | Event | `email-verify-success` (filter: `entity_type = job`) |

### Funnel 5: Recruiter Profile Discovery → Resume Download

Measures: How effectively do recruiters find and engage with talent?

| Step | Type | Value |
|------|------|-------|
| 1 | URL | `/profiles` |
| 2 | Event | `profile-card-click` |
| 3 | Event | `resume-download` |

---

## Goals to Configure in Umami Dashboard

Goals track cumulative event counts against a target. Configure under **Reports → Goals**.

### Conversion Goals

| Goal Name | Event | Target (monthly) | Notes |
|---|---|---|---|
| Job Listings Created | `job-form-submit` | 50 | Track month-over-month growth |
| Profiles Created | `profile-form-submit` | 100 | Talent-side health metric |
| Recruiters Registered | `recruiter-register-submit` | 20 | Supply-side growth |
| Email Verifications | `email-verify-success` | 150 | Measures verification friction — compare to total submissions |
| Job Applications | `job-apply-click` | 200 | Core marketplace metric — are jobs getting applications? |
| Resume Downloads | `resume-download` | 50 | Are recruiters engaging with profiles? |

### Engagement Goals

| Goal Name | Event / URL | Target (monthly) | Notes |
|---|---|---|---|
| Job Detail Views | URL: `/jobs/*` | 2,000 | Pageview goal — overall interest |
| Profile Detail Views | URL: `/profiles/*` | 1,000 | Are profiles getting discovered? |
| Shares | `share-click` | 100 | Organic distribution metric |

---

## Umami Dashboard Configuration

### Recommended Dashboard Setup

In the Umami Cloud dashboard, pin these widgets for at-a-glance monitoring:

1. **Realtime visitors** (built-in)
2. **Page views over time** (built-in)
3. **Custom events chart** — filter to P0 events only
4. **Referrers** (built-in) — where are users coming from?
5. **Browser & device breakdown** (built-in) — mobile vs. desktop split

### Event Data Exploration

Use **Reports → Insights** to run ad-hoc queries:

- "Show me all `job-form-submit` events grouped by `employment_type`" — which job types are most posted?
- "Show me all `job-apply-click` events grouped by `method`" — do people prefer email or URL applications?
- "Show me all `profile-form-submit` events grouped by `experience_years`" — what experience level is our talent pool?
- "Show me `job-form-error` events grouped by `field`" — which form fields cause the most friction?

### Journey Reports

Use **Reports → Journey** to visualize how users navigate:

- Entry page → where do they go next?
- `/jobs` page → do users go to job detail or leave?
- After login → do users go to `/account`, `/jobs/new`, or browse?

---

## Implementation Plan

### Phase 1: Foundation (P0 events)

1. Create `src/lib/analytics.ts` (tracking utility)
2. Create `src/types/umami.d.ts` (type declarations)
3. Instrument all P0 events listed above
4. Deploy and monitor event volume for 1 week
5. Create Funnels 1–4 in Umami dashboard
6. Create all Conversion Goals in Umami dashboard

### Phase 2: Engagement (P1 events)

1. Add P1 events (search, card clicks, share, login, report)
2. Create Funnel 5 (profile discovery → resume download)
3. Set up Journey reports for key entry pages
4. Review event budget — are we within 100K/month?

### Phase 3: Lifecycle (P2 events)

1. Add P2 events (edit, deactivate, reactivate, delete, homepage CTAs)
2. Add Engagement Goals
3. Set up Insights queries for product decisions
4. Evaluate whether to self-host or upgrade tier

---

## Privacy Considerations

- Umami is privacy-focused — no cookies, no personal data stored, GDPR compliant by default
- Our proxy setup (`/stats/script.js` → `cloud.umami.is/script.js`) prevents most ad blockers from stripping the tracker
- **Do NOT** include PII in event data: no email addresses, no names, no profile/job codes that could identify individuals
- Event data should contain only categorical or numeric properties (e.g., `employment_type: 'full_time'`, `skill_count: 5`)
- The privacy page (`/privacy`) currently says "We do not use tracking cookies or analytics" — this needs updating to disclose Umami (cookieless, privacy-preserving analytics) once events are live

---

## Key Metrics & Questions This Answers

| Question | How to answer |
|---|---|
| Are we getting more job postings over time? | Goal: `Job Listings Created` trend |
| Where do talent users drop off? | Funnel 1: Talent Profile Creation |
| Why do recruiters abandon registration? | Funnel 2: Recruiter Onboarding + `recruiter-register-start` vs `submit` delta |
| Are job listings actually useful? | `job-apply-click` count vs. job detail page views = effective apply rate |
| Which job types are most popular? | Insights: `job-form-submit` grouped by `employment_type` |
| Are recruiters using the platform after approval? | Funnel 2 step 5→6 conversion (approved → first job post) |
| Do users come back? | Journey report: returning visitors pattern |
| Is mobile or desktop more important? | Built-in device breakdown + apply rate by device |
| Which form fields cause abandonment? | `*-form-error` events grouped by `field` |
| What search terms have no results? | `job-search` / `profile-search` event data analysis |
