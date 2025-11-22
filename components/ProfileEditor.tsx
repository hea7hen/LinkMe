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

  const handlePromptChange = (index: number, value: string) => {
      const newPrompts = [...(formState.prompts || [])];
      newPrompts[index] = { ...newPrompts[index], answer: value };
      handleChange('prompts', newPrompts);
  };

  return (
    <main className="max-w-4xl mx-auto w-full p-4 md:p-8 animate-fade-in pb-24">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-black">Edit Profile</h1>
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

        <div className="bg-surface border border-gray-200 rounded-xl p-4 md:p-8 shadow-sm space-y-8">
            {/* Header Config */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Headline</label>
                    <input 
                        type="text"
                        value={formState.headline}
                        onChange={(e) => handleChange('headline', e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-swissRed transition-colors"
                        placeholder="e.g. Product Manager @ Google"
                    />
                </div>
            </div>

            {/* Bio */}
            <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-2">About Me</label>
                <textarea 
                    value={formState.bio}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-swissRed transition-colors h-24 resize-none"
                    placeholder="Brief intro..."
                />
            </div>

            {/* PROFESSIONAL FIELDS */}
            {formState.profile_type === 'professional' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label className="block text-xs font-bold uppercase text-gray-400 mb-2">LinkedIn URL</label>
                            <input 
                                type="text"
                                value={formState.linkedin_url || ''}
                                onChange={(e) => handleChange('linkedin_url', e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-swissRed"
                                placeholder="linkedin.com/in/..."
                            />
                        </div>
                        <div>
                             <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Skills (Comma sep)</label>
                             <input 
                                type="text"
                                value={formState.skills?.join(', ') || ''}
                                onChange={(e) => handleChange('skills', e.target.value.split(',').map(s => s.trim()))}
                                className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-swissRed"
                                placeholder="React, Leadership, Sales..."
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white p-4 rounded border border-gray-200">
                        <input 
                            type="checkbox"
                            checked={formState.open_to_work}
                            onChange={(e) => handleChange('open_to_work', e.target.checked)}
                            className="w-5 h-5 text-swissRed focus:ring-swissRed rounded border-gray-300"
                        />
                        <label className="text-sm font-bold">Open to work / Hiring opportunities</label>
                    </div>

                    <div>
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
                    </div>
                </div>
            )}

            {/* PERSONAL FIELDS */}
            {formState.profile_type === 'personal' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                             <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Instagram Handle</label>
                             <input 
                                type="text"
                                value={formState.instagram_handle || ''}
                                onChange={(e) => handleChange('instagram_handle', e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-swissRed"
                                placeholder="@username"
                            />
                        </div>
                        <div>
                             <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Relationship Goal</label>
                             <select
                                value={formState.relationship_goal || 'networking'}
                                onChange={(e) => handleChange('relationship_goal', e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-swissRed"
                             >
                                <option value="networking">Networking</option>
                                <option value="friends">New Friends</option>
                                <option value="dating">Dating</option>
                                <option value="chat">Just Chat</option>
                             </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Interests</label>
                        <input 
                            type="text"
                            value={formState.hobbies.join(', ')}
                            onChange={(e) => handleChange('hobbies', e.target.value.split(',').map(s => s.trim()))}
                            className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-swissRed transition-colors"
                            placeholder="Photography, Hiking, Coffee..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-4">Personality Prompts</label>
                        {(formState.prompts || []).map((prompt, i) => (
                            <div key={i} className="mb-4 bg-gray-50 p-4 rounded-lg">
                                <p className="text-xs font-bold text-swissRed mb-2">{prompt.question}</p>
                                <input
                                    value={prompt.answer}
                                    onChange={(e) => handlePromptChange(i, e.target.value)}
                                    className="w-full bg-transparent border-b border-gray-300 focus:border-swissRed outline-none py-1 text-sm"
                                    placeholder="Your answer..."
                                />
                            </div>
                        ))}
                    </div>
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