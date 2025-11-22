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

    const { userId, email, name, avatar_url } = await request.json();

    if (!userId || !email) {
      return NextResponse.json({ error: 'userId and email are required' }, { status: 400 });
    }
    // Upsert user
    const { error: userError } = await supabase
      .from('users')
      .upsert({ 
        id: userId,
        email: email,
        name: name || email.split('@')[0],
        avatar_url: avatar_url || null,
        last_active: new Date().toISOString()
      }, { onConflict: 'id' });

    if (userError) {
      console.error('Error upserting user:', userError);
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    // Check if profiles exist, if not create default ones
    const { data: existingProfiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (!existingProfiles || existingProfiles.length === 0) {
      // Create default professional profile
      const { error: proError } = await supabase
        .from('profiles')
        .insert({
          id: `p_${userId}_professional`, // Generate ID
          user_id: userId,
          profile_type: 'professional',
          headline: 'New Professional',
          bio: '',
          visibility: 'nearby',
          experience: [],
          education: [],
          skills: [],
          hobbies: [],
          prompts: [],
          open_to_work: false
        });

      if (proError) {
        console.error('Error creating professional profile:', proError);
      }

      // Create default personal profile
      const { error: persError } = await supabase
        .from('profiles')
        .insert({
          id: `p_${userId}_personal`, // Generate ID
          user_id: userId,
          profile_type: 'personal',
          headline: 'New User',
          bio: '',
          visibility: 'nearby',
          experience: [],
          education: [],
          skills: [],
          hobbies: [],
          prompts: [],
          open_to_work: false
        });

      if (persError) {
        console.error('Error creating personal profile:', persError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error syncing user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

