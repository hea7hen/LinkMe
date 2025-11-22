import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const profileType = searchParams.get('profileType');

  if (!userId || !profileType) {
    return NextResponse.json({ error: 'userId and profileType are required' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('profile_type', profileType)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching profile:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If no profile exists, return null (client will create default)
    return NextResponse.json({ data: data || null });
  } catch (error: any) {
    console.error('Error getting profile:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

