// app/api/auth/google/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    // 1. Create a Supabase client
    const cookieStore = cookies();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          flowType: 'pkce',
          detectSessionInUrl: false,
        },
      }
    );

    // 2. Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 3. Login successful -> Redirect to Home
      return NextResponse.redirect(`${requestUrl.origin}/`);
    }
  }

  // 4. Login failed -> Redirect to Home with error
  return NextResponse.redirect(`${requestUrl.origin}/?error=auth_failed`);
}