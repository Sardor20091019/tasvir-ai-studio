'use client';

import React from 'react';
import {
  Sparkles,
  Layers,
  ArrowRight,
  ShoppingBag,
  Flame,
  Star,
  Zap,
} from 'lucide-react';

export interface TemplateItem {
  id: string;
  titleUz: string;
  titleRu: string;
  category: string;
  priceUzs: number;
  discountBadge: string;
  imageUrl: string;
  tone: 'discount_hook' | 'quality_review' | 'short_reels';
  platform: string;
    scriptExcerptUz: string;
  scriptExcerptRu: string;
}

export const TEMPLATES: TemplateItem[] = [
  {
    id: 'uzum-sneakers',
    titleUz: 'Nike Air Zoom Pegasus 40 — Uzum Super Chegirma',
    titleRu: 'Nike Air Zoom Pegasus 40 — Супер скидка на Uzum',
    category: 'Kiyim va Poyabzal',
    priceUzs: 450000,
    discountBadge: '-35% Chegirma',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    tone: 'discount_hook',
    platform: 'uzum_9_16',
    scriptExcerptUz: 'Salom! Uzum Marketda ulgurib qoling! Mashhur krossovkalar atigi 450,000 soʻm...',
    scriptExcerptRu: 'Привет! Успейте заказать на Uzum Market кроссовки всего за 450,000 сум...',
  },
  {
    id: 'atlas-dress',
    titleUz: 'Milliy Atlas Xonatlas Koʻylagi — Samarqand Kolleksiyasi',
    titleRu: 'Платье из Хан-атласа — Коллекция Самарканд',
    category: 'Milliy Liboslar',
    priceUzs: 320000,
    discountBadge: 'Bestseller Uzum',
    imageUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80',
    tone: 'quality_review',
    platform: 'uzum_9_16',
    scriptExcerptUz: 'Assalomu alaykum! Xonatlas liboslarimiz yangi partiyasi yetib keldi...',
    scriptExcerptRu: 'Здравствуйте! Новая коллекция традиционных платьев из шелкового атласа...',
  },
  {
    id: 'smart-watch',
    titleUz: 'Smart Watch Ultra 8 AMOLED — 1+1 Sovgʻa',
    titleRu: 'Smart Watch Ultra 8 AMOLED — Подарок 1+1',
    category: 'Elektronika',
    priceUzs: 290000,
    discountBadge: '1+1 Sovgʻa',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    tone: 'short_reels',
    platform: 'instagram_reels',
    scriptExcerptUz: 'Tezda koʻring! Trenddagi Ultra aqlli soat atigi 290,000 soʻm va naushnik sovgʻa!',
    scriptExcerptRu: 'Смотрите! Трендовые смарт-часы Ultra всего 290,000 сум с подарком!',
  },
  {
    id: 'parfume',
    titleUz: 'Samarqand Oq Mushk Parfyum 50ml — Sharh va Tavsiya',
    titleRu: 'Белый мускус Самарканд 50мл — Честный отзыв',
    category: "Go'zallik va Parvarish",
    priceUzs: 550000,
    discountBadge: '-20% Maxsus Taklif',
    imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
    tone: 'quality_review',
    platform: 'telegram_ad',
    scriptExcerptUz: 'Xushboʻy ifori 48 soat saqlanib qoluvchi oq mushk parfyumi haqida...',
    scriptExcerptRu: 'Стойкий аромат белого мускуса, который держится до 48 часов...',
  },
  {
    id: 'airfryer',
    titleUz: 'Aqlli Oshxona Aerogril 6L — Yogʻsiz Pishirish',
    titleRu: 'Умный Аэрогриль 6L — Готовка без масла',
    category: "Uy-ro'zg'or",
    priceUzs: 620000,
    discountBadge: 'Bepul Yetkazish',
    imageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80',
    tone: 'discount_hook',
    platform: 'uzum_9_16',
    scriptExcerptUz: 'Oshxonangiz uchun eng kerakli yordamchi — endi bepul yetkazib berish bilan!',
    scriptExcerptRu: 'Незаменимый помощник на кухне с бесплатной доставкой за 1 день!',
  },
  {
    id: 'baby-stroller',
    titleUz: 'Zamonaviy Yengil Bolalar Aravachasi (Transformator)',
    titleRu: 'Легкая детская коляска-трансформер',
    category: 'Bolalar Dunyosi',
    priceUzs: 890000,
    discountBadge: 'Kafolat 1 yil',
    imageUrl: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80',
    tone: 'quality_review',
    platform: 'instagram_reels',
    scriptExcerptUz: 'Onajonlar uchun eng qulay va yengil aravacha bilan tanishing...',
    scriptExcerptRu: 'Самая легкая и маневренная коляска для удобных прогулок с малышом...',
  },
];

import { LocaleType } from '../types';

interface TemplatesGalleryProps {
  locale: LocaleType;
  onSelectTemplate: (template: TemplateItem) => void;
}

export function TemplatesGallery({
  locale,
  onSelectTemplate,
}: TemplatesGalleryProps) {
  const t = {
    uz: {
      badge: 'Tayyor Shablonlar Kolleksiyasi',
      title: 'Uzum Market va Reels uchun tasdiqlangan ssenariylar',
      sub: 'Eng koʻp sotilgan tovarlar asosida tayyorlangan 9:16 video qoliplar. Bitta tugma orqali yarating.',
      useBtn: 'AI Studio da ochish',
    },
    en: {
      badge: 'Curated Template Collection',
      title: 'Proven viral ad scripts for Uzum Market and Reels',
      sub: 'High-converting 9:16 video templates based on top-selling e-commerce items. Load into AI Studio with one click.',
      useBtn: 'Open in AI Studio',
    },
    ru: {
      badge: 'Коллекция готовых шаблонов',
      title: 'Проверенные сценарии для Uzum Market и Reels',
      sub: 'Готовые 9:16 видео-шаблоны для топовых категорий e-commerce. Загрузка в AI Studio в один клик.',
      useBtn: 'Открыть в AI Studio',
    },
  }[locale] || {
    badge: 'Template Collection',
    title: 'Ad scripts for Uzum Market and Reels',
    sub: 'High-converting 9:16 video templates. Load into AI Studio with one click.',
    useBtn: 'Open in AI Studio',
  };

  return (
    <div className="space-y-6">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-bento-mint border border-emerald-500/20 text-emerald-800 text-xs font-bold mb-3">
          <Layers className="h-3.5 w-3.5 text-emerald-600" />
          <span>{t.badge}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-ink tracking-tight mb-2">
          {t.title}
        </h2>
        <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
          {t.sub}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TEMPLATES.map((tmpl) => (
          <div
            key={tmpl.id}
            className="group rounded-2xl bg-surface border border-border overflow-hidden shadow-tactile hover:shadow-tactile-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-canvas">
                <img
                  src={tmpl.imageUrl}
                  alt={tmpl.titleUz}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-ink/75 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-md">
                  {tmpl.category}
                </div>
                <div className="absolute top-3 right-3 bg-coral text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {tmpl.discountBadge}
                </div>
              </div>

              <div className="p-4 space-y-2">
                <h3 className="font-bold text-sm text-ink line-clamp-1">
                  {locale === 'ru' ? tmpl.titleRu : tmpl.titleUz}
                </h3>
                <div className="font-mono text-xs font-extrabold text-coral">
                  {Number(tmpl.priceUzs).toLocaleString('uz-UZ')} {locale === 'en' ? 'UZS' : 'soʻm'}
                </div>
                <p className="text-xs text-ink-muted line-clamp-2 italic bg-canvas p-2.5 rounded-xl border border-border/70">
                  &ldquo;{locale === 'ru' ? tmpl.scriptExcerptRu : tmpl.scriptExcerptUz}&rdquo;
                </p>
              </div>
            </div>

            <div className="p-4 pt-0">
              <button
                onClick={() => onSelectTemplate(tmpl)}
                className="w-full py-2.5 px-3 rounded-xl bg-canvas hover:bg-bento-peach border border-border hover:border-coral text-ink hover:text-coral text-xs font-bold flex items-center justify-center gap-1.5 transition-colors tactile-btn"
              >
                <span>{t.useBtn}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

