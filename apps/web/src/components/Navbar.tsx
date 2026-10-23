'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Film,
  Layers,
  CreditCard,
  Video,
  Crown,
  User as UserIcon,
  Menu,
  X,
  ChevronRight,
  Sliders,
  Scissors,
} from 'lucide-react';
import { User, LocaleType } from '../types';
import { ThemeToggle } from './ThemeToggle';
import { setStoredLocale } from '../lib/useAppLocale';

export type NavTabType = 'studio' | 'prompt' | 'editor' | 'templates' | 'pricing' | 'library' | 'admin';

interface NavbarProps {
  user: User | null;
  locale: LocaleType;
  onToggleLocale: () => void;
  onChangeLocale?: (locale: LocaleType) => void;
  activeTab: NavTabType;
  setActiveTab: (tab: NavTabType) => void;
  onOpenCheckout: () => void;
  onOpenAuth: () => void;
  onOpenProfile?: () => void;
  libraryCount: number;
}

export function Navbar({
  user,
  locale,
  onToggleLocale,
  onChangeLocale,
  activeTab,
  setActiveTab,
  onOpenCheckout,
  onOpenAuth,
  onOpenProfile,
  libraryCount,
}: NavbarProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (tabKey: NavTabType) => {
    if (tabKey === 'editor') {
      router.push('/editor');
    } else {
      setActiveTab(tabKey);
    }
  };

  const handleLanguageChange = (lang: LocaleType) => {
    setStoredLocale(lang);
    if (onChangeLocale) {
      onChangeLocale(lang);
    } else if (lang !== locale) {
      onToggleLocale();
    }
  };

  const t = {
    uz: {
      studio: 'STUDIYA',
      prompt: 'VEO ENGINE',
      editor: 'CAPCUT MUHARRIR',
      templates: 'SHABLONLAR',
      pricing: 'TARIFLAR',
      library: 'ARXIV',
      credits: (count: number) => `${count}`,
      recharge: 'Token soʻrash',
      login: 'Kirish',
      theme: 'Mavzu',
    },
    en: {
      studio: 'STUDIO',
      prompt: 'VEO ENGINE',
      editor: 'VIDEO EDITOR',
      templates: 'TEMPLATES',
      pricing: 'PRICING',
      library: 'ARCHIVE',
      credits: (count: number) => `${count}`,
      recharge: 'Request',
      login: 'Sign In',
      theme: 'Theme',
    },
    ru: {
      studio: 'СТУДИЯ',
      prompt: 'VEO ENGINE',
      editor: 'CAPCUT РЕДАКТОР',
      templates: 'ШАБЛОНЫ',
      pricing: 'ТАРИФЫ',
      library: 'АРХИВ',
      credits: (count: number) => `${count}`,
      recharge: 'Запросить',
      login: 'Вход',
      theme: 'Тема',
    },
  }[locale] || {
    studio: 'STUDIO',
    prompt: 'VEO ENGINE',
    editor: 'VIDEO EDITOR',
    templates: 'TEMPLATES',
    pricing: 'PRICING',
    library: 'ARCHIVE',
    credits: (count: number) => `${count}`,
    recharge: 'Request',
    login: 'Sign In',
    theme: 'Theme',
  };

  const navItems: { key: NavTabType; label: string; accent?: boolean; badge?: string }[] = [
    { key: 'prompt', label: t.prompt, accent: true, badge: 'OMNI 1.1' },
    { key: 'editor', label: t.editor, badge: 'PRO' },
    { key: 'templates', label: t.templates },
    { key: 'pricing', label: t.pricing },
  ];

  return (
    <>
      {/* ── DESKTOP HEADER ────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-obsidian/95 backdrop-blur-sm border-b border-stroke">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-10 h-14 flex items-center justify-between">

          {/* LEFT — Brand mark */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => {
                if (typeof window !== 'undefined' && window.location.pathname.startsWith('/editor')) {
                  router.push('/?tab=prompt');
                } else {
                  handleNavClick('prompt');
                }
              }}
              className="flex items-center gap-3 group"
            >
              {/* Logomark — sharp square */}
              <div className="h-7 w-7 border border-stroke group-hover:border-accent-warm transition-colors flex items-center justify-center">
                <div className="w-0 h-0 border-l-[5px] border-l-accent-warm border-t-[3.5px] border-t-transparent border-b-[3.5px] border-b-transparent ml-0.5" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-sans font-bold text-sm tracking-[0.15em] text-ink uppercase">
                  Tasvir
                </span>
                <span className="text-[10px] font-mono font-medium text-ink-dim tracking-wider">
                  .AI
                </span>
              </div>
            </button>

            {/* CENTER — Navigation links */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.key)}
                  className={`
                    px-3.5 py-1.5 text-[11px] font-mono font-medium tracking-[0.12em] transition-all relative
                    ${activeTab === item.key
                      ? 'text-ink'
                      : 'text-ink-dim hover:text-ink-muted'
                    }
                  `}
                >
                  {item.label}
                  {item.accent && (
                    <span className="ml-1.5 text-[8px] font-mono font-bold tracking-wider text-accent-warm opacity-80">
                      3.1
                    </span>
                  )}
                  {item.badge && (
                    <span className="ml-1.5 px-1 py-0.5 rounded text-[8px] font-mono font-bold bg-accent-warm/20 text-accent-warm border border-accent-warm/40">
                      {item.badge}
                    </span>
                  )}
                  {/* Active underline */}
                  {activeTab === item.key && (
                    <span className="absolute bottom-0 left-3.5 right-3.5 h-px bg-accent-warm" />
                  )}
                </button>
              ))}
              {user?.role === 'admin' && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`
                    px-3.5 py-1.5 text-[11px] font-mono font-medium tracking-[0.12em] transition-all relative
                    ${activeTab === 'admin'
                      ? 'text-signal-red'
                      : 'text-ink-dim hover:text-ink-muted'
                    }
                  `}
                >
                  ADMIN
                  {activeTab === 'admin' && (
                    <span className="absolute bottom-0 left-3.5 right-3.5 h-px bg-signal-red" />
                  )}
                </button>
              )}
            </nav>
          </div>

          {/* RIGHT — Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Archive */}
            <button
              onClick={() => setActiveTab('library')}
              className={`
                hidden sm:flex items-center gap-2 px-3 py-1.5 text-[11px] font-mono tracking-wider border transition-all
                ${activeTab === 'library'
                  ? 'border-accent-warm/30 text-accent-warm bg-accent-warm/5'
                  : 'border-stroke text-ink-dim hover:text-ink-muted hover:border-stroke-hover'
                }
              `}
            >
              {t.library}
              {libraryCount > 0 && (
                <span className="h-4 min-w-[16px] px-1 bg-surface-raised text-ink-muted text-[9px] font-mono font-bold flex items-center justify-center">
                  {libraryCount}
                </span>
              )}
            </button>

            {/* Credits badge */}
            {user && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 border border-stroke text-[11px] font-mono">
                <span className="text-ink-dim tracking-wider">CREDITS</span>
                <span className="text-ink font-bold tabular-nums">{t.credits(user.credits_balance)}</span>
                <button
                  onClick={onOpenCheckout}
                  className="ml-1 px-1.5 py-0.5 text-[10px] border border-stroke hover:border-accent-warm/30 text-ink-dim hover:text-accent-warm transition-colors"
                >
                  +
                </button>
              </div>
            )}

            {/* Theme Toggle */}
            <ThemeToggle align="right" />

            {/* Locale switcher */}
            <div className="hidden sm:flex items-center border border-stroke">
              {(['uz', 'en', 'ru'] as LocaleType[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => handleLanguageChange(lang)}
                  className={`
                    px-2 py-1 text-[10px] font-mono font-bold tracking-widest transition-all
                    ${locale === lang
                      ? 'bg-surface-raised text-ink'
                      : 'text-ink-dim hover:text-ink-muted'
                    }
                  `}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            {/* User / Auth */}
            <button
              onClick={() => {
                if (user && onOpenProfile) onOpenProfile();
                else onOpenAuth();
              }}
              className="flex items-center gap-2 px-3 py-1.5 border border-stroke hover:border-stroke-hover transition-colors"
            >
              <div className="h-5 w-5 border border-stroke-hover flex items-center justify-center">
                {user?.full_name ? (
                  <span className="text-[10px] font-mono font-bold text-ink">{user.full_name[0]}</span>
                ) : (
                  <UserIcon className="h-3 w-3 text-ink-dim" />
                )}
              </div>
              <span className="hidden lg:block text-[11px] font-mono text-ink-muted tracking-wider">
                {user?.full_name || t.login}
              </span>
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 border border-stroke hover:border-stroke-hover transition-colors"
            >
              {mobileOpen ? <X className="h-4 w-4 text-ink" /> : <Menu className="h-4 w-4 text-ink" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── MOBILE SLIDE-DOWN NAV ────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-14 z-40 bg-obsidian/98 backdrop-blur-sm border-t border-stroke animate-fade-in">
          <nav className="flex flex-col p-6 gap-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => { setMobileOpen(false); handleNavClick(item.key); }}
                className={`
                  flex items-center justify-between py-4 border-b border-stroke/50 text-left
                  ${activeTab === item.key ? 'text-ink' : 'text-ink-dim'}
                `}
              >
                <span className="text-sm font-mono tracking-[0.15em]">{item.label}</span>
                <ChevronRight className="h-4 w-4 text-ink-dim" />
              </button>
            ))}
            <button
              onClick={() => { setActiveTab('library'); setMobileOpen(false); }}
              className={`
                flex items-center justify-between py-4 border-b border-stroke/50 text-left
                ${activeTab === 'library' ? 'text-ink' : 'text-ink-dim'}
              `}
            >
              <span className="text-sm font-mono tracking-[0.15em]">{t.library}</span>
              {libraryCount > 0 && (
                <span className="h-5 px-2 bg-surface-raised text-ink-muted text-[10px] font-mono font-bold flex items-center justify-center">
                  {libraryCount}
                </span>
              )}
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => { setActiveTab('admin'); setMobileOpen(false); }}
                className="flex items-center justify-between py-4 border-b border-stroke/50 text-left text-signal-red"
              >
                <span className="text-sm font-mono tracking-[0.15em]">ADMIN</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            )}

            {/* Mobile theme toggle */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-stroke/50">
              <span className="text-xs font-mono tracking-[0.15em] text-ink-dim uppercase">{t.theme}</span>
              <ThemeToggle variant="segmented" />
            </div>

            {/* Mobile locale switcher */}
            <div className="flex items-center gap-0 mt-4 border border-stroke self-start">
              {(['uz', 'en', 'ru'] as LocaleType[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => handleLanguageChange(lang)}
                  className={`
                    px-3 py-2 text-[11px] font-mono font-bold tracking-widest transition-all
                    ${locale === lang ? 'bg-surface-raised text-ink' : 'text-ink-dim hover:text-ink-muted'}
                  `}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Mobile auth / credits */}
            <div className="mt-6 flex items-center gap-3">
              {user && (
                <div className="flex items-center gap-2 px-3 py-2 border border-stroke text-[11px] font-mono">
                  <span className="text-ink-dim tracking-wider">CREDITS</span>
                  <span className="text-ink font-bold">{user.credits_balance}</span>
                </div>
              )}
              <button
                onClick={() => {
                  if (user && onOpenProfile) onOpenProfile();
                  else onOpenAuth();
                  setMobileOpen(false);
                }}
                className="px-4 py-2 border border-stroke hover:border-accent-warm/30 text-[11px] font-mono tracking-wider text-ink-muted hover:text-accent-warm transition-colors"
              >
                {user?.full_name || t.login}
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* ── MOBILE BOTTOM BAR ────────────────────────── */}
      {activeTab !== 'editor' && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-obsidian/95 backdrop-blur-sm border-t border-stroke pb-[env(safe-area-inset-bottom,0px)]">
          <div className="flex items-center justify-around px-2 py-2">
            {[
              { key: 'studio' as NavTabType, label: t.studio, icon: Film },
              { key: 'prompt' as NavTabType, label: 'VEO', icon: Layers },
              { key: 'editor' as NavTabType, label: 'CAPCUT', icon: Scissors },
              { key: 'templates' as NavTabType, label: t.templates, icon: Layers },
              { key: 'library' as NavTabType, label: t.library, icon: Video },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleNavClick(item.key)}
                className={`
                  flex flex-col items-center gap-0.5 py-1 px-2 transition-all cursor-pointer
                  ${activeTab === item.key ? 'text-ink' : 'text-ink-dim'}
                `}
              >
                <item.icon className={`h-4 w-4 ${activeTab === item.key ? 'text-accent-warm' : ''}`} />
                <span className="text-[8px] font-mono tracking-widest">{item.label}</span>
                {activeTab === item.key && <span className="w-4 h-px bg-accent-warm mt-0.5" />}
              </button>
            ))}
            {user?.role === 'admin' && (
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`
                  flex flex-col items-center gap-0.5 py-1 px-2 transition-all cursor-pointer
                  ${activeTab === 'admin' ? 'text-signal-red' : 'text-ink-dim'}
                `}
              >
                <Crown className="h-4 w-4" />
                <span className="text-[8px] font-mono tracking-widest">ADMIN</span>
              </button>
            )}
          </div>
        </nav>
      )}
    </>
  );
}
