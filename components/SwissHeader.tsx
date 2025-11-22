import React from 'react';

interface SwissHeaderProps {
  activeTab: 'dashboard' | 'connections' | 'profile';
  onTabChange: (tab: 'dashboard' | 'connections' | 'profile') => void;
  onLogout: () => void;
}

export const SwissHeader: React.FC<SwissHeaderProps> = ({ activeTab, onTabChange, onLogout }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          <h1 className="text-xl md:text-2xl font-bold tracking-tighter text-black">
            Link<span className="text-swissRed">Me</span>.
          </h1>
          <div className="h-6 w-px bg-gray-200 mx-2 hidden md:block"></div>
          <span className="text-xs font-medium tracking-widest text-gray-400 uppercase hidden md:block">
            Proximity Network
          </span>
        </div>

        <div className="flex items-center gap-2 md:gap-6">
            <nav className="flex gap-2 md:gap-6 lg:gap-8 mr-2 md:mr-4">
              {(['dashboard', 'connections', 'profile'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => onTabChange(tab)}
                  className={`text-xs md:text-sm font-medium tracking-wide uppercase transition-colors relative h-16 flex items-center px-1 md:px-0
                    ${activeTab === tab ? 'text-black' : 'text-gray-400 hover:text-gray-600 active:text-gray-600'}
                  `}
                >
                  <span className="hidden sm:inline">{tab}</span>
                  <span className="sm:hidden">
                    {tab === 'dashboard' ? 'Dash' : tab === 'connections' ? 'Conn' : 'Prof'}
                  </span>
                  {activeTab === tab && (
                    <span className="absolute bottom-0 left-0 w-full h-1 bg-swissRed"></span>
                  )}
                </button>
              ))}
            </nav>
            <button 
                onClick={onLogout}
                className="text-xs font-bold uppercase text-gray-400 hover:text-swissRed active:text-swissRed transition-colors px-1 md:px-0"
            >
                <span className="hidden sm:inline">Sign Out</span>
                <span className="sm:hidden">Out</span>
            </button>
        </div>
      </div>
    </header>
  );
};