import React from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { INDIAN_LANGUAGES, getLanguageByCode } from '../constants/languages';

type Variant = 'hero' | 'navbar' | 'inline' | 'contact';

function DropdownChevron({ className }: { className?: string }) {
  return (
    <span className={`pointer-events-none absolute top-1/2 z-[1] -translate-y-1/2 ${className ?? ''}`} aria-hidden>
      <ChevronDown className="h-4 w-4 shrink-0" strokeWidth={2.25} />
    </span>
  );
}

export function LanguageSelect({
  variant = 'inline',
  id = 'preferred-language',
  className = '',
  mutedOnDark = false,
  hideHelper = false,
  navbarOnDark = false,
}: {
  variant?: Variant;
  id?: string;
  className?: string;
  mutedOnDark?: boolean;
  hideHelper?: boolean;
  navbarOnDark?: boolean;
}) {
  const { preferredLanguage, setPreferredLanguage } = useAppContext();
  const current = getLanguageByCode(preferredLanguage);

  const navbarSelectClass =
    variant === 'navbar' && navbarOnDark
      ? 'max-w-[180px] cursor-pointer appearance-none rounded-full border border-black/10 bg-white py-2 pl-3 pr-8 text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-900 outline-none shadow-sm focus:ring-2 focus:ring-[#DFFF00]/50'
      : variant === 'navbar'
        ? 'max-w-[180px] cursor-pointer appearance-none rounded-full border border-black/10 bg-white py-2 pl-3 pr-8 text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-800 outline-none focus:ring-2 focus:ring-[#DFFF00]/50'
        : '';

  const select = (
    <select
      id={id}
      value={preferredLanguage}
      onChange={(event) => setPreferredLanguage(event.target.value)}
      aria-label="Preferred alert language"
      className={
        variant === 'hero'
          ? 'w-full min-w-[200px] max-w-full cursor-pointer appearance-none rounded-[16px] border border-black/15 bg-white py-3 pl-4 pr-10 text-left text-sm font-medium text-neutral-900 shadow-sm outline-none transition hover:border-black/30 focus:border-black focus:ring-2 focus:ring-[#DFFF00]/40 sm:w-auto'
          : variant === 'navbar'
            ? navbarSelectClass
            : variant === 'contact'
              ? 'w-full cursor-pointer appearance-none rounded-[16px] border border-black/15 bg-white py-3 pl-4 pr-10 text-sm text-neutral-900 outline-none focus:border-black focus:ring-2 focus:ring-[#DFFF00]/40'
              : 'w-full min-w-0 max-w-full cursor-pointer appearance-none rounded-[14px] border border-black/15 bg-white py-2.5 pl-3 pr-9 text-xs font-medium text-neutral-900 outline-none focus:border-black focus:ring-2 focus:ring-[#DFFF00]/40 sm:min-w-[200px] sm:max-w-md'
      }
    >
      {INDIAN_LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.nativeName} / {lang.englishName}
        </option>
      ))}
    </select>
  );

  if (variant === 'navbar') {
    return (
      <div className={`relative flex min-w-0 items-center gap-1.5 ${className}`}>
        <Globe className="h-3.5 w-3.5 shrink-0 text-neutral-500" aria-hidden />
        <div className="relative min-w-0 shrink">
          {select}
          <DropdownChevron className="right-3 text-neutral-500" />
        </div>
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <div className={`relative w-full ${className}`}>
        <DropdownChevron className="right-3 text-neutral-500" />
        {select}
        {!hideHelper && (
          <p className={`mt-2 text-[11px] ${mutedOnDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
            Fleet alerts and dashboard copy follow{' '}
            <span className={`font-medium ${mutedOnDark ? 'text-white' : 'text-neutral-800'}`}>{current.nativeName}</span>{' '}
            when available.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <DropdownChevron className={`right-3 ${variant === 'contact' ? 'text-neutral-500' : 'text-neutral-400'}`} />
      {select}
    </div>
  );
}
