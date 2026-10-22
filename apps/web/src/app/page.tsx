'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Film,
  Layers,
  CreditCard,
  Video,
  ShieldCheck,
  Zap,
  Flame,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  Crown,
} from 'lucide-react';
import { Navbar, NavTabType } from '../components/Navbar';
import { Studio } from '../components/Studio';
import { TemplatesGallery, TemplateItem } from '../components/TemplatesGallery';
import { PricingSection } from '../components/PricingSection';
import { VideoLibraryModal } from '../components/VideoLibraryModal';
import { AskAdminModal } from '../components/AskAdminModal';
import { AuthModal } from '../components/AuthModal';
import { ProfileModal } from '../components/ProfileModal';
import { AdminPanel } from '../components/AdminPanel';
import { PromptVideoGenerator } from '../components/PromptVideoGenerator';
import { User, VideoJob, LocaleType } from '../types';
import { api } from '../lib/api';

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [locale, setLocale] = useState<LocaleType>('uz');
  const [activeTab, setActiveTab] = useState<NavTabType>('studio');

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutPlanId, setCheckoutPlanId] = useState('shop_pro');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);

  const [jobs, setJobs] = useState<VideoJob[]>([
    {
      id: 'job-demo-1',
      user_id: 'user-demo',
      product_id: 'p1',
      avatar_id: 'malika',
      platform_preset: 'uzum_9_16',
      script_tone: 'discount_hook',
      script_text: "Salom! Uzum Marketda ulgurib qoling! Aynan bugun mashhur Nike Air Zoom atigi 450,000 so'm bo'lib turibdi...",
      status: 'completed',
      progress_percent: 100,
      audio_preview_url: null,
      output_video_url: 'https://n6ogfqlb21.ufs.sh/f/e4WrEcObdaG3xQRkL5D1FbQuz7SaXsDfAioc3JZvk59ORCG4',
      credits_charged: 1,
      error_message: null,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      completed_at: new Date(Date.now() - 3550000).toISOString(),
    },
  ]);

  useEffect(() => {
    api.getMe().then((u) => {
      if (u) setUser(u);
    });
  }, []);

  const handleToggleLocale = () => {
    setLocale((prev) => {
      if (prev === 'uz') return 'en';
      if (prev === 'en') return 'ru';
      return 'uz';
    });
  };

  const handleOpenCheckoutWithPlan = (planId: string) => {
    setCheckoutPlanId(planId);
    setIsCheckoutOpen(true);
  };

  const handleSelectTemplate = (template: TemplateItem) => {
    setSelectedTemplate(template);
    setActiveTab('studio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleJobCreated = (newJob: VideoJob) => {
    setJobs((prev) => [newJob, ...prev]);
  };

  const heroContent = {
    uz: {
      badge: '🔥 Google Veo 3.1 & Mahalliy AI Diktorlar • 9:16 Vertikal Format',
      titlePart1: 'Uzum Market, Reels va TikTok uchun',
      titleHighlight: '1 daqiqada 9:16 Video Reklama',
      subtitle:
        'Mahsulot rasmini yuklang yoki Veo 3.1 dramatik gʻoyasini yozing. Oʻzbek tilidagi professional diktorlar, sinxron karaoke subtitrlar va kinematografik vizuallar savdolaringizni oshiradi.',
      features: [
        {
          icon: '⚡',
          title: '60 soniyada tayyor',
          desc: 'Avtomatlashgan ssenariy va ovoz sintezi',
        },
        {
          icon: '📱',
          title: '9:16 Vertikal format',
          desc: 'Uzum, Reels va TikTok xaridorlari uchun',
        },
        {
          icon: '🎭',
          title: 'Markaziy Osiyo yuzlari',
          desc: 'Oʻzbek tilidagi tabiiy AI boshlovchilar',
        },
        {
          icon: '🎵',
          title: 'Karaoke & "Kamin" OST',
          desc: 'EMIN & JONY musiqasi va jonli subtitrlar',
        },
      ],
      tabStudio: 'Studiyo: Avatar & Ovoz',
      tabVeo: 'Veo 3.1 Drama Video',
      tabTemplates: 'Shablonlar',
      tabPricing: 'Tariflar & Tokenlar',
      tabLibrary: 'Videolarim',
      footerDesc: 'Oʻzbekiston elektron tijorati va marketplace sotuvchilari uchun sunʼiy intellekt video platformasi',
      adminSupport: 'Admin bilan aloqa: Sardor Sunatullayev',
    },
    en: {
      badge: '🔥 Google Veo 3.1 & Central Asian AI Avatars • 9:16 Vertical Ads',
      titlePart1: 'High-Converting 9:16 AI Video Ads',
      titleHighlight: 'Ready in 60 Seconds',
      subtitle:
        'Upload product photos or write a dramatic Veo 3.1 storyline. Instant Central Asian AI avatars, natural voiceover, karaoke captions, and cinematic BGM designed for Uzum, Reels, and TikTok.',
      features: [
        {
          icon: '⚡',
          title: 'Ready in 60s',
          desc: 'Automated script, audio & video rendering',
        },
        {
          icon: '📱',
          title: '9:16 Vertical Master',
          desc: 'Optimized for Uzum, Reels & TikTok buyers',
        },
        {
          icon: '🎭',
          title: 'Central Asian Avatars',
          desc: 'Realistic local personas & natural speech',
        },
        {
          icon: '🎵',
          title: 'Karaoke & "Kamin" OST',
          desc: 'EMIN & JONY track & real-time subtitles',
        },
      ],
      tabStudio: 'Studio: Avatar & Audio',
      tabVeo: 'Veo 3.1 Drama Engine',
      tabTemplates: 'Templates',
      tabPricing: 'Plans & Tokens',
      tabLibrary: 'My Videos',
      footerDesc: 'AI video marketing platform for Uzbekistan e-commerce and marketplace sellers',
      adminSupport: 'Admin Support: Sardor Sunatullayev',
    },
    ru: {
      badge: '🔥 Google Veo 3.1 и AI Дикторы Узбекистана • Вертикальный формат 9:16',
      titlePart1: 'Продающая 9:16 AI видео-реклама',
      titleHighlight: 'всего за 60 секунд',
      subtitle:
        'Загрузите фото товара или напишите драматический промпт для Veo 3.1. Реалистичные дикторы Центральной Азии, естественная речь, караоке-субтитры и кинематографичный саундтрек.',
      features: [
        {
          icon: '⚡',
          title: 'Готово за 60 секунд',
          desc: 'Автоматический сценарий и озвучка',
        },
        {
          icon: '📱',
          title: 'Формат 9:16',
          desc: 'Для Uzum Market, Instagram Reels и TikTok',
        },
        {
          icon: '🎭',
          title: 'Дикторы Узбекистана',
          desc: 'Реалистичные локальные лица и речь',
        },
        {
          icon: '🎵',
          title: 'Караоке и трек «Камин»',
          desc: 'Песня EMIN & JONY и динамичные субтитры',
        },
      ],
      tabStudio: 'Студия: Аватары и Голос',
      tabVeo: 'Драма Генератор Veo 3.1',
      tabTemplates: 'Шаблоны',
      tabPricing: 'Тарифы и Токены',
      tabLibrary: 'Мои Видео',
      footerDesc: 'AI видео студия для e-commerce и продавцов на маркетплейсах Узбекистана',
      adminSupport: 'Поддержка администратора: Сардор Сунатуллаев',
    },
  }[locale] || {
    badge: '🔥 Google Veo 3.1 & AI Studio',
    titlePart1: 'High-Converting 9:16 AI Video Ads',
    titleHighlight: 'Ready in 60 Seconds',
    subtitle: 'Upload a product photo or write a dramatic Veo 3.1 storyline.',
    features: [
      { icon: '⚡', title: 'Ready in 60s', desc: 'Fast rendering' },
      { icon: '📱', title: '9:16 Vertical', desc: 'Social & Marketplace format' },
      { icon: '🎭', title: 'AI Avatars', desc: 'Natural local personas' },
      { icon: '🎵', title: 'Karaoke & OST', desc: 'Synced music and text' },
    ],
    tabStudio: 'Studio',
    tabVeo: 'Veo 3.1 Drama',
    tabTemplates: 'Templates',
    tabPricing: 'Pricing',
    tabLibrary: 'Videos',
    footerDesc: 'AI video marketing platform',
    adminSupport: 'Admin Support: Sardor Sunatullayev',
  };

  const mainContent = (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-10 pb-24 md:pb-12">
      <section className="relative text-center space-y-6 pt-2 pb-4">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 w-full max-w-4xl h-48 bg-gradient-to-b from-orange-400/10 via-amber-200/5 to-transparent blur-3xl -z-10"
        />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-border text-xs font-mono font-bold tracking-tight shadow-2xs hover:border-coral/40 transition-colors">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-ink">{heroContent.badge}</span>
        </div>

        <div className="space-y-2 max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-heading font-black text-ink tracking-tight leading-[1.12]">
            {heroContent.titlePart1}
            <span className="shimmer-text block mt-1.5">
              {heroContent.titleHighlight}
            </span>
          </h1>
          <p className="text-sm sm:text-base text-ink-muted max-w-2xl mx-auto leading-relaxed pt-2">
            {heroContent.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto pt-2">
          {heroContent.features.map((feat, idx) => (
            <div
              key={idx}
              className="p-3.5 sm:p-4 rounded-2xl bg-white border border-border text-left shadow-2xs interactive-card"
            >
              <div className="text-xl mb-1.5">{feat.icon}</div>
              <h3 className="font-heading font-bold text-xs sm:text-sm text-ink line-clamp-1">
                {feat.title}
              </h3>
              <p className="text-[11px] text-ink-muted leading-tight mt-0.5 line-clamp-2">
                {feat.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="pt-3 max-w-2xl mx-auto">
          <div className="inline-flex p-1.5 rounded-2xl bg-white border border-border shadow-xs w-full sm:w-auto justify-center flex-wrap gap-1">
            <button
              onClick={() => setActiveTab('studio')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-heading font-bold transition-all tactile-btn flex items-center gap-1.5 ${
                activeTab === 'studio'
                  ? 'bg-bento-peach text-coral shadow-2xs'
                  : 'text-ink-muted hover:text-ink hover:bg-canvas'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{heroContent.tabStudio}</span>
            </button>

            <button
              onClick={() => setActiveTab('prompt')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-heading font-bold transition-all tactile-btn flex items-center gap-1.5 ${
                activeTab === 'prompt'
                  ? 'bg-amber-100 text-amber-900 shadow-2xs'
                  : 'text-ink-muted hover:text-ink hover:bg-canvas'
              }`}
            >
              <Film className="h-3.5 w-3.5 text-coral" />
              <span>{heroContent.tabVeo}</span>
              <span className="text-[9px] font-mono bg-coral text-white px-1.5 py-0.2 rounded font-bold uppercase">
                Veo 3.1
              </span>
            </button>

            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-heading font-bold transition-all tactile-btn flex items-center gap-1.5 ${
                activeTab === 'templates'
                  ? 'bg-bento-mint text-emerald-800 shadow-2xs'
                  : 'text-ink-muted hover:text-ink hover:bg-canvas'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>{heroContent.tabTemplates}</span>
            </button>

            <button
              onClick={() => setActiveTab('pricing')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-heading font-bold transition-all tactile-btn flex items-center gap-1.5 ${
                activeTab === 'pricing'
                  ? 'bg-bento-lavender text-purple-800 shadow-2xs'
                  : 'text-ink-muted hover:text-ink hover:bg-canvas'
              }`}
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>{heroContent.tabPricing}</span>
            </button>

            <button
              onClick={() => setActiveTab('library')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-heading font-bold transition-all tactile-btn flex items-center gap-1.5 ${
                activeTab === 'library'
                  ? 'bg-ink text-white shadow-2xs'
                  : 'text-ink-muted hover:text-ink hover:bg-canvas'
              }`}
            >
              <Video className="h-3.5 w-3.5 text-coral" />
              <span>{heroContent.tabLibrary}</span>
              {jobs.length > 0 && (
                <span className="h-4 min-w-[16px] px-1 rounded-full bg-coral text-white text-[10px] font-mono font-bold flex items-center justify-center">
                  {jobs.length}
                </span>
              )}
            </button>

            {user?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-heading font-bold transition-all tactile-btn flex items-center gap-1.5 ${
                  activeTab === 'admin'
                    ? 'bg-red-600 text-white shadow-2xs'
                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                }`}
              >
                <Crown className="h-3.5 w-3.5 text-amber-300" />
                <span>Admin Panel</span>
                <span className="text-[9px] font-mono bg-white/20 text-white px-1.5 py-0.2 rounded font-bold uppercase">
                  role: admin
                </span>
              </button>
            )}
          </div>
        </div>
      </section>

      {activeTab === 'studio' && (
        <div className="space-y-12 animate-in fade-in duration-200">
          <Studio
            user={user}
            onUpdateUser={setUser}
            locale={locale}
            onOpenCheckout={() => setIsCheckoutOpen(true)}
            onOpenAuth={() => setIsAuthOpen(true)}
            onJobCreated={handleJobCreated}
            initialTemplate={
              selectedTemplate
                ? {
                    productTitle: selectedTemplate.titleUz,
                    category: selectedTemplate.category,
                    priceUzs: selectedTemplate.priceUzs,
                    discountBadge: selectedTemplate.discountBadge,
                    imageUrl: selectedTemplate.imageUrl,
                    tone: selectedTemplate.tone,
                    platform: selectedTemplate.platform,
                    avatarSlug: selectedTemplate.avatarSlug,
                  }
                : null
            }
          />
        </div>
      )}

      {activeTab === 'prompt' && (
        <div className="animate-in fade-in duration-200">
          <PromptVideoGenerator
            user={user}
            locale={locale}
            onRequireAuth={() => setIsAuthOpen(true)}
            onVideoCreated={(videoUrl) => {
              const newPromptJob: VideoJob = {
                id: `job-prompt-${Date.now()}`,
                user_id: user?.id || 'user-demo',
                product_id: 'p-prompt',
                avatar_id: 'malika',
                platform_preset: 'uzum_9_16',
                script_tone: 'discount_hook',
                script_text: 'Google Veo 3.1 Dramatic Video Ad',
                status: 'completed',
                progress_percent: 100,
                audio_preview_url: null,
                output_video_url: videoUrl,
                credits_charged: 1,
                error_message: null,
                created_at: new Date().toISOString(),
                completed_at: new Date().toISOString(),
              };
              handleJobCreated(newPromptJob);
            }}
          />
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="animate-in fade-in duration-200">
          <TemplatesGallery
            locale={locale}
            onSelectTemplate={handleSelectTemplate}
          />
        </div>
      )}

      {activeTab === 'pricing' && (
        <div className="animate-in fade-in duration-200">
          <PricingSection
            locale={locale}
            onSelectPlan={handleOpenCheckoutWithPlan}
          />
        </div>
      )}

      {activeTab === 'library' && (
        <div className="animate-in fade-in duration-200">
          <VideoLibraryModal
            jobs={jobs}
            locale={locale}
            onOpenStudio={() => setActiveTab('studio')}
          />
        </div>
      )}

      {activeTab === 'admin' && (
        <div className="animate-in fade-in duration-200">
          <AdminPanel user={user} locale={locale} />
        </div>
      )}

      <footer className="pt-12 pb-8 border-t border-border space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-coral text-white font-heading font-black text-sm flex items-center justify-center shadow-xs">
                T
              </div>
              <span className="font-heading font-extrabold text-base text-ink tracking-tight">
                tasvir<span className="text-coral">.ai</span>
              </span>
              <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-bento-peach text-coral">
                v2.5
              </span>
            </div>
            <p className="text-xs text-ink-muted max-w-md">
              {heroContent.footerDesc}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-mono text-ink-muted">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-border">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Cloudflare Turnstile</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-border">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span>Google Veo 3.1 & Gemini</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-border">
              <CheckCircle2 className="h-3.5 w-3.5 text-sky-600" />
              <span>UploadThing Cloud</span>
            </span>
          </div>

          <div className="text-center md:text-right">
            <a
              href="https://t.me/astro_spectrum"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 text-xs font-semibold transition-colors tactile-btn"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>Telegram: @astro_spectrum</span>
            </a>
            <div className="text-[11px] font-mono text-ink-muted mt-1">
              Tel: +998-99-099-11-12
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-ink-muted gap-2">
          <span>© 2026 Tasvir Technologies Inc. All rights reserved.</span>
          <span>Sardor Sunatullayev • Oʻzbekiston</span>
        </div>
      </footer>
    </main>
  );

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <Navbar
        user={user}
        locale={locale}
        onToggleLocale={handleToggleLocale}
        onChangeLocale={setLocale}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCheckout={() => setIsCheckoutOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        libraryCount={jobs.length}
      />

      {mainContent}

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onUpdateUser={setUser}
        locale={locale}
        onOpenCheckout={() => setIsCheckoutOpen(true)}
      />

      <AskAdminModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        user={user}
        onUpdateUser={setUser}
        locale={locale}
        initialPlanId={checkoutPlanId}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(loggedInUser) => {
          setUser(loggedInUser);
        }}
        locale={locale}
      />
    </div>
  );
}

