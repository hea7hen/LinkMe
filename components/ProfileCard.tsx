import React from 'react';
import { NearbyUser } from '../types';
import { formatDistance } from '../utils/haversine';

interface ProfileCardProps {
  user: NearbyUser;
  onConnect: (user: NearbyUser) => void;
  compact?: boolean;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ user, onConnect, compact = false }) => {
  const isProfessional = user.profile.profile_type === 'professional';

  return (
    <div className={`bg-surface border border-gray-100 rounded-none md:rounded-lg transition-all hover:shadow-sm overflow-hidden flex flex-col ${compact ? 'p-4' : 'p-8 h-full'}`}>
      
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
             {user.avatar_url ? (
               <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-lg">
                 {user.name.charAt(0)}
               </div>
             )}
           </div>
           <div>
             <h3 className="text-lg font-bold leading-tight text-textPrimary">{user.name}</h3>
             <span className={`text-xs uppercase tracking-wider font-medium px-2 py-0.5 rounded-sm ${isProfessional ? 'bg-gray-200 text-gray-700' : 'bg-swissRed/10 text-swissRed'}`}>
               {user.profile.profile_type}
             </span>
           </div>
        </div>
        <div className="text-right">
          <span className="block text-2xl font-bold tracking-tighter text-textPrimary">
            {formatDistance(user.distance)}
          </span>
          <span className="text-xs text-gray-400 uppercase tracking-wide">Away</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-grow space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-900 leading-relaxed">
            {user.profile.headline}
          </p>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed line-clamp-3">
            {user.profile.bio}
          </p>
        </div>

        {isProfessional && user.profile.experience && user.profile.experience.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
             <p className="text-xs font-bold uppercase text-gray-400 mb-2">Current</p>
             <p className="text-sm font-medium">
               {user.profile.experience[0].role} <span className="text-gray-400">@</span> {user.profile.experience[0].company}
             </p>
          </div>
        )}

        {!isProfessional && user.profile.hobbies && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs font-bold uppercase text-gray-400 mb-2">Interests</p>
            <div className="flex flex-wrap gap-2">
              {user.profile.hobbies.map(hobby => (
                <span key={hobby} className="text-xs border border-gray-300 px-2 py-1 rounded-full text-gray-600">
                  {hobby}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Action */}
      <div className="mt-8 pt-4">
        <button 
          onClick={() => onConnect(user)}
          className="w-full bg-textPrimary hover:bg-black text-white text-xs font-bold uppercase tracking-widest py-4 px-6 transition-colors flex items-center justify-center gap-2"
        >
          <span>Connect Request</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
        </button>
      </div>
    </div>
  );
};