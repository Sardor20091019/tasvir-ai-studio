'use client';

import React from 'react';
import {
  Sparkles,
  Layers,
  CreditCard,
  Video,
  Globe,
  Coins,
  Film,
  User as UserIcon,
} from 'lucide-react';
import { User, LocaleType } from '../types';

interface NavbarProps {
  user: User | null;
  locale: LocaleType;
  onToggleLocale: () => void;
  activeTab: 'studio' | 'prompt' | 'templates' | 'pricing' | 'library';
  setActiveTab: (tab: 'studio' | 'prompt' | 'templates' | 'pricing' | 'library') => void;
  onOpenCheckout: () => void;
  onOpenAuth: () => void;
  libraryCount: number;
}

export function Navbar({
  user,
  locale,
  onToggleLocale,
  activeTab,
  setActiveTab,
  onOpenCheckout,
  onOpenAuth,
  libraryCount,
}: NavbarProps) {
  const t = {
    uz: {
      brandSub: 'AI Video Reklama',
      studio: 'Studiyo',
      prompt: 'AI Prompt Video',
      templates: 'Shablonlar',
      pricing: 'Narxlar',
      library: 'Videolarim',
      credits: (count: number) => `${count} ta video qoldi`,
      recharge: 'Token soʻrash',
      login: 'Kirish (Google)',
    },
    en: {
      brandSub: 'AI Video Ads',
      studio: 'Studio',
      prompt: 'AI Prompt Video',
      templates: 'Templates',
      pricing: 'Pricing',
      library: 'My Videos',
      credits: (count: number) => `${count} videos left`,
      recharge: 'Request tokens',
      login: 'Sign In (Google)',
    },
    ru: {
      brandSub: 'AI Видео Реклама',
      studio: 'Студия',
      prompt: 'AI Промпт Видео',
      templates: 'Шаблоны',
      pricing: 'Тарифы',
      library: 'Мои видео',
      credits: (count: number) => `Осталось: ${count} видео`,
      recharge: 'Запросить токены',
      login: 'Вход (Google)',
    },
  }[locale] || {
    brandSub: 'AI Video Ads',
    studio: 'Studio',
    prompt: 'AI Prompt Video',
    templates: 'Templates',
    pricing: 'Pricing',
    library: 'My Videos',
    credits: (count: number) => `${count} videos left`,
    recharge: 'Request tokens',
    login: 'Sign In (Google)',
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-border shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Tag */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab('studio')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="h-9 w-9 rounded-xl bg-coral flex items-center justify-center text-white font-heading font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
              T
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-extrabold text-lg text-ink tracking-tight">
                  tasvir<span className="text-coral">.ai</span>
                </span>
                <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-bento-peach text-coral">
                  Beta
                </span>
              </div>
              <span className="text-[10px] text-ink-muted hidden sm:block -mt-0.5">
                {t.brandSub}
              </span>
            </div>
          </button>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('studio')}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'studio'
                  ? 'bg-bento-peach text-coral font-semibold'
                  : 'text-ink-muted hover:text-ink hover:bg-canvas'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {t.studio}
            </button>
            <button
              onClick={() => setActiveTab('prompt')}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'prompt'
                  ? 'bg-amber-100 text-amber-900 font-semibold'
                  : 'text-ink-muted hover:text-ink hover:bg-canvas'
              }`}
            >
              <Film className="h-3.5 w-3.5 text-coral" />
              <span>{t.prompt}</span>
              <span className="text-[9px] font-mono bg-coral text-white px-1 rounded-sm font-bold">
                VEO 3.1
              </span>
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'templates'
                  ? 'bg-bento-mint text-emerald-700 font-semibold'
                  : 'text-ink-muted hover:text-ink hover:bg-canvas'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              {t.templates}
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'pricing'
                  ? 'bg-bento-lavender text-purple-700 font-semibold'
                  : 'text-ink-muted hover:text-ink hover:bg-canvas'
              }`}
            >
              <CreditCard className="h-3.5 w-3.5" />
              {t.pricing}
            </button>
          </nav>
        </div>

        {/* Right: Actions, Credits & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Library Button */}
          <button
            onClick={() => setActiveTab('library')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border border-border flex items-center gap-1.5 transition-colors tactile-btn ${
              activeTab === 'library'
                ? 'bg-ink text-white'
                : 'bg-canvas hover:bg-white text-ink'
            }`}
          >
            <Video className="h-3.5 w-3.5 text-coral" />
            <span className="hidden sm:inline">{t.library}</span>
            {libraryCount > 0 && (
              <span className="h-4 min-w-[16px] px-1 rounded-full bg-coral text-white text-[10px] font-mono font-bold flex items-center justify-center">
                {libraryCount}
              </span>
            )}
          </button>

          {/* Credits Balance Pill */}
          {user && (
            <div className="hidden sm:flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl bg-canvas border border-border text-xs">
              <div className="flex items-center gap-1.5 font-mono">
                <Coins className="h-3.5 w-3.5 text-coral" />
                <span className="font-bold text-ink">
                  {user.credits_balance}
                </span>
                <span className="text-ink-muted text-[11px] hidden lg:inline">
                  {locale === 'uz' ? 'ta' : locale === 'en' ? 'videos' : 'видео'}
                </span>
              </div>
              <button
                onClick={onOpenCheckout}
                className="px-2 py-0.5 rounded-lg bg-coral hover:bg-coral-dark text-white text-[11px] font-semibold transition-colors tactile-btn"
              >
                +
              </button>
            </div>
          )}

          {/* Ask Admin / Recharge Button */}
          <button
            onClick={onOpenCheckout}
            className="px-3 py-1.5 rounded-xl bg-coral hover:bg-coral-dark text-white font-heading font-bold text-xs shadow-xs transition-colors tactile-btn flex items-center gap-1.5"
          >
            <Coins className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t.recharge}</span>
          </button>

          {/* Language Switcher */}
          <div className="border-l border-border pl-2 sm:pl-3 flex items-center gap-1">
            <button
              onClick={onToggleLocale}
              className="px-2 py-1 text-xs font-mono font-semibold rounded-lg text-ink-muted hover:text-ink hover:bg-canvas transition-colors flex items-center gap-1"
              title={locale === 'uz' ? "Tilni o'zgartirish" : locale === 'en' ? 'Change language' : 'Сменить язык'}
            >
              <Globe className="h-3.5 w-3.5" />
              <span className="uppercase font-bold">{locale}</span>
            </button>
          </div>

          {/* User Account / Auth */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-border bg-white text-ink hover:bg-canvas tactile-btn"
            title={user ? (locale === 'en' ? 'My profile' : 'Mening profilim') : (locale === 'en' ? 'Sign in with Google' : 'Google orqali kirish')}
          >
            <div className="h-7 w-7 rounded-lg bg-bento-peach text-coral font-bold flex items-center justify-center text-xs">
              {user?.full_name ? user.full_name[0] : <UserIcon className="h-3.5 w-3.5" />}
            </div>
            <div className="hidden lg:flex flex-col text-left leading-tight">
              <span className="text-xs font-semibold text-ink line-clamp-1">
                {user?.full_name || t.login}
              </span>
              <span className="text-[10px] font-mono text-ink-muted">
                {user?.phone_number || (user ? `${user.credits_balance} ${locale === 'en' ? 'tokens' : 'token'}` : (locale === 'en' ? 'Google Account' : 'Google hisob'))}
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
