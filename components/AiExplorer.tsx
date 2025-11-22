import React, { useState } from 'react';

interface AiExplorerProps {
  currentLat: number;
  currentLng: number;
}

export const AiExplorer: React.FC<AiExplorerProps> = ({ currentLat, currentLng }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<any>(null); // Text or Places
  const [loading, setLoading] = useState(false);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/explore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, lat: currentLat, lng: currentLng })
      });
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error(err);
      setResponse({ text: "Sorry, I couldn't reach the AI services right now." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="absolute bottom-24 right-4 md:right-8 bg-black text-white p-4 rounded-full shadow-2xl z-40 hover:scale-105 transition-transform flex items-center gap-2"
      >
        <span className="text-xl">✨</span>
        <span className="hidden md:inline text-xs font-bold uppercase tracking-widest">Ask AI</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-surface">
                <div className="flex items-center gap-2">
                    <span className="text-xl">✨</span>
                    <h3 className="font-bold text-lg">Local AI Explorer</h3>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-2xl text-gray-400 hover:text-black">&times;</button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-4">
               {!response && !loading && (
                   <div className="text-center text-gray-500 mt-10">
                       <p className="text-sm">Ask about nearby places, coffee shops, or hidden gems.</p>
                       <div className="flex flex-wrap justify-center gap-2 mt-4">
                           {["Best coffee nearby?", "Quiet place to work?", "Italian restaurants?"].map(q => (
                               <button key={q} onClick={() => { setQuery(q); }} className="text-xs border border-gray-200 px-3 py-1 rounded-full hover:border-swissRed transition">
                                   {q}
                               </button>
                           ))}
                       </div>
                   </div>
               )}

               {loading && (
                   <div className="flex justify-center py-8">
                       <div className="w-8 h-8 border-2 border-swissRed border-t-transparent rounded-full animate-spin"></div>
                   </div>
               )}

               {response && (
                   <div className="space-y-4 animate-slide-up">
                       {response.text && (
                           <p className="text-sm leading-relaxed bg-surface p-4 rounded-lg">{response.text}</p>
                       )}
                       {response.places && response.places.length > 0 && (
                           <div className="grid gap-3">
                               {response.places.map((place: any, i: number) => (
                                   <a href={place.googleMapsUri} target="_blank" rel="noopener noreferrer" key={i} className="flex items-start gap-3 p-3 border border-gray-100 rounded hover:bg-gray-50 transition group">
                                       <div className="bg-red-50 p-2 rounded text-swissRed group-hover:scale-110 transition-transform">📍</div>
                                       <div>
                                           <h4 className="font-bold text-sm">{place.name}</h4>
                                           <div className="flex items-center gap-2 text-xs text-gray-500">
                                              <span>{place.rating}</span>
                                              <span>{place.userRatingCount}</span>
                                           </div>
                                           <p className="text-xs text-swissRed font-bold mt-1 uppercase">{place.address}</p>
                                       </div>
                                   </a>
                               ))}
                           </div>
                       )}
                   </div>
               )}
            </div>

            <form onSubmit={handleAsk} className="p-4 border-t border-gray-100 flex gap-2">
                <input 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-grow bg-surface border-none rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-swissRed"
                    placeholder="Ask about this area..."
                />
                <button type="submit" disabled={loading || !query} className="bg-black text-white px-6 rounded-lg font-bold uppercase text-xs">
                    Go
                </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};