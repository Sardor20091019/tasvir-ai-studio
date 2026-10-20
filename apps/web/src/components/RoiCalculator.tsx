'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  Clock,
  Coins,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface RoiCalculatorProps {
  locale: 'uz' | 'ru';
  onGetStarted: () => void;
  onOpenCheckout: () => void;
}

export function RoiCalculator({
  locale,
  onGetStarted,
  onOpenCheckout,
}: RoiCalculatorProps) {
  const [videoCount, setVideoCount] = useState(25);

  const traditionalCostPerVideo = 600000; // Tashkent media production studio rate
  const tasvirCostPerVideo = 12000; // Average per video on Tasvir Pro

  const totalTraditional = videoCount * traditionalCostPerVideo;
  const totalTasvir = videoCount * tasvirCostPerVideo;
  const totalSaved = totalTraditional - totalTasvir;
  const savingsPercent = Math.round((totalSaved / totalTraditional) * 100);

  const daysSaved = Math.round(videoCount * 1.5);

  const t = {
    uz: {
      badge: 'Foyda va Iqtisod Kalkulyatori',
      title: 'Toshkent media studiyalariga ortiqcha toʻlashni toʻxtating',
      subtitle:
        'Anʼanaviy video suratga olish xarajatlari bilan Tasvir AI avtomatlashtirilgan studiyasining taqqoslash hisob-kitobi.',
      sliderLabel: 'Oylik video reklamalar soni:',
      perMonth: 'ta video / oy',
      traditionalStudio: 'Oddiy Toshkent Studiyasi',
      tasvirStudio: 'Tasvir AI UGC Studiyasi',
      moneySavedTitle: 'Tejab qolinadigan mablagʻ:',
      timeSavedTitle: 'Tejab qolinadigan vaqt:',
      days: 'ish kuni',
      mins: 'atigi 25 daqiqa',
      ctaStart: 'Studiyani bepul sinab koʻrish',
      ctaPlan: 'Tarifni tanlash',
      featuresTraditional: [
        'Har bir video uchun 600,000+ soʻm',
        'Model va aktyor izlash (3-5 kun)',
        'Studiyani ijaraga olish toʻlovi',
        'Montaj va tahrirni haftalab kutish',
        'Kamera va yorugʻlik sozlamalari',
      ],
      featuresTasvir: [
        'Atigi 12,000 soʻm / video (98% arzon)',
        '4 ta Markaziy Osiyo AI boshlovchisi',
        '60 soniyada toʻliq tayyor 9:16 format',
        'Ssenariy va ovoz avtomatik yoziladi',
        'Uzum Market va Reels uchun mos',
      ],
    },
    ru: {
      badge: 'Калькулятор окупаемости ROI',
      title: 'Перестаньте переплачивать медиа-студиям в Ташкенте',
      subtitle:
        'Наглядное сравнение расходов на классическую видеосъемку и производство в AI-студии Tasvir.',
      sliderLabel: 'Количество видеороликов в месяц:',
      perMonth: 'видео / месяц',
      traditionalStudio: 'Обычная видеостудия',
      tasvirStudio: 'AI Студия Tasvir',
      moneySavedTitle: 'Сэкономленные средства:',
      timeSavedTitle: 'Сэкономленное время:',
      days: 'рабочих дней',
      mins: 'всего 25 минут',
      ctaStart: 'Попробовать бесплатно',
      ctaPlan: 'Выбрать тариф',
      featuresTraditional: [
        'От 600,000 сум за каждый ролик',
        'Поиск моделей и актеров (3-5 дней)',
        'Аренда локации и павильона',
        'Недели ожидания монтажа',
        'Сложное съемочное оборудование',
      ],
      featuresTasvir: [
        'Всего ~12,000 сум за видео (на 98% дешевле)',
        '4 ведущих из Центральной Азии',
        'Готовое 9:16 видео за 60 секунд',
        'AI текст и дикторская озвучка сразу',
        'Идеально для Uzum Market и Reels',
      ],
    },
  }[locale];

  return (
    <section className="bg-white rounded-studio border border-border p-6 sm:p-8 shadow-tactile my-8">
      {/* Header */}
      <div className="max-w-3xl mx-auto text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-bento-peach border border-coral/20 text-coral text-xs font-bold mb-3">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>{t.badge}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-ink tracking-tight mb-2">
          {t.title}
        </h2>
        <p className="text-sm text-ink-muted leading-relaxed">
          {t.subtitle}
        </p>
      </div>

      {/* Interactive Slider */}
      <div className="max-w-2xl mx-auto mb-10 bg-canvas p-6 rounded-2xl border border-border">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-bold text-ink">
            {t.sliderLabel}
          </label>
          <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-xl border border-border shadow-xs">
            <span className="font-mono text-lg font-black text-coral">
              {videoCount}
            </span>
            <span className="text-xs text-ink-muted font-medium">
              {t.perMonth}
            </span>
          </div>
        </div>

        <input
          type="range"
          min={5}
          max={100}
          step={5}
          value={videoCount}
          onChange={(e) => setVideoCount(Number(e.target.value))}
          className="w-full h-2.5 bg-border rounded-lg appearance-none cursor-pointer accent-coral"
        />

        <div className="flex justify-between text-[11px] font-mono text-ink-muted mt-2">
          <span>5 ta</span>
          <span>25 ta (Oʻrtacha doʻkon)</span>
          <span>50 ta (Top seller)</span>
          <span>100 ta (Agentlik)</span>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-10">
        {/* Traditional Studio */}
        <div className="rounded-2xl border border-red-200 bg-red-50/40 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                {t.traditionalStudio}
              </span>
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-black text-ink mb-1">
              {totalTraditional.toLocaleString('uz-UZ')}{' '}
              <span className="text-sm font-sans font-normal text-ink-muted">
                soʻm / oy
              </span>
            </div>
            <p className="text-xs text-ink-muted mb-4 font-mono">
              600,000 soʻm × {videoCount} ta video
            </p>

            <ul className="space-y-2.5 text-xs text-ink-muted pt-4 border-t border-red-200/60">
              {t.featuresTraditional.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-red-200/60 text-xs font-semibold text-red-700 flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>Kutish vaqti: ~{daysSaved} kun</span>
          </div>
        </div>

        {/* Tasvir AI Studio */}
        <div className="rounded-2xl border-2 border-coral bg-bento-peach p-6 flex flex-col justify-between shadow-tactile relative overflow-hidden">
          <div className="absolute top-3 right-3 bg-coral text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
            {savingsPercent}% Tejamkorlik
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="h-4 w-4 text-coral" />
              <span className="text-xs font-bold uppercase tracking-wider text-coral">
                {t.tasvirStudio}
              </span>
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-black text-coral mb-1">
              {totalTasvir.toLocaleString('uz-UZ')}{' '}
              <span className="text-sm font-sans font-normal text-ink-muted">
                soʻm / oy
              </span>
            </div>
            <p className="text-xs text-ink-muted mb-4 font-mono">
              ~12,000 soʻm × {videoCount} ta video
            </p>

            <ul className="space-y-2.5 text-xs text-ink font-medium pt-4 border-t border-coral/20">
              {t.featuresTasvir.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-coral/20 text-xs font-bold text-coral flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4" />
              <span>Tayyor boʻlish: {t.mins}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Savings Summary Bento */}
      <div className="max-w-3xl mx-auto rounded-2xl bg-bento-mint border border-emerald-500/30 p-6 text-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div>
            <span className="text-xs font-semibold text-emerald-800 block mb-1">
              {t.moneySavedTitle}
            </span>
            <div className="font-mono text-3xl sm:text-4xl font-black text-emerald-700">
              +{totalSaved.toLocaleString('uz-UZ')}{' '}
              <span className="text-sm font-sans font-bold">soʻm</span>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-emerald-800 block mb-1">
              {t.timeSavedTitle}
            </span>
            <div className="font-mono text-3xl sm:text-4xl font-black text-emerald-700">
              +{daysSaved}{' '}
              <span className="text-sm font-sans font-bold">{t.days}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onGetStarted}
            className="px-6 py-3 rounded-xl bg-coral hover:bg-coral-hover text-white text-xs font-bold shadow-tactile flex items-center gap-2 tactile-btn"
          >
            <span>{t.ctaStart}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={onOpenCheckout}
            className="px-6 py-3 rounded-xl bg-white border border-border text-ink hover:bg-canvas text-xs font-bold shadow-tactile flex items-center gap-2 tactile-btn"
          >
            <span>{t.ctaPlan}</span>
          </button>
        </div>
      </div>
    </section>
  );
}

