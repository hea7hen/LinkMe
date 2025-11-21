import React from 'react';

interface SwissHeaderProps {
  activeTab: 'dashboard' | 'connections' | 'profile';
  onTabChange: (tab: 'dashboard' | 'connections' | 'profile') => void;
}

export const SwissHeader: React.FC<SwissHeaderProps> = ({ activeTab, onTabChange }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tighter text-black">
            Link<span className="text-swissRed">Me</span>.
          </h1>
          <div className="h-6 w-px bg-gray-200 mx-2 hidden md:block"></div>
          <span className="text-xs font-medium tracking-widest text-gray-400 uppercase hidden md:block">
            Proximity Network
          </span>
        </div>

        <nav className="flex gap-6 md:gap-8">
          {(['dashboard', 'connections', 'profile'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`text-sm font-medium tracking-wide uppercase transition-colors relative h-16 flex items-center
                ${activeTab === tab ? 'text-black' : 'text-gray-400 hover:text-gray-600'}
              `}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 w-full h-1 bg-swissRed"></span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};