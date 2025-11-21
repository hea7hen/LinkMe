import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat')!);
  const lng = parseFloat(searchParams.get('lng')!);
  const radius = parseFloat(searchParams.get('radius')!) || 1000;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Get visible users from DB
  // Note: Using a Postgres function for haversine is more performant in production,
  // but for this scaffold, we fetch generic nearby box and filter in JS or use PostGIS.
  // Assuming a simple 'locations' fetch for now.
  
  const { data: locations, error } = await supabase
    .from('locations')
    .select('user_id, latitude, longitude, users(id, name, avatar_url), profiles(*)');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 2. Calculate distance and filter
  const nearby = locations.filter(loc => {
     const d = getDistanceFromLatLonInMeters(lat, lng, loc.latitude, loc.longitude);
     return d <= radius;
  });

  return NextResponse.json({ data: nearby });
}

function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  // Haversine implementation
  const R = 6371e3; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}