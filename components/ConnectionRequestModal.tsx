import React, { useState } from 'react';
import { NearbyUser } from '../types';

interface Props {
  user: NearbyUser;
  isOpen: boolean;
  onClose: () => void;
  onSend: (msg: string, meetup?: any) => void;
}

export const ConnectionRequestModal: React.FC<Props> = ({ user, isOpen, onClose, onSend }) => {
  const [message, setMessage] = useState('');
  const [proposeMeetup, setProposeMeetup] = useState(false);
  const [meetupDetails, setMeetupDetails] = useState({ place_name: '', note: '' });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white w-full max-w-md rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-6 bg-surface border-b border-gray-100 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold leading-none">Connect with {user.name}</h3>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">{user.profile.profile_type} Profile</span>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-black text-xl">×</button>
            </div>
            
            <div className="p-6 space-y-6">
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Message</label>
                    <textarea 
                        className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:border-swissRed outline-none h-24 resize-none bg-gray-50 focus:bg-white transition-colors" 
                        placeholder={`Hi ${user.name.split(' ')[0]}, I'd like to connect...`}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                        <input 
                            type="checkbox" 
                            id="meetup" 
                            checked={proposeMeetup}
                            onChange={(e) => setProposeMeetup(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-swissRed focus:ring-swissRed" 
                        />
                        <label htmlFor="meetup" className="text-sm font-bold text-gray-700 select-none cursor-pointer">Propose a meetup?</label>
                    </div>
                    
                    {proposeMeetup && (
                        <div className="space-y-3 pl-7 animate-fade-in">
                             <input 
                                className="w-full border border-gray-200 rounded p-2 text-sm outline-none" 
                                placeholder="Place Name (e.g. Starbucks on 5th)"
                                value={meetupDetails.place_name}
                                onChange={(e) => setMeetupDetails({...meetupDetails, place_name: e.target.value})}
                             />
                             <input 
                                className="w-full border border-gray-200 rounded p-2 text-sm outline-none" 
                                placeholder="Quick note (e.g. 15 min coffee)"
                                value={meetupDetails.note}
                                onChange={(e) => setMeetupDetails({...meetupDetails, note: e.target.value})}
                             />
                        </div>
                    )}
                </div>

                <button 
                    onClick={() => onSend(message, proposeMeetup ? { ...meetupDetails, lat: 0, lng: 0 } : undefined)} 
                    className="w-full bg-swissRed text-white font-bold uppercase tracking-widest py-4 rounded-lg hover:bg-red-600 transition-colors shadow-lg shadow-red-100"
                >
                    Send Request
                </button>
            </div>
        </div>
    </div>
  );
};
