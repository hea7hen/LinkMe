import React, { useState, useEffect, useRef } from 'react';
import { Message, Connection } from '../types';
import { dataService } from '../services/dataService';

interface ChatWindowProps {
  connection: Connection;
  currentUserId: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ connection, currentUserId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);

  // Load messages
  useEffect(() => {
    const load = async () => {
        const msgs = await dataService.getMessages(connection.id);
        setMessages(msgs);
    };
    load();
    
    // In a real app, supabase.channel subscription here
    const interval = setInterval(load, 3000); // Poll for demo
    return () => clearInterval(interval);
  }, [connection.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const text = input;
    setInput(''); // Optimistic clear
    setIsSending(true);
    
    const newMsg = await dataService.sendMessage(connection.id, currentUserId, text);
    setMessages(prev => [...prev, newMsg]);
    setIsSending(false);
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-surface z-10 relative">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
                <img src={connection.peer?.avatar_url} className="w-full h-full object-cover" />
            </div>
            <div>
                <h3 className="text-sm font-bold text-black">{connection.peer?.name}</h3>
                <p className="text-xs text-gray-500 uppercase tracking-wide">{connection.profile_type} Network</p>
            </div>
        </div>
        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase">Live</span>
        </div>
      </div>

      {/* Meetup Proposal Widget (if exists) */}
      {connection.proposed_meetup && (
        <div className="bg-gray-50 p-3 border-b border-gray-100 flex gap-3 items-center justify-between">
          <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded border border-gray-200 text-swissRed">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-gray-400">Meetup @ {connection.proposed_meetup.place_name}</p>
                <p className="text-xs text-gray-600 italic">"{connection.proposed_meetup.note}"</p>
              </div>
          </div>
          <button className="text-xs font-bold underline text-swissRed">View on Map</button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-white">
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[75%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                isMe 
                  ? 'bg-black text-white rounded-br-none' 
                  : 'bg-surface text-gray-900 rounded-bl-none border border-gray-100'
              }`}>
                {msg.text}
              </div>
              <span className="text-[9px] text-gray-300 mt-1 font-medium uppercase tracking-widest">
                {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100 flex gap-3 bg-white">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-grow bg-surface border-none rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-swissRed outline-none transition-all"
        />
        <button 
          type="submit"
          disabled={!input.trim() || isSending}
          className="bg-swissRed text-white px-6 py-2 rounded-lg font-bold uppercase text-xs tracking-widest hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
};
