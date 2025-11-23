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

    const connection = await request.json();

    if (!connection.from_user || !connection.to_user || !connection.message) {
      return NextResponse.json({ 
        error: 'from_user, to_user, and message are required' 
      }, { status: 400 });
    }

    // Ensure ID is set
    if (!connection.id) {
      connection.id = `conn_${connection.from_user}_${connection.to_user}_${Date.now()}`;
    }

    // Upsert connection
    const { data, error } = await supabase
      .from('connections')
      .upsert({
        id: connection.id,
        from_user: connection.from_user,
        to_user: connection.to_user,
        profile_type: connection.profile_type || 'professional',
        message: connection.message,
        status: connection.status || 'pending',
        proposed_meetup: connection.proposed_meetup || null,
        created_at: connection.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.error('Error saving connection:', error);
      return NextResponse.json({ 
        error: error.message,
        details: error.details,
        hint: error.hint
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Unexpected error in send-connection:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}


