import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // 1. Validate Env Vars
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Server config error: Missing keys' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 2. Parse & Validate Params
  const latStr = searchParams.get('lat');
  const lngStr = searchParams.get('lng');
  const radiusStr = searchParams.get('radius');
  const currentUserId = searchParams.get('userId');

  if (!latStr || !lngStr) {
    return NextResponse.json({ error: 'Missing lat or lng' }, { status: 400 });
  }

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);
  const radius = parseFloat(radiusStr || '1000');

  try {
    // Calculate bounding box to reduce query size
    // Approximate: 1 degree latitude ≈ 111km, 1 degree longitude ≈ 111km * cos(latitude)
    const latOffset = radius / 111000; // Convert meters to degrees
    const lngOffset = radius / (111000 * Math.cos(lat * Math.PI / 180));

    // Fetch locations within bounding box using lat/lng column names
    // Join through users table since locations and profiles both reference users
    const { data: bboxData, error: bboxError } = await supabase
      .from('locations')
      .select(`
        user_id, 
        lat, 
        lng, 
        updated_at,
        users!inner(id, name, email, avatar_url, last_active)
      `)
      .gte('lat', lat - latOffset)
      .lte('lat', lat + latOffset)
      .gte('lng', lng - lngOffset)
      .lte('lng', lng + lngOffset)
      .neq('user_id', currentUserId || ''); // Exclude current user

    if (bboxError) {
      console.error('Bounding box query error:', bboxError);
      return NextResponse.json({ error: bboxError.message }, { status: 500 });
    }

    // Haversine distance calculation function
    const getDistanceFromLatLonInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371e3; // Earth's radius in meters
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    // Get user IDs from locations
    const userIds = (bboxData || []).map((loc: any) => loc.user_id).filter(Boolean);
    
    if (userIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Fetch profiles for these users (get one profile per user - prefer professional, fallback to personal)
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('user_id', userIds)
      .in('visibility', ['public', 'nearby']); // Only get visible profiles

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    // Group profiles by user_id
    const profilesByUserId = new Map();
    (profilesData || []).forEach((profile: any) => {
      if (!profilesByUserId.has(profile.user_id)) {
        profilesByUserId.set(profile.user_id, profile);
      } else {
        // Prefer professional over personal
        const existing = profilesByUserId.get(profile.user_id);
        if (profile.profile_type === 'professional' && existing.profile_type === 'personal') {
          profilesByUserId.set(profile.user_id, profile);
        }
      }
    });

    // Filter by visibility and calculate exact distance using Haversine
    const nearby = (bboxData || []).map((loc: any) => {
      const profile = profilesByUserId.get(loc.user_id);
      const user = loc.users || null;
      
      if (!user || !profile) return null;
      
      // Calculate exact distance
      const distance = getDistanceFromLatLonInMeters(lat, lng, loc.lat, loc.lng);
      
      // Filter by radius
      if (distance > radius) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        last_active: user.last_active,
        profile: profile,
        location: {
          id: loc.id || `${loc.user_id}_loc`,
          user_id: loc.user_id,
          latitude: loc.lat,  // Map to latitude for frontend compatibility
          longitude: loc.lng, // Map to longitude for frontend compatibility
          updated_at: loc.updated_at
        },
        distance: Math.round(distance)
      };
    }).filter((item: any) => item !== null);

    return NextResponse.json({ data: nearby });

  } catch (error: any) {
    console.error("Unexpected API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}