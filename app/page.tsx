'use client';
import React, { useState, useEffect } from 'react';
import { SwissHeader } from '../components/SwissHeader';
import { ProfileCard } from '../components/ProfileCard';
import { ProximityMap } from '../components/ProximityMap';
import { ChatWindow } from '../components/ChatWindow';
import { ConnectionRequestModal } from '../components/ConnectionRequestModal';
import { ProfileEditor } from '../components/ProfileEditor';
import { AiExplorer } from '../components/AiExplorer';
import { NearbyUser, Connection, Profile } from '../types';
import { dataService } from '../services/dataService';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';

// Constants
const NYC_CENTER = { lat: 40.7128, lng: -74.0060 };

export default function App() {
  // --- AUTH STATE ---
  const [currentUser, setCurrentUser] = useState<FirebaseUser | any | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // --- APP STATE ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'connections' | 'profile'>('dashboard');
  const [radius, setRadius] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(NYC_CENTER);
  
  // Data State
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [activeProfileType, setActiveProfileType] = useState<'professional' | 'personal'>('professional');

  // Selection State
  const [selectedUser, setSelectedUser] = useState<NearbyUser | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [isConnectModalOpen, setConnectModalOpen] = useState(false);

  // --- INITIALIZATION ---

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
        if (user) {
            setCurrentUser(user);
            setIsDemoMode(false);
        }
        setIsAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Geolocation
  useEffect(() => {
    if ("geolocation" in navigator) {
        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation({ lat: latitude, lng: longitude });
            },
            (error) => console.log("Geo error, using default NYC", error),
            { enableHighAccuracy: true }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Load Data when User Ready
  useEffect(() => {
    if (currentUser) {
        loadMyProfile();
        loadConnections();
    }
  }, [currentUser, activeProfileType]);

  // Load Nearby
  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadNearby();
    }
  }, [radius, activeTab, userLocation]);

  // --- ACTIONS ---

  const handleLogin = async () => {
    try {
        await signInWithPopup(auth, googleProvider);
    } catch (e: any) {
        console.warn("Firebase Login blocked:", e.code);
        
        // Critical Fix: If the domain is unauthorized (common in previews), 
        // automatically fallback to Demo Mode so the user isn't stuck.
        if (e.code === 'auth/unauthorized-domain' || e.code === 'auth/operation-not-supported-in-this-environment') {
           console.info("Falling back to Guest Mode due to environment restrictions.");
           handleDemoLogin();
        } else {
            alert("Authentication Error: " + e.message);
        }
    }
  };

  const handleDemoLogin = () => {
       const demoUser = { 
           uid: 'me', 
           email: 'demo@linkme.com', 
           displayName: 'Demo User', 
           photoURL: 'https://api.dicebear.com/7.x/micah/svg?seed=me' 
       };
       setCurrentUser(demoUser);
       setIsDemoMode(true);
       setIsAuthLoading(false);
  };

  const handleLogout = async () => {
    if (!isDemoMode) {
        await signOut(auth);
    }
    setCurrentUser(null);
    setIsDemoMode(false);
    setActiveTab('dashboard');
    setSelectedUser(null);
  };

  const loadMyProfile = async () => {
    const userId = currentUser?.uid || 'me';
    const p = await dataService.getMyProfile(userId, activeProfileType);
    if (p) setMyProfile(p);
  };

  const loadNearby = async () => {
    setLoading(true);
    const users = await dataService.fetchNearby(userLocation.lat, userLocation.lng, radius);
    setNearbyUsers(users);
    setLoading(false);
  };

  const loadConnections = async () => {
    const userId = currentUser?.uid || 'me';
    const conns = await dataService.getConnections(userId);
    setConnections(conns);
  };

  const handleSendConnection = async (message: string, meetupProposal?: any) => {
    if (!selectedUser) return;
    await dataService.sendConnectionRequest({
        from_user: currentUser?.uid || 'me',
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

  // --- RENDER HELPERS ---

  if (isAuthLoading) return <div className="h-screen flex items-center justify-center font-bold tracking-widest uppercase">Initializing LinkMe...</div>;

  if (!currentUser) {
      return (
          <div className="h-screen flex flex-col items-center justify-center bg-white p-6 animate-fade-in text-center">
              <div className="mb-8">
                  <h1 className="text-5xl font-bold tracking-tighter mb-2">Link<span className="text-swissRed">Me</span>.</h1>
                  <p className="text-gray-400 font-medium tracking-wide uppercase text-xs">Proximity Network</p>
              </div>
              
              <div className="space-y-4 flex flex-col items-center w-full max-w-sm">
                <button 
                    onClick={handleLogin}
                    className="w-full bg-black text-white px-8 py-4 rounded-lg font-bold uppercase tracking-widest hover:bg-gray-800 transition shadow-lg flex items-center justify-center gap-3"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
                    Sign in with Google
                </button>
                
                <div className="flex items-center gap-2 w-full my-2">
                    <div className="h-px bg-gray-200 flex-grow"></div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Preview Mode</span>
                    <div className="h-px bg-gray-200 flex-grow"></div>
                </div>

                <button 
                    onClick={handleDemoLogin}
                    className="w-full bg-surface border border-gray-200 text-black px-8 py-3 rounded-lg font-bold uppercase tracking-widest hover:bg-gray-100 transition text-xs"
                >
                    Continue as Guest
                </button>
              </div>
          </div>
      );
  }

  const renderDashboard = () => (
    <main className="flex-grow flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden animate-fade-in relative">
      <div className="absolute z-40">
           <AiExplorer currentLat={userLocation.lat} currentLng={userLocation.lng} />
      </div>

      {/* Left: Map */}
      <div className="w-full md:w-[65%] h-[40vh] md:h-full relative border-b md:border-b-0 md:border-r border-gray-200">
          <ProximityMap 
            users={nearbyUsers} 
            radius={radius}
            currentUserLocation={userLocation}
            onUserSelect={(u) => { setSelectedUser(u); if(window.innerWidth < 768) document.getElementById('list-view')?.scrollIntoView({behavior:'smooth'}); }}
          />
          
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur shadow-xl border border-gray-200 px-6 py-4 rounded-full flex items-center gap-4 z-30 w-[90%] max-w-md transition-all hover:scale-105">
            <span className="text-xs font-bold uppercase text-gray-500 whitespace-nowrap">Radius</span>
            <input 
              type="range" 
              min="500" 
              max="2000" 
              step="250" 
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full accent-swissRed cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none"
            />
            <span className="text-xs font-bold tabular-nums w-12 text-right text-swissRed">{radius}m</span>
          </div>
      </div>

      {/* Right: List / Detail */}
      <div id="list-view" className="w-full md:w-[35%] h-full overflow-y-auto bg-white relative z-10 scroll-smooth">
        {loading && nearbyUsers.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-20">
                <div className="w-8 h-8 border-2 border-swissRed border-t-transparent rounded-full animate-spin"></div>
            </div>
        )}
        
        {selectedUser ? (
          <div className="p-6 animate-slide-in-right">
            <button 
              onClick={() => setSelectedUser(null)}
              className="mb-6 text-xs font-bold uppercase text-gray-400 hover:text-black flex items-center gap-1 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
              Back to list
            </button>
            <ProfileCard 
                user={selectedUser} 
                onConnect={() => setConnectModalOpen(true)} 
            />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-end border-b border-gray-100 pb-4 sticky top-0 bg-white z-10">
              <h2 className="text-3xl font-bold tracking-tighter">Nearby</h2>
              <span className="text-sm font-medium text-gray-400 mb-1">{nearbyUsers.length} visible</span>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {nearbyUsers.map(user => (
                <div key={user.id} className="relative group hover:z-10">
                    <ProfileCard user={user} onConnect={(u) => {setSelectedUser(u); setConnectModalOpen(true);}} compact={true} />
                </div>
              ))}
              {nearbyUsers.length === 0 && !loading && (
                  <div className="text-center py-20 px-6 text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-100 mt-4">
                      <p className="font-bold text-gray-900 mb-1">No one nearby</p>
                      <p className="text-xs">Try increasing the radius or check back later.</p>
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
          <div className="md:col-span-4 border border-gray-200 rounded-lg overflow-hidden bg-surface flex flex-col h-full shadow-sm">
            <div className="p-4 bg-white border-b border-gray-100">
              <h2 className="font-bold text-lg">Connections</h2>
            </div>
            <div className="divide-y divide-gray-100 overflow-y-auto flex-grow">
              {connections.length === 0 && (
                  <div className="p-8 text-center text-gray-400 text-xs">No connections yet. Go to Dashboard to find people.</div>
              )}
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
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded tracking-wide
                            ${conn.status === 'accepted' ? 'bg-green-100 text-green-700' : 
                              conn.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                              'bg-yellow-100 text-yellow-700'}`}>
                            {conn.status}
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{conn.message}</p>
                  </div>
              ))}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="md:col-span-8 h-full">
            {selectedConnection ? (
                selectedConnection.status === 'accepted' ? (
                    <ChatWindow 
                      connection={selectedConnection} 
                      currentUserId={currentUser.uid}
                    />
                ) : (
                    <div className="h-full bg-white border border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center text-center shadow-sm">
                        <div className="w-24 h-24 bg-gray-100 rounded-full mb-6 overflow-hidden border-4 border-white shadow-lg">
                            <img src={selectedConnection.peer?.avatar_url} className="w-full h-full object-cover" />
                        </div>
                        <h2 className="text-3xl font-bold mb-2 tracking-tight">Request from {selectedConnection.peer?.name}</h2>
                        <div className="mb-6">
                             <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full 
                                ${selectedConnection.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                Status: {selectedConnection.status}
                            </span>
                        </div>
                        <div className="bg-surface p-6 rounded-xl border border-gray-100 max-w-lg mb-8 relative">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-2xl text-gray-300">❝</div>
                            <p className="text-gray-600 italic leading-relaxed">"{selectedConnection.message}"</p>
                        </div>
                        
                        {selectedConnection.proposed_meetup && (
                             <div className="bg-white p-4 rounded-lg mb-8 w-full max-w-sm text-left border border-l-4 border-l-swissRed border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-3">
                                    <div className="text-swissRed mt-0.5">📍</div>
                                    <div>
                                        <p className="text-xs font-bold uppercase text-gray-400 mb-0.5">Suggested Meetup</p>
                                        <p className="font-bold text-lg">{selectedConnection.proposed_meetup.place_name}</p>
                                        <p className="text-sm text-gray-500 mt-1">{selectedConnection.proposed_meetup.note}</p>
                                    </div>
                                </div>
                             </div>
                        )}

                        {selectedConnection.status === 'pending' && (
                             <div className="flex gap-4">
                                <button 
                                    onClick={() => { dataService.updateConnectionStatus(selectedConnection.id, 'accepted'); loadConnections(); }}
                                    className="px-8 py-3 bg-swissRed text-white font-bold uppercase text-sm tracking-widest rounded-lg hover:bg-red-700 transition shadow-lg shadow-red-100"
                                >
                                    Accept
                                </button>
                                <button 
                                    onClick={() => { dataService.updateConnectionStatus(selectedConnection.id, 'rejected'); loadConnections(); }}
                                    className="px-8 py-3 bg-white border border-gray-200 text-gray-500 font-bold uppercase text-sm tracking-widest rounded-lg hover:bg-gray-50 transition"
                                >
                                    Reject
                                </button>
                            </div>
                        )}
                    </div>
                )
            ) : (
                <div className="h-full bg-gray-50 border border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400">
                    <div className="text-4xl mb-4 opacity-20">💬</div>
                    <p className="font-medium">Select a connection to view details</p>
                </div>
            )}
          </div>
      </div>
    </main>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-textPrimary">
      {/* Banner for Demo Mode */}
      {isDemoMode && (
          <div className="bg-black text-white text-[10px] uppercase font-bold tracking-widest text-center py-1">
              Guest Mode (Mock Data)
          </div>
      )}
      
      <SwissHeader 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onLogout={handleLogout}
      />
      
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