'use client';

import React from 'react';
import {
  Sparkles,
  Plus,
  Coins,
  Film,
  Zap,
  Globe,
  User as UserIcon,
  Layers,
  Calculator,
  CreditCard,
} from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  locale: 'uz' | 'ru';
  onToggleLocale: () => void;
  activeTab: 'studio' | 'prompt' | 'templates' | 'calculator' | 'pricing' | 'library';
  setActiveTab: (tab: 'studio' | 'prompt' | 'templates' | 'calculator' | 'pricing' | 'library') => void;
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
      calculator: 'Kalkulyator',
      pricing: 'Narxlar',
      library: 'Videolarim',
      credits: (count: number) => `${count} ta video qoldi`,
      recharge: 'Token soʻrash',
      login: 'Kirish (Google)',
    },
    ru: {
      brandSub: 'AI Видео Реклама',
      studio: 'Студия',
      prompt: 'AI Промпт Видео',
      templates: 'Шаблоны',
      calculator: 'Калькулятор',
      pricing: 'Тарифы',
      library: 'Мои видео',
      credits: (count: number) => `Осталось: ${count} видео`,
      recharge: 'Запросить токены',
      login: 'Войти (Google)',
    },
  }[locale];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-white/95 backdrop-blur-sm shadow-tactile">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab('studio')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-coral text-white font-heading font-black text-lg shadow-sm transition-transform group-hover:scale-105">
              T
            </div>
            <div>
              <span className="font-heading font-extrabold text-xl tracking-tight text-ink flex items-center gap-1.5">
                Tasvir
                <span className="text-[10px] font-mono tracking-normal font-semibold px-1.5 py-0.5 rounded-md bg-coral-light text-coral border border-coral/20">
                  UGC AI
                </span>
              </span>
              <p className="text-[11px] text-ink-muted -mt-0.5 font-medium hidden sm:block">
                {t.brandSub} (Uzum, Reels, TG)
              </p>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('studio')}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'studio'
                  ? 'bg-bento-peach text-coral font-semibold'
                  : 'text-ink-muted hover:text-ink hover:bg-canvas'
              }`}
            >
              {t.studio}
            </button>
            <button
              onClick={() => setActiveTab('prompt')}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'prompt'
                  ? 'bg-coral text-white font-semibold shadow-xs'
                  : 'text-coral font-medium hover:bg-coral-light'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t.prompt}</span>
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
              onClick={() => setActiveTab('calculator')}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'calculator'
                  ? 'bg-bento-sky text-cobalt font-semibold'
                  : 'text-ink-muted hover:text-ink hover:bg-canvas'
              }`}
            >
              <Calculator className="h-3.5 w-3.5" />
              {t.calculator}
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
            <button
              onClick={() => setActiveTab('library')}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'library'
                  ? 'bg-ink text-white font-semibold'
                  : 'text-ink-muted hover:text-ink hover:bg-canvas'
              }`}
            >
              <Film className="h-3.5 w-3.5" />
              {t.library}
              {libraryCount > 0 && (
                <span className="font-mono text-xs px-1.5 py-0.2 rounded-full bg-coral text-white font-bold">
                  {libraryCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Working Language Toggle */}
          <button
            onClick={onToggleLocale}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono font-semibold rounded-lg border border-border bg-canvas text-ink hover:bg-white tactile-btn"
            title="Tilni o'zgartirish"
          >
            <Globe className="h-3.5 w-3.5 text-ink-muted" />
            <span className={locale === 'uz' ? 'font-bold text-coral' : 'text-ink-muted'}>
              OʻZ
            </span>
            <span className="text-border">|</span>
            <span className={locale === 'ru' ? 'font-bold text-cobalt' : 'text-ink-muted'}>
              РУ
            </span>
          </button>

          {/* Live Credit Balance Pill */}
          <div className="flex items-center bg-canvas border border-border rounded-xl p-1 shadow-inner">
            <div
              onClick={onOpenCheckout}
              className="flex items-center gap-1.5 px-2.5 py-1 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="h-5 w-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                <Zap className="h-3 w-3 fill-amber-500 text-amber-600" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-mono text-xs font-bold text-ink leading-none">
                  {user?.credits_balance ?? 3}{' '}
                  <span className="text-[10px] font-sans font-normal text-ink-muted">
                    {locale === 'uz' ? 'ta video' : 'видео'}
                  </span>
                </span>
              </div>
            </div>

            <button
              onClick={onOpenCheckout}
              className="h-7 px-2 rounded-lg bg-coral hover:bg-coral-hover text-white text-xs font-semibold flex items-center gap-1 shadow-sm tactile-btn"
              title="Hisobni to'ldirish"
            >
              <Plus className="h-3 w-3" />
              <span className="hidden md:inline">{t.recharge}</span>
            </button>
          </div>

          {/* User Account / Auth */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-border bg-white text-ink hover:bg-canvas tactile-btn"
            title="Profil"
          >
            <div className="h-7 w-7 rounded-lg bg-bento-peach text-coral font-bold flex items-center justify-center text-xs">
              {user?.full_name ? user.full_name[0] : <UserIcon className="h-3.5 w-3.5" />}
            </div>
            <div className="hidden lg:flex flex-col text-left leading-tight">
              <span className="text-xs font-semibold text-ink line-clamp-1">
                {user?.full_name || t.login}
              </span>
              <span className="text-[10px] font-mono text-ink-muted">
                {user?.phone_number || '+998-99-099-11-12'}
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}

