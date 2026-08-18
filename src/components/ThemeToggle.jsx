import React, { useState } from 'react';
import { MdCheck, MdDarkMode, MdExpandMore, MdLightMode, MdContrast } from 'react-icons/md';
import { useTheme } from '../utils/theme.js';

const THEME_LABELS = {
  light: 'Clair',
  dark: 'Sombre',
  system: 'Système',
};

const ThemeToggle = () => {
  const { mode, resolvedTheme, setMode, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const Icon = mode === 'system' ? MdContrast : resolvedTheme === 'dark' ? MdDarkMode : MdLightMode;

  return (
    <div className="bluefox-theme-control relative z-30 flex items-center rounded-full border p-0.5" data-theme-control>
      <button
        type="button"
        onClick={toggleTheme}
        className="flex h-8 w-8 items-center justify-center rounded-full text-[#55565b] transition-colors hover:bg-[#f0efed] hover:text-[#202124]"
        aria-label={`Thème ${THEME_LABELS[mode]}. Cliquer pour basculer entre clair et sombre`}
        title={`Thème : ${THEME_LABELS[mode]}`}
      >
        <Icon className="text-[18px]" />
      </button>
      <button
        type="button"
        onClick={() => setIsMenuOpen((open) => !open)}
        className="flex h-7 w-5 items-center justify-center rounded-full text-[#77787b] transition-colors hover:bg-[#f0efed] hover:text-[#202124]"
        aria-label="Choisir le thème"
        aria-expanded={isMenuOpen}
      >
        <MdExpandMore className={`text-[16px] transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
      </button>
      {isMenuOpen && (
        <div className="bluefox-theme-menu absolute left-0 top-10 min-w-[132px] overflow-hidden rounded-lg border border-[#d8d7d4] bg-white p-1 text-[12px] shadow-lg">
          {Object.entries(THEME_LABELS).map(([value, label]) => (
            <button
              type="button"
              key={value}
              onClick={() => {
                setMode(value);
                setIsMenuOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[#4f5054] transition-colors hover:bg-[#f0efed] hover:text-[#202124] ${mode === value ? 'font-semibold text-[#137b8b]' : ''}`}
            >
              <span>{label}</span>
              {mode === value && <MdCheck className="bluefox-theme-check inline-block h-[15px] w-[15px] shrink-0" style={{ color: resolvedTheme === 'dark' ? '#ffffff' : '#000000', fill: resolvedTheme === 'dark' ? '#ffffff' : '#000000' }} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
