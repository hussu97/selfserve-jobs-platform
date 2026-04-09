import { ImageResponse } from 'next/og';
import { getProfile } from '@/lib/api';

export const runtime = 'edge';
export const alt = 'Candidate profile on jobs4u';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface Props {
  params: Promise<{ profileCode: string }>;
}

export default async function Image({ params }: Props) {
  const { profileCode } = await params;

  let personName = 'Candidate Profile';
  let currentTitle = '';
  let location = '';
  let experience = '';
  let skills: string[] = [];

  try {
    const profile = await getProfile(profileCode);
    personName = profile.person_name;
    currentTitle = profile.current_title;
    location = `${profile.current_city}, ${profile.current_country}`;
    experience = `${profile.years_of_experience} yr${profile.years_of_experience !== 1 ? 's' : ''} experience`;
    skills = profile.key_skills.slice(0, 4);
  } catch {
    // fallback to defaults above
  }

  const initials = personName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

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
            jobs4u
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
            Candidate Profile
          </span>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '48px' }}>
          {/* Avatar */}
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              backgroundColor: '#d2e8d3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 44,
              color: '#384B3B',
              fontFamily: 'serif',
              fontStyle: 'italic',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>

          {/* Info */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {/* Title */}
            {currentTitle && (
              <p
                style={{
                  fontSize: 18,
                  color: '#8C4E32',
                  fontFamily: 'sans-serif',
                  marginBottom: '12px',
                  fontWeight: 600,
                }}
              >
                {currentTitle}
              </p>
            )}

            {/* Name */}
            <h1
              style={{
                fontSize: personName.length > 24 ? 52 : 64,
                color: '#384B3B',
                fontFamily: 'serif',
                fontStyle: 'italic',
                lineHeight: 1.1,
                marginBottom: '24px',
              }}
            >
              {personName}
            </h1>

            {/* Meta row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
              {location && (
                <span style={{ fontSize: 16, color: '#434843', fontFamily: 'sans-serif' }}>
                  {location}
                </span>
              )}
              {experience && (
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
                  {experience}
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
            jobs4u.app · No signup required · No middlemen
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
