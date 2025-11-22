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

    const { userId, lat, lng } = await request.json();

    if (!userId || lat === undefined || lng === undefined) {
      return NextResponse.json({ 
        error: 'userId, lat, and lng are required' 
      }, { status: 400 });
    }

    // FIX: Changed 'latitude' -> 'lat' and 'longitude' -> 'lng'
    const { data, error } = await supabase
      .from('locations')
      .upsert({ 
        user_id: userId, 
        lat: lat,   // <--- MATCHES DATABASE COLUMN
        lng: lng,   // <--- MATCHES DATABASE COLUMN
        updated_at: new Date().toISOString() 
      }, { 
        onConflict: 'user_id',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ 
        error: error.message,
        details: error.details,
        hint: error.hint
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Unexpected error in update-location:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}