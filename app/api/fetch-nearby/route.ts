import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // Validate inputs
  const latStr = searchParams.get('lat');
  const lngStr = searchParams.get('lng');
  const radiusStr = searchParams.get('radius');

  if (!latStr || !lngStr) {
    return NextResponse.json({ error: 'Missing lat or lng' }, { status: 400 });
  }

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);
  const radius = parseFloat(radiusStr || '1000'); // Default 1km

  // Initialize Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Call the PostGIS RPC function we created in SQL
    // This returns only the user_ids and distances within range
    const { data: nearbyLocs, error: rpcError } = await supabase
      .rpc('get_nearby_locations', {
        p_lat: lat,
        p_lng: lng,
        p_radius_meters: radius
      });

    if (rpcError) {
      console.error('RPC Error:', rpcError);
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    if (!nearbyLocs || nearbyLocs.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // 2. Extract the User IDs to fetch profile details
    const userIds = nearbyLocs.map((loc: any) => loc.user_id);

    // 3. Fetch Profile Data (Name, Avatar, etc.) for these specific users
    // note: make sure you have a 'profiles' table. If not, change this to 'users' or whatever stores names.
    const { data: profiles, error: profileError } = await supabase
      .from('profiles') 
      .select('*')
      .in('id', userIds);

    if (profileError) {
      console.error('Profile Fetch Error:', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // 4. Merge the Distance data with the Profile data
    const results = nearbyLocs.map((loc: any) => {
      const profile = profiles?.find((p: any) => p.id === loc.user_id);
      return {
        ...profile, // user name, avatar, job, etc.
        lat: loc.lat,
        lng: loc.lng,
        distance_meters: loc.dist_meters // Calculated by PostGIS
      };
    });

    return NextResponse.json({ data: results });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}