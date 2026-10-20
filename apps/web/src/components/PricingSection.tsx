'use client';

import React from 'react';
import {
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Crown,
  ArrowRight,
} from 'lucide-react';
import { PlanConfig } from '../types';
import { fallbackPlans } from '../lib/api';

interface PricingSectionProps {
  locale: 'uz' | 'ru';
  onSelectPlan: (planId: string) => void;
}

export function PricingSection({
  locale,
  onSelectPlan,
}: PricingSectionProps) {
  const plans = fallbackPlans;

  const t = {
    uz: {
      badge: 'Shaffof va Qulay Narxlar',
      title: 'Uzum va Reels savdolaringizni oshirish uchun tariflar',
      sub: 'Yashirin toʻlovlarsiz. Har bir video toʻliq 9:16 HD formatda, mahalliy AI boshlovchi va subtitrlar bilan taqdim etiladi.',
      select: 'Tanlash',
      bestSeller: 'Eng ommabop',
      videoCredits: (count: number) => `${count} ta video yaratish`,
    },
    ru: {
      badge: 'Прозрачные и честные тарифы',
      title: 'Тарифы для кратного роста продаж на Uzum и Reels',
      sub: 'Без скрытых платежей. Каждое видео создается в формате 9:16 HD с локальным AI-диктором и субтитрами.',
      select: 'Выбрать',
      bestSeller: 'Популярный',
      videoCredits: (count: number) => `Создание ${count} видео`,
    },
  }[locale];

  return (
    <div className="space-y-8 my-6">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-bento-peach border border-coral/20 text-coral text-xs font-bold mb-3">
          <CreditCard className="h-3.5 w-3.5" />
          <span>{t.badge}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-ink tracking-tight mb-2">
          {t.title}
        </h2>
        <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
          {t.sub}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((p) => {
          const isPro = p.id === 'shop_pro';
          return (
            <div
              key={p.id}
              className={`relative rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all ${
                isPro
                  ? 'bg-bento-peach border-2 border-coral shadow-tactile-lg ring-1 ring-coral'
                  : 'bg-white border border-border shadow-tactile hover:shadow-tactile-md'
              }`}
            >
              {p.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-coral text-white text-[11px] font-bold shadow-sm">
                  {p.badge}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-heading font-bold text-lg text-ink">
                    {p.nameUz}
                  </h3>
                  {isPro && <Crown className="h-5 w-5 text-coral" />}
                </div>

                <div className="mb-4">
                  <div className="font-mono text-3xl font-black text-ink">
                    {Number(p.priceUzs).toLocaleString('uz-UZ')}{' '}
                    <span className="text-sm font-sans font-normal text-ink-muted">
                      soʻm
                    </span>
                  </div>
                  <div className="font-mono text-xs font-bold text-coral mt-1">
                    ⚡ {t.videoCredits(p.credits)}
                  </div>
                </div>

                <p className="text-xs text-ink-muted mb-6 leading-relaxed">
                  {p.description}
                </p>

                {/* Features List */}
                <ul className="space-y-2.5 text-xs text-ink mb-6 pt-4 border-t border-border">
                  {p.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <div className="h-4 w-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                      <span className="font-medium">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => onSelectPlan(p.id)}
                className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm tactile-btn transition-colors ${
                  isPro
                    ? 'bg-coral hover:bg-coral-hover text-white'
                    : 'bg-canvas hover:bg-ink hover:text-white text-ink border border-border'
                }`}
              >
                <span>{t.select}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

