import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ThemeToggle from './ThemeToggle';
import { FaYoutube } from 'react-icons/fa';
import {
  MdAdd,
  MdArrowForward,
  MdArrowUpward,
  MdAutoAwesome,
  MdCheck,
  MdCheckCircle,
  MdChatBubbleOutline,
  MdComputer,
  MdContentCopy,
  MdExpandMore,
  MdGraphicEq,
  MdFeed,
  MdInsertLink,
  MdLanguage,
  MdPhotoLibrary,
  MdPublic,
  MdLightbulbOutline,
  MdMenu,
  MdMic,
  MdNorthEast,
  MdMoreHoriz,
  MdSubscriptions,
  MdPause,
  MdPlayArrow,
  MdReply,
  MdSearch,
  MdSettings,
  MdShare,
  MdSkipNext,
  MdSkipPrevious,
  MdThumbDown,
  MdThumbUp,
} from 'react-icons/md';
import '../styles/music.css';

const BLUEFOX_LOGO = `${import.meta.env.BASE_URL}Logo.ico`;

const MARKDOWN_COMPONENTS = {
  h1: ({ children }) => <h1 className="mb-3 mt-5 text-2xl font-semibold tracking-tight text-[#202124] first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 mt-5 text-xl font-semibold tracking-tight text-[#202124] first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 mt-4 text-lg font-semibold text-[#202124] first:mt-0">{children}</h3>,
  p: ({ children }) => <p className="mb-3 leading-7 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-3 ml-5 list-disc space-y-1.5">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 ml-5 list-decimal space-y-1.5">{children}</ol>,
  li: ({ children }) => <li className="pl-1 leading-6">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-[#202124]">{children}</strong>,
  blockquote: ({ children }) => <blockquote className="my-3 border-l-2 border-[#b9c1c7] pl-4 italic text-[#66676a]">{children}</blockquote>,
  a: ({ children, href }) => href === '#foxy-highlight'
    ? <mark className="rounded-[3px] bg-[#e6f1fb] px-1 py-0.5 text-[#202124]">{children}</mark>
    : <a href={href} target="_blank" rel="noreferrer" className="font-medium text-[#137b8b] underline decoration-[#b9d5d9] underline-offset-2 hover:text-[#0d5964]">{children}</a>,
  hr: () => <hr className="my-5 border-[#e7e6e3]" />,
  code: ({ children, className }) => className
    ? <pre className="my-3 overflow-x-auto rounded-lg bg-[#f3f2ef] p-3 text-[13px] leading-5 text-[#303134]"><code className={className}>{children}</code></pre>
    : <code className="rounded bg-[#f1f0ed] px-1.5 py-0.5 text-[13px] text-[#303134]">{children}</code>,
};

const linkCitations = (content, sources) => content.replace(/\[(\d+)\](?!\()/g, (citation, number) => {
  const source = sources[Number(number) - 1];
  return source?.url ? `[${number}](${source.url})` : citation;
});

const formatImportantPhrases = (content) => content.replace(/==([^=\n]+)==/g, '[$1](#foxy-highlight)');

const getFaviconUrl = (url) => {
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`;
  } catch {
    return BLUEFOX_LOGO;
  }
};

const getDomain = (url) => {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'Web';
  }
};

const getSiteName = (url) => {
  const domain = getDomain(url);
  const parts = domain.split('.');
  return parts.length > 1 ? parts[parts.length - 2] : domain;
};

const hideUnusableImage = (event) => {
  const image = event.currentTarget;
  if (image.naturalWidth < 260 || image.naturalHeight < 180) {
    const result = image.closest('[data-image-result]');
    if (result) result.hidden = true;
  }
};

const hideBrokenImage = (event) => {
  const result = event.currentTarget.closest('[data-image-result]');
  if (result) result.hidden = true;
};

const formatPublishedDate = (value, language = 'fr') => {
  if (!value) return '';
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return '';
  const hours = Math.max(1, Math.floor((Date.now() - timestamp) / 3600000));
  if (language.startsWith('en')) {
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
};

const completedAnswerAnimations = new Set();

const FastMarkdownMessage = ({ content, sources = [], messageKey, onTypingComplete }) => {
  const shouldAnimateRef = useRef(!completedAnswerAnimations.has(messageKey));
  const shouldAnimate = shouldAnimateRef.current;
  const [displayedContent, setDisplayedContent] = useState(() => shouldAnimate ? '' : content);
  const [isTyping, setIsTyping] = useState(shouldAnimate);

  useEffect(() => {
    if (!shouldAnimate) {
      setDisplayedContent(content);
      setIsTyping(false);
      onTypingComplete?.();
      return undefined;
    }

    completedAnswerAnimations.add(messageKey);
    const typingDuration = 2000;
    const tickInterval = 40;
    const totalTicks = Math.ceil(typingDuration / tickInterval);
    let tick = 0;
    setDisplayedContent('');
    setIsTyping(true);

    const timer = window.setInterval(() => {
      tick += 1;
      const progress = Math.min(1, tick / totalTicks);
      const position = Math.min(content.length, Math.ceil(content.length * progress));
      setDisplayedContent(content.slice(0, position));
      if (tick >= totalTicks) {
        window.clearInterval(timer);
        setDisplayedContent(content);
        setIsTyping(false);
        onTypingComplete?.();
      }
    }, tickInterval);

    return () => window.clearInterval(timer);
  }, [content, messageKey, onTypingComplete, shouldAnimate]);

  return (
    <div className={`foxy-markdown text-[15px] leading-7 text-[#303134] ${isTyping ? 'foxy-answer-reveal' : 'foxy-answer-visible'}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>{formatImportantPhrases(linkCitations(displayedContent, sources))}</ReactMarkdown>
      {isTyping && <span className="foxy-typing-caret" aria-hidden="true" />}
    </div>
  );
};  const formatMusicTime = (seconds) => {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, '0')}`;
};

const parseMusicDuration = (value) => {
  const parts = String(value || '').split(':').map(Number);
  if (parts.some((part) => !Number.isFinite(part))) return 0;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
};

const MusicConversationPlayer = ({ video, onOpenMusic, onMusicControl, musicPlayback, onMusicPlaybackChange, hasMusicTab }) => {
  const playbackForVideo = musicPlayback?.videoId === video.id ? musicPlayback : null;
  const duration = Math.max(parseMusicDuration(video.duration), Number(playbackForVideo?.duration) || 0);
  const position = Math.min(duration || Number.MAX_SAFE_INTEGER, Math.max(0, Number(playbackForVideo?.position) || 0));
  const isPlaying = playbackForVideo?.isPlaying === true;
  const canControl = Boolean(hasMusicTab && playbackForVideo);
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (position / duration) * 100)) : 0;

  const sendMusicControl = (type, value) => {
    onMusicControl?.({ type, value });
  };

  const togglePlayback = () => {
    if (!canControl) return;
    const nextPlaying = !isPlaying;
    onMusicPlaybackChange?.({ videoId: video.id, isPlaying: nextPlaying, position });
    sendMusicControl(nextPlaying ? 'play' : 'pause');
  };

  const seek = (event) => {
    if (!canControl) return;
    const nextPosition = duration ? Number(event.target.value) : 0;
    onMusicPlaybackChange?.({ videoId: video.id, isPlaying, position: nextPosition });
    sendMusicControl('seek', duration ? nextPosition / duration : 0);
  };

  return (
    <div className="foxy-music-conversation-player">
      <div className="foxy-music-conversation-main">
        <img
          className="foxy-music-conversation-cover"
          src={video.thumbnail || BLUEFOX_LOGO}
          alt=""
          onError={(event) => { event.currentTarget.src = BLUEFOX_LOGO; }}
        />
        <div className="foxy-music-conversation-copy">
          <div className="foxy-music-conversation-heading">
            <span className="foxy-music-conversation-icon"><MdSubscriptions /></span>
            <div>
              <strong>{t('ai.playStarted')}</strong>
              <span>{video.title}</span>
            </div>
          </div>
          <div className="foxy-music-conversation-progress">
            <input type="range" min="0" max={duration || 100} step="1" value={duration ? position : 0} onChange={seek} style={{ '--music-progress': `${progressPercent}%` }} aria-label={t('ai.musicPosition')} />
            <div><span>{formatMusicTime(position)}</span><span>{formatMusicTime(duration)}</span></div>
          </div>
          <div className="foxy-music-conversation-controls">
            <button type="button" onClick={() => sendMusicControl('previous')} aria-label={t('ai.previousMusic')}><MdSkipPrevious /></button>
            {canControl && <button type="button" className="is-main" onClick={togglePlayback} aria-label={isPlaying ? t('ai.pauseMusic') : t('ai.resumeMusic')}>{isPlaying ? <MdPause /> : <MdPlayArrow />}</button> }
            <button type="button" onClick={() => sendMusicControl('next')} aria-label={t('ai.nextMusic')}><MdSkipNext /></button>
            <button type="button" className="foxy-music-conversation-open" onClick={() => onOpenMusic?.(video)} aria-label="Ouvrir sur YouTube"><FaYoutube aria-hidden="true" /><span>{t('ai.open')}</span></button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AiPage = ({ isAiMode, onModeChange, isSidebar = false, pageContext = null, currentTitle = '', currentUrl = '', currentFavicon = '', initialPrompt = '', submitInitialPrompt = false, isDocumentMode = false, documentText = '', hideUserPrompts = false, hideModeSwitch = false, hideThemeToggle = false, onAnswer, onOpenMusic, onMusicControl, musicPlayback, onMusicPlaybackChange, hasMusicTab = false, conversation, conversationKey, onConversationChange }) => {
  const { t, i18n } = useTranslation('common');
  const selectedLanguage = i18n.resolvedLanguage || 'fr';
  const [prompt, setPrompt] = useState(initialPrompt);
  const [messages, setMessages] = useState(() => Array.isArray(conversation?.messages) ? conversation.messages : []);
  const [isLoading, setIsLoading] = useState(false);
  const [showSearchProgress, setShowSearchProgress] = useState(false);
  const [searchSources, setSearchSources] = useState([]);
  const [showSourcePreview, setShowSourcePreview] = useState(false);
  const [isSourcePreviewClosing, setIsSourcePreviewClosing] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const [searchStage, setSearchStage] = useState('idle');
  const [activeView, setActiveView] = useState('response');
  const [activeAction, setActiveAction] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isAnswerTyping, setIsAnswerTyping] = useState(false);
  const [followUps, setFollowUps] = useState(() => Array.isArray(conversation?.followUps) ? conversation.followUps : []);
  const progressTimers = useRef([]);
  const [visibleResultCount, setVisibleResultCount] = useState(12);
  const [sidebarSuggestions, setSidebarSuggestions] = useState([]);
  const [sidebarFaviconError, setSidebarFaviconError] = useState(false);
  const submittedInitialPromptRef = useRef('');

  useEffect(() => {
    setSidebarFaviconError(false);
  }, [currentFavicon, currentUrl]);

  useEffect(() => {
    setPrompt(initialPrompt);
  }, [initialPrompt]);

  useEffect(() => {
    if (!conversation) return;
    setMessages(Array.isArray(conversation.messages) ? conversation.messages : []);
    setFollowUps(Array.isArray(conversation.followUps) ? conversation.followUps : []);
  }, [conversation]);

  useEffect(() => {
    if (!isSidebar || !pageContext?.url) {
      setSidebarSuggestions([]);
      return undefined;
    }

    let cancelled = false;
    setSidebarSuggestions([]);
    const generateSuggestions = async () => {
      const result = await window.electron?.generateAiQuestions?.({ ...pageContext, language: selectedLanguage });
      if (!cancelled && result?.ok && Array.isArray(result.questions)) setSidebarSuggestions(result.questions.slice(0, 3));
    };
    void generateSuggestions();
    return () => { cancelled = true; };
  }, [isSidebar, pageContext?.description, pageContext?.text, pageContext?.title, pageContext?.url, selectedLanguage]);

  useEffect(() => {
    onConversationChange?.(conversationKey, { messages, followUps });
  }, [conversationKey, followUps, messages, onConversationChange]);

  const clearProgressTimers = () => {
    progressTimers.current.forEach((timer) => window.clearTimeout(timer));
    progressTimers.current = [];
  };

  useEffect(() => {
    const unsubscribe = window.electron?.onAiSearchProgress?.((progress) => {
      setSearchStage(progress.status);
      if (progress.status === 'searching') {
        clearProgressTimers();
        setSearchSources([]);
        setShowSourcePreview(false);
        setIsSourcePreviewClosing(false);
        setShowReasoning(false);
      }
      if (progress.status === 'sources') {
        setSearchSources(progress.sources || []);
        setShowSourcePreview(true);
        setIsSourcePreviewClosing(false);
        setShowReasoning(false);
      }
      if (progress.status === 'analyzing') {
        clearProgressTimers();
        const closeTimer = window.setTimeout(() => {
          setIsSourcePreviewClosing(true);
          const reasoningTimer = window.setTimeout(() => {
            setShowSourcePreview(false);
            setIsSourcePreviewClosing(false);
            setShowReasoning(true);
          }, 520);
          progressTimers.current.push(reasoningTimer);
        }, 1400);
        progressTimers.current.push(closeTimer);
      }
    });
    return () => {
      clearProgressTimers();
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (isLoading && !isDocumentMode && searchStage !== 'music') setShowSearchProgress(true);
    if (isDocumentMode || searchStage === 'music') setShowSearchProgress(false);
  }, [isDocumentMode, isLoading, searchStage]);

  const animateAction = (action) => {
    setActiveAction(action);
    window.setTimeout(() => setActiveAction(''), 280);
  };

  const copyLatestAnswer = async () => {
    if (!latestAssistant?.content) return;
    try {
      await navigator.clipboard?.writeText(latestAssistant.content);
    } finally {
      setIsCopied(true);
      animateAction('copy');
      window.setTimeout(() => setIsCopied(false), 1600);
    }
  };

  const handlePromptKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  const askFoxy = async (event, questionOverride = '') => {
    event?.preventDefault?.();
    const question = String(questionOverride || prompt).trim();
    if (!question || isLoading) return;

    setPrompt('');
    setSearchSources([]);
    clearProgressTimers();
    setShowSourcePreview(false);
    setIsSourcePreviewClosing(false);
    setShowReasoning(false);
    setIsAnswerTyping(true);
    setVisibleResultCount(12);
    setSearchStage(isDocumentMode ? 'document' : 'searching');
    setShowSearchProgress(!isDocumentMode);
    if (isDocumentMode) setShowSearchProgress(false);
    setFollowUps([]);
    setMessages((current) => [...current, { role: 'user', content: question }]);
    setIsLoading(true);

    try {
        const result = await window.electron?.askAi(question, {
          mode: isDocumentMode ? 'document' : 'web',
          language: selectedLanguage,
          ...(isDocumentMode ? { documentText: String(documentText || '').slice(0, 24000) } : {})
        });
        if (!result?.ok) {
          throw new Error(result?.error || 'La réponse IA est indisponible.');
        }
        setMessages((current) => [...current, {
          role: 'assistant',
          content: result.answer,
          sources: result.sources || [],
        }]);
        onAnswer?.({
          text: result.answer,
          insertIntoPdf: isDocumentMode && /modif|réécri|insèr|ajout|remplac|corrig|edit|rewrite|insert|add|replace|correct|change/i.test(question)
        });
        setFollowUps(Array.isArray(result.followUps) ? result.followUps : []);
    } catch (error) {
      setMessages((current) => [...current, {
        role: 'assistant',
        content: error.message || t('ai.genericError'),
        error: true,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const question = String(initialPrompt || '').trim();
    if (!submitInitialPrompt || !question || submittedInitialPromptRef.current === question) return undefined;
    submittedInitialPromptRef.current = question;
    const timer = window.setTimeout(() => {
      void askFoxy(null, question);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialPrompt, submitInitialPrompt]);

  const hasConversation = messages.length > 0;
  const latestAssistant = [...messages].reverse().find((message) => message.role === 'assistant');
  const latestUser = [...messages].reverse().find((message) => message.role === 'user');
  const sources = latestAssistant?.sources || [];
  const imageSources = sources.filter((source) => source.image);
  const sidebarSite = (() => {
    if (!isSidebar || isDocumentMode || !/^https?:\/\//i.test(currentUrl)) return null;
    let hostname = '';
    try { hostname = new URL(currentUrl).hostname.toLowerCase(); } catch { return null; }
    const siteName = getSiteName(currentUrl);
    return {
      name: siteName === 'Web' ? '' : siteName.charAt(0).toUpperCase() + siteName.slice(1),
      favicon: currentFavicon || getFaviconUrl(currentUrl)
    };
  })();
  const visibleNewsSources = sources.slice(0, visibleResultCount);
  const latestUserIndex = messages.reduce((lastIndex, message, index) => message.role === 'user' ? index : lastIndex, -1);
  const handleTypingComplete = useCallback(() => setIsAnswerTyping(false), []);

  useEffect(() => {
    setVisibleResultCount(sources.length || 12);
  }, [activeView, sources.length]);

  const handleResultsScroll = (event) => {
    if (!['links', 'images', 'news'].includes(activeView)) return;
    const element = event.currentTarget;
    if (element.scrollTop + element.clientHeight < element.scrollHeight - 320) return;
    const total = activeView === 'images' ? imageSources.length : sources.length;
    setVisibleResultCount((count) => Math.min(count + 10, total));
  };

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-white text-[#202124]">
      <aside className="hidden">
        <div className="flex h-16 items-center justify-between border-b border-[#e7e6e3] px-5">
          <div className="flex items-center gap-2 text-[15px] font-semibold">
            <img src={BLUEFOX_LOGO} alt="BlueFox" className="h-7 w-7 object-contain" />
            <span>{t('ai.assistant')}</span>
          </div>
          <button type="button" className="flex h-8 w-8 items-center justify-center rounded-md text-[#6f7073] hover:bg-[#ecebe8]" aria-label={t('ai.reduceMenu')}>
            <MdMenu className="text-lg" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-5 text-[13px]">
          <button type="button" className="mb-2 flex w-full items-center gap-3 rounded-lg bg-[#ecebe8] px-3 py-2.5 text-left font-medium text-[#292929]">
            <MdAdd className="text-lg" />{t('ai.new')}</button>
          <button type="button" className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[#4f5053] hover:bg-[#f0efed]"><MdChatBubbleOutline className="text-lg" />{t('ai.conversations')}</button>
          <button type="button" className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[#4f5053] hover:bg-[#f0efed]"><MdAutoAwesome className="text-lg" />{t('ai.artifacts')}</button>
          <button type="button" className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[#4f5053] hover:bg-[#f0efed]"><MdSettings className="text-lg" />{t('ai.customize')}</button>
          <p className="mb-2 mt-7 px-3 text-[11px] font-medium uppercase tracking-[0.12em] text-[#a0a0a0]">{t('ai.projects')}</p>
          <p className="px-3 text-[13px] text-[#a0a0a0]">{t('ai.noProject')}</p>
          <p className="mb-2 mt-7 px-3 text-[11px] font-medium uppercase tracking-[0.12em] text-[#a0a0a0]">{t('ai.sessions')}</p>
          <p className="px-3 text-[13px] text-[#a0a0a0]">{t('ai.noRecentSession')}</p>
        </nav>

        <button type="button" className="flex items-center justify-between border-t border-[#e7e6e3] px-5 py-4 text-left text-[13px] text-[#4f5053] hover:bg-[#f0efed]">
          <span className="flex items-center gap-2"><MdSettings className="text-lg" /> {t('ai.login')}</span>
          <MdArrowForward className="text-base" />
        </button>
      </aside>

      <section onScroll={handleResultsScroll} className="foxy-interface relative flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
        {hasConversation ? (
        <div className="flex h-14 shrink-0 items-center border-b border-[#e6e5e2] px-6 sm:px-10">
          <div className="flex h-full items-center gap-5 text-[14px] text-[#66676a]">
            <button type="button" onClick={() => setActiveView('response')} className={`relative flex h-full items-center gap-2 ${activeView === 'response' ? 'font-medium text-[#292929]' : 'hover:text-[#292929]'}`}><MdAutoAwesome /> {t('ai.response')}{activeView === 'response' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#292929]" />}</button>
            {!isDocumentMode && <>
              <button type="button" onClick={() => setActiveView('links')} className={`relative flex h-full items-center gap-2 ${activeView === 'links' ? 'font-medium text-[#292929]' : 'hover:text-[#292929]'}`}><MdInsertLink /> {t('ai.links')}{activeView === 'links' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#292929]" />}</button>
              <button type="button" onClick={() => setActiveView('images')} className={`relative flex h-full items-center gap-2 ${activeView === 'images' ? 'font-medium text-[#292929]' : 'hover:text-[#292929]'}`}><MdPhotoLibrary /> {t('ai.images')}{activeView === 'images' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#292929]" />}</button>
              <button type="button" onClick={() => setActiveView('news')} className={`relative flex h-full items-center gap-2 ${activeView === 'news' ? 'font-medium text-[#292929]' : 'hover:text-[#292929]'}`}><MdFeed /> {t('ai.news')}{activeView === 'news' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#292929]" />}</button>
            </>}

          </div>
          {(!hideModeSwitch || !hideThemeToggle) && <div className="ml-auto flex items-center gap-2">
            {!hideThemeToggle && <ThemeToggle />}
            {!hideModeSwitch && <button type="button" onClick={() => onModeChange(!isAiMode)} className={`bluefox-mode-switch relative flex h-8 w-[104px] cursor-pointer items-center rounded-full border p-1 text-[10px] font-semibold tracking-wide shadow-sm transition-colors duration-200 ${isAiMode ? 'border-[#707070] bg-[#707070] text-white' : 'border-[#707070] bg-[#707070] text-white'}`}
              role="switch" aria-checked={isAiMode} aria-label={t('ai.toggleMode')} title={isAiMode ? t('ai.aiMode') : t('ai.normalMode')}>
              <span className={`absolute left-1 top-1 h-6 w-[48px] rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${isAiMode ? 'translate-x-[48px]' : 'translate-x-0'}`} />
              <span className={`bluefox-mode-label ${!isAiMode ? 'bluefox-mode-label-active' : 'bluefox-mode-label-inactive'} relative z-10 flex w-1/2 justify-center`}>WEB</span>
              <span className={`bluefox-mode-label ${isAiMode ? 'bluefox-mode-label-active' : 'bluefox-mode-label-inactive'} relative z-10 flex w-1/2 justify-center`}>IA</span>
            </button>}
          </div>}
        </div>
        ) : (
          ((!hideModeSwitch || !hideThemeToggle) && <div className="absolute right-5 top-4 z-20 flex items-center gap-3">
            {!hideThemeToggle && <ThemeToggle />}
            {!hideModeSwitch && <button type="button" onClick={() => onModeChange(!isAiMode)} className={`bluefox-mode-switch relative flex h-8 w-[104px] cursor-pointer items-center rounded-full border p-1 text-[10px] font-semibold tracking-wide shadow-sm transition-colors duration-200 ${isAiMode ? 'border-[#707070] bg-[#707070] text-white' : 'border-[#707070] bg-[#707070] text-white'}`}
              role="switch" aria-checked={isAiMode} aria-label={t('ai.toggleMode')} title={isAiMode ? t('ai.aiMode') : t('ai.normalMode')}>
              <span className={`absolute left-1 top-1 h-6 w-[48px] rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${isAiMode ? 'translate-x-[48px]' : 'translate-x-0'}`} />
              <span className={`bluefox-mode-label ${!isAiMode ? 'bluefox-mode-label-active' : 'bluefox-mode-label-inactive'} relative z-10 flex w-1/2 justify-center`}>WEB</span>
              <span className={`bluefox-mode-label ${isAiMode ? 'bluefox-mode-label-active' : 'bluefox-mode-label-inactive'} relative z-10 flex w-1/2 justify-center`}>IA</span>
            </button>}
          </div>)
        )}

        <div className={`relative mx-auto flex w-full ${activeView === 'images' ? 'max-w-[1180px]' : 'max-w-[1040px]'} flex-col px-6 pb-8 pt-8 sm:px-10 ${hasConversation ? 'justify-start' : isSidebar ? 'min-h-full justify-between translate-y-0' : isDocumentMode ? 'min-h-full justify-center translate-y-0' : 'min-h-full justify-center -translate-y-8'}`}>
          {!hasConversation && (
            <div className="mb-8 text-center">
              <p className="mb-2 text-[13px] text-[#86878a]">{isDocumentMode ? t('ai.document') : t('ai.search')}</p>
              <h1 className="foxy-dm-title text-[30px] font-medium tracking-[-0.04em] text-[#292929]">{isDocumentMode ? t('ai.documentQuestion') : t('ai.question')}</h1>
              {isSidebar && sidebarSite?.name && sidebarSuggestions.length > 0 && <div className="foxy-sidebar-suggestions">{sidebarSuggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => setPrompt(suggestion)}><MdNorthEast aria-hidden="true" /><span>{suggestion}</span></button>)}</div>}
            </div>
          )}

          {hasConversation && (
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[12px] text-[#8a8b8e]">{isDocumentMode ? t('ai.pageAnalysis') : t('ai.searchFoxy')}</p>
                <h1 className="foxy-dm-title text-xl font-medium">{isDocumentMode ? t('ai.summaryAndEdits') : t('ai.conversation')}</h1>
              </div>
            </div>
          )}

          {activeView === 'response' && hasConversation && (
            <>
            <div className="mb-4 space-y-3">
              {messages.map((message, index) => (
                <React.Fragment key={`${message.role}-${index}`}>
                  {!(message.role === 'user' && hideUserPrompts) && (
                    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`foxy-message ${message.role === 'assistant' ? 'foxy-assistant-message' : 'foxy-user-message'}`}>
                        {message.role === 'assistant' ? <>
                          <FastMarkdownMessage content={message.content} sources={message.sources} messageKey={`${message.role}-${index}`} onTypingComplete={handleTypingComplete} />
                        </> : <p className="whitespace-pre-wrap">{message.content}</p>}
                      </div>
                    </div>
                  )}

                  {message.role === 'user' && index === latestUserIndex && !isDocumentMode && showSearchProgress && (
                    <div className={`foxy-search-progress ml-2 ${isLoading ? 'foxy-search-progress-active' : 'foxy-search-progress-complete'}`}>
                      <div className="foxy-search-step">
                        <span className={`foxy-search-step-icon ${isLoading && searchStage === 'searching' ? 'foxy-search-step-icon-active' : ''}`}><MdLanguage /></span>
                        <p>{hideUserPrompts ? t('ai.searching') : <>{t('ai.latestInfo')} <strong>{message.content}</strong></>}</p>
                      </div>
                      {showSourcePreview && searchSources.length > 0 && (
                        <div className={`foxy-source-preview ${isSourcePreviewClosing ? 'foxy-source-preview-closing' : ''}`}>
                          {searchSources.slice(0, 5).map((source, sourceIndex) => (
                            <div data-image-result key={source.url} className="foxy-source-preview-item" style={{ animationDelay: `${sourceIndex * 120}ms` }}>
                              <img src={source.image || getFaviconUrl(source.url)} alt="" onError={hideBrokenImage} />
                              <span className="foxy-source-preview-copy"><small>{getSiteName(source.url)}</small>{source.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {showReasoning && (
                        <div className={`foxy-reasoning-step ${isLoading ? 'foxy-reasoning-active' : 'foxy-reasoning-complete'}`}>
                          <span className="foxy-reasoning-icon"><MdLightbulbOutline /></span>
                          <p>{t('ai.reasoning')}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {message.role === 'assistant' && (!isAnswerTyping || message !== latestAssistant) && message.sources?.some((source) => source.image) && (
                    <div className="ml-2 flex max-w-[760px] gap-2 overflow-hidden">
                      {message.sources.filter((source) => source.image).slice(0, 4).map((source) => (
                        <a data-image-result key={source.url} href={source.url} target="_blank" rel="noreferrer" className="group flex h-[96px] max-w-[160px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#f2f1ef]">
                          <img src={source.image} alt={source.title} onLoad={hideUnusableImage} onError={hideBrokenImage} loading="lazy" className="block h-auto max-h-[96px] w-auto max-w-[160px] object-contain transition-transform duration-300 group-hover:scale-[1.03]" />
                        </a>
                      ))}
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
            </>
          )}

          {activeView === 'response' && latestAssistant && !isAnswerTyping && (
            <div className="mb-3 flex items-center gap-2 text-[#77787b]">
              <button type="button" onClick={copyLatestAnswer} className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-[#f1f0ee] ${activeAction === 'copy' ? 'foxy-action-pop' : ''} ${isCopied ? 'text-[#2e8b57]' : ''}`} aria-label={isCopied ? t('ai.copied') : t('ai.copy')}>{isCopied ? <MdCheck className="text-lg" /> : <MdContentCopy />}</button>
              <button type="button" onClick={() => animateAction('share')} className={`flex h-8 w-8 items-center justify-center rounded-md hover:bg-[#f1f0ee] ${activeAction === 'share' ? 'foxy-action-pop' : ''}`} aria-label={t('ai.share')}><MdShare /></button>
              <button type="button" onClick={() => animateAction('like')} className={`flex h-8 w-8 items-center justify-center rounded-md hover:bg-[#f1f0ee] ${activeAction === 'like' ? 'foxy-action-pop' : ''}`} aria-label={t('ai.goodAnswer')}><MdThumbUp /></button>
              <button type="button" onClick={() => animateAction('dislike')} className={`flex h-8 w-8 items-center justify-center rounded-md hover:bg-[#f1f0ee] ${activeAction === 'dislike' ? 'foxy-action-pop' : ''}`} aria-label={t('ai.badAnswer')}><MdThumbDown /></button>
              <button type="button" onClick={() => animateAction('more')} className={`flex h-8 w-8 items-center justify-center rounded-md hover:bg-[#f1f0ee] ${activeAction === 'more' ? 'foxy-action-pop' : ''}`} aria-label={t('ai.moreOptions')}><MdMoreHoriz /></button>
            </div>
          )}

          {activeView === 'response' && latestAssistant && !isAnswerTyping && followUps.length > 0 && (
            <div className="mb-3 border-t border-[#ecebe8] pt-1">{followUps.map((followUp) => <button type="button" key={followUp} onClick={() => setPrompt(followUp)} className="flex w-full items-center gap-2 py-2 text-left text-[14px] text-[#292929] transition-colors hover:text-[#137b8b]"><MdReply className="shrink-0 text-[11px] text-[#77787b]" />{followUp}</button>)}</div>
          )}

          {activeView === 'links' && hasConversation && (
            <div className="foxy-results-content space-y-1">              <p className="mb-3 text-[15px] text-[#85868a]">{t('ai.resultsFor')} <span className="font-medium text-[#4b4c4f]">{hideUserPrompts ? t('ai.yourRequest') : (latestUser?.content || t('ai.yourSearch'))}</span></p>
              {sources.map((source) => (
                <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="group block border-b border-[#ecebe8] py-3 first:pt-1 hover:bg-[#fcfcfa]">
                  <div className="flex items-start gap-3">
                    <img src={getFaviconUrl(source.url)} alt="" className="mt-1 h-8 w-8 shrink-0 rounded-full border border-[#e3e2df] bg-white p-1 object-contain" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[15px] text-[#292929]"><span className="truncate">{getSiteName(source.url)}</span><MdCheckCircle className="shrink-0 text-[11px] text-[#8a8b8e]" /></div>
                      <p className="mt-0.5 truncate text-[13px] text-[#707174]">{source.url}</p>
                      <h3 className="mt-1 truncate text-[15px] font-medium leading-5 text-[#087b8f] group-hover:underline">{source.title}</h3>
                      <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-[#707174]">{source.text || t('ai.resultInfo')}</p>
                    </div>
                    {source.image && <div data-image-result className="h-20 w-20 shrink-0 overflow-hidden rounded-lg"><img src={source.image} alt="" onLoad={hideUnusableImage} onError={hideBrokenImage} className="h-full w-full object-cover" /></div>}
                  </div>
                </a>
              ))}
            </div>
          )}

          {activeView === 'news' && hasConversation && (
            <div className="foxy-results-content space-y-6">
              <p className="text-sm text-[#77787b]">{t('ai.newsRelated')}</p>
              {sources.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
                  <a href={sources[0].url} target="_blank" rel="noreferrer" className="group block border-b border-[#e8e7e4] pb-5">
                    {sources[0].image && <img src={sources[0].image} alt={sources[0].title} className="mb-4 h-48 w-full rounded-xl object-cover transition-transform duration-300 group-hover:scale-[1.01]" />}
                    <div className="flex items-center gap-2 text-xs text-[#77787b]"><img src={getFaviconUrl(sources[0].url)} alt="" className="h-4 w-4 rounded-sm" /><span className="truncate">{getDomain(sources[0].url)}{formatPublishedDate(sources[0].publishedDate, selectedLanguage) && ` · ${formatPublishedDate(sources[0].publishedDate, selectedLanguage)}`}</span></div>
                    <h2 className="mt-2 text-[22px] font-medium leading-7 text-[#202124] group-hover:underline">{sources[0].title}</h2>
                    <p className="mt-2 line-clamp-3 text-[14px] leading-6 text-[#66676a]">{sources[0].text || t('ai.latestInfoRelated')}</p>
                  </a>
                  <div className="divide-y divide-[#e8e7e4]">
                    {visibleNewsSources.slice(1).map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="group flex gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0 flex-1"><h3 className="line-clamp-3 text-[16px] font-medium leading-6 text-[#202124] group-hover:underline">{source.title}</h3><div className="mt-2 flex items-center gap-2 text-xs text-[#77787b]"><img src={getFaviconUrl(source.url)} alt="" className="h-4 w-4 rounded-sm" /><span className="truncate">{getDomain(source.url)}{formatPublishedDate(source.publishedDate, selectedLanguage) && ` · ${formatPublishedDate(source.publishedDate, selectedLanguage)}`}</span></div></div>
                      {source.image && <img src={source.image} alt="" className="h-20 w-28 shrink-0 rounded-lg object-cover" />}
                    </a>)}
                  </div>
                </div>
              ) : <p className="py-10 text-center text-sm text-[#85868a]">{t('ai.noNews')}</p>}
            </div>
          )}

          {activeView === 'images' && hasConversation && (
            <div className="foxy-results-content">
              <p className="mb-3 text-[15px] text-[#85868a]">{t('ai.imagesFor')} <span className="font-medium text-[#4b4c4f]">{hideUserPrompts ? t('ai.yourRequest') : (latestUser?.content || t('ai.yourSearch'))}</span></p>
              {sources.some((source) => source.image) ? (
                <div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">{imageSources.map((source) => <a data-image-result key={source.url} href={source.url} target="_blank" rel="noreferrer" className="group block min-w-0"><img src={source.image} alt={source.title} onLoad={hideUnusableImage} onError={hideBrokenImage} loading="lazy" className="aspect-[4/3] w-full rounded-lg object-cover transition-transform duration-300 group-hover:scale-[1.015]" /><div className="mt-1.5 flex min-w-0 items-center gap-2 text-[13px] text-[#77787b]"><img src={getFaviconUrl(source.url)} alt="" className="h-5 w-5 shrink-0 rounded-full object-contain" /><span className="truncate">{getSiteName(source.url)}</span></div></a>)}</div>
              ) : <div className="px-5 py-10 text-center text-sm text-[#85868a]">{t('ai.noImages')}</div>}
            </div>
          )}

          {activeView === 'response' && <div className="sticky bottom-0 z-20 -mx-6 mt-5 bg-white px-6 pb-4 pt-2 sm:-mx-10 sm:px-10">{sidebarSite?.name && <div className="foxy-sidebar-site-context">{sidebarFaviconError ? <MdPublic aria-label={t('ai.site')} /> : <img src={sidebarSite.favicon} alt="" onError={() => setSidebarFaviconError(true)} />}<span>{sidebarSite.name}</span></div>}<form onSubmit={askFoxy} className="bluefox-ai-prompt-bar w-full rounded-[16px] border border-[#e3e3e6] bg-white p-2.5 shadow-[0_4px_18px_rgba(32,33,36,0.08)] focus-within:border-[#b9c9d8]">
            <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={handlePromptKeyDown} className="min-h-[42px] max-h-[68px] w-full resize-none bg-transparent px-2 py-1 text-[14px] leading-5 text-[#292929] outline-none placeholder:text-[#a0a1a3]" placeholder={isDocumentMode ? t('ai.pdfPrompt') : (hasConversation ? t('ai.followupPrompt') : t('ai.connectorsPrompt'))} aria-label={t('ai.questionLabel')} />
            <div className="flex items-center justify-between pt-1.5">
              <div className="flex items-center gap-1 text-xs text-[#6d6e72]"><button type="button" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#f1f0ee]" aria-label={t('ai.add')}><MdAdd className="text-lg" /></button>{!isDocumentMode && <span className="flex items-center gap-1 rounded-full border border-[#e1e0dd] px-2.5 py-1"><MdSearch /> {t('ai.searchChip')} <MdExpandMore /></span>}<span className="flex items-center gap-1 rounded-full bg-[#f4f3f1] px-2.5 py-1"><MdComputer /> {t('ai.computer')}</span></div>
              <div className="flex items-center gap-2 text-[#77787b]"><span className="hidden items-center gap-1 text-xs sm:flex">{t('ai.model')} <MdExpandMore /></span><MdMic className="hidden text-lg sm:block" /><button type="submit" disabled={isLoading} className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-30 ${prompt.trim() ? 'bluefox-ai-send-button' : 'bluefox-ai-audio-button'}`} aria-label={prompt.trim() ? t('ai.send') : t('ai.voice')}>{prompt.trim() ? <MdArrowUpward className="text-lg" /> : <MdGraphicEq className="text-[19px]" />}</button></div>
            </div>
          </form><p className="mt-2 px-2 text-center text-[10px] leading-4 text-[#85868a]">{t('ai.disclaimer')}</p></div>}

          {!hasConversation && !isSidebar && (
            <>
            <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => setPrompt(t('ai.starterNews'))} className="rounded-[10px] border border-[#e3e3e6] bg-[#f8f8f9] p-5 text-left hover:bg-[#f0f0f1]"><span className="flex items-center gap-2 text-[15px] font-medium"><MdSearch /> {t('ai.searchAndOrganize')}</span><span className="mt-2 block text-[13px] leading-5 text-[#85868a]">{t('ai.searchAndOrganizeText')}</span></button>
              <button type="button" onClick={() => setPrompt(t('ai.starterWork'))} className="rounded-[10px] border border-[#e3e3e6] bg-[#f8f8f9] p-5 text-left hover:bg-[#f0f0f1]"><span className="flex items-center gap-2 text-[15px] font-medium"><MdAutoAwesome /> {t('ai.organizeAssist')}</span><span className="mt-2 block text-[13px] leading-5 text-[#85868a]">{t('ai.organizeAssistText')}</span></button>
            </div>
            <div className="mt-10 flex justify-center"><button type="button" className="flex items-center gap-2 rounded-full border border-[#deddd9] px-4 py-2 text-[13px] text-[#55565a] hover:bg-[#f4f3f1]"><MdSettings />{t('ai.customize')}</button></div>
            </>
          )}
        </div>

      </section>
    </div>
  );
};

export default AiPage;
