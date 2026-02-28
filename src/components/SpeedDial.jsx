import React, { useState, useEffect } from 'react';
import { VscAdd, VscSearch, VscGlobe } from "react-icons/vsc";
import fetchJsonp from 'fetch-jsonp';

// Helper to get favicon URL
const getFaviconUrl = (url) => {
    try {
        const domain = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    } catch (e) {
        return '';
    }
};

const SpeedDialItem = ({ title, url, onNavigate }) => (
  <div 
    onClick={() => onNavigate(url)}
    className="bg-gray-100 rounded-lg cursor-pointer hover:scale-105 transition-transform duration-100 group relative overflow-hidden h-28 w-44 flex flex-col shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md"
  >
    {/* Icon Area - Real Favicon */}
    <div className="flex-1 bg-gray-100 flex items-center justify-center overflow-hidden relative p-4">
        <img 
            src={getFaviconUrl(url)} 
            alt={title}
            className="w-12 h-12 object-contain drop-shadow-sm"
            onError={(e) => { e.target.style.display = 'none'; }} // Hide if fails
        />
    </div>

    {/* Title Bar */}
    <div className="h-8 bg-gray-100 flex items-center px-3 border-t border-gray-200">
        <span className="text-gray-700 text-xs font-bold truncate group-hover:text-blue-600 transition-colors">{title}</span>
    </div>
  </div>
);

const SpeedDial = ({ onNavigate }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Debounced Search Logic
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length > 1) {
                try {
                    const response = await fetchJsonp(`https://suggestqueries.google.com/complete/search?client=chrome&q=${searchQuery}&hl=fr`);
                    if (response.ok) {
                        const data = await response.json();
                        setSuggestions(data[1] || []);
                        setShowSuggestions(true);
                    }
                } catch (err) {
                    setShowSuggestions(false);
                }
            } else {
                setShowSuggestions(false);
            }
        }, 150);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleInputChange = (e) => {
        setSearchQuery(e.target.value);
    }

    const selectSuggestion = (s) => {
        setSearchQuery(s);
        onNavigate(s);
        setShowSuggestions(false);
    }

    const handleSearch = (e) => {
        if(e.key === 'Enter') {
            onNavigate(searchQuery);
            setShowSuggestions(false);
        }
    }

  return (
    <div className="h-full w-full p-8 flex flex-col items-center overflow-y-auto bg-[#f9f9fb]">
        
        {/* Central Search Bar */}
        <div className="w-full max-w-2xl mb-10 mt-4 relative z-50">
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                        <img 
                            src="https://www.google.com/favicon.ico" 
                            alt="G"
                            className="w-4 h-4 object-contain" 
                        />
                     </div>
                </div>
                <input 
                    type="text" 
                    className="w-full bg-gray-100 text-gray-800 rounded-xl py-3 pl-14 pr-4 outline-none border border-transparent focus:border-blue-600 focus:bg-white focus:shadow-md shadow-sm placeholder-gray-500 transition-all"
                    placeholder="Rechercher sur le web"
                    value={searchQuery}
                    onChange={handleInputChange}
                    onKeyDown={handleSearch}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onFocus={() => searchQuery.length > 1 && setShowSuggestions(true)}
                />
            </div>
             {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-14 left-0 right-0 bg-white rounded-lg shadow-xl border border-gray-100 py-2 overflow-hidden">
                    {suggestions.map((s, i) => (
                        <div 
                            key={i} 
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center text-sm text-gray-700"
                            onClick={() => selectSuggestion(s)}
                        >
                            <VscSearch className="mr-3 text-gray-400 text-lg" />
                            {s}
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Grid - Closer gap (gap-4) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            <SpeedDialItem 
                title="Wikipedia" 
                url="https://fr.wikipedia.org" 
                onNavigate={onNavigate} 
            />
            
            <SpeedDialItem 
                title="Google" 
                url="https://www.google.com" 
                onNavigate={onNavigate} 
            />

            <SpeedDialItem 
                title="Pronote" 
                url="https://www.index-education.com/fr/pronote-parents-eleves.php" 
                onNavigate={onNavigate} 
            />

            <SpeedDialItem 
                title="Amazon" 
                url="https://www.amazon.fr" 
                onNavigate={onNavigate} 
            />

             <SpeedDialItem 
                title="YouTube" 
                url="https://www.youtube.com" 
                onNavigate={onNavigate} 
            />

            <SpeedDialItem 
                title="Le Figaro Étudiant" 
                url="https://etudiant.lefigaro.fr/" 
                onNavigate={onNavigate} 
            />
            
            <div className="h-28 w-44 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 text-gray-400 hover:text-blue-600 transition-colors border border-dashed border-gray-300 hover:border-blue-600">
                <VscAdd className="text-3xl" />
            </div>
        </div>
    </div>
  );
};

export default SpeedDial;
