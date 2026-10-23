'use client';

import React from 'react';
import {
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  Coins,
  Crown,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { PlanConfig, LocaleType } from '../types';
import { fallbackPlans } from '../lib/api';

interface PricingSectionProps {
  locale: LocaleType;
  onSelectPlan: (planId: string) => void;
}

export function PricingSection({
  locale,
  onSelectPlan,
}: PricingSectionProps) {
  const plans = fallbackPlans;

  const t = {
    uz: {
      badge: 'Xavfsiz Token Tizimi',
      title: 'Uzum va Reels savdolaringiz uchun video tokenlari',
      sub: 'Avtomatik toʻlovlar oʻrniga xavfsiz administrator orqali token berish tizimi. Soʻrov yuboring yoki Telegram orqali administrator bilan bogʻlaning.',
      select: 'Admindan soʻrash',
      bestSeller: 'Eng ommabop',
      videoCredits: (count: number) => `${count} ta video tokeni`,
      secTitle: 'Toʻlov shlyuzlari oʻrniga xavfsiz admin tasdiqlash tizimi',
      secDesc: 'Hisobingizga token olish uchun kerakli tarifni tanlab adminga soʻrov yuboring. Administrator soʻrovingizni tekshirib, hisobingizga darhol tokenlarni qoʻshib beradi.',
    },
    en: {
      badge: 'Secure Token System',
      title: 'Video tokens for your Uzum and Reels marketing',
      sub: 'Instead of automated payment gateways, tokens are allocated securely through platform administrator. Submit a request or contact admin via Telegram.',
      select: 'Request from admin',
      bestSeller: 'Most Popular',
      videoCredits: (count: number) => `${count} video tokens`,
      secTitle: 'Secure admin verification system instead of third-party payment gateways',
      secDesc: 'To receive video tokens on your balance, choose a plan and submit a request to the platform administrator.',
    },
    ru: {
      badge: 'Безопасная система токенов',
      title: 'Пакеты видео-токенов для Uzum и Reels',
      sub: 'Вместо автоматических платежных систем токены выдаются напрямую через администратора платформы.',
      select: 'Запросить у админа',
      bestSeller: 'Популярный',
      videoCredits: (count: number) => `${count} видео токенов`,
      secTitle: 'Безопасная выдача токенов через администратора',
      secDesc: 'Для начисления токенов выберите нужный пакет и отправьте запрос. Администратор проверит заявку и начислит токены на ваш баланс.',
    },
  }[locale] || {
    badge: 'Secure Token System',
    title: 'Video tokens for your marketing',
    sub: 'Tokens are allocated securely through platform administrator.',
    select: 'Request from admin',
    bestSeller: 'Popular',
    videoCredits: (count: number) => `${count} video tokens`,
    secTitle: 'Secure admin verification',
    secDesc: 'Choose a plan and submit a request to the platform administrator.',
  };

  return (
    <div className="space-y-8 my-6">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-3 shadow-xs">
          <ShieldCheck className="h-3.5 w-3.5" />
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
                  : 'bg-surface border border-border shadow-tactile hover:shadow-tactile-md'
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
                  <div className="font-mono text-xs font-bold text-coral mt-1 flex items-center gap-1">
                    <Coins className="h-3.5 w-3.5" />
                    <span>{t.videoCredits(p.credits)}</span>
                  </div>
                </div>

                <p className="text-xs text-ink-muted mb-6 leading-relaxed">
                  {p.description}
                </p>

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
                <Coins className="h-4 w-4" />
                <span>{t.select}</span>
                <ArrowRight className="h-4 w-4 ml-auto" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="max-w-3xl mx-auto rounded-2xl bg-canvas border border-border p-4 sm:p-5 flex items-start gap-3.5 shadow-xs">
        <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
          <Lock className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-heading font-bold text-xs sm:text-sm text-ink mb-1">
            {t.secTitle}
          </h4>
          <p className="text-xs text-ink-muted leading-relaxed">
            {t.secDesc}
          </p>
        </div>
      </div>
    </div>
  );
}

