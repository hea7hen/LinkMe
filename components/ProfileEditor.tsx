import React, { useState, useEffect } from 'react';
import { Profile, ProfileType } from '../types';

interface ProfileEditorProps {
  profile: Profile;
  onSave: (profile: Profile) => void;
  onTypeChange: (type: ProfileType) => void;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({ profile, onSave, onTypeChange }) => {
  const [formState, setFormState] = useState<Profile>(profile);

  useEffect(() => {
    setFormState(profile);
  }, [profile]);

  const handleChange = (field: keyof Profile, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleExperienceChange = (index: number, field: string, value: string) => {
      const newExp = [...formState.experience];
      newExp[index] = { ...newExp[index], [field]: value };
      handleChange('experience', newExp);
  };

  return (
    <main className="max-w-4xl mx-auto w-full p-8 animate-fade-in pb-24">
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold tracking-tighter">Edit Profile</h1>
            <div className="flex bg-surface p-1 rounded-lg border border-gray-200">
                {(['professional', 'personal'] as const).map(type => (
                    <button
                        key={type}
                        onClick={() => onTypeChange(type)}
                        className={`px-6 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                            profile.profile_type === type ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        {type}
                    </button>
                ))}
            </div>
        </div>

        <div className="bg-surface border border-gray-200 rounded-xl p-8 shadow-sm">
            {/* Header Config */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Visibility</label>
                    <select 
                        value={formState.visibility}
                        onChange={(e) => handleChange('visibility', e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm font-medium outline-none focus:border-swissRed transition-colors"
                    >
                        <option value="public">Public (Everyone)</option>
                        <option value="nearby">Nearby Only (Within Radius)</option>
                        <option value="private">Private (Hidden)</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Profile Headline</label>
                    <input 
                        type="text"
                        value={formState.headline}
                        onChange={(e) => handleChange('headline', e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-swissRed transition-colors"
                        placeholder="e.g. Product Manager"
                    />
                </div>
            </div>

            {/* Bio */}
            <div className="mb-8">
                <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Bio</label>
                <textarea 
                    value={formState.bio}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-swissRed transition-colors h-32 resize-none"
                    placeholder="Tell people about yourself..."
                />
            </div>

            {/* Conditional Fields */}
            {formState.profile_type === 'professional' && (
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-bold uppercase text-gray-400">Experience</label>
                        <button className="text-xs text-swissRed font-bold uppercase">+ Add</button>
                    </div>
                    {formState.experience.map((exp, i) => (
                        <div key={i} className="grid grid-cols-2 gap-4 mb-4 p-4 bg-white rounded border border-gray-100">
                             <input 
                                placeholder="Role" 
                                value={exp.role}
                                onChange={(e) => handleExperienceChange(i, 'role', e.target.value)}
                                className="border-b border-gray-200 p-2 text-sm outline-none"
                             />
                             <input 
                                placeholder="Company" 
                                value={exp.company} 
                                onChange={(e) => handleExperienceChange(i, 'company', e.target.value)}
                                className="border-b border-gray-200 p-2 text-sm outline-none"
                             />
                        </div>
                    ))}
                    {formState.experience.length === 0 && <p className="text-sm text-gray-400 italic">No experience listed.</p>}
                </div>
            )}

            {formState.profile_type === 'personal' && (
                <div className="mb-8">
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Interests (Comma separated)</label>
                    <input 
                        type="text"
                        value={formState.hobbies.join(', ')}
                        onChange={(e) => handleChange('hobbies', e.target.value.split(',').map(s => s.trim()))}
                        className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-swissRed transition-colors"
                    />
                </div>
            )}

            <div className="flex justify-end pt-6 border-t border-gray-200">
                <button 
                    onClick={() => onSave(formState)}
                    className="bg-swissRed text-white px-8 py-3 rounded-lg font-bold uppercase text-xs tracking-widest hover:bg-red-700 transition-all shadow-md hover:shadow-lg"
                >
                    Save Changes
                </button>
            </div>
        </div>
    </main>
  );
};
