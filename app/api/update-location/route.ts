import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Note: In a real Next.js app, this runs server-side
export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { userId, lat, lng } = await request.json();

  // Upsert location
  const { error } = await supabase
    .from('locations')
    .upsert({ 
      user_id: userId, 
      latitude: lat, 
      longitude: lng,
      updated_at: new Date().toISOString() 
    }, { onConflict: 'user_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}