import React, { useState, useEffect } from 'react';
import { SwissHeader } from './components/SwissHeader';
import { ProfileCard } from './components/ProfileCard';
import { ProximityMap } from './components/ProximityMap';
import { ChatWindow } from './components/ChatWindow';
import { ConnectionRequestModal } from './components/ConnectionRequestModal';
import { ProfileEditor } from './components/ProfileEditor';
import { NearbyUser, Connection, Message, Profile } from './types';
import { dataService } from './services/dataService';

// Constants
const CURRENT_USER_ID = 'me'; 
const NYC_CENTER = { lat: 40.7128, lng: -74.0060 };

export default function App() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'connections' | 'profile'>('dashboard');
  const [radius, setRadius] = useState(1000);
  const [loading, setLoading] = useState(false);
  
  // Data State
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [activeProfileType, setActiveProfileType] = useState<'professional' | 'personal'>('professional');

  // Selection State
  const [selectedUser, setSelectedUser] = useState<NearbyUser | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [isConnectModalOpen, setConnectModalOpen] = useState(false);

  // --- EFFECTS ---

  // 1. Load Initial Data
  useEffect(() => {
    loadMyProfile();
    loadConnections();
  }, [activeProfileType]);

  // 2. Load Nearby on Radius/Tab change
  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadNearby();
    }
  }, [radius, activeTab]);

  // --- ACTIONS ---

  const loadMyProfile = async () => {
    const p = await dataService.getMyProfile(CURRENT_USER_ID, activeProfileType);
    if (p) setMyProfile(p);
  };

  const loadNearby = async () => {
    setLoading(true);
    const users = await dataService.fetchNearby(NYC_CENTER.lat, NYC_CENTER.lng, radius);
    setNearbyUsers(users);
    setLoading(false);
  };

  const loadConnections = async () => {
    const conns = await dataService.getConnections(CURRENT_USER_ID);
    setConnections(conns);
  };

  const handleSendConnection = async (message: string, meetupProposal?: any) => {
    if (!selectedUser) return;
    await dataService.sendConnectionRequest({
        from_user: CURRENT_USER_ID,
        to_user: selectedUser.id,
        profile_type: selectedUser.profile.profile_type,
        message,
        proposed_meetup: meetupProposal
    });
    setConnectModalOpen(false);
    setSelectedUser(null);
    alert("Connection Request Sent!");
    loadConnections();
  };

  const handleSaveProfile = async (updated: Profile) => {
    await dataService.updateProfile(updated);
    setMyProfile(updated);
    alert("Profile Saved");
  };

  const handleAcceptConnection = async (conn: Connection) => {
    await dataService.updateConnectionStatus(conn.id, 'accepted');
    loadConnections();
    setSelectedConnection({...conn, status: 'accepted'}); // Optimistic update
  };

  // --- RENDER HELPERS ---

  const renderDashboard = () => (
    <main className="flex-grow flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden animate-fade-in">
      {/* Left: Map */}
      <div className="w-full md:w-[65%] h-[40vh] md:h-full relative border-b md:border-b-0 md:border-r border-gray-200">
          <ProximityMap 
            users={nearbyUsers} 
            radius={radius}
            currentUserLocation={NYC_CENTER}
            onUserSelect={(u) => { setSelectedUser(u); if(window.innerWidth < 768) document.getElementById('list-view')?.scrollIntoView({behavior:'smooth'}); }}
          />
          
          {/* Floating Range Slider */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur shadow-lg border border-gray-200 px-6 py-4 rounded-full flex items-center gap-4 z-30 w-[90%] max-w-md">
            <span className="text-xs font-bold uppercase text-gray-500 whitespace-nowrap">Radius</span>
            <input 
              type="range" 
              min="500" 
              max="2000" 
              step="250" 
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full accent-swissRed cursor-pointer h-1 bg-gray-200 rounded-lg appearance-none"
            />
            <span className="text-xs font-bold tabular-nums w-12 text-right">{radius}m</span>
          </div>
      </div>

      {/* Right: List / Detail */}
      <div id="list-view" className="w-full md:w-[35%] h-full overflow-y-auto bg-white relative">
        {loading && nearbyUsers.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-20">
                <div className="w-8 h-8 border-2 border-swissRed border-t-transparent rounded-full animate-spin"></div>
            </div>
        )}
        
        {selectedUser ? (
          <div className="p-6 animate-slide-in-right">
            <button 
              onClick={() => setSelectedUser(null)}
              className="mb-4 text-xs font-bold uppercase text-gray-400 hover:text-black flex items-center gap-1 transition-colors"
            >
              ← Back to list
            </button>
            <ProfileCard 
                user={selectedUser} 
                onConnect={() => setConnectModalOpen(true)} 
            />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-end border-b border-gray-100 pb-4">
              <h2 className="text-3xl font-bold tracking-tighter">Nearby</h2>
              <span className="text-sm text-gray-400 mb-1">{nearbyUsers.length} visible</span>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {nearbyUsers.map(user => (
                <div key={user.id} className="relative group">
                    <ProfileCard user={user} onConnect={(u) => {setSelectedUser(u); setConnectModalOpen(true);}} compact={true} />
                </div>
              ))}
              {nearbyUsers.length === 0 && !loading && (
                  <div className="text-center py-12 text-gray-400">
                      <p>No one nearby.</p>
                      <p className="text-sm mt-2">Try increasing the radius.</p>
                  </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );

  const renderConnections = () => (
    <main className="max-w-6xl mx-auto w-full p-4 md:p-8 h-[calc(100vh-64px)]">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">
          {/* Sidebar List */}
          <div className="md:col-span-4 border border-gray-200 rounded-lg overflow-hidden bg-surface flex flex-col h-full">
            <div className="p-4 bg-white border-b border-gray-100">
              <h2 className="font-bold text-lg">Connections</h2>
            </div>
            <div className="divide-y divide-gray-100 overflow-y-auto flex-grow">
              {connections.map(conn => (
                  <div 
                    key={conn.id}
                    onClick={() => setSelectedConnection(conn)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 
                        ${selectedConnection?.id === conn.id ? 'bg-white border-l-4 border-swissRed shadow-sm' : 'bg-transparent border-l-4 border-transparent'}
                    `}
                  >
                    <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-sm text-textPrimary">{conn.peer?.name || 'Unknown'}</h4>
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${conn.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {conn.status}
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{conn.message}</p>
                  </div>
              ))}
              {connections.length === 0 && (
                  <div className="p-8 text-center text-gray-400 text-sm">No connections yet.</div>
              )}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="md:col-span-8 h-full">
            {selectedConnection ? (
                selectedConnection.status === 'accepted' ? (
                    <ChatWindow 
                      connection={selectedConnection} 
                      currentUserId={CURRENT_USER_ID}
                    />
                ) : (
                    <div className="h-full bg-white border border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full mb-4 overflow-hidden">
                            <img src={selectedConnection.peer?.avatar_url} className="w-full h-full object-cover" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Request from {selectedConnection.peer?.name}</h2>
                        <p className="text-gray-600 max-w-md mb-6">"{selectedConnection.message}"</p>
                        
                        {selectedConnection.proposed_meetup && (
                             <div className="bg-surface p-4 rounded-lg mb-8 w-full max-w-sm text-left border border-gray-200">
                                <p className="text-xs font-bold uppercase text-gray-400 mb-1">Suggested Meetup</p>
                                <p className="font-bold">📍 {selectedConnection.proposed_meetup.place_name}</p>
                                <p className="text-sm text-gray-500 italic mt-1">{selectedConnection.proposed_meetup.note}</p>
                             </div>
                        )}

                        <div className="flex gap-4">
                            <button 
                                onClick={() => handleAcceptConnection(selectedConnection)}
                                className="px-8 py-3 bg-swissRed text-white font-bold uppercase text-sm tracking-widest rounded hover:bg-red-700 transition"
                            >
                                Accept
                            </button>
                            <button className="px-8 py-3 border border-gray-200 text-gray-500 font-bold uppercase text-sm tracking-widest rounded hover:bg-gray-50 transition">
                                Ignore
                            </button>
                        </div>
                    </div>
                )
            ) : (
                <div className="h-full bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                    Select a connection to view details
                </div>
            )}
          </div>
      </div>
    </main>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-textPrimary">
      <SwissHeader activeTab={activeTab} onTabChange={setActiveTab} />
      
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'connections' && renderConnections()}
      {activeTab === 'profile' && myProfile && (
        <ProfileEditor 
            profile={myProfile} 
            onSave={handleSaveProfile} 
            onTypeChange={(t) => setActiveProfileType(t)} 
        />
      )}

      {/* MODALS */}
      {isConnectModalOpen && selectedUser && (
        <ConnectionRequestModal 
            user={selectedUser}
            isOpen={isConnectModalOpen}
            onClose={() => setConnectModalOpen(false)}
            onSend={handleSendConnection}
        />
      )}
    </div>
  );
}
