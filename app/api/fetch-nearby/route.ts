import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat')!);
  const lng = parseFloat(searchParams.get('lng')!);
  const radius = parseFloat(searchParams.get('radius')!) || 1000;
  const userId = searchParams.get('userId'); // Exclude current user from results

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Calculate bounding box to reduce query size
  // Approximate: 1 degree latitude ≈ 111km, 1 degree longitude ≈ 111km * cos(latitude)
  const latOffset = radius / 111000; // Convert meters to degrees
  const lngOffset = radius / (111000 * Math.cos(lat * Math.PI / 180));

  // Try PostGIS first (if available), otherwise use bounding box + Haversine
  let locations;
  
  try {
    // Check if PostGIS is available by trying a PostGIS query
    // If PostGIS extension is enabled, use ST_DWithin for efficient distance filtering
    const { data: postgisData, error: postgisError } = await supabase.rpc('get_nearby_locations', {
      center_lat: lat,
      center_lng: lng,
      radius_meters: radius
    });

    if (!postgisError && postgisData) {
      locations = postgisData;
    } else {
      // Fallback to bounding box + Haversine
      const { data: bboxData, error: bboxError } = await supabase
        .from('locations')
        .select(`
          user_id, 
          latitude, 
          longitude, 
          updated_at,
          users!inner(id, name, email, avatar_url, last_active),
          profiles!inner(id, user_id, profile_type, name, headline, bio, visibility, experience, education, skills, hobbies, prompts, linkedin_url, github_url, instagram_handle, open_to_work, relationship_goal)
        `)
        .gte('latitude', lat - latOffset)
        .lte('latitude', lat + latOffset)
        .gte('longitude', lng - lngOffset)
        .lte('longitude', lng + lngOffset)
        .neq('user_id', userId || ''); // Exclude current user

      if (bboxError) {
        return NextResponse.json({ error: bboxError.message }, { status: 500 });
      }

      // Filter by visibility and calculate exact distance using Haversine
      const nearby = (bboxData || []).filter((loc: any) => {
        // Only include profiles with 'public' or 'nearby' visibility
        if (loc.profiles && loc.profiles.length > 0) {
          const profile = loc.profiles[0];
          if (profile.visibility === 'private') return false;
        }
        
        // Calculate exact distance
        const distance = getDistanceFromLatLonInMeters(lat, lng, loc.latitude, loc.longitude);
        return distance <= radius;
      }).map((loc: any) => {
        const distance = getDistanceFromLatLonInMeters(lat, lng, loc.latitude, loc.longitude);
        const profile = loc.profiles && loc.profiles.length > 0 ? loc.profiles[0] : null;
        const user = loc.users || null;
        
        if (!user || !profile) return null;

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
            latitude: loc.latitude,
            longitude: loc.longitude,
            updated_at: loc.updated_at
          },
          distance: Math.round(distance)
        };
      }).filter((item: any) => item !== null);

      return NextResponse.json({ data: nearby });
    }
  } catch (error: any) {
    // If PostGIS RPC doesn't exist, fall back to bounding box method
    const { data: bboxData, error: bboxError } = await supabase
      .from('locations')
      .select(`
        user_id, 
        latitude, 
        longitude, 
        updated_at,
        users!inner(id, name, email, avatar_url, last_active),
        profiles!inner(id, user_id, profile_type, name, headline, bio, visibility, experience, education, skills, hobbies, prompts, linkedin_url, github_url, instagram_handle, open_to_work, relationship_goal)
      `)
      .gte('latitude', lat - latOffset)
      .lte('latitude', lat + latOffset)
      .gte('longitude', lng - lngOffset)
      .lte('longitude', lng + lngOffset)
      .neq('user_id', userId || '');

    if (bboxError) {
      return NextResponse.json({ error: bboxError.message }, { status: 500 });
    }

    // Filter by visibility and calculate exact distance using Haversine
    const nearby = (bboxData || []).filter((loc: any) => {
      if (loc.profiles && loc.profiles.length > 0) {
        const profile = loc.profiles[0];
        if (profile.visibility === 'private') return false;
      }
      const distance = getDistanceFromLatLonInMeters(lat, lng, loc.latitude, loc.longitude);
      return distance <= radius;
    }).map((loc: any) => {
      const distance = getDistanceFromLatLonInMeters(lat, lng, loc.latitude, loc.longitude);
      const profile = loc.profiles && loc.profiles.length > 0 ? loc.profiles[0] : null;
      const user = loc.users || null;
      
      if (!user || !profile) return null;

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
          latitude: loc.latitude,
          longitude: loc.longitude,
          updated_at: loc.updated_at
        },
        distance: Math.round(distance)
      };
    }).filter((item: any) => item !== null);

    return NextResponse.json({ data: nearby });
  }

  return NextResponse.json({ data: locations || [] });
}

function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  // Haversine formula implementation
  const R = 6371e3; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}