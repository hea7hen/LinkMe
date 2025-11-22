import { createClient } from '@supabase/supabase-js';
import { NearbyUser, Connection, Message, User, Profile, Location } from '../types';
import { getDistanceFromLatLonInMeters } from '../utils/haversine';

// --- CONFIG ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- MOCK DATA STORE (LocalStorage persistence for demo) ---
const STORAGE_KEY = 'linkme_mock_db_v5';

// Pre-seeded rich data for the "Demo User" ('me')
const SEEDED_DB = {
  users: [
    { id: 'me', email: 'demo@linkme.com', name: 'Demo User', avatar_url: 'https://api.dicebear.com/7.x/micah/svg?seed=me' },
    { id: '1', email: 'aman@example.com', name: 'Aman Roy', avatar_url: 'https://api.dicebear.com/7.x/micah/svg?seed=aman' },
    { id: '2', email: 'maya@example.com', name: 'Maya Sen', avatar_url: 'https://api.dicebear.com/7.x/micah/svg?seed=maya' },
    { id: '3', email: 'elara@tech.com', name: 'Elara Vance', avatar_url: 'https://api.dicebear.com/7.x/micah/svg?seed=elara' },
  ] as User[],
  profiles: [
    { 
      id: 'p_me_pro', user_id: 'me', profile_type: 'professional', headline: 'Senior Product Designer', bio: 'Obsessed with Swiss design and functional minimalism.', visibility: 'nearby',
      experience: [
          { company: 'Studio Alpha', role: 'Lead Designer', from: '2021', to: 'Present' },
          { company: 'Freelance', role: 'UI/UX Consultant', from: '2019', to: '2021' }
      ], 
      education: [{ institution: 'Parsons', degree: 'BFA Design', year: '2018' }], 
      skills: ['Figma', 'React', 'Design Systems', 'Prototyping'], 
      open_to_work: true,
      linkedin_url: 'linkedin.com/in/demo',
      hobbies: [], prompts: []
    },
    { 
      id: 'p_me_pers', user_id: 'me', profile_type: 'personal', headline: 'Coffee & Marathons', bio: 'Training for the NYC marathon. Always looking for new espresso spots.', visibility: 'nearby',
      experience: [], education: [], 
      hobbies: ['Running', 'Espresso', 'Architecture', 'Vinyl'], 
      prompts: [
          {question: 'A perfect Sunday is...', answer: 'Running 10k then finding the perfect bagel.'},
          {question: 'I geek out on...', answer: 'Mid-century furniture.'}
      ], 
      relationship_goal: 'friends',
      instagram_handle: '@demo_runs'
    },
    {
      id: 'p1', user_id: '1', profile_type: 'professional', headline: 'Product Manager @ Beacon Labs', bio: 'Building tools for the future of work.', visibility: 'nearby',
      experience: [{ company: 'Beacon Labs', role: 'PM', from: '2021', to: 'Present' }], education: [], skills: ['Product Strategy', 'Agile', 'Jira'], linkedin_url: 'linkedin.com/aman', open_to_work: false,
      hobbies: [], prompts: []
    },
    {
      id: 'p2', user_id: '2', profile_type: 'personal', headline: 'Hiking & Photography', bio: 'Looking for hiking buddies for upstate trails.', visibility: 'nearby',
      experience: [], education: [], instagram_handle: '@maya_hikes', hobbies: ['Hiking', 'Photography', 'Nature'], relationship_goal: 'networking',
      prompts: [{question: 'My secret talent is...', answer: 'Finding the best sunset spots.'}]
    },
     {
      id: 'p3', user_id: '3', profile_type: 'professional', headline: 'UX Researcher', bio: 'Specializing in proximity interactions.', visibility: 'nearby',
      experience: [{ company: 'Google', role: 'Researcher', from: '2019', to: '2023' }], education: [], skills: ['Figma', 'User Testing'], open_to_work: true,
      hobbies: [], prompts: []
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
  // Fetch users nearby from Supabase API
  async fetchNearby(lat: number, lng: number, radius: number, userId?: string): Promise<NearbyUser[]> {
    try {
      // Try to fetch from Supabase API first
      const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        radius: radius.toString(),
      });
      if (userId) {
        params.append('userId', userId);
      }

      const response = await fetch(`/api/fetch-nearby?${params.toString()}`);
      
      if (response.ok) {
        const result = await response.json();
        return result.data || [];
      } else {
        // If API fails, fall back to mock data for demo
        console.warn('API fetch failed, falling back to mock data');
        return this.fetchNearbyMock(lat, lng, radius);
      }
    } catch (error) {
      console.error('Error fetching nearby users:', error);
      // Fall back to mock data for demo
      return this.fetchNearbyMock(lat, lng, radius);
    }
  },

  // Fallback mock implementation
  async fetchNearbyMock(lat: number, lng: number, radius: number): Promise<NearbyUser[]> {
    const db = getMockDB();
    const nearby: NearbyUser[] = [];
    
    db.locations.forEach((loc: Location) => {
      // Use Haversine to calculate distance from the PASSED lat/lng (User's location)
      const dist = getDistanceFromLatLonInMeters(lat, lng, loc.latitude, loc.longitude);
      if (dist <= radius) {
        const user = db.users.find((u: User) => u.id === loc.user_id);
        const profile = db.profiles.find((p: Profile) => p.user_id === loc.user_id && p.visibility !== 'private');
        
        if (user && profile) {
          nearby.push({ ...user, profile, location: loc, distance: dist });
        }
      }
    });
    
    // Simulate network delay
    return new Promise(resolve => setTimeout(() => resolve(nearby), 600)); 
  },

  // Get my profile
  async getMyProfile(userId: string, type: 'professional' | 'personal'): Promise<Profile | undefined> {
    try {
      // Try to fetch from Supabase API first
      const response = await fetch(`/api/get-profile?userId=${userId}&profileType=${type}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          return result.data;
        }
      }
      
      // If not found, create default profile in Supabase
      const newProfile: Profile = {
        id: `p_${userId}_${type}`,
        user_id: userId,
        profile_type: type,
        headline: type === 'professional' ? 'New Professional' : 'New User',
        bio: '',
        visibility: 'nearby',
        experience: [], education: [], skills: [], hobbies: [], prompts: [], open_to_work: false
      };
      
      // Save to Supabase
      await fetch('/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProfile),
      });
      
      return newProfile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Fallback to mock data
      const db = getMockDB();
      const p = db.profiles.find((p: Profile) => p.user_id === userId && p.profile_type === type);
      if (!p) {
        const newProfile: Profile = {
          id: `p_${userId}_${type}`,
          user_id: userId,
          profile_type: type,
          headline: type === 'professional' ? 'New Professional' : 'New User',
          bio: '',
          visibility: 'nearby',
          experience: [], education: [], skills: [], hobbies: [], prompts: [], open_to_work: false
        };
        db.profiles.push(newProfile);
        updateMockDB(db);
        return newProfile;
      }
      return p;
    }
  },

  // Update profile
  async updateProfile(profile: Profile): Promise<void> {
    try {
      // Save to Supabase API
      const response = await fetch('/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        console.error('Failed to update profile in Supabase');
        // Fallback to mock data
        const db = getMockDB();
        const idx = db.profiles.findIndex((p: Profile) => p.id === profile.id);
        if (idx !== -1) {
          db.profiles[idx] = profile;
        } else {
          db.profiles.push(profile);
        }
        updateMockDB(db);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      // Fallback to mock data
      const db = getMockDB();
      const idx = db.profiles.findIndex((p: Profile) => p.id === profile.id);
      if (idx !== -1) {
        db.profiles[idx] = profile;
      } else {
        db.profiles.push(profile);
      }
      updateMockDB(db);
    }
  },

  // Connections
  async getConnections(userId: string): Promise<Connection[]> {
    const db = getMockDB();
    const connections = db.connections.filter((c: Connection) => c.from_user === userId || c.to_user === userId);
    
    // Hydrate with peer info
    const hydrated = connections.map((c: Connection) => {
      const peerId = c.from_user === userId ? c.to_user : c.from_user;
      const peer = db.users.find((u: User) => u.id === peerId) || { id: peerId, name: 'Unknown', email: '' };
      const peerProfile = db.profiles.find((p: Profile) => p.user_id === peerId && p.profile_type === c.profile_type);
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