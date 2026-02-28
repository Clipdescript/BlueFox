import React, { useState, useEffect } from 'react';
import { VscArrowLeft, VscArrowRight, VscRefresh, VscLock, VscSearch, VscGlobe, VscShield, VscHome } from "react-icons/vsc"; 
import { FaCube } from "react-icons/fa";
import fetchJsonp from 'fetch-jsonp';

const TopBar = React.memo(({ onSearch, currentUrl, onReload, onBack, onForward, currentFavicon }) => {
  const [inputVal, setInputVal] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Prefetch logic
  useEffect(() => {
      if (suggestions.length > 0) {
          const firstSuggestion = suggestions[0];
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = `https://www.google.com/search?q=${encodeURIComponent(firstSuggestion)}`;
          document.head.appendChild(link);
          return () => {
              try { document.head.removeChild(link); } catch(e){}
          };
      }
  }, [suggestions]);

  useEffect(() => {
    setInputVal(currentUrl || '');
  }, [currentUrl]);

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(async () => {
        if (inputVal.length > 1 && document.activeElement.tagName === 'INPUT') { // Only search if typing
            try {
                const response = await fetchJsonp(`https://suggestqueries.google.com/complete/search?client=chrome&q=${inputVal}&hl=fr`);
                if (response.ok) {
                    const data = await response.json();
                    setSuggestions(data[1] || []);
                    setShowSuggestions(true);
                }
            } catch (err) {
                // Fail silently
            }
        } else if (inputVal.length <= 1) {
            setShowSuggestions(false);
        }
    }, 100); // Ultra fast 100ms debounce

    return () => clearTimeout(timer);
  }, [inputVal]);

  const handleInputChange = (e) => {
      setInputVal(e.target.value);
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearch(inputVal);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (s) => {
      setInputVal(s);
      onSearch(s);
      setShowSuggestions(false);
  }

  return (
    <div className="h-10 bg-white flex items-center justify-between px-2 border-b border-gray-200 shadow-sm z-50 sticky top-0">
      {/* Navigation Controls */}
      <div className="flex items-center space-x-1 px-2">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-black transition-colors"><VscArrowLeft className="text-lg" /></button>
        <button onClick={onForward} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-black transition-colors"><VscArrowRight className="text-lg" /></button>
        <button onClick={onReload} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-black transition-colors group">
            <VscRefresh className="text-lg" />
        </button>
        <button onClick={() => window.location.reload()} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-black transition-colors"><VscHome className="text-lg" /></button>
      </div>

      {/* Address Bar */}
      <div className="flex-1 mx-2 relative">
        <div className="flex items-center bg-[#f1f3f4] rounded-full px-4 py-1.5 border border-transparent focus-within:border-blue-600 focus-within:bg-white focus-within:shadow-sm transition-all h-8">
            {/* Show Favicon if available, else Lock/Google icon */}
            {currentFavicon ? (
                <img src={currentFavicon} alt="" className="w-4 h-4 mr-2" />
            ) : inputVal && inputVal.includes('google') ? (
                <VscGlobe className="text-gray-500 mr-2 text-xs" />
            ) : (
                <img src="https://www.google.com/favicon.ico" alt="Sûr" className="w-4 h-4 mr-2" />
            )}

            {/* VPN Button */}
            <div className="bg-white text-gray-500 text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer hover:text-black transition-colors mr-2 select-none border border-gray-300 shadow-sm">
                VPN
            </div>
            
            <input 
                type="text" 
                className="bg-transparent border-none outline-none text-gray-800 text-sm w-full placeholder-gray-500 font-normal"
                placeholder="Rechercher sur le web"
                value={inputVal}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onFocus={() => inputVal.length > 1 && setShowSuggestions(true)}
            />
             <div className="flex space-x-2 text-gray-500">
                <VscSearch className="cursor-pointer hover:text-black text-sm" />
            </div>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-10 left-0 right-0 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
                {suggestions.map((s, i) => (
                    <div 
                        key={i} 
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center text-sm"
                        onClick={() => selectSuggestion(s)}
                    >
                        <VscSearch className="mr-3 text-gray-400" />
                        {s}
                    </div>
                ))}
            </div>
        )}
      </div>
      
      {/* Extension / Menu Area */}
      <div className="w-8 flex items-center justify-center">
        <FaCube className="text-gray-600 hover:text-black cursor-pointer text-lg" title="Extensions 3D" />
      </div>
    </div>
  );
});

export default TopBar;
