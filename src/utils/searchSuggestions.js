import { createElement, useEffect, useMemo, useState } from 'react';
import { MdPublic } from 'react-icons/md';
import fetchJsonp from 'fetch-jsonp';
import { findSmartSearchResult } from './entitySearch.js';

export const SiteSuggestionIcon = ({ src = '', alt = '', imageClassName = '', fallbackClassName = '' }) => {
  const [hasError, setHasError] = useState(!src);

  useEffect(() => {
    setHasError(!src);
  }, [src]);

  if (!src || hasError) {
    return createElement(MdPublic, {
      className: fallbackClassName || imageClassName,
      'aria-label': 'Site sans favicon'
    });
  }

  return createElement('img', {
    src,
    alt,
    className: imageClassName,
    onError: () => setHasError(true)
  });
};

const getHistoryFavicon = (entry) => String(entry?.favicon || '').trim();

const isSiteHistoryEntry = (entry) => /^https?:\/\//i.test(String(entry?.url || ''));

const getSuggestionIcon = (entry) => (isSiteHistoryEntry(entry) ? getHistoryFavicon(entry) : '');

const getSuggestionKind = (entry) => (isSiteHistoryEntry(entry) ? 'history' : 'search');

const SUGGESTION_DELAY = 180;
const SMART_SUGGESTION_DELAY = 450;
const MAX_REMOTE_SUGGESTIONS = 6;
const HISTORY_KEY = 'bluefox_history';

const normalize = (value = '') => String(value).trim().toLocaleLowerCase();

const readLocalSuggestions = (query) => {
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    if (!Array.isArray(history)) return [];
    const normalizedQuery = normalize(query);
    return history
      .filter((entry) => {
        const title = normalize(entry.title);
        const url = normalize(entry.url);
        return title.includes(normalizedQuery) || url.includes(normalizedQuery);
      })
      .slice(0, 4)
      .map((entry) => ({
        id: `history:${entry.url}`,
        label: entry.title || entry.url,
        value: entry.url,
        detail: entry.url,
        favicon: getSuggestionIcon(entry),
        kind: getSuggestionKind(entry)
      }));
  } catch {
    return [];
  }
};

const readGoogleSuggestions = async (query) => {
  const response = await fetchJsonp(`https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}&hl=fr`);
  if (!response.ok) return [];
  const data = await response.json();
  return (Array.isArray(data[1]) ? data[1] : [])
    .slice(0, MAX_REMOTE_SUGGESTIONS)
    .map((label, index) => ({
      id: `remote:${label}:${index}`,
      label,
      value: label,
      detail: 'Suggestion de recherche',
      kind: 'search'
    }));
};

const mergeSuggestions = (localSuggestions, remoteSuggestions, query) => {
  const seen = new Set([normalize(query)]);
  return [...localSuggestions, ...remoteSuggestions].filter((suggestion) => {
    const key = normalize(suggestion.value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 8);
};

export const useSearchSuggestions = ({ query, focused, searchEngineId }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsQuery, setSuggestionsQuery] = useState('');
  const [smartSuggestion, setSmartSuggestion] = useState(null);
  const [smartSuggestionQuery, setSmartSuggestionQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const cleanQuery = query.trim();
  const visibleSuggestions = suggestionsQuery === cleanQuery ? suggestions : [];
  const visibleSmartSuggestion = smartSuggestionQuery === cleanQuery ? smartSuggestion : null;
  const smartAndSuggestions = useMemo(
    () => [
      ...(visibleSmartSuggestion ? [{ ...visibleSmartSuggestion, kind: 'smart', value: visibleSmartSuggestion.target || visibleSmartSuggestion.searchQuery }] : []),
      ...visibleSuggestions
    ],
    [visibleSmartSuggestion, visibleSuggestions]
  );

  useEffect(() => {
    setHighlightedIndex(-1);
    setSmartSuggestion(null);
    setSmartSuggestionQuery('');
    if (!focused || cleanQuery.length < 2) {
      setSuggestions([]);
      setSuggestionsQuery('');
      setIsLoading(false);
      return undefined;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      const localSuggestions = readLocalSuggestions(cleanQuery);
      let remoteSuggestions = [];

      // Do not send queries to Google when another search engine is selected.
      // Other engines still get useful local history suggestions without leaking
      // the text to an unrelated provider.
      if (searchEngineId === 'google') {
        try {
          remoteSuggestions = await readGoogleSuggestions(cleanQuery);
        } catch {
          remoteSuggestions = [];
        }
      }

      if (!cancelled) {
        setSuggestions(mergeSuggestions(localSuggestions, remoteSuggestions, cleanQuery));
        setSuggestionsQuery(cleanQuery);
        setIsLoading(false);
      }
    }, SUGGESTION_DELAY);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [cleanQuery, focused, searchEngineId]);

  useEffect(() => {
    if (!focused || cleanQuery.length < 3) {
      setSmartSuggestion(null);
      return undefined;
    }

    const controller = new AbortController();
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const result = await findSmartSearchResult(cleanQuery, { signal: controller.signal });
        if (!cancelled) {
          setSmartSuggestion(result);
          setSmartSuggestionQuery(cleanQuery);
        }
      } catch {
        if (!cancelled) setSmartSuggestion(null);
      }
    }, SMART_SUGGESTION_DELAY);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [cleanQuery, focused]);

  const moveHighlight = (direction) => {
    if (!smartAndSuggestions.length) return;
    setHighlightedIndex((currentIndex) => {
      const nextIndex = currentIndex + direction;
      if (nextIndex < 0) return smartAndSuggestions.length - 1;
      if (nextIndex >= smartAndSuggestions.length) return 0;
      return nextIndex;
    });
  };

  const highlightedSuggestion = highlightedIndex >= 0 ? smartAndSuggestions[highlightedIndex] : null;

  return {
    suggestions: visibleSuggestions,
    smartSuggestion: visibleSmartSuggestion,
    isLoading,
    highlightedIndex,
    highlightedSuggestion,
    moveHighlight,
    clearSuggestions: () => {
      setSuggestions([]);
      setSuggestionsQuery('');
      setSmartSuggestion(null);
      setSmartSuggestionQuery('');
      setHighlightedIndex(-1);
    }
  };
};
