import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'hirebridge — UAE Jobs & Talent, No Signup Required';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#fcf9f5',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
        }}
      >
        {/* Logo */}
        <div
          style={{
            fontSize: '30px',
            fontStyle: 'italic',
            color: '#384B3B',
            fontFamily: 'serif',
            letterSpacing: '-0.5px',
          }}
        >
          hirebridge
        </div>

        {/* Headline block */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div
            style={{
              fontSize: '11px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#8BA888',
              fontFamily: 'sans-serif',
            }}
          >
            UAE Jobs &amp; Talent
          </div>
          <div
            style={{
              fontSize: '76px',
              fontWeight: '600',
              color: '#1c1c1a',
              lineHeight: '1.05',
              letterSpacing: '-2px',
              fontFamily: 'serif',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '18px',
            }}
          >
            <span>Find</span>
            <span style={{ color: '#8C4E32', fontStyle: 'italic' }}>Extraordinary</span>
            <span>Talent</span>
          </div>
          <div
            style={{
              fontSize: '24px',
              color: '#434843',
              fontFamily: 'sans-serif',
              fontWeight: '400',
              lineHeight: '1.45',
              maxWidth: '700px',
            }}
          >
            Post jobs and talent profiles across Dubai, Abu Dhabi, and the Emirates — no account needed.
          </div>
        </div>

        {/* Bottom row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            {['Dubai Jobs', 'Abu Dhabi', 'All Industries', 'No Signup'].map((tag) => (
              <div
                key={tag}
                style={{
                  background: '#8BA888',
                  color: '#ffffff',
                  padding: '7px 18px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontFamily: 'sans-serif',
                  fontWeight: '600',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {tag}
              </div>
            ))}
          </div>
          <div
            style={{
              fontSize: '18px',
              color: '#8C4E32',
              fontFamily: 'sans-serif',
              fontWeight: '500',
            }}
          >
            hirebridgeuae.com
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
