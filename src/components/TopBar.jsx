import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaDiscord } from 'react-icons/fa';
import {
  MdApps,
  MdAutoAwesome,
  MdBookmarkBorder,
  MdAccountCircle,
  MdCallSplit,
  MdWallet,
  MdCleaningServices,
  MdFileOpen,
  MdManageHistory,
  MdOpenInBrowser,
  MdShare,
  MdTab,
  MdArrowBack,
  MdArrowForward,
  MdMoreHoriz,
  MdNorthEast,
  MdDownload,
  MdExpandMore,
  MdExtension,
  MdPowerSettingsNew,
  MdGamepad,
  MdHomeFilled,
  MdInfoOutline,
  MdKey,
  MdLocationOn,
  MdMic,
  MdMusicNote,
  MdPrint,
  MdPublic,
  MdRefresh,
  MdSearch,
  MdSettings,
  MdTune,
  MdWifi,
  MdWbSunny,
  MdMenu,
  MdVerticalSplit,
  MdViewInAr,
  MdZoomIn,
} from 'react-icons/md';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserSecret } from '@fortawesome/free-solid-svg-icons';
import { DEFAULT_SEARCH_ENGINE_ID, getSearchEngine, getSearchEngineIcon, SEARCH_ENGINE_STORAGE_KEY } from '../utils/searchEngines.js';
import { SiteSuggestionIcon, useSearchSuggestions } from '../utils/searchSuggestions.js';

const ICON_COLOR = 'text-[#6d6e72]';
const BLUEFOX_ADDONS_URL = 'https://bluefox-add-ons.pages.dev/';
let whisperPipelinePromise = null;

const getWhisperPipeline = async (onProgress) => {
  if (!whisperPipelinePromise) {
    whisperPipelinePromise = import('@huggingface/transformers').then(({ env, pipeline }) => {
      env.allowLocalModels = false;
      env.useBrowserCache = true;

      const onnxRuntimeVersion = env.backends.onnx?.versions?.web;
      if (onnxRuntimeVersion && env.backends.onnx?.wasm) {
        const onnxWasmCdnBase = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${onnxRuntimeVersion}/dist/`;
        env.backends.onnx.wasm.wasmPaths = {
          mjs: `${onnxWasmCdnBase}ort-wasm-simd-threaded.asyncify.mjs`,
          wasm: `${onnxWasmCdnBase}ort-wasm-simd-threaded.asyncify.wasm`
        };
      }
      const files = new Map();
      const reportProgress = (progress) => {
        if (!onProgress || !progress) return;
        if (progress.status === 'progress' || progress.status === 'done') {
          const file = progress.file || 'model';
          const total = Number(progress.total);
          const loaded = progress.status === 'done' && Number.isFinite(total)
            ? total
            : Number(progress.loaded);
          files.set(file, {
            loaded: Number.isFinite(loaded) ? loaded : 0,
            total: Number.isFinite(total) && total > 0 ? total : 0,
            progress: Number(progress.progress) || 0
          });
          const entries = [...files.values()];
          const totalBytes = entries.reduce((sum, entry) => sum + entry.total, 0);
          const loadedBytes = entries.reduce((sum, entry) => sum + entry.loaded, 0);
          const percent = totalBytes > 0
            ? (loadedBytes / totalBytes) * 100
            : Math.max(...entries.map((entry) => entry.progress), 0);
          onProgress({ ...progress, progress: percent });
          return;
        }
        onProgress(progress);
      };
      // The q8 decoder currently fails in ONNX Runtime on some Windows GPUs,
      // while Whisper Small can exceed the available WASM memory on ordinary PCs.
      // Base keeps local transcription reliable without a large allocation.
      return pipeline('automatic-speech-recognition', 'Xenova/whisper-base', {
        dtype: 'fp32',
        progress_callback: reportProgress
      });
    });
  }
  return whisperPipelinePromise;
};

const SecretAgentIcon = (props) => <FontAwesomeIcon icon={faUserSecret} {...props} />;

const formatCompactAddress = (url) => {
  if (!url) return '';
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol === 'bluefox:') return url;
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) return url.replace(/^[a-z]+:\/\//i, '');
    return `${parsedUrl.hostname.replace(/^www\./i, '')}${parsedUrl.port ? `:${parsedUrl.port}` : ''}`;
  } catch {
    return url.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  }
};


const MenuRow = ({ icon: Icon, children, shortcut, onClick, className = '' }) => (
  <button type="button" onClick={onClick} className={`bluefox-topbar-menu-row flex min-h-7 w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[12px] text-[#303134] transition-colors hover:bg-[#f0efed] ${className}`}>
    <span className="flex h-4 w-4 shrink-0 items-center justify-center leading-none">
      <Icon className="text-[16px] text-[#5f6368]" />
    </span>
    <span className="min-w-0 flex-1 truncate">{children}</span>
    {shortcut && <span className="shrink-0 text-[11px] text-[#6d6e72]">{shortcut}</span>}
  </button>
);

const TopBar = React.memo(({ onSearch, onAskFoxy, currentUrl, currentFavicon, isAiMode, isSettingsOpen, isGame, isPageError = false, isOfflineFallback, showHomeButton, onHome, onReload, onBack, onForward, onAssistant, onSettings, onSettingsSection, onModeChange, isAssistantActive, isMenuOpen = false, onMenuChange, onNewTab, onOpenPdf, onPrint, onNewWindow, onNewPrivateWindow, onPlayGame, onZoomOut, onZoomIn, zoomFactor = 1, discordProfile, onDiscordLogin, onDiscordLogout }) => {
  const { t, i18n } = useTranslation('common');
  const addressPlaceholders = t('topbar.addressPlaceholders', { returnObjects: true });
  const [inputVal, setInputVal] = useState('');
  const [isAddressFocused, setIsAddressFocused] = useState(false);
  const [isInputDirty, setIsInputDirty] = useState(false);
  const [isFaviconBroken, setIsFaviconBroken] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isPlaceholderVisible, setIsPlaceholderVisible] = useState(true);
  const [searchEngineId, setSearchEngineId] = useState(() => localStorage.getItem(SEARCH_ENGINE_STORAGE_KEY) || DEFAULT_SEARCH_ENGINE_ID);
  const [isDiscordProfileOpen, setIsDiscordProfileOpen] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [isVoiceTranscribing, setIsVoiceTranscribing] = useState(false);
  const [isWhisperPreparing, setIsWhisperPreparing] = useState(false);
  const [whisperDownloadProgress, setWhisperDownloadProgress] = useState(null);
  const [voiceError, setVoiceError] = useState('');
  const menuRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const voiceChunksRef = useRef([]);
  const voiceStopTimerRef = useRef(null);
  const voiceLiveTranscribingRef = useRef(false);
  const voiceLastPreviewAtRef = useRef(0);
  const discordProfileRef = useRef(null);

  useEffect(() => {
    setInputVal(currentUrl || '');
    setIsInputDirty(false);
  }, [currentUrl]);
  useEffect(() => {
    if (isAddressFocused || currentUrl || inputVal) {
      setIsPlaceholderVisible(false);
      return undefined;
    }

    setIsPlaceholderVisible(true);
    let transitionTimer = null;
    const timer = window.setInterval(() => {
      setIsPlaceholderVisible(false);
      transitionTimer = window.setTimeout(() => {
        setPlaceholderIndex((index) => (index + 1) % addressPlaceholders.length);
        setIsPlaceholderVisible(true);
      }, 260);
    }, 3200);
    return () => {
      window.clearInterval(timer);
      if (transitionTimer) window.clearTimeout(transitionTimer);
    };
  }, [addressPlaceholders.length, currentUrl, inputVal, isAddressFocused]);
  useEffect(() => setIsFaviconBroken(false), [currentFavicon, currentUrl, isAiMode, isSettingsOpen]);
  useEffect(() => {
    const handleSearchEngineChange = (event) => {
      setSearchEngineId(event.detail || DEFAULT_SEARCH_ENGINE_ID);
      setIsFaviconBroken(false);
    };
    window.addEventListener('bluefox-search-engine-changed', handleSearchEngineChange);
    return () => window.removeEventListener('bluefox-search-engine-changed', handleSearchEngineChange);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const closeMenu = (event) => {
      if (!menuRef.current?.contains(event.target)) onMenuChange?.(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onMenuChange?.(false);
    };
    document.addEventListener('mousedown', closeMenu);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeMenu);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isMenuOpen, onMenuChange]);

  useEffect(() => {
    if (!isDiscordProfileOpen) return undefined;
    const closeProfile = (event) => {
      if (!discordProfileRef.current?.contains(event.target)) setIsDiscordProfileOpen(false);
    };
    document.addEventListener('mousedown', closeProfile);
    return () => document.removeEventListener('mousedown', closeProfile);
  }, [isDiscordProfileOpen]);

  useEffect(() => {
    if (!discordProfile) setIsDiscordProfileOpen(false);
  }, [discordProfile]);

  useEffect(() => () => {
    if (voiceStopTimerRef.current) window.clearTimeout(voiceStopTimerRef.current);
    mediaRecorderRef.current?.stop?.();
    mediaStreamRef.current?.getTracks?.().forEach((track) => track.stop());
    mediaRecorderRef.current = null;
    mediaStreamRef.current = null;
  }, []);

  const stopVoiceRecorder = () => {
    if (voiceStopTimerRef.current) {
      window.clearTimeout(voiceStopTimerRef.current);
      voiceStopTimerRef.current = null;
    }
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === 'recording') recorder.stop();
  };

  const transcribeVoicePreview = async (chunks) => {
    if (voiceLiveTranscribingRef.current || chunks.length < 2) return;
    voiceLiveTranscribingRef.current = true;
    let audioUrl = '';
    try {
      const audioBlob = new Blob(chunks, { type: 'audio/webm' });
      audioUrl = URL.createObjectURL(audioBlob);
      const transcriber = await getWhisperPipeline((progress) => {
        if ((progress?.status === 'progress' || progress?.status === 'done') && Number.isFinite(Number(progress.progress))) {
          setWhisperDownloadProgress(Math.max(0, Math.min(100, Math.round(Number(progress.progress)))));
          if (progress.status === 'done') setIsWhisperPreparing(true);
        }
      });
      setIsWhisperPreparing(false);
      const result = await transcriber(audioUrl, { language: i18n.resolvedLanguage || 'fr', task: 'transcribe' });
      const transcript = String(result?.text || '').replace(/\s+/g, ' ').trim();
      if (transcript) {
        setInputVal(transcript);
        setIsInputDirty(true);
        setIsAddressFocused(true);
      }
    } catch {
      // Partial chunks are sometimes not decodable yet; the final recording is retried on stop.
    } finally {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      voiceLiveTranscribingRef.current = false;
    }
  };

  const handleVoiceSearch = async () => {
    if (isVoiceTranscribing) return;
    if (isVoiceListening) {
      stopVoiceRecorder();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setVoiceError(t('topbar.audioUnavailable'));
      window.setTimeout(() => setVoiceError(''), 5000);
      return;
    }

    setVoiceError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true }
      });
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
        .find((type) => MediaRecorder.isTypeSupported?.(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      voiceChunksRef.current = [];
      voiceLastPreviewAtRef.current = 0;
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (!event.data?.size) return;
        voiceChunksRef.current.push(event.data);
        const now = Date.now();
        if (voiceChunksRef.current.length >= 2 && now - voiceLastPreviewAtRef.current >= 1500) {
          voiceLastPreviewAtRef.current = now;
          void transcribeVoicePreview([...voiceChunksRef.current]);
        }
      };
      recorder.onerror = () => {
        setVoiceError(t('topbar.microphoneCapture'));
        setIsVoiceListening(false);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        setIsVoiceListening(false);
        while (voiceLiveTranscribingRef.current) {
          await new Promise((resolve) => window.setTimeout(resolve, 50));
        }
        const chunks = voiceChunksRef.current;
        voiceChunksRef.current = [];
        if (!chunks.length) {
          setVoiceError(t('topbar.noVoice'));
          window.setTimeout(() => setVoiceError(''), 4000);
          return;
        }

        setIsVoiceTranscribing(true);
        setWhisperDownloadProgress(null);
        try {
          const audioBlob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);
          const transcriber = await getWhisperPipeline((progress) => {
            if ((progress?.status === 'progress' || progress?.status === 'done') && Number.isFinite(Number(progress.progress))) {
              setWhisperDownloadProgress(Math.max(0, Math.min(100, Math.round(Number(progress.progress)))));
              if (progress.status === 'done') setIsWhisperPreparing(true);
            }
          });
          setIsWhisperPreparing(false);
          const result = await transcriber(audioUrl, { language: i18n.resolvedLanguage || 'fr', task: 'transcribe' });
          URL.revokeObjectURL(audioUrl);
          const transcript = String(result?.text || '').replace(/\s+/g, ' ').trim();
          if (!transcript) throw new Error('Aucune phrase reconnue.');
          setInputVal(transcript);
          setShowSuggestions(false);
          setIsAddressFocused(true);
        } catch (error) {
          setVoiceError(t('topbar.transcriptionError', { error: error.message || 'unknown error' }));
          window.setTimeout(() => setVoiceError(''), 6000);
        } finally {
          setWhisperDownloadProgress(null);
          setIsWhisperPreparing(false);
          setIsVoiceTranscribing(false);
        }
      };
      recorder.start(250);
      setIsVoiceListening(true);
      voiceStopTimerRef.current = window.setTimeout(stopVoiceRecorder, 10000);
    } catch (error) {
      setIsVoiceListening(false);
      setVoiceError(error.name === 'NotAllowedError'
        ? t('topbar.allowMicrophone')
        : t('topbar.microphoneCapture'));
      window.setTimeout(() => setVoiceError(''), 5000);
    }
  };

  const {
    suggestions,
    smartSuggestion,
    isLoading: isSuggestionsLoading,
    highlightedIndex,
    highlightedSuggestion,
    moveHighlight,
    clearSuggestions
  } = useSearchSuggestions({ query: inputVal, focused: isAddressFocused, searchEngineId });

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setShowSuggestions(true);
      moveHighlight(event.key === 'ArrowDown' ? 1 : -1);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      clearSuggestions();
      setShowSuggestions(false);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const value = highlightedSuggestion?.value || inputVal;
      setInputVal(highlightedSuggestion?.label || inputVal);
      setIsInputDirty(false);
      clearSuggestions();
      onSearch(value);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion) => {
    setInputVal(suggestion.label);
    setIsInputDirty(false);
    clearSuggestions();
    onSearch(suggestion.value);
    setShowSuggestions(false);
  };

  const activeSearchEngine = getSearchEngine(searchEngineId);
  const activeSearchEngineIcon = getSearchEngineIcon(activeSearchEngine);

  return (
    <div className="bluefox-topbar sticky top-0 z-50 flex h-12 items-center gap-2 border-b border-[#e1e0dd] bg-[#fffefe] px-3 text-[#202124]">
      <div className="flex shrink-0 items-center gap-0.5">
        <button type="button" onClick={onBack} className={`flex h-9 w-9 items-center justify-center rounded-full ${ICON_COLOR} transition-colors hover:bg-[#f0efed] hover:text-[#292929]`} aria-label={t('topbar.previous')}><MdArrowBack className="text-[19px]" /></button>
        <button type="button" onClick={onForward} className={`flex h-9 w-9 items-center justify-center rounded-full ${ICON_COLOR} transition-colors hover:bg-[#f0efed] hover:text-[#292929]`} aria-label={t('topbar.next')}><MdArrowForward className="text-[19px]" /></button>
        <button type="button" onClick={onReload} className={`flex h-9 w-9 items-center justify-center rounded-full ${ICON_COLOR} transition-colors hover:bg-[#f0efed] hover:text-[#292929]`} aria-label={t('topbar.reload')}><MdRefresh className="text-[19px]" /></button>
        {showHomeButton && <button type="button" onClick={onHome} className={`flex h-9 w-9 items-center justify-center rounded-full ${ICON_COLOR} transition-colors hover:bg-[#f0efed] hover:text-[#292929]`} aria-label={t('topbar.home')} title={t('topbar.home')}><MdHomeFilled className="text-[19px]" /></button>}
      </div>

      <div className="relative min-w-0 flex-1">
        <div className={`bluefox-address-bar flex h-9 items-center border border-[#a9d5dd] bg-white px-3 transition-[border-color,box-shadow] focus-within:border-[#16899b] focus-within:ring-2 focus-within:ring-[#d9f0f3] ${showSuggestions && (suggestions.length > 0 || smartSuggestion || isSuggestionsLoading || inputVal.trim()) ? 'rounded-t-[12px] rounded-b-none border-[#8fcbd4]' : 'rounded-[12px]'}`}>
          {isSettingsOpen ? (
            <MdTune className="mr-2 h-[18px] w-[18px] shrink-0 text-[#137b8b]" aria-label={t('topbar.settings')} />
          ) : isPageError ? (
            <MdPublic className="bluefox-address-fallback-icon mr-2 h-[18px] w-[18px] shrink-0" aria-label={t('tabs.pageNotFound')} />
          ) : isGame || isOfflineFallback ? (
            <MdGamepad className="bluefox-address-game-icon mr-2 h-[18px] w-[18px] shrink-0 text-[#7346bc]" aria-label={t('tabs.offlineGame')} />
          ) : isAiMode ? (
            <MdAutoAwesome className="mr-2 h-[18px] w-[18px] shrink-0 text-[#137b8b]" aria-label={t('topbar.aiMode')} />
          ) : currentFavicon && !isFaviconBroken ? (
            <img
              src={currentFavicon}
              alt=""
              className="mr-2 h-[18px] w-[18px] object-contain"
              onError={() => setIsFaviconBroken(true)}
            />
          ) : !currentUrl && !isFaviconBroken ? (
            <img
              src={activeSearchEngineIcon}
              alt={`Moteur de recherche ${activeSearchEngine.name}`}
              className="mr-2 h-[18px] w-[18px] object-contain"
              onError={() => setIsFaviconBroken(true)}
            />
          ) : (
            <MdPublic className="bluefox-address-fallback-icon mr-2 h-[18px] w-[18px] shrink-0" aria-label={t('tabs.siteNoIcon')} />
          )}
          <div className="relative min-w-0 flex-1">
            <input
              type="text"
              className="relative z-10 w-full bg-transparent text-[13px] text-[#292929] outline-none placeholder:text-[#77787b]"
              placeholder=""
              value={isAddressFocused || isInputDirty ? inputVal : formatCompactAddress(currentUrl)}
              onChange={(event) => {
                setInputVal(event.target.value);
                setIsInputDirty(true);
                setShowSuggestions(true);
              }}
              onClick={(event) => event.currentTarget.select()}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                setIsAddressFocused(false);
                setTimeout(() => {
                  clearSuggestions();
                  setShowSuggestions(false);
                }, 160);
              }}
              onFocus={() => {
                setIsAddressFocused(true);
                if (inputVal.length > 1) setShowSuggestions(true);
              }}
            />
            {!isAddressFocused && !currentUrl && !inputVal && <span key={placeholderIndex} className={`bluefox-address-placeholder pointer-events-none absolute inset-0 flex items-center text-[13px] text-[#77787b] ${isPlaceholderVisible ? 'is-visible' : 'is-leaving'}`} aria-hidden="true">{addressPlaceholders[placeholderIndex]}</span>}
          </div>
          <button type="button" onClick={() => { setIsInputDirty(false); onSearch(inputVal); }} className={`ml-1 flex h-7 w-7 items-center justify-center rounded-full ${ICON_COLOR} hover:bg-[#f0efed] hover:text-[#292929]`} aria-label={t('topbar.search')}><MdSearch className="text-[17px]" /></button>
          <button type="button" onClick={handleVoiceSearch} disabled={isVoiceTranscribing} className={`ml-0.5 flex h-7 w-7 items-center justify-center rounded-full transition-colors disabled:cursor-wait ${isVoiceListening || isVoiceTranscribing ? 'bg-[#dff3f5] text-[#137b8b]' : `${ICON_COLOR} hover:bg-[#f0efed] hover:text-[#292929]`}`} aria-label={isVoiceTranscribing ? t('topbar.transcribing') : isVoiceListening ? t('topbar.stopVoice') : t('topbar.voiceSearch')} aria-pressed={isVoiceListening} title={voiceError || (isVoiceTranscribing ? t('topbar.transcribing') : isVoiceListening ? t('topbar.stopVoice') : t('topbar.voiceSearch'))}><MdMic className={`text-[17px] ${isVoiceListening || isVoiceTranscribing ? 'animate-pulse' : ''}`} /></button>
          <span className="sr-only" aria-live="polite">{voiceError || (whisperDownloadProgress !== null ? t('topbar.downloadWhisper', { percent: whisperDownloadProgress }) : isWhisperPreparing ? t('topbar.prepareWhisper') : isVoiceTranscribing ? t('topbar.localTranscription') : isVoiceListening ? t('topbar.voiceSearch') : '')}</span>
        </div>
        {(voiceError || isVoiceListening || isVoiceTranscribing || isWhisperPreparing) && <div className={`absolute left-0 right-0 top-10 z-[110] rounded-b-[9px] border border-t-0 px-3 py-2 text-[11px] shadow-[0_8px_18px_rgba(32,33,36,0.10)] ${voiceError ? 'border-[#e5b9bd] bg-[#fff5f5] text-[#a33e49]' : 'border-[#b9dfe4] bg-[#f0fbfc] text-[#137b8b]'}`} role="status" aria-live="polite">
          {voiceError || (whisperDownloadProgress !== null ? t('topbar.downloadWhisper', { percent: whisperDownloadProgress }) : isWhisperPreparing ? t('topbar.prepareWhisper') : isVoiceTranscribing ? t('topbar.localTranscription') : t('topbar.listeningNow'))}
          {whisperDownloadProgress !== null && <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-[#d7edf0]"><span className="block h-full bg-[#16899b] transition-[width] duration-150" style={{ width: `${whisperDownloadProgress}%` }} /></div>}
        </div>}

        {showSuggestions && (suggestions.length > 0 || smartSuggestion || isSuggestionsLoading || inputVal.trim()) && (
          <div className="bluefox-address-suggestions absolute left-0 right-0 top-9 z-[100] overflow-hidden rounded-b-[12px] border border-t-0 border-[#8fcbd4] bg-white/90 py-1.5 shadow-[0_16px_34px_rgba(32,33,36,0.14)]">
            {inputVal.trim() && <button type="button" className="bluefox-address-suggestion bluefox-address-first-result flex w-full items-center px-3 py-2 text-left text-sm font-medium text-[#292929] transition-colors duration-150" onMouseDown={(event) => event.preventDefault()} onClick={() => { setIsInputDirty(false); clearSuggestions(); onSearch(inputVal.trim()); setShowSuggestions(false); }}>
              <MdNorthEast className={`mr-3 ${ICON_COLOR}`} />{t('topbar.searchFor', { query: inputVal.trim() })}
            </button>}
            {smartSuggestion && <button type="button" className={`bluefox-address-smart-card ${highlightedIndex === 0 ? 'is-highlighted' : ''}`} onMouseDown={(event) => event.preventDefault()} onClick={() => { setIsInputDirty(false); clearSuggestions(); onSearch(smartSuggestion.target || smartSuggestion.searchQuery); setShowSuggestions(false); }}>
              <span className="bluefox-address-smart-image">
                {smartSuggestion.kind === 'weather' && !smartSuggestion.favicon && !smartSuggestion.image ? (
                  <MdLocationOn aria-hidden="true" />
                ) : (
                  <SiteSuggestionIcon
                    src={smartSuggestion.favicon || smartSuggestion.image}
                    imageClassName="relative z-[1] h-full w-full object-cover"
                    fallbackClassName="bluefox-address-smart-fallback"
                  />
                )}
              </span>
              <span className="bluefox-address-smart-copy">
                <small>{smartSuggestion.kind === 'site' ? t('topbar.recognizedSite') : smartSuggestion.kind === 'weather' ? t('topbar.weather') : smartSuggestion.kind === 'person' ? t('topbar.person') : smartSuggestion.kind === 'game' ? t('topbar.videoGame') : smartSuggestion.kind === 'subject' ? t('topbar.subject') : smartSuggestion.kind === 'city' ? t('topbar.city') : t('topbar.recognizedResult')}</small>
                <strong>{smartSuggestion.title}{smartSuggestion.country ? ` · ${smartSuggestion.country}` : ''}</strong>
                <span>{smartSuggestion.weather?.temperature !== null && smartSuggestion.weather ? `${smartSuggestion.weather.temperature} °C · ${smartSuggestion.weather.description}` : smartSuggestion.admin || t('topbar.seeWebResults')}</span>
              </span>
              {smartSuggestion.weather ? <MdWbSunny className="bluefox-address-smart-status" aria-hidden="true" /> : <MdNorthEast className="bluefox-address-smart-status" aria-hidden="true" />}
            </button>}
            {suggestions.map((suggestion, index) => (
              <button
                type="button"
                key={suggestion.id}
                aria-selected={highlightedIndex === (smartSuggestion ? index + 1 : index)}
                className={`bluefox-address-suggestion flex w-full items-center px-3 py-2 text-left text-sm text-[#4f5054] transition-colors duration-150 hover:bg-[#eef8fa] hover:text-[#202124] ${highlightedIndex === (smartSuggestion ? index + 1 : index) ? 'is-highlighted' : ''}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectSuggestion(suggestion)}
              >
                {suggestion.kind === 'history' ? (
                  <SiteSuggestionIcon
                    src={suggestion.favicon}
                    imageClassName="mr-3 h-[18px] w-[18px] object-contain"
                    fallbackClassName={`mr-3 h-[18px] w-[18px] ${ICON_COLOR}`}
                  />
                ) : (
                  <MdSearch className={`mr-3 ${ICON_COLOR}`} />
                )}
                <span className="min-w-0 flex-1 truncate">{suggestion.label}</span>
                {suggestion.kind === 'history' && <small className="ml-2 shrink-0 text-[10px] text-[#8a9099]">{t('topbar.historyLabel')}</small>}
              </button>
            ))}
            {isSuggestionsLoading && <div className="bluefox-address-suggestions-status" role="status">{t('topbar.searchSuggestionsLoading')}</div>}
            {inputVal.trim() && <button type="button" className="bluefox-address-foxy-action flex w-full items-center gap-2 border-t border-[#d9eef0] px-3 py-2 text-left text-sm font-medium text-[#137b8b] transition-colors hover:bg-[#eef8fa]" onMouseDown={(event) => event.preventDefault()} onClick={() => { setIsInputDirty(false); clearSuggestions(); onAskFoxy?.(inputVal.trim()); setShowSuggestions(false); }}>
              <MdAutoAwesome className="text-[16px]" />{t('topbar.askFoxy')}</button>}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <button type="button" onClick={onAssistant} className={`hidden h-9 items-center gap-1 rounded-full px-2 text-[13px] transition-colors lg:flex ${isAssistantActive ? 'bg-[#f0efed] text-[#292929]' : 'text-[#68696d] hover:bg-[#f0efed] hover:text-[#292929]'}`} aria-label={isAssistantActive ? t('topbar.closeAssistant') : t('topbar.openAssistant')} aria-pressed={isAssistantActive}><MdAutoAwesome className="text-[17px]" /><span>{t('topbar.assistant')}</span><MdExpandMore className="text-[16px] transition-transform duration-200" /></button>
        <div className="hidden items-center gap-1.5 lg:flex" aria-label={t('topbar.webMode')}>
          <button
            type="button"
            onClick={() => onModeChange?.(!isAiMode)}
            className="bluefox-topbar-mode-switch relative flex h-8 w-[96px] items-center rounded-full border p-1 text-[10px] font-semibold tracking-wide transition-colors"
            role="switch"
            aria-checked={isAiMode}
            aria-label={`${t('topbar.webMode')} / ${t('topbar.aiMode')}`}
            title={isAiMode ? t('topbar.aiMode') : t('topbar.webMode')}
          >
            <span className="absolute left-1 top-1 h-6 w-[44px] rounded-full shadow-sm transition-transform duration-200 ease-out" style={{ transform: isAiMode ? 'translateX(44px)' : 'translateX(0)' }} />
            <span className={`bluefox-topbar-mode-label ${isAiMode ? 'is-inactive' : 'is-active'} relative z-10 flex w-1/2 justify-center`}>WEB</span>
            <span className={`bluefox-topbar-mode-label ${isAiMode ? 'is-active' : 'is-inactive'} relative z-10 flex w-1/2 justify-center`}>IA</span>
          </button>
        </div>
        <div ref={discordProfileRef} className="relative" onMouseEnter={() => discordProfile && setIsDiscordProfileOpen(true)} onMouseLeave={() => setIsDiscordProfileOpen(false)}>
          <button type="button" onClick={() => discordProfile ? setIsDiscordProfileOpen((open) => !open) : onDiscordLogin?.()} className={`flex h-9 w-9 items-center justify-center rounded-full ${ICON_COLOR} transition-colors hover:bg-[#f0efed] hover:text-[#292929]`} aria-label={discordProfile ? t('topbar.discordProfile') : t('topbar.loginDiscord')} aria-expanded={Boolean(discordProfile && isDiscordProfileOpen)} title={discordProfile ? t('topbar.connectedAs', { name: discordProfile.globalName || discordProfile.username }) : t('topbar.loginDiscord')}>{discordProfile ? <img src={discordProfile.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" /> : <MdAccountCircle className="text-[21px]" />}</button>
          {discordProfile && isDiscordProfileOpen && (
            <div className="bluefox-discord-profile-popover" role="dialog" aria-label="Profil Discord">
              <div className="bluefox-discord-profile-heading">
                <img src={discordProfile.avatarUrl} alt="" className="bluefox-discord-profile-avatar" />
                <div className="min-w-0">
                  <strong>{t('topbar.hello', { name: discordProfile.globalName || discordProfile.username })}</strong>
                  <span>@{discordProfile.username}</span>
                </div>
              </div>
              <div className="bluefox-discord-profile-status"><FaDiscord className="bluefox-discord-profile-status-icon" aria-hidden="true" /> {t('topbar.connectedWithDiscord')}</div>
              <p className="bluefox-discord-profile-note">{t('topbar.connectedWithDiscord')}</p>
              <div className="bluefox-discord-profile-actions">
                <button type="button" onClick={() => { onSettings?.(); setIsDiscordProfileOpen(false); }}>{t('topbar.accountSettings')}</button>
                <button type="button" className="is-secondary" onClick={() => { onDiscordLogout?.(); setIsDiscordProfileOpen(false); }}>{t('topbar.logout')}</button>
              </div>
            </div>
          )}
        </div>
        <button type="button" onClick={() => onSearch(BLUEFOX_ADDONS_URL)} className="bluefox-topbar-utility-button flex h-9 w-9 items-center justify-center rounded-full" aria-label="Ouvrir BlueFox Add Ons" title="Extensions BlueFox"><MdViewInAr className="text-[21px]" /></button>
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => onMenuChange?.(!isMenuOpen)}
            className={`bluefox-topbar-menu-trigger flex h-9 w-9 items-center justify-center rounded-full ${isMenuOpen ? 'bg-[#f0efed] text-[#292929]' : ICON_COLOR} transition-colors hover:bg-[#f0efed] hover:text-[#292929]`}
            aria-label={t('topbar.menu')}
            aria-expanded={isMenuOpen}
          >
            <MdMenu className="text-[20px]" />
          </button>

          {isMenuOpen && (
            <div className="bluefox-topbar-menu absolute right-0 top-11 z-[200] max-h-[calc(100vh-76px)] w-[320px] overflow-hidden rounded-lg border border-[#deddd9] bg-white p-1.5 text-[#303134] shadow-none">
              <MenuRow icon={MdTab} shortcut="Ctrl+T" onClick={() => { onNewTab?.(); onMenuChange?.(false); }}>{t('topbar.newTab')}</MenuRow>
              <MenuRow icon={MdFileOpen} onClick={async () => { await onOpenPdf?.(); onMenuChange?.(false); }}>{t('topbar.openPdf')}</MenuRow>
              <MenuRow icon={MdOpenInBrowser} shortcut="Ctrl+N" onClick={() => { onNewWindow?.(); onMenuChange?.(false); }}>{t('topbar.newWindow')}</MenuRow>
              <MenuRow icon={SecretAgentIcon} shortcut="Ctrl+Maj+N" onClick={() => { onNewPrivateWindow?.(); onMenuChange?.(false); }}>{t('topbar.privateWindow')}</MenuRow>

              <div className="my-1 border-t border-[#e7e6e3]" />
              <MenuRow icon={MdHomeFilled} onClick={() => { onHome?.(); onMenuChange?.(false); }}>{t('topbar.home')}</MenuRow>
              <MenuRow icon={MdWallet} onClick={() => { onSettingsSection?.('wallet'); onMenuChange?.(false); }}>{t('topbar.wallet')}</MenuRow>
              <MenuRow icon={MdWifi} onClick={() => { onSettingsSection?.('vpn'); onMenuChange?.(false); }}>{t('topbar.vpn')}</MenuRow>

              <div className="my-1 border-t border-[#e7e6e3]" />
              <MenuRow icon={MdVerticalSplit} shortcut="Activé" onClick={() => { onAssistant?.(); onMenuChange?.(false); }}>{t('topbar.sidebar')}</MenuRow>
              <MenuRow icon={MdKey} onClick={() => { onSettingsSection?.('passwords'); onMenuChange?.(false); }}>{t('topbar.passwords')}</MenuRow>
              <MenuRow icon={MdManageHistory} onClick={() => { onSettingsSection?.('history'); onMenuChange?.(false); }}>{t('topbar.history')}</MenuRow>
              <MenuRow icon={MdBookmarkBorder}>{t('topbar.bookmarks')}</MenuRow>
              <MenuRow icon={MdDownload} shortcut="Ctrl+J" onClick={() => { onSettingsSection?.('downloads'); onMenuChange?.(false); }}>{t('topbar.downloads')}</MenuRow>
              <MenuRow icon={MdViewInAr} onClick={() => { onSearch(BLUEFOX_ADDONS_URL); onMenuChange?.(false); }}>{t('topbar.addons')}</MenuRow>
              <MenuRow icon={MdCleaningServices} shortcut="Ctrl+Maj+Suppr" onClick={() => { onSettingsSection?.('clear-data'); onMenuChange?.(false); }}>{t('topbar.clearData')}</MenuRow>

              <div className="my-1 border-t border-[#e7e6e3]" />
              <div className="flex items-center gap-2 rounded-md px-2 py-1 text-[12px]">
                <MdZoomIn className="shrink-0 text-[16px] text-[#5f6368]" />
                <span className="flex-1">{t('topbar.zoom')}</span>
                <button type="button" onClick={onZoomOut} className="px-1.5 text-base leading-none hover:text-[#137b8b]" aria-label={t('topbar.zoomOut')}>−</button>
                <span className="text-[11px]">{Math.round(zoomFactor * 100)} %</span>
                <button type="button" onClick={onZoomIn} className="px-1.5 text-base leading-none hover:text-[#137b8b]" aria-label={t('topbar.zoomIn')}>+</button>
              </div>

              <div className="my-1 border-t border-[#e7e6e3]" />
              <MenuRow icon={MdPrint} shortcut="Ctrl+P" onClick={() => { onPrint?.(); onMenuChange?.(false); }}>{t('topbar.print')}</MenuRow>
              <MenuRow icon={MdSearch}>{t('topbar.findEdit')}</MenuRow>
              <MenuRow icon={MdShare}>{t('topbar.saveShare')}</MenuRow>
              <MenuRow icon={MdCallSplit}>{t('topbar.moreOptions')}</MenuRow>

              <div className="my-1 border-t border-[#e7e6e3]" />
              <MenuRow icon={MdInfoOutline}>{t('topbar.help')}</MenuRow>
              <MenuRow icon={MdTune} onClick={() => { onSettings?.(); onMenuChange?.(false); }}>{t('topbar.settings')}</MenuRow>
              <MenuRow icon={MdGamepad} onClick={() => { onPlayGame?.(); onMenuChange?.(false); }}>{t('topbar.playTetris')}</MenuRow>
              <MenuRow icon={MdPowerSettingsNew} className="bluefox-topbar-menu-quit" onClick={() => { window.electron?.close(); onMenuChange?.(false); }}>{t('topbar.quit')}</MenuRow>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default TopBar;
