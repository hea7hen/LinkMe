import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json({ 
        error: 'Server configuration error: Missing Supabase credentials' 
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const profile = await request.json();

    if (!profile.user_id || !profile.profile_type) {
      return NextResponse.json({ error: 'user_id and profile_type are required' }, { status: 400 });
    }
    // Upsert profile
    const { error } = await supabase
      .from('profiles')
      .upsert(profile, { onConflict: 'id' });

    if (error) {
      console.error('Error upserting profile:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

