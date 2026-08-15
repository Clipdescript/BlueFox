import React, { useState, useEffect } from 'react';
import { MdArrowBack, MdArrowForward, MdRefresh, MdSearch, MdMic, MdTune, MdGraphicEq, MdChatBubbleOutline, MdExpandMore, MdAccountCircle } from 'react-icons/md';
import fetchJsonp from 'fetch-jsonp';

const ICON_COLOR = 'text-[#6d6e72]';

const TopBar = React.memo(({ onSearch, currentUrl, onReload, onBack, onForward, currentFavicon, onAssistant, isAssistantActive }) => {
  const [inputVal, setInputVal] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (!suggestions.length) return undefined;
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = `https://www.google.com/search?q=${encodeURIComponent(suggestions[0])}`;
    document.head.appendChild(link);
    return () => {
      try { document.head.removeChild(link); } catch { /* already removed */ }
    };
  }, [suggestions]);

  useEffect(() => setInputVal(currentUrl || ''), [currentUrl]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (inputVal.length > 1 && document.activeElement?.tagName === 'INPUT') {
        try {
          const response = await fetchJsonp(`https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(inputVal)}&hl=fr`);
          if (response.ok) {
            const data = await response.json();
            setSuggestions(data[1] || []);
            setShowSuggestions(true);
          }
        } catch {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } else if (inputVal.length <= 1) {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [inputVal]);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      onSearch(inputVal);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion) => {
    setInputVal(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="sticky top-0 z-50 flex h-12 items-center gap-2 border-b border-[#e1e0dd] bg-[#fffefe] px-3 text-[#202124]">
      <div className="flex shrink-0 items-center gap-0.5">
        <button type="button" onClick={onBack} className={`flex h-9 w-9 items-center justify-center rounded-full ${ICON_COLOR} transition-colors hover:bg-[#f0efed] hover:text-[#292929]`} aria-label="Page précédente"><MdArrowBack className="text-[19px]" /></button>
        <button type="button" onClick={onForward} className={`flex h-9 w-9 items-center justify-center rounded-full ${ICON_COLOR} transition-colors hover:bg-[#f0efed] hover:text-[#292929]`} aria-label="Page suivante"><MdArrowForward className="text-[19px]" /></button>
        <button type="button" onClick={onReload} className={`flex h-9 w-9 items-center justify-center rounded-full ${ICON_COLOR} transition-colors hover:bg-[#f0efed] hover:text-[#292929]`} aria-label="Actualiser"><MdRefresh className="text-[19px]" /></button>
      </div>

      <div className="relative min-w-0 flex-1">
        <div className="flex h-9 items-center rounded-[9px] border border-[#a9d5dd] bg-white px-3 transition-[border-color,box-shadow] focus-within:border-[#16899b] focus-within:ring-2 focus-within:ring-[#d9f0f3]">
          <img src={currentFavicon || '/Logo.ico'} alt="" className="mr-2 h-[18px] w-[18px] object-contain" />
          <input
            type="text"
            className="w-full bg-transparent text-[13px] text-[#292929] outline-none placeholder:text-[#77787b]"
            placeholder="Rechercher ou saisir une adresse"
            value={inputVal}
            onChange={(event) => setInputVal(event.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onFocus={() => inputVal.length > 1 && setShowSuggestions(true)}
          />
          <button type="button" onClick={() => onSearch(inputVal)} className={`ml-1 flex h-7 w-7 items-center justify-center rounded-full ${ICON_COLOR} hover:bg-[#f0efed] hover:text-[#292929]`} aria-label="Rechercher"><MdSearch className="text-[17px]" /></button>
          <button type="button" className={`ml-0.5 flex h-7 w-7 items-center justify-center rounded-full ${ICON_COLOR} hover:bg-[#f0efed] hover:text-[#292929]`} aria-label="Recherche vocale"><MdMic className="text-[17px]" /></button>
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-11 z-[100] overflow-hidden rounded-b-[10px] border border-[#d7d6d3] bg-white py-1 shadow-lg">
            {suggestions.map((suggestion, index) => (
              <button type="button" key={`${suggestion}-${index}`} className="flex w-full items-center px-3 py-2 text-left text-sm text-[#4f5054] hover:bg-[#f2f7f8] hover:text-[#202124]" onMouseDown={() => selectSuggestion(suggestion)}>
                <MdSearch className={`mr-3 ${ICON_COLOR}`} />{suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <button type="button" className={`flex h-9 w-9 items-center justify-center rounded-full ${ICON_COLOR} transition-colors hover:bg-[#f0efed] hover:text-[#292929]`} aria-label="Options"><MdTune className="text-[19px]" /></button>
        <button type="button" className={`hidden h-9 w-9 items-center justify-center rounded-full ${ICON_COLOR} transition-colors hover:bg-[#f0efed] hover:text-[#292929] sm:flex`} aria-label="Audio"><MdGraphicEq className="text-[19px]" /></button>
        <button type="button" onClick={onAssistant} className={`hidden h-9 items-center gap-1 rounded-full px-2 text-[13px] transition-colors lg:flex ${isAssistantActive ? 'bg-[#f0efed] text-[#292929]' : 'text-[#68696d] hover:bg-[#f0efed] hover:text-[#292929]'}`} aria-label={isAssistantActive ? 'Fermer Assistant' : 'Ouvrir Assistant'} aria-pressed={isAssistantActive}><MdChatBubbleOutline className="text-[17px]" /><span>Assistant</span><MdExpandMore className="text-[16px] transition-transform duration-200" /></button>
        <button type="button" className={`flex h-9 w-9 items-center justify-center rounded-full ${ICON_COLOR} transition-colors hover:bg-[#f0efed] hover:text-[#292929]`} aria-label="Profil"><MdAccountCircle className="text-[21px]" /></button>
      </div>
    </div>
  );
});

export default TopBar;
