import { ImageResponse } from 'next/og';
import { getJob } from '@/lib/api';

export const runtime = 'edge';
export const alt = 'Job listing on hirebridge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface Props {
  params: Promise<{ jobCode: string }>;
}

export default async function Image({ params }: Props) {
  const { jobCode } = await params;

  let jobTitle = 'Job Listing';
  let companyName = 'hirebridge';
  let location = '';
  let employmentType = '';
  let skills: string[] = [];

  try {
    const job = await getJob(jobCode);
    jobTitle = job.job_title;
    companyName = job.company_name;
    location = `${job.company_city}, ${job.company_country}`;
    employmentType = job.employment_type.replace('_', ' ');
    skills = job.key_skills.slice(0, 4);
  } catch {
    // fallback to defaults above
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#fcf9f5',
          padding: '64px',
          fontFamily: 'serif',
        }}
      >
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '48px' }}>
          <span style={{ fontSize: 28, fontStyle: 'italic', color: '#384B3B', fontFamily: 'serif' }}>
            hirebridge
          </span>
          <div style={{ flex: 1 }} />
          <span
            style={{
              fontSize: 11,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#8BA888',
              fontFamily: 'sans-serif',
            }}
          >
            Free Job Board
          </span>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Company name */}
          <p
            style={{
              fontSize: 20,
              color: '#8C4E32',
              fontFamily: 'sans-serif',
              marginBottom: '16px',
              fontWeight: 600,
            }}
          >
            {companyName}
          </p>

          {/* Job title */}
          <h1
            style={{
              fontSize: jobTitle.length > 40 ? 52 : 64,
              color: '#384B3B',
              fontFamily: 'serif',
              fontStyle: 'italic',
              lineHeight: 1.1,
              marginBottom: '28px',
            }}
          >
            {jobTitle}
          </h1>

          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
            {location && (
              <span style={{ fontSize: 16, color: '#434843', fontFamily: 'sans-serif' }}>
                {location}
              </span>
            )}
            {employmentType && (
              <span
                style={{
                  fontSize: 12,
                  color: '#384B3B',
                  fontFamily: 'sans-serif',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  backgroundColor: '#d2e8d3',
                  padding: '4px 12px',
                  borderRadius: '999px',
                }}
              >
                {employmentType}
              </span>
            )}
          </div>

          {/* Skills */}
          {skills.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {skills.map((skill) => (
                <span
                  key={skill}
                  style={{
                    fontSize: 12,
                    color: '#384B3B',
                    fontFamily: 'sans-serif',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    backgroundColor: '#8BA888',
                    padding: '4px 12px',
                    borderRadius: '999px',
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            paddingTop: '24px',
            borderTop: '1px solid #c3c8c0',
          }}
        >
          <span style={{ fontSize: 13, color: '#434843', fontFamily: 'sans-serif' }}>
            hirebridgeuae.com · No signup required · No middlemen
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
