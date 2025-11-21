export type ProfileType = 'professional' | 'personal';
export type Visibility = 'public' | 'nearby' | 'private';
export type ConnectionStatus = 'pending' | 'accepted' | 'rejected';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
}

export interface Experience {
  company: string;
  role: string;
  from: string;
  to: string;
}

export interface Education {
  institution: string;
  degree: string;
  year: string;
}

export interface Profile {
  id: string;
  user_id: string;
  profile_type: ProfileType;
  headline: string;
  bio: string;
  experience: Experience[];
  education: Education[];
  socials: { instagram?: string; linkedin?: string; website?: string };
  hobbies: string[];
  visibility: Visibility;
}

export interface Location {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  updated_at: string;
}

export interface MeetupProposal {
  place_name: string;
  lat: number;
  lng: number;
  note: string;
}

export interface Connection {
  id: string;
  from_user: string;
  to_user: string;
  profile_type: ProfileType;
  message: string;
  status: ConnectionStatus;
  proposed_meetup?: MeetupProposal;
  created_at: string;
  updated_at: string;
  // Joined fields for UI
  peer?: User;
  peer_profile?: Profile;
}

export interface Message {
  id: string;
  connection_id: string;
  sender_id: string;
  text: string;
  created_at: string;
  read_at?: string;
}

// Combined type for dashboard display
export interface NearbyUser extends User {
  profile: Profile;
  location: Location;
  distance: number; // computed
}
