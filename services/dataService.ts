import { createClient } from '@supabase/supabase-js';
import { NearbyUser, Connection, Message, User, Profile, Location } from '../types';
import { getDistanceFromLatLonInMeters } from '../utils/haversine';

// --- CONFIG ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- MOCK DATA STORE (LocalStorage persistence for demo) ---
const STORAGE_KEY = 'linkme_mock_db_v2';

const SEEDED_DB = {
  users: [
    { id: 'me', email: 'me@demo.com', name: 'Demo User', avatar_url: 'https://api.dicebear.com/7.x/micah/svg?seed=me' },
    { id: '1', email: 'aman@example.com', name: 'Aman Roy', avatar_url: 'https://api.dicebear.com/7.x/micah/svg?seed=aman' },
    { id: '2', email: 'maya@example.com', name: 'Maya Sen', avatar_url: 'https://api.dicebear.com/7.x/micah/svg?seed=maya' },
    { id: '3', email: 'elara@tech.com', name: 'Elara Vance', avatar_url: 'https://api.dicebear.com/7.x/micah/svg?seed=elara' },
  ] as User[],
  profiles: [
    { 
      id: 'p_me_pro', user_id: 'me', profile_type: 'professional', headline: 'Full Stack Developer', bio: 'Building things.', visibility: 'nearby',
      experience: [{ company: 'Freelance', role: 'Dev', from: '2020', to: 'Present' }], education: [], socials: {}, hobbies: []
    },
    { 
      id: 'p_me_pers', user_id: 'me', profile_type: 'personal', headline: 'Coffee enthusiast', bio: 'Love running and espresso.', visibility: 'nearby',
      experience: [], education: [], socials: {}, hobbies: ['Running', 'Coffee']
    },
    {
      id: 'p1', user_id: '1', profile_type: 'professional', headline: 'Product Manager @ Beacon Labs', bio: 'Building tools for the future of work.', visibility: 'nearby',
      experience: [{ company: 'Beacon Labs', role: 'PM', from: '2021', to: 'Present' }], education: [], socials: {}, hobbies: []
    },
    {
      id: 'p2', user_id: '2', profile_type: 'personal', headline: 'Hiking & Photography', bio: 'Looking for hiking buddies for upstate trails.', visibility: 'nearby',
      experience: [], education: [], socials: { instagram: '@maya_hikes' }, hobbies: ['Hiking', 'Photography']
    },
     {
      id: 'p3', user_id: '3', profile_type: 'professional', headline: 'UX Researcher', bio: 'Specializing in proximity interactions.', visibility: 'nearby',
      experience: [{ company: 'Google', role: 'Researcher', from: '2019', to: '2023' }], education: [], socials: {}, hobbies: []
    }
  ] as Profile[],
  locations: [
    { id: 'l1', user_id: '1', latitude: 40.7160, longitude: -74.0090, updated_at: new Date().toISOString() },
    { id: 'l2', user_id: '2', latitude: 40.7110, longitude: -74.0020, updated_at: new Date().toISOString() },
    { id: 'l3', user_id: '3', latitude: 40.7140, longitude: -74.0060, updated_at: new Date().toISOString() },
  ] as Location[],
  connections: [] as Connection[],
  messages: [] as Message[],
};

const getMockDB = () => {
  if (typeof window === 'undefined') return SEEDED_DB;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEEDED_DB));
    return SEEDED_DB;
  }
  return JSON.parse(stored);
};

const updateMockDB = (newData: any) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
};

// --- SERVICE METHODS ---

export const dataService = {
  // Fetch users nearby
  async fetchNearby(lat: number, lng: number, radius: number): Promise<NearbyUser[]> {
    // Try Supabase (commented out to ensure fallback works in preview)
    // const { data, error } = await supabase.rpc('fetch_nearby_users', { lat, lng, radius });
    // if (!error && data) return data;

    // Mock Implementation
    const db = getMockDB();
    const nearby: NearbyUser[] = [];
    
    db.locations.forEach((loc: Location) => {
      const dist = getDistanceFromLatLonInMeters(lat, lng, loc.latitude, loc.longitude);
      if (dist <= radius) {
        const user = db.users.find((u: User) => u.id === loc.user_id);
        // Logic to pick the "Active" profile type. For now, return both or default to professional if exists
        const profile = db.profiles.find((p: Profile) => p.user_id === loc.user_id && p.visibility !== 'private');
        
        if (user && profile) {
          nearby.push({ ...user, profile, location: loc, distance: dist });
        }
      }
    });
    
    return new Promise(resolve => setTimeout(() => resolve(nearby), 600)); // Simulate network
  },

  // Get my profile
  async getMyProfile(userId: string, type: 'professional' | 'personal'): Promise<Profile | undefined> {
    const db = getMockDB();
    const p = db.profiles.find((p: Profile) => p.user_id === userId && p.profile_type === type);
    return Promise.resolve(p);
  },

  // Update profile
  async updateProfile(profile: Profile): Promise<void> {
    const db = getMockDB();
    const idx = db.profiles.findIndex((p: Profile) => p.id === profile.id);
    if (idx !== -1) {
      db.profiles[idx] = profile;
      updateMockDB(db);
    }
    return Promise.resolve();
  },

  // Connections
  async getConnections(userId: string): Promise<Connection[]> {
    const db = getMockDB();
    const connections = db.connections.filter((c: Connection) => c.from_user === userId || c.to_user === userId);
    
    // Hydrate with peer info
    const hydrated = connections.map((c: Connection) => {
      const peerId = c.from_user === userId ? c.to_user : c.from_user;
      const peer = db.users.find((u: User) => u.id === peerId);
      const peerProfile = db.profiles.find((p: Profile) => p.user_id === peerId && p.profile_type === c.profile_type); // Simplified
      return { ...c, peer, peer_profile: peerProfile };
    });
    
    return Promise.resolve(hydrated);
  },

  async sendConnectionRequest(conn: Partial<Connection>): Promise<void> {
    const db = getMockDB();
    const newConn = {
        ...conn,
        id: crypto.randomUUID(),
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    db.connections.push(newConn);
    updateMockDB(db);
    return Promise.resolve();
  },

  async updateConnectionStatus(connId: string, status: 'accepted' | 'rejected'): Promise<void> {
    const db = getMockDB();
    const idx = db.connections.findIndex((c: Connection) => c.id === connId);
    if (idx !== -1) {
        db.connections[idx].status = status;
        updateMockDB(db);
    }
    return Promise.resolve();
  },

  // Messages
  async getMessages(connId: string): Promise<Message[]> {
    const db = getMockDB();
    return Promise.resolve(db.messages.filter((m: Message) => m.connection_id === connId).sort((a:Message, b:Message) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
  },

  async sendMessage(connId: string, senderId: string, text: string): Promise<Message> {
    const db = getMockDB();
    const msg: Message = {
        id: crypto.randomUUID(),
        connection_id: connId,
        sender_id: senderId,
        text,
        created_at: new Date().toISOString()
    };
    db.messages.push(msg);
    updateMockDB(db);
    return Promise.resolve(msg);
  }
};
