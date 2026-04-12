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
          background: '#141a14',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 80px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* UAE flag colour bars — decorative left edge */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '8px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, background: '#00732F' }} />
          <div style={{ flex: 1, background: '#ffffff' }} />
          <div style={{ flex: 1, background: '#000000' }} />
        </div>

        {/* Red accent bar full height */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: '#FF0000' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            style={{
              fontSize: '28px',
              fontStyle: 'italic',
              color: '#f0ede8',
              fontFamily: 'serif',
              letterSpacing: '-0.3px',
            }}
          >
            hirebridge
          </div>
          <div
            style={{
              fontSize: '11px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#8BA888',
              fontFamily: 'sans-serif',
            }}
          >
            Free · No Signup Required
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              fontSize: '11px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#8BA888',
              fontFamily: 'sans-serif',
            }}
          >
            Supporting our community in times of change
          </div>
          <div
            style={{
              fontSize: '78px',
              fontWeight: '600',
              color: '#f0ede8',
              lineHeight: '1.0',
              letterSpacing: '-2px',
              fontFamily: 'serif',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span>Your Talent is</span>
            <span style={{ color: '#8BA888', fontStyle: 'italic' }}>Still Your Power.</span>
          </div>
          <div
            style={{
              fontSize: '22px',
              color: '#9a9e99',
              fontFamily: 'sans-serif',
              fontWeight: '400',
              lineHeight: '1.4',
              maxWidth: '680px',
            }}
          >
            A free UAE job board — no algorithms, no spam, no account needed.
          </div>
        </div>

        {/* Bottom */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            {['Dubai', 'Abu Dhabi', 'All Industries', 'Always Free'].map((tag) => (
              <div
                key={tag}
                style={{
                  background: 'rgba(139,168,136,0.15)',
                  color: '#8BA888',
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
              fontSize: '17px',
              color: '#8BA888',
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
