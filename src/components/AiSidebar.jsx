import React from 'react';
import { useTranslation } from 'react-i18next';
import { MdAutoAwesome, MdClose } from 'react-icons/md';
import AiPage from './AiPage';

const AiSidebar = ({ isOpen, initialPrompt = '', isDocumentMode = false, documentText = '', pageContext = null, currentTitle = '', currentUrl = '', currentFavicon = '', onAnswer, onOpenMusic, onMusicControl, musicPlayback, onMusicPlaybackChange, hasMusicTab = false, conversation, conversationKey, onConversationChange, onClose }) => {
  const { t } = useTranslation('common');
  return (
    <div className={`absolute bottom-0 right-0 top-[96px] z-[40] overflow-hidden transition-[width] duration-300 ease-out ${isOpen ? 'w-[min(560px,100vw)]' : 'w-0'}`}>
      <aside aria-label={isDocumentMode ? t('ai.edit') : t('ai.assistant')} aria-hidden={!isOpen} className="flex h-full w-[min(560px,100vw)] flex-col border-l border-[#e1e0dd] bg-white shadow-[-8px_0_28px_rgba(32,33,36,0.12)]">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#e7e6e3] px-4 text-[#292929]">
          <div className="flex items-center gap-2 text-[14px] font-medium"><MdAutoAwesome className="text-[18px] text-[#6d6e72]" /><span>{isDocumentMode ? t('ai.edit') : t('ai.assistant')}</span></div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-[#6d6e72] transition-colors hover:bg-[#f0efed] hover:text-[#292929]" aria-label={t('ai.close')}><MdClose className="text-[19px]" /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-hidden">
          <AiPage isAiMode isSidebar pageContext={pageContext} currentTitle={currentTitle} currentUrl={currentUrl} currentFavicon={currentFavicon} initialPrompt={initialPrompt} isDocumentMode={isDocumentMode} documentText={documentText} onAnswer={onAnswer} onOpenMusic={onOpenMusic} onMusicControl={onMusicControl} musicPlayback={musicPlayback} onMusicPlaybackChange={onMusicPlaybackChange} hasMusicTab={hasMusicTab} conversation={conversation} conversationKey={conversationKey} onConversationChange={onConversationChange} hideModeSwitch hideThemeToggle onModeChange={() => {}} />
        </div>
      </aside>
    </div>
  );
};

export default AiSidebar;
