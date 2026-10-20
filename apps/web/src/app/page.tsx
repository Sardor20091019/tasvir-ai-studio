'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Studio } from '../components/Studio';
import { RoiCalculator } from '../components/RoiCalculator';
import { TemplatesGallery, TemplateItem } from '../components/TemplatesGallery';
import { PricingSection } from '../components/PricingSection';
import { VideoLibraryModal } from '../components/VideoLibraryModal';
import { CheckoutModal } from '../components/CheckoutModal';
import { AuthModal } from '../components/AuthModal';
import { TelegramContainer } from '../components/TelegramContainer';
import { PromptVideoGenerator } from '../components/PromptVideoGenerator';
import { User, VideoJob } from '../types';
import { api } from '../lib/api';

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [locale, setLocale] = useState<'uz' | 'ru'>('uz');
  const [activeTab, setActiveTab] = useState<'studio' | 'prompt' | 'templates' | 'calculator' | 'pricing' | 'library'>('studio');
  const [isTelegramMode, setIsTelegramMode] = useState(false);

  // Modals
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutPlanId, setCheckoutPlanId] = useState('shop_pro');
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Selected template to load in Studio
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);

  // Video Jobs history
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
      output_video_url: 'https://assets.mixkit.co/videos/preview/mixkit-vertical-fashion-model-showing-her-shoes-42795-large.mp4',
      credits_charged: 1,
      error_message: null,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      completed_at: new Date(Date.now() - 3550000).toISOString(),
    },
  ]);

  // Load user profile on mount
  useEffect(() => {
    api.getMe().then((u) => {
      if (u) setUser(u);
    });
  }, []);

  const handleToggleLocale = () => {
    setLocale((prev) => (prev === 'uz' ? 'ru' : 'uz'));
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

  // Main Studio Content
  const mainContent = (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Tab: Studio */}
      {activeTab === 'studio' && (
        <div className="space-y-12 animate-in fade-in duration-200">
          <Studio
            user={user}
            onUpdateUser={setUser}
            locale={locale}
            onOpenCheckout={() => setIsCheckoutOpen(true)}
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

          {/* Quick Embedded ROI Calculator Section */}
          <RoiCalculator
            locale={locale}
            onGetStarted={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenCheckout={() => setIsCheckoutOpen(true)}
          />
        </div>
      )}

      {/* Tab: AI Video Prompt Generator (Gemini Omni 1.1 Flash & Remotion) */}
      {activeTab === 'prompt' && (
        <div className="animate-in fade-in duration-200">
          <PromptVideoGenerator
            locale={locale}
            onVideoCreated={(videoUrl) => {
              const newPromptJob: VideoJob = {
                id: `job-prompt-${Date.now()}`,
                user_id: user?.id || 'user-demo',
                product_id: 'p-prompt',
                avatar_id: 'malika',
                platform_preset: 'uzum_9_16',
                script_tone: 'discount_hook',
                script_text: 'Gemini Omni 1.1 Flash AI Prompt Video',
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

      {/* Tab: Shablonlar (Templates) */}
      {activeTab === 'templates' && (
        <div className="animate-in fade-in duration-200">
          <TemplatesGallery
            locale={locale}
            onSelectTemplate={handleSelectTemplate}
          />
        </div>
      )}

      {/* Tab: Kalkulyator (ROI) */}
      {activeTab === 'calculator' && (
        <div className="animate-in fade-in duration-200">
          <RoiCalculator
            locale={locale}
            onGetStarted={() => {
              setActiveTab('studio');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenCheckout={() => setIsCheckoutOpen(true)}
          />
        </div>
      )}

      {/* Tab: Narxlar (Pricing) */}
      {activeTab === 'pricing' && (
        <div className="animate-in fade-in duration-200">
          <PricingSection
            locale={locale}
            onSelectPlan={handleOpenCheckoutWithPlan}
          />
        </div>
      )}

      {/* Tab: Videolarim (Library) */}
      {activeTab === 'library' && (
        <div className="animate-in fade-in duration-200">
          <VideoLibraryModal
            jobs={jobs}
            locale={locale}
            onOpenStudio={() => setActiveTab('studio')}
          />
        </div>
      )}

      {/* Footer */}
      <footer className="pt-12 pb-8 border-t border-border flex flex-col sm:flex-row items-center justify-between text-xs text-ink-muted gap-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-coral text-white font-bold text-xs flex items-center justify-center">
            T
          </div>
          <span className="font-heading font-bold text-ink">Tasvir.ai</span>
          <span>— Oʻzbekiston elektron tijorati uchun sunʼiy intellekt video studiyasi</span>
        </div>

        <div className="flex items-center gap-4 font-mono text-[11px]">
          <span>Payme • Click • Uzum Bank</span>
          <span>© 2026 Tasvir Technologies Inc.</span>
        </div>
      </footer>
    </main>
  );

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Top Navbar */}
      <Navbar
        user={user}
        locale={locale}
        onToggleLocale={handleToggleLocale}
        isTelegramMode={isTelegramMode}
        onToggleTelegramMode={() => setIsTelegramMode(!isTelegramMode)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCheckout={() => setIsCheckoutOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        libraryCount={jobs.length}
      />

      {/* If Telegram Mode is toggled on, show wrapped in TelegramContainer */}
      {isTelegramMode ? (
        <TelegramContainer
          onExit={() => setIsTelegramMode(false)}
          locale={locale}
        >
          {mainContent}
        </TelegramContainer>
      ) : (
        mainContent
      )}

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        user={user}
        onUpdateUser={setUser}
        locale={locale}
        initialPlanId={checkoutPlanId}
      />

      {/* Auth Modal */}
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

