'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Film,
  Layers,
  CreditCard,
  Video,
  ArrowRight,
  ArrowUpRight,
  Play,
  Monitor,
  Aperture,
  ScanLine,
  Clock,
  Cpu,
  Crown,
} from 'lucide-react';
import { Navbar, NavTabType } from '../components/Navbar';
import { TemplatesGallery, TemplateItem } from '../components/TemplatesGallery';
import { PricingSection } from '../components/PricingSection';
import { VideoLibraryModal } from '../components/VideoLibraryModal';
import { AskAdminModal } from '../components/AskAdminModal';
import { AuthModal } from '../components/AuthModal';
import { ProfileModal } from '../components/ProfileModal';
import { AdminPanel } from '../components/AdminPanel';
import { PromptVideoGenerator } from '../components/PromptVideoGenerator';
import { CapCutEditor } from '../components/CapCutEditor';
import { ThemeToggle } from '../components/ThemeToggle';
import { User, VideoJob, LocaleType, VideoEditorProject } from '../types';
import { api } from '../lib/api';

/* ──────────────────────────────────────────────────────────
   CINEMATIC LANDING PAGE
   ────────────────────────────────────────────────────────── */

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [locale, setLocale] = useState<LocaleType>('en');
  const [activeTab, setActiveTab] = useState<NavTabType | 'landing'>('landing' as any);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutPlanId, setCheckoutPlanId] = useState('shop_pro');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
  const [currentEditorProject, setCurrentEditorProject] = useState<VideoEditorProject | null>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  const [jobs, setJobs] = useState<VideoJob[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('tasvir_jobs');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('tasvir_jobs', JSON.stringify(jobs));
      } catch {}
    }
  }, [jobs]);

  useEffect(() => {
    api.getMe().then((u) => {
      if (u) setUser(u);
    });

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as NavTabType | null;
      if (tabParam) {
        setActiveTab(tabParam === ('studio' as any) ? 'prompt' : tabParam);
      }
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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
    setActiveTab('prompt');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleJobCreated = (newJob: VideoJob) => {
    setJobs((prev) => [newJob, ...prev.filter((j) => j.id !== newJob.id)]);
  };

  const handleJobStarted = (newJob: VideoJob) => {
    setJobs((prev) => [newJob, ...prev.filter((j) => j.id !== newJob.id)]);
    setActiveTab('library');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateJob = (updatedJob: VideoJob) => {
    setJobs((prev) => prev.map((j) => (j.id === updatedJob.id ? updatedJob : j)));
  };

  const enterStudio = (tab: NavTabType = 'prompt') => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── i18n hero content ────────────────────────── */
  const hero = {
    uz: {
      overline: 'KINEMATOGRAFIK AI VIDEO PLATFORMASI',
      headline: ['Tasvirni', 'Harakatga', 'Keltiring'],
      subhead: 'Google Veo 3.1 kuchi bilan professional kinematografik video yarating. Bir so\u02BBz — bir film.',
      ctaPrimary: 'Studiyaga kirish',
      ctaSecondary: 'Namoyish ko\u02BBrish',
      statsLabel: ['RENDERING', 'FORMATLAR', 'ENGINE', 'ANIQLIK'],
      statsValue: ['< 60s', '9:16 ', 'Veo 3.1', '1080p+'],
    },
    en: {
      overline: 'CINEMATIC AI VIDEO PLATFORM',
      headline: ['Render Your', 'Vision Into', 'Motion'],
      subhead: 'Professional-grade cinematic video generation powered by Google Veo 3.1. One prompt. One take. Infinite possibilities.',
      ctaPrimary: 'Enter Studio',
      ctaSecondary: 'View Reel',
      statsLabel: ['RENDERING', 'FORMATS', 'ENGINE', 'RESOLUTION'],
      statsValue: ['< 60s', '9:16', 'Veo 3.1', '1080p+'],
    },
    ru: {
      overline: 'КИНЕМАТОГРАФИЧЕСКАЯ AI ВИДЕО ПЛАТФОРМА',
      headline: ['Превратите', 'Видение в', 'Движение'],
      subhead: 'Профессиональная генерация кинематографического видео на базе Google Veo 3.1. Один промпт. Один дубль.',
      ctaPrimary: 'Войти в студию',
      ctaSecondary: 'Смотреть шоурил',
      statsLabel: ['РЕНДЕРИНГ', 'ФОРМАТЫ', 'ДВИЖОК', 'РАЗРЕШЕНИЕ'],
      statsValue: ['< 60с', '9:16 ', 'Veo 3.1', '1080p+'],
    },
  }[locale]!;

  const features = {
    uz: [
      { label: 'Veo 3.1 Engine', desc: 'Google\u02BCning eng so\u02BBnggi generativ video modeli', num: '01' },
      { label: 'CapCut Video Studio', desc: 'Soniyama-soniya subtitrlarni professional tahrirlash', num: '02' },
      { label: 'Karaoke Subtitrlar', desc: 'Millisekund aniqlikdagi jonli matn animatsiyasi', num: '03' },
      { label: 'Professional Eksport', desc: '9:16 vertikal formatlar', num: '04' },
    ],
    en: [
      { label: 'Veo 3.1 Engine', desc: 'Google\u2019s latest generative video model with cinematic fidelity', num: '01' },
      { label: 'CapCut Video Editor', desc: 'Frame-accurate subtitle editing and dynamic karaoke styles', num: '02' },
      { label: 'Karaoke Captions', desc: 'Millisecond-precise synchronized text animation', num: '03' },
      { label: 'Professional Export', desc: '9:16 vertical delivery formats', num: '04' },
    ],
    ru: [
      { label: 'Движок Veo 3.1', desc: 'Новейшая генеративная видеомодель Google', num: '01' },
      { label: 'CapCut Видео Редактор', desc: 'Посекундное редактирование субтитров и стили караоке', num: '02' },
      { label: 'Караоке Субтитры', desc: 'Синхронизированная текстовая анимация с точностью до миллисекунд', num: '03' },
      { label: 'Профессиональный Экспорт', desc: 'Форматы 9:16 вертикальный', num: '04' },
    ],
  }[locale]!;

  /* ── Tab content labels ────────────────────────── */
  const tabContent = {
    uz: {
      tabStudio: 'Studiyo',
      tabVeo: 'Veo 3.1',
      tabTemplates: 'Shablonlar',
      tabPricing: 'Tariflar',
      tabLibrary: 'Videolarim',
      footerDesc: 'O\u02BBzbekiston elektron tijorati uchun sun\u02BBiy intellekt video platformasi',
    },
    en: {
      tabStudio: 'Studio',
      tabVeo: 'Veo 3.1',
      tabTemplates: 'Templates',
      tabPricing: 'Pricing',
      tabLibrary: 'My Videos',
      footerDesc: 'Professional AI video generation platform for filmmakers and creators',
    },
    ru: {
      tabStudio: 'Студия',
      tabVeo: 'Veo 3.1',
      tabTemplates: 'Шаблоны',
      tabPricing: 'Тарифы',
      tabLibrary: 'Мои видео',
      footerDesc: 'Профессиональная AI видео платформа для кинематографистов и создателей контента',
    },
  }[locale]!;

  /* ──────────────────────────────────────────────
     LANDING PAGE SECTIONS
     ────────────────────────────────────────────── */

  const isLanding = activeTab === ('landing' as any);

  const landingContent = (
    <>
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 01 — HERO
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col justify-center overflow-hidden">

        {/* Cinematic viewport background */}
        <div className="absolute inset-0 viewport-frame">
          {/* Gradient atmospheric depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-obsidian via-obsidian/60 to-obsidian z-[4]" />
          {/* Dark cinematic still / abstract texture */}
          <div
            className="absolute inset-0 opacity-[0.07] animate-slow-drift"
            style={{
              backgroundImage: `
                radial-gradient(ellipse 80% 50% at 70% 40%, rgba(212,165,116,0.15), transparent),
                radial-gradient(ellipse 60% 80% at 20% 60%, rgba(138,155,178,0.08), transparent)
              `,
            }}
          />
          {/* Horizontal scan line */}
          <div className="scan-line absolute inset-0" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-[1600px] mx-auto px-6 lg:px-10 py-24 lg:py-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center min-h-screen">

            {/* LEFT — Editorial type block (7 cols) */}
            <div className="lg:col-span-7 space-y-8 lg:space-y-10">
              {/* Overline */}
              <div className="opacity-0 animate-fade-up stagger-1">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-px bg-accent-warm" />
                  <span className="text-[10px] font-mono font-medium tracking-[0.3em] text-ink-dim">
                    {hero.overline}
                  </span>
                </div>
              </div>

              {/* Headline — oversized editorial serif */}
              <div className="opacity-0 animate-fade-up stagger-2">
                <h1 className="text-display-xl font-serif font-bold text-ink leading-[0.92]">
                  {hero.headline.map((line, i) => (
                    <span key={i} className="block">
                      {i === hero.headline.length - 1 ? (
                        <span className="shimmer-text">{line}</span>
                      ) : (
                        line
                      )}
                    </span>
                  ))}
                </h1>
              </div>

              {/* Subhead */}
              <div className="opacity-0 animate-fade-up stagger-3">
                <p className="text-sm lg:text-base text-ink-muted max-w-lg leading-relaxed font-sans font-light">
                  {hero.subhead}
                </p>
              </div>

              {/* CTAs */}
              <div className="opacity-0 animate-fade-up stagger-4 flex items-center gap-4">
                <button
                  onClick={() => enterStudio('prompt')}
                  className="group flex items-center gap-3 px-6 py-3 bg-ink text-obsidian text-[11px] font-mono font-bold tracking-[0.15em] uppercase hover:bg-accent-warm transition-colors"
                >
                  {hero.ctaPrimary}
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => enterStudio('templates')}
                  className="group flex items-center gap-3 px-6 py-3 border border-stroke text-ink-muted text-[11px] font-mono font-medium tracking-[0.15em] uppercase hover:border-stroke-hover hover:text-ink transition-all"
                >
                  {hero.ctaSecondary}
                  <Play className="h-3 w-3 fill-current" />
                </button>
              </div>
            </div>

            {/* RIGHT — Preview viewport (5 cols) */}
            <div className="lg:col-span-5 opacity-0 animate-fade-up stagger-5">
              <div className="viewport-frame aspect-[9/14] lg:aspect-[9/16] max-w-sm lg:max-w-none mx-auto relative group">
                {/* Canvas interior */}
                <div className="absolute inset-0 bg-gradient-to-br from-surface via-surface-raised to-surface z-[1]" />

                {/* Fake editing UI overlay */}
                <div className="absolute inset-0 z-[5] flex flex-col justify-between p-3 lg:p-4 pointer-events-none">
                  {/* Top bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-signal-red/60" />
                      <span className="text-[8px] font-mono text-ink-dim tracking-widest">REC</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-mono text-ink-dim tabular-nums">00:00:00:00</span>
                      <span className="text-[8px] font-mono text-accent-warm/60">1080p</span>
                    </div>
                  </div>

                  {/* Center play indicator */}
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-14 h-14 border border-stroke/40 flex items-center justify-center opacity-40 group-hover:opacity-70 transition-opacity">
                      <Play className="h-5 w-5 text-ink fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Bottom timeline */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[7px] font-mono text-ink-dim tracking-widest">TIMELINE</span>
                      <div className="flex-1 h-px bg-stroke/40" />
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 24 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 h-1"
                          style={{
                            backgroundColor: i < 8
                              ? 'rgba(212,165,116,0.25)'
                              : i < 16
                              ? 'rgba(138,155,178,0.15)'
                              : 'rgba(42,42,46,0.4)',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* CTA overlay on hover */}
                <button
                  onClick={() => enterStudio('prompt')}
                  className="absolute inset-0 z-[6] flex items-center justify-center opacity-0 group-hover:opacity-100 bg-obsidian/40 transition-all cursor-pointer"
                >
                  <span className="text-[10px] font-mono tracking-[0.2em] text-ink border border-stroke/60 px-4 py-2">
                    OPEN STUDIO
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom stat bar */}
        <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-stroke">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-10">
            <div className="grid grid-cols-2 lg:grid-cols-4">
              {hero.statsLabel.map((label, i) => (
                <div
                  key={i}
                  className={`py-4 lg:py-5 ${i > 0 ? 'border-l border-stroke' : ''} px-4 lg:px-6 opacity-0 animate-fade-up`}
                  style={{ animationDelay: `${0.6 + i * 0.1}s` }}
                >
                  <div className="text-[9px] font-mono text-ink-dim tracking-[0.2em] mb-1">{label}</div>
                  <div className="text-sm lg:text-base font-mono font-bold text-ink tabular-nums">{hero.statsValue[i]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 02 — CAPABILITIES
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative border-t border-stroke">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-24 lg:py-32">
          {/* Section header */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16 lg:mb-24">
            <div className="lg:col-span-5">
              <div className="flex items-center gap-3 mb-6">
                <span className="w-8 h-px bg-stroke" />
                <span className="text-[10px] font-mono font-medium tracking-[0.3em] text-ink-dim">
                  CAPABILITIES
                </span>
              </div>
              <h2 className="text-display font-serif font-bold text-ink">
                {locale === 'uz' ? 'Professional' : locale === 'ru' ? 'Профессиональный' : 'Professional'}
                <br />
                <span className="text-ink-muted italic">
                  {locale === 'uz' ? 'darajadagi vositalar' : locale === 'ru' ? 'набор инструментов' : 'grade tooling'}
                </span>
              </h2>
            </div>
            <div className="lg:col-span-5 lg:col-start-8 flex items-end">
              <p className="text-sm text-ink-dim leading-relaxed font-sans max-w-md">
                {locale === 'uz'
                  ? 'Har bir kadr professional sifatda. Har bir ovoz tabiiy. Har bir eksport marketplace-ga tayyor.'
                  : locale === 'ru'
                  ? 'Каждый кадр профессионального качества. Каждый голос естественный. Каждый экспорт готов к платформе.'
                  : 'Every frame rendered at professional fidelity. Every voice naturally articulated. Every export platform-ready.'}
              </p>
            </div>
          </div>

          {/* Feature grid — asymmetric editorial */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-stroke">
            {features.map((feat, i) => (
              <div
                key={i}
                className="bg-obsidian p-8 lg:p-12 group hover:bg-surface transition-colors"
              >
                <div className="flex items-start justify-between mb-8">
                  <span className="text-[10px] font-mono text-ink-dim tracking-[0.2em]">{feat.num}</span>
                  <ArrowUpRight className="h-4 w-4 text-ink-dim group-hover:text-accent-warm transition-colors" />
                </div>
                <h3 className="text-editorial font-serif font-semibold text-ink mb-3">
                  {feat.label}
                </h3>
                <p className="text-sm text-ink-dim leading-relaxed font-sans font-light max-w-sm">
                  {feat.desc}
                </p>
                <div className="mt-8 h-px bg-stroke group-hover:bg-accent-warm/20 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 03 — INTERFACE PREVIEW
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative border-t border-stroke">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Text */}
            <div className="lg:col-span-4 space-y-6">
              <div className="flex items-center gap-3">
                <span className="w-8 h-px bg-accent-warm" />
                <span className="text-[10px] font-mono font-medium tracking-[0.3em] text-ink-dim">
                  WORKSPACE
                </span>
              </div>
              <h2 className="text-display font-serif font-bold text-ink leading-[0.95]">
                {locale === 'uz' ? (
                  <>Studiya<br /><span className="text-ink-muted italic">muhiti</span></>
                ) : locale === 'ru' ? (
                  <>Студийная<br /><span className="text-ink-muted italic">среда</span></>
                ) : (
                  <>Studio<br /><span className="text-ink-muted italic">environment</span></>
                )}
              </h2>
              <p className="text-sm text-ink-dim leading-relaxed font-sans font-light">
                {locale === 'uz'
                  ? 'DaVinci Resolve singari professional interfeys. Har bir element aniq maqsadga xizmat qiladi.'
                  : locale === 'ru'
                  ? 'Профессиональный интерфейс уровня DaVinci Resolve. Каждый элемент служит конкретной цели.'
                  : 'An interface engineered like DaVinci Resolve. Every element serves a precise purpose. No decoration — only function.'}
              </p>
              <button
                onClick={() => enterStudio('prompt')}
                className="group flex items-center gap-3 text-[11px] font-mono tracking-[0.15em] text-ink-muted hover:text-accent-warm transition-colors"
              >
                <span>
                  {locale === 'uz' ? 'STUDIYANI OCHISH' : locale === 'ru' ? 'ОТКРЫТЬ СТУДИЮ' : 'LAUNCH WORKSPACE'}
                </span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Preview panel */}
            <div className="lg:col-span-8">
              <div className="viewport-frame aspect-video relative">
                <div className="absolute inset-0 bg-surface z-[1]" />
                {/* Simulated workspace UI */}
                <div className="absolute inset-0 z-[5] p-4 flex flex-col">
                  {/* Toolbar */}
                  <div className="flex items-center justify-between pb-3 border-b border-stroke/40">
                    <div className="flex items-center gap-3">
                      <span className="text-[8px] font-mono text-ink-dim tracking-widest">PROJECT</span>
                      <span className="text-[8px] font-mono text-accent-warm/60">untitled_sequence.mp4</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Monitor className="h-3 w-3 text-ink-dim" />
                      <Aperture className="h-3 w-3 text-ink-dim" />
                      <ScanLine className="h-3 w-3 text-ink-dim" />
                    </div>
                  </div>
                  {/* Main area */}
                  <div className="flex-1 grid grid-cols-12 gap-3 pt-3">
                    {/* Left panel */}
                    <div className="col-span-3 border border-stroke/30 p-2 flex flex-col gap-2">
                      <span className="text-[7px] font-mono text-ink-dim tracking-widest">PROMPT</span>
                      <div className="flex-1 space-y-1">
                        {[88, 72, 94, 78].map((w, i) => (
                          <div key={i} className="h-1.5 bg-stroke/20 rounded-none" style={{ width: `${w}%` }} />
                        ))}
                      </div>
                      <div className="h-6 bg-accent-warm/10 border border-accent-warm/20 flex items-center justify-center">
                        <span className="text-[7px] font-mono text-accent-warm tracking-wider">GENERATE</span>
                      </div>
                    </div>
                    {/* Center viewport */}
                    <div className="col-span-6 border border-stroke/30 flex items-center justify-center relative">
                      <div className="w-12 h-12 border border-stroke/20 flex items-center justify-center">
                        <Play className="h-4 w-4 text-ink-dim/40 fill-current ml-0.5" />
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1">
                        <div className="h-0.5 flex-1 bg-accent-warm/20" />
                        <div className="h-0.5 flex-[2] bg-stroke/20" />
                      </div>
                    </div>
                    {/* Right panel */}
                    <div className="col-span-3 border border-stroke/30 p-2 flex flex-col gap-2">
                      <span className="text-[7px] font-mono text-ink-dim tracking-widest">PROPERTIES</span>
                      {['Resolution', 'Duration', 'Format', 'Audio'].map((prop) => (
                        <div key={prop} className="flex items-center justify-between">
                          <span className="text-[7px] font-mono text-ink-dim">{prop}</span>
                          <span className="text-[7px] font-mono text-ink-muted">—</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Bottom timeline */}
                  <div className="pt-3 mt-3 border-t border-stroke/40">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[7px] font-mono text-ink-dim tracking-widest">TIMELINE</span>
                      <Clock className="h-2.5 w-2.5 text-ink-dim" />
                    </div>
                    <div className="timeline-grid h-6 border border-stroke/20 relative">
                      <div className="absolute top-0 left-0 h-full w-1/3 bg-accent-warm/8 border-r border-accent-warm/20" />
                      <div className="absolute top-0 left-[33%] h-full w-1/4 bg-accent-cold/5 border-r border-accent-cold/10" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 04 — CTA BAND
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="border-t border-stroke">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-20 lg:py-26">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8">
              <h2 className="text-display font-serif font-bold text-ink leading-[0.95]">
                {locale === 'uz'
                  ? 'Birinchi kadrni yarating'
                  : locale === 'ru'
                  ? 'Создайте первый кадр'
                  : 'Render your first frame'}
              </h2>
            </div>
            <div className="lg:col-span-4 flex lg:justify-end">
              <button
                onClick={() => enterStudio('prompt')}
                className="group flex items-center gap-4 px-8 py-4 bg-ink text-obsidian text-[11px] font-mono font-bold tracking-[0.15em] uppercase hover:bg-accent-warm transition-colors"
              >
                {hero.ctaPrimary}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          FOOTER
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <footer className="border-t border-stroke">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Brand */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 border border-stroke flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[4px] border-l-accent-warm border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent ml-0.5" />
                </div>
                <span className="font-sans font-bold text-xs tracking-[0.2em] text-ink uppercase">
                  TASVIR
                </span>
                <span className="text-[9px] font-mono text-ink-dim">.AI</span>
              </div>
              <p className="text-xs text-ink-dim leading-relaxed max-w-xs font-sans">
                {tabContent.footerDesc}
              </p>
            </div>

            {/* Links */}
            <div className="lg:col-span-2 lg:col-start-7">
              <div className="text-[9px] font-mono text-ink-dim tracking-[0.2em] mb-4">PLATFORM</div>
              <div className="space-y-2">
                {[
                  { label: 'Veo Engine', tab: 'prompt' as NavTabType },
                  { label: 'Templates', tab: 'templates' as NavTabType },
                  { label: 'Pricing', tab: 'pricing' as NavTabType },
                ].map((item) => (
                  <button
                    key={item.tab}
                    onClick={() => enterStudio(item.tab)}
                    className="block text-xs text-ink-muted hover:text-ink font-sans transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="text-[9px] font-mono text-ink-dim tracking-[0.2em] mb-4">CONNECT</div>
              <div className="space-y-2">
                <a
                  href="https://t.me/astro_spectrum"
                  target="_blank"
                  rel="noreferrer"
                  className="block text-xs text-ink-muted hover:text-ink font-sans transition-colors"
                >
                  Telegram
                </a>
                <span className="block text-xs text-ink-dim font-mono">
                  +998-99-099-11-12
                </span>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="text-[9px] font-mono text-ink-dim tracking-[0.2em] mb-4">INFRASTRUCTURE</div>
              <div className="space-y-2 text-xs text-ink-dim font-mono">
                <span className="block">Google Veo 3.1</span>
                <span className="block">Cloudflare</span>
                <span className="block">UploadThing</span>
              </div>
            </div>
          </div>

          {/* Bottom rule */}
          <div className="mt-12 pt-6 border-t border-stroke flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[10px] font-mono text-ink-dim tracking-wider">
              &copy; 2026 TASVIR TECHNOLOGIES
            </span>
            <span className="text-[10px] font-mono text-ink-dim tracking-wider">
              SARDOR SUNATULLAYEV &middot; TASHKENT
            </span>
          </div>
        </div>
      </footer>
    </>
  );

  /* ──────────────────────────────────────────────
     STUDIO CONTENT (existing components)
     ────────────────────────────────────────────── */

  const studioContent = (
    <main className="max-w-[1600px] mx-auto px-6 lg:px-10 py-8 pb-24 lg:pb-12 min-h-screen">
      {(activeTab === 'prompt' || activeTab === ('studio' as any)) && (
        <div className="animate-in fade-in duration-200">
          <PromptVideoGenerator
            user={user}
            locale={locale}
            initialPrompt={
              selectedTemplate
                ? locale === 'ru'
                  ? selectedTemplate.scriptExcerptRu
                  : selectedTemplate.scriptExcerptUz
                : undefined
            }
            initialImage={selectedTemplate?.imageUrl}
            onRequireAuth={() => setIsAuthOpen(true)}
            onJobStarted={handleJobStarted}
            onEditInCapCut={(proj) => {
              setCurrentEditorProject(proj);
              setActiveTab('editor');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onVideoCreated={(videoUrl) => {
              const newPromptJob: VideoJob = {
                id: `job-prompt-${Date.now()}`,
                user_id: user?.id || 'user-demo',
                product_id: 'p-prompt',
                platform_preset: 'uzum_9_16',
                script_tone: 'discount_hook',
                script_text: 'Gemini Omni 1.1 Flash Video Ad',
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

      {activeTab === 'editor' && (
        <div className="animate-in fade-in duration-200">
          <CapCutEditor
            locale={locale}
            user={user}
            initialProject={currentEditorProject}
            onBackToStudio={() => setActiveTab('prompt')}
            onSave={(p) => setCurrentEditorProject(p)}
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
            onUpdateJob={handleUpdateJob}
            onOpenStudio={() => setActiveTab('prompt')}
            onEditJob={(job) => {
              setCurrentEditorProject({
                id: job.id,
                title: job.script_text ? job.script_text.slice(0, 45) : 'AI Video Ad',
                videoUrl: job.output_video_url || '',
                duration: 16,
                subtitles: [
                  {
                    id: `cue-${job.id}-1`,
                    startSec: 0.5,
                    endSec: 5.0,
                    text: job.script_text ? job.script_text.slice(0, 60) : 'Tasvir AI video subtitri',
                  },
                ],
                style: {
                  preset: 'capcut_yellow',
                  fontSize: 32,
                  position: 'bottom',
                  textColor: '#FFFFFF',
                  highlightColor: '#FACC15',
                  bgColor: 'rgba(0,0,0,0.4)',
                  bgOpacity: 0.4,
                  fontFamily: 'heading',
                  animation: 'karaoke_active',
                  textTransform: 'uppercase',
                },
              });
              setActiveTab('editor');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      )}

      {activeTab === 'admin' && (
        <div className="animate-in fade-in duration-200">
          <AdminPanel user={user} locale={locale} />
        </div>
      )}

      {/* Studio footer */}
      <footer className="pt-16 pb-8 border-t border-stroke mt-16">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 border border-stroke flex items-center justify-center">
              <div className="w-0 h-0 border-l-[3px] border-l-accent-warm border-t-[2px] border-t-transparent border-b-[2px] border-b-transparent ml-0.5" />
            </div>
            <span className="font-sans font-bold text-[10px] tracking-[0.2em] text-ink-dim uppercase">
              TASVIR.AI
            </span>
          </div>
          <span className="text-[10px] font-mono text-ink-dim tracking-wider">
            &copy; 2026 TASVIR TECHNOLOGIES &middot; SARDOR SUNATULLAYEV
          </span>
        </div>
      </footer>
    </main>
  );

  return (
    <div className="min-h-screen bg-obsidian text-ink">
      {!isLanding && (
        <Navbar
          user={user}
          locale={locale}
          onToggleLocale={handleToggleLocale}
          onChangeLocale={setLocale}
          activeTab={activeTab as NavTabType}
          setActiveTab={setActiveTab}
          onOpenCheckout={() => setIsCheckoutOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          libraryCount={jobs.length}
        />
      )}

      {isLanding ? (
        <>
          {/* Landing has its own minimal header */}
          <header className="fixed top-0 left-0 right-0 z-50 bg-obsidian/80 backdrop-blur-sm border-b border-stroke/50">
            <div className="max-w-[1600px] mx-auto px-6 lg:px-10 h-14 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 border border-stroke flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[4px] border-l-accent-warm border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent ml-0.5" />
                </div>
                <span className="font-sans font-bold text-xs tracking-[0.2em] text-ink uppercase">TASVIR</span>
                <span className="text-[9px] font-mono text-ink-dim">.AI</span>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                {/* Theme Toggle */}
                <ThemeToggle align="right" />

                {/* Locale */}
                <div className="hidden sm:flex items-center border border-stroke/50">
                  {(['uz', 'en', 'ru'] as LocaleType[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLocale(lang)}
                      className={`px-2 py-1 text-[9px] font-mono font-bold tracking-widest transition-all ${
                        locale === lang ? 'bg-surface-raised text-ink' : 'text-ink-dim hover:text-ink-muted'
                      }`}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => enterStudio('prompt')}
                  className="px-4 py-1.5 bg-ink text-obsidian text-[10px] font-mono font-bold tracking-[0.15em] uppercase hover:bg-accent-warm transition-colors"
                >
                  {hero.ctaPrimary}
                </button>
              </div>
            </div>
          </header>
          {landingContent}
        </>
      ) : (
        studioContent
      )}

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
