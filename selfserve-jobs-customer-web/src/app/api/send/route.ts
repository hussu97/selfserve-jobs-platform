import { NextRequest, NextResponse } from 'next/server';

const UMAMI_ENDPOINT = 'https://cloud.umami.is/api/send';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Preserve the user's real IP so Umami can geo-attribute correctly.
    // Without this, all events would appear to originate from Vercel's servers.
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor?.split(',')[0].trim() ?? request.headers.get('x-real-ip') ?? '';
    const ua = request.headers.get('user-agent') ?? '';

    await fetch(UMAMI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': ua,
        ...(ip && { 'X-Forwarded-For': ip }),
      },
      body: JSON.stringify(body),
    });
  } catch {
    // Never let analytics errors surface to the user
  }

  return new NextResponse(null, { status: 204 });
}
