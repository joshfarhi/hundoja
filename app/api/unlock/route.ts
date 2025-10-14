import { NextRequest, NextResponse } from 'next/server';

const LOCK_COOKIE_NAME = 'hundoja_unlocked';
const LOCK_PASSWORD = 'Hundoja2026!!';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (password !== LOCK_PASSWORD) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const res = NextResponse.json({ success: true });

    // Set a short-lived cookie (e.g., 7 days). Adjust as needed.
    res.cookies.set(LOCK_COOKIE_NAME, '1', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}


