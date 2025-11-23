import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Fetch connections where user is either sender or recipient
    const { data: connections, error } = await supabase
      .from('connections')
      .select('*')
      .or(`from_user.eq.${userId},to_user.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching connections:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get unique user IDs
    const userIds = new Set<string>();
    (connections || []).forEach((conn: any) => {
      userIds.add(conn.from_user);
      userIds.add(conn.to_user);
    });

    // Fetch user data for all involved users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, avatar_url, last_active')
      .in('id', Array.from(userIds));

    if (usersError) {
      console.error('Error fetching users:', usersError);
    }

    // Create a map of user data
    const usersMap = new Map();
    (users || []).forEach((user: any) => {
      usersMap.set(user.id, user);
    });

    // Transform the data to match the expected format
    const transformed = (connections || []).map((conn: any) => {
      const isSender = conn.from_user === userId;
      const peerId = isSender ? conn.to_user : conn.from_user;
      const peer = usersMap.get(peerId) || null;
      
      return {
        id: conn.id,
        from_user: conn.from_user,
        to_user: conn.to_user,
        profile_type: conn.profile_type,
        message: conn.message,
        status: conn.status,
        proposed_meetup: conn.proposed_meetup,
        created_at: conn.created_at,
        updated_at: conn.updated_at,
        peer: peer
      };
    });

    return NextResponse.json({ data: transformed });
  } catch (error: any) {
    console.error('Error getting connections:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

