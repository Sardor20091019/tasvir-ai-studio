'use client';

import React, { useState } from 'react';
import {
  X,
  CreditCard,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PlanConfig, User } from '../types';
import { api, fallbackPlans } from '../lib/api';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUpdateUser: (user: User) => void;
  locale: 'uz' | 'ru';
  initialPlanId?: string;
}

export function CheckoutModal({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  locale,
  initialPlanId = 'shop_pro',
}: CheckoutModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId);
  const [selectedProvider, setSelectedProvider] = useState<'payme' | 'click' | 'uzum'>('payme');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '+998901234567');
  const [isLoading, setIsLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [addedCredits, setAddedCredits] = useState(0);

  if (!isOpen) return null;

  const plans = fallbackPlans;
  const currentPlan = plans.find((p) => p.id === selectedPlanId) || plans[1];

  const t = {
    uz: {
      title: 'Hisobni toʻldirish & Tariflar',
      sub: 'Payme, Click yoki Uzum Bank orqali xavfsiz va bir zumda toʻlov',
      choosePlan: '1. Tarif rejasini tanlang',
      chooseProvider: '2. Toʻlov tizimini tanlang',
      phoneLabel: 'Telefon raqamingiz (SMS chek uchun):',
      payNow: `Toʻlash: ${Number(currentPlan.priceUzs).toLocaleString('uz-UZ')} soʻm`,
      testCheckoutBtn: '⚡ Test rejimida bir zumda faollashtirish',
      processing: 'Toʻlov amalga oshirilmoqda...',
      successTitle: 'Toʻlov muvaffaqiyatli qabul qilindi!',
      successSub: (credits: number) => `Hisobingizga ${credits} ta video krediti qoʻshildi!`,
      close: 'Studiyaga qaytish',
      secureGuaranteed: '256-bit SSL xavfsizlik va bank kafolati',
    },
    ru: {
      title: 'Пополнение баланса и Тарифы',
      sub: 'Безопасная мгновенная оплата через Payme, Click или Uzum Bank',
      choosePlan: '1. Выберите тарифный план',
      chooseProvider: '2. Выберите платежную систему',
      phoneLabel: 'Номер телефона (для SMS чека):',
      payNow: `Оплатить: ${Number(currentPlan.priceUzs).toLocaleString('uz-UZ')} сум`,
      testCheckoutBtn: '⚡ Мгновенная активация (Тестовый режим)',
      processing: 'Обработка платежа...',
      successTitle: 'Оплата успешно завершена!',
      successSub: (credits: number) => `На ваш баланс начислено ${credits} видео-кредитов!`,
      close: 'Вернуться в студию',
      secureGuaranteed: '256-bit SSL защита и гарантия платежа',
    },
  }[locale];

  // Handle instant test payment
  const handleConfirmPayment = async () => {
    setIsLoading(true);
    try {
      // 1. Create checkout
      const checkoutRes = await api.createCheckout({
        userId: user?.id || 'demo-user-1',
        planTier: currentPlan.id,
        provider: selectedProvider,
        phoneNumber,
      });

      // 2. Immediately confirm payment in local demo mode
      const confirmRes = await api.confirmTestPayment(checkoutRes.transactionId);

      // Update user credits
      if (user) {
        const newBalance = user.credits_balance + currentPlan.credits;
        const updated = {
          ...user,
          credits_balance: confirmRes.newCreditsBalance || newBalance,
          plan_tier: currentPlan.id,
        };
        onUpdateUser(updated);
      }

      setAddedCredits(currentPlan.credits);
      setPaymentSuccess(true);

      // Confetti burst
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
        });
      } catch (e) {}
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-white border border-border shadow-2xl p-6 sm:p-7 max-h-[92vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 h-8 w-8 rounded-full border border-border bg-canvas hover:bg-white flex items-center justify-center text-ink-muted hover:text-ink transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {paymentSuccess ? (
          /* Payment Success Screen */
          <div className="text-center py-8 space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h3 className="text-xl font-heading font-extrabold text-ink">
              {t.successTitle}
            </h3>
            <p className="text-sm text-ink-muted max-w-sm mx-auto">
              {t.successSub(addedCredits)}
            </p>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-bento-mint text-emerald-800 text-xs font-mono font-bold border border-emerald-500/20">
              <Zap className="h-4 w-4 text-emerald-600" />
              <span>Yangi balans: {(user?.credits_balance ?? 3) + addedCredits} ta video</span>
            </div>

            <div className="pt-4">
              <button
                onClick={() => {
                  setPaymentSuccess(false);
                  onClose();
                }}
                className="w-full py-3 px-6 rounded-xl bg-coral hover:bg-coral-hover text-white text-sm font-bold shadow-tactile tactile-btn"
              >
                {t.close}
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Form */
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-bento-peach text-coral text-[11px] font-bold mb-2">
                <CreditCard className="h-3 w-3" />
                <span>UZCARD / HUMO / VISA</span>
              </div>
              <h2 className="text-xl font-heading font-extrabold text-ink tracking-tight">
                {t.title}
              </h2>
              <p className="text-xs text-ink-muted">{t.sub}</p>
            </div>

            {/* 1. Plan Tier Cards */}
            <div>
              <label className="text-xs font-bold text-ink mb-2.5 block">
                {t.choosePlan}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {plans.map((p) => {
                  const isSelected = selectedPlanId === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlanId(p.id)}
                      className={`relative p-3.5 rounded-xl border cursor-pointer transition-all tactile-btn ${
                        isSelected
                          ? 'border-coral bg-bento-peach ring-2 ring-coral/40 shadow-sm'
                          : 'border-border bg-canvas hover:bg-white'
                      }`}
                    >
                      {p.badge && (
                        <span className="absolute -top-2.5 right-2 px-2 py-0.2 rounded-full bg-coral text-white text-[9px] font-bold">
                          {p.badge}
                        </span>
                      )}
                      <div className="font-bold text-xs text-ink">{p.nameUz}</div>
                      <div className="font-mono text-sm font-extrabold text-coral mt-1">
                        {Number(p.priceUzs).toLocaleString('uz-UZ')} soʻm
                      </div>
                      <div className="font-mono text-[11px] text-ink-muted font-semibold mt-0.5">
                        ⚡ {p.credits} ta video
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Payment Providers (Payme, Click, Uzum) */}
            <div>
              <label className="text-xs font-bold text-ink mb-2.5 block">
                {t.chooseProvider}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {/* Payme */}
                <button
                  type="button"
                  onClick={() => setSelectedProvider('payme')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all tactile-btn ${
                    selectedProvider === 'payme'
                      ? 'border-[#00CCCC] bg-[#E6FFFF] ring-2 ring-[#00CCCC]/30'
                      : 'border-border bg-canvas hover:bg-white'
                  }`}
                >
                  <span className="font-black text-sm text-[#00A3A3] tracking-tighter">
                    payme
                  </span>
                  <span className="text-[10px] text-ink-muted mt-0.5 font-medium">
                    Karta orqali
                  </span>
                </button>

                {/* Click */}
                <button
                  type="button"
                  onClick={() => setSelectedProvider('click')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all tactile-btn ${
                    selectedProvider === 'click'
                      ? 'border-[#0073FF] bg-[#EDF5FF] ring-2 ring-[#0073FF]/30'
                      : 'border-border bg-canvas hover:bg-white'
                  }`}
                >
                  <span className="font-black text-sm text-[#0066E6] tracking-tighter flex items-center gap-0.5">
                    CLICK
                    <span className="text-amber-500 font-black">⚡</span>
                  </span>
                  <span className="text-[10px] text-ink-muted mt-0.5 font-medium">
                    Click Up / Pay
                  </span>
                </button>

                {/* Uzum Bank */}
                <button
                  type="button"
                  onClick={() => setSelectedProvider('uzum')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all tactile-btn ${
                    selectedProvider === 'uzum'
                      ? 'border-[#7000FF] bg-[#F5EDFF] ring-2 ring-[#7000FF]/30'
                      : 'border-border bg-canvas hover:bg-white'
                  }`}
                >
                  <span className="font-black text-sm text-[#7000FF] tracking-tighter">
                    uzum bank
                  </span>
                  <span className="text-[10px] text-ink-muted mt-0.5 font-medium">
                    Uzum Nasiya
                  </span>
                </button>
              </div>
            </div>

            {/* 3. Phone Input */}
            <div>
              <label className="text-xs font-semibold text-ink-muted block mb-1">
                {t.phoneLabel}
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+998 90 123 45 67"
                className="w-full font-mono text-xs font-semibold px-3 py-2.5 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
              />
            </div>

            {/* Actions */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleConfirmPayment}
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-coral hover:bg-coral-hover text-white text-xs sm:text-sm font-heading font-bold shadow-tactile flex items-center justify-center gap-2 tactile-btn"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t.processing}</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>{t.payNow}</span>
                  </>
                )}
              </button>

              <button
                onClick={handleConfirmPayment}
                disabled={isLoading}
                className="w-full py-2.5 px-3 rounded-xl bg-bento-peach border border-coral/30 hover:bg-coral-light text-coral text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors tactile-btn"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{t.testCheckoutBtn}</span>
              </button>
            </div>

            {/* Security Note */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-ink-muted">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>{t.secureGuaranteed}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

