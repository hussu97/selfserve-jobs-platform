import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'hirebridge — UAE Tech Jobs & Talent, No Signup Required';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
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
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '64px' }}>
          <span style={{ fontSize: 32, fontStyle: 'italic', color: '#384B3B', fontFamily: 'serif' }}>
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
            Free · No Signup Required
          </span>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p
            style={{
              fontSize: 13,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#8BA888',
              fontFamily: 'sans-serif',
              marginBottom: '20px',
            }}
          >
            UAE Tech Jobs &amp; Talent
          </p>
          <h1
            style={{
              fontSize: 72,
              color: '#384B3B',
              fontFamily: 'serif',
              fontStyle: 'italic',
              lineHeight: 1.1,
              marginBottom: '32px',
            }}
          >
            Find <span style={{ color: '#8C4E32' }}>Extraordinary</span> Talent
          </h1>
          <p
            style={{
              fontSize: 22,
              color: '#434843',
              fontFamily: 'sans-serif',
              lineHeight: 1.5,
              maxWidth: '680px',
            }}
          >
            Post jobs and talent profiles across Dubai, Abu Dhabi, and the Emirates — no account needed.
          </p>
        </div>

        {/* Tag pills row */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '32px', flexWrap: 'wrap' }}>
          {['Dubai Jobs', 'Abu Dhabi', 'Tech Roles', 'Remote UAE', 'Talent Profiles'].map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 12,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#384B3B',
                backgroundColor: '#8BA888',
                padding: '6px 14px',
                borderRadius: '999px',
                fontFamily: 'sans-serif',
              }}
            >
              {tag}
            </span>
          ))}
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
            hirebridgeuae.com · No fees · No middlemen · No algorithms
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
