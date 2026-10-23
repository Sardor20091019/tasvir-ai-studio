'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Download,
  Share2,
  Eye,
  Sliders,
  Flame,
  Star,
  Zap,
  ShoppingBag,
  ExternalLink,
  Send,
  Smartphone,
  ChevronRight,
  Camera,
  Layers,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AiAvatar, Product, User, LocaleType, VideoJob } from '../types';
import { api, fallbackAvatars, fallbackProducts } from '../lib/api';
import { SpeechSynthPlayer } from '../lib/audio';

interface StudioProps {
  user: User | null;
  onUpdateUser: (user: User) => void;
  locale: LocaleType;
  onOpenCheckout: () => void;
  onOpenAuth?: () => void;
  onJobCreated?: (job: VideoJob) => void;
  initialTemplate?: {
    productTitle: string;
    category: string;
    priceUzs: number;
    discountBadge: string;
    imageUrl: string;
    tone: 'discount_hook' | 'quality_review' | 'short_reels';
    platform: string;
    avatarSlug?: string;
  } | null;
}

export function Studio({
  user,
  onUpdateUser,
  locale,
  onOpenCheckout,
  onOpenAuth,
  onJobCreated,
  initialTemplate,
}: StudioProps) {
  const t = {
    uz: {
      step1Title: '1. Mahsulot maʼlumotlari',
      step1Sub: 'Rasm yuklang yoki tayyor namunalardan birini tanlang',
      dropzoneText: 'Rasm yuklash uchun bosing yoki shu yerga tashlang',
      dropzoneSub: 'PNG, JPG, WebP formatlar (Uzum yoki Instagram rasmlari)',
      productName: 'Mahsulot nomi',
      category: 'Kategoriya',
      price: 'Narxi (soʻmda)',
      discount: 'Chegirma nishoni',
      demoProducts: '⚡ Tezkor namunalar (1-bosishda):',
      step2Title: '2. Mahalliy AI Boshlovchi',
      step2Sub: 'Markaziy Osiyo yuzlari va milliy shevalardagi professional diktorlar',
      step3Title: '3. AI Ssenariy va Ovoz',
      step3Sub: 'Uzum va Reels uchun xaridorgir reklama matnini avtomatik yozish',
      scriptPlaceholder: 'Reklama matni shu yerda shakllanadi...',
      listenVoice: 'Ovozni eshitish',
      listening: 'Ovoz ijro etilmoqda...',
      stopVoice: 'Toʻxtatish',
      toneDiscount: '🔥 Chegirma urgʻusi',
      toneQuality: '✨ Sifat va sharh',
      toneReels: '⚡ Qisqa Reels',
      step4Title: '4. Format va Render',
      platformUzum: 'Uzum Market (9:16)',
      platformReels: 'Instagram Reels (9:16)',
      platformTelegram: 'Telegram Doʻkon (9:16)',
      renderBtn: '✨ 9:16 Video Yaratish (1 kredit)',
      rendering: 'Video tayyorlanmoqda...',
      noCredits: 'Kreditlar tugadi. Admindan token soʻrang',
      recharge: 'Admindan token soʻrash',
      previewTitle: 'Jonli 9:16 Smartfon Koʻrinishi',
      previewSub: 'Reklama roligi qanday koʻrinishda chiqishi',
      pipToggle: 'Boshlovchi oynasi (PiP)',
      stage1: '1. Rasm tahlili',
      stage2: '2. Ovoz sintezi',
      stage3: '3. Lip-sync animatsiya',
      stage4: '4. Video tayyor!',
      downloadVideo: 'Videoni yuklab olish (MP4)',
      shareTelegram: 'Telegramga yuborish',
      characters: 'belgi',
      words: 'soʻz',
      durationEst: '~15 soniya',
      errorOccurred: 'Video yaratishda xatolik yuz berdi. Iltimos, qayta urinib koʻring.',
      tryAgain: 'Qayta urinish',
    },
    en: {
      step1Title: '1. Product Information',
      step1Sub: 'Upload a product image or select a ready template',
      dropzoneText: 'Click to upload or drag & drop image here',
      dropzoneSub: 'PNG, JPG, WebP formats (Uzum or Instagram product photos)',
      productName: 'Product name',
      category: 'Category',
      price: 'Price (UZS)',
      discount: 'Discount badge',
      demoProducts: '⚡ Quick demo items (1-click):',
      step2Title: '2. Local AI Presenter',
      step2Sub: 'Central Asian faces and native dialect voice presenters',
      step3Title: '3. AI Script & Voice',
      step3Sub: 'Automatic high-converting sales copywriting for Uzum and Reels',
      scriptPlaceholder: 'Generated ad copywriting will appear here...',
      listenVoice: 'Preview voice',
      listening: 'Playing voice...',
      stopVoice: 'Stop',
      toneDiscount: '🔥 Discount Hook',
      toneQuality: '✨ Quality & Review',
      toneReels: '⚡ Short Reels',
      step4Title: '4. Format & Render',
      platformUzum: 'Uzum Market (9:16)',
      platformReels: 'Instagram Reels (9:16)',
      platformTelegram: 'Telegram Shop (9:16)',
      renderBtn: '✨ Create 9:16 Video (1 credit)',
      rendering: 'Rendering video...',
      noCredits: 'Out of credits. Request tokens from admin',
      recharge: 'Request tokens from admin',
      previewTitle: 'Live 9:16 Smartphone Preview',
      previewSub: 'Accurate preview of the finalized video advertisement',
      pipToggle: 'Presenter overlay (PiP)',
      stage1: '1. Image analysis',
      stage2: '2. Voice synthesis',
      stage3: '3. Lip-sync animation',
      stage4: '4. Video ready!',
      downloadVideo: 'Download video (MP4)',
      shareTelegram: 'Share to Telegram',
      characters: 'chars',
      words: 'words',
      durationEst: '~15 seconds',
      errorOccurred: 'An error occurred while creating the video. Please try again.',
      tryAgain: 'Try again',
    },
    ru: {
      step1Title: '1. Информация о товаре',
      step1Sub: 'Загрузите фото или выберите готовый образец',
      dropzoneText: 'Нажмите для загрузки или перетащите фото сюда',
      dropzoneSub: 'Форматы PNG, JPG, WebP (фото для Uzum или Instagram)',
      productName: 'Название товара',
      category: 'Категория',
      price: 'Цена (в сумах)',
      discount: 'Бейдж скидки',
      demoProducts: '⚡ Быстрые образцы (в 1 клик):',
      step2Title: '2. Локальный AI Ведущий',
      step2Sub: 'Лица Центральной Азии и дикторы на родных диалектах',
      step3Title: '3. AI Сценарий и Озвучка',
      step3Sub: 'Автоматическое создание продающего текста для Uzum и Reels',
      scriptPlaceholder: 'Текст рекламного ролика формируется здесь...',
      listenVoice: 'Прослушать голос',
      listening: 'Идет воспроизведение...',
      stopVoice: 'Остановить',
      toneDiscount: '🔥 Акцент на скидку',
      toneQuality: '✨ Качество и отзыв',
      toneReels: '⚡ Короткий Reels',
      step4Title: '4. Формат и Рендер',
      platformUzum: 'Uzum Market (9:16)',
      platformReels: 'Instagram Reels (9:16)',
      platformTelegram: 'Telegram Магазин (9:16)',
      renderBtn: '✨ Создать 9:16 видео (1 кредит)',
      rendering: 'Идет рендеринг видео...',
      noCredits: 'Закончились кредиты. Запросите токены у админа',
      recharge: 'Запросить токены',
      previewTitle: 'Живой 9:16 просмотр на смартфоне',
      previewSub: 'Точный вид готового рекламного видео',
      pipToggle: 'Окно ведущего (PiP)',
      stage1: '1. Анализ фото',
      stage2: '2. Синтез голоса',
      stage3: '3. Lip-sync анимация',
      stage4: '4. Видео готово!',
      downloadVideo: 'Скачать видео (MP4)',
      shareTelegram: 'Отправить в Telegram',
      characters: 'симв.',
      words: 'слов',
      durationEst: '~15 секунд',
      errorOccurred: 'Произошла ошибка при создании видео. Пожалуйста, попробуйте снова.',
      tryAgain: 'Попробовать снова',
    },
  }[locale] || {
    step1Title: '1. Product Information',
    step1Sub: 'Upload a product image or select a ready template',
    dropzoneText: 'Click to upload or drag & drop image here',
    dropzoneSub: 'PNG, JPG, WebP formats',
    productName: 'Product name',
    category: 'Category',
    price: 'Price (UZS)',
    discount: 'Discount badge',
    demoProducts: '⚡ Quick demo items:',
    step2Title: '2. Local AI Presenter',
    step2Sub: 'Central Asian faces and native dialect voice presenters',
    step3Title: '3. AI Script & Voice',
    step3Sub: 'Automatic high-converting sales copywriting',
    scriptPlaceholder: 'Generated ad copywriting will appear here...',
    listenVoice: 'Preview voice',
    listening: 'Playing voice...',
    stopVoice: 'Stop',
    toneDiscount: '🔥 Discount Hook',
    toneQuality: '✨ Quality & Review',
    toneReels: '⚡ Short Reels',
    step4Title: '4. Format & Render',
    platformUzum: 'Uzum Market (9:16)',
    platformReels: 'Instagram Reels (9:16)',
    platformTelegram: 'Telegram Shop (9:16)',
    renderBtn: '✨ Create 9:16 Video (1 credit)',
    rendering: 'Rendering video...',
    noCredits: 'Out of credits. Request tokens from admin',
    recharge: 'Request tokens from admin',
    previewTitle: 'Live 9:16 Smartphone Preview',
    previewSub: 'Accurate preview of the finalized video',
    pipToggle: 'Presenter overlay (PiP)',
    stage1: '1. Image analysis',
    stage2: '2. Voice synthesis',
    stage3: '3. Lip-sync animation',
    stage4: '4. Video ready!',
    downloadVideo: 'Download video (MP4)',
    shareTelegram: 'Share to Telegram',
    characters: 'chars',
    words: 'words',
    durationEst: '~15 seconds',
    errorOccurred: 'An error occurred while creating the video. Please try again.',
    tryAgain: 'Try again',
  };

  const [avatars, setAvatars] = useState<AiAvatar[]>(fallbackAvatars);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(fallbackAvatars[0].id);

  const [productTitle, setProductTitle] = useState('Nike Air Zoom Pegasus 40');
  const [productCategory, setProductCategory] = useState('Kiyim va Poyabzal');
  const [productPrice, setProductPrice] = useState(450000);
  const [productDiscount, setProductDiscount] = useState('-35% Chegirma');
  const [productImage, setProductImage] = useState(
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
  );

  const [scriptTone, setScriptTone] = useState<'discount_hook' | 'quality_review' | 'short_reels'>('discount_hook');
  const [scriptText, setScriptText] = useState(
    "Salom! Uzum Marketda ulgurib qoling! Aynan bugun mashhur \"Nike Air Zoom\" atigi 450,000 so'm bo'lib turibdi. Sifati a'lo darajada, yetkazib berish esa 1 kunda bepul! Buyurtma berish uchun quyidagi havolani bosing va 30% chegirmadan foydalaning!",
  );
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  const [platformPreset, setPlatformPreset] = useState<'uzum_9_16' | 'instagram_reels' | 'telegram_ad'>('uzum_9_16');

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [waveformBars, setWaveformBars] = useState<number[]>([30, 45, 60, 35, 75, 50, 40, 65, 80, 55, 30, 70, 45, 60, 35, 25]);
  const [showPip, setShowPip] = useState(true);
  const [isPlayingPreview, setIsPlayingPreview] = useState(true);
  const [karaokeIndex, setKaraokeIndex] = useState(0);

  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStage, setRenderStage] = useState<1 | 2 | 3 | 4>(1);
  const [renderedVideoUrl, setRenderedVideoUrl] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const synthPlayerRef = useRef<SpeechSynthPlayer>(new SpeechSynthPlayer());

  useEffect(() => {
    api.getAvatars().then((res) => {
      if (res && res.length > 0) {
        setAvatars(res);
        if (!selectedAvatarId) {
          setSelectedAvatarId(res[0].id);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (initialTemplate) {
      setProductTitle(initialTemplate.productTitle);
      setProductCategory(initialTemplate.category);
      setProductPrice(initialTemplate.priceUzs);
      setProductDiscount(initialTemplate.discountBadge);
      setProductImage(initialTemplate.imageUrl);
      setScriptTone(initialTemplate.tone);
      if (initialTemplate.avatarSlug) {
        const found = avatars.find((a) => a.slug === initialTemplate.avatarSlug);
        if (found) setSelectedAvatarId(found.id);
      }
      handleRewriteScript(initialTemplate.tone, initialTemplate.productTitle, initialTemplate.priceUzs);
    }
  }, [initialTemplate]);

  const scriptWords = scriptText.split(' ').filter(Boolean);
  useEffect(() => {
    if (!isPlayingPreview) return;
    const interval = setInterval(() => {
      setKaraokeIndex((prev) => (prev + 1) % (scriptWords.length || 1));
    }, 450);
    return () => clearInterval(interval);
  }, [isPlayingPreview, scriptWords.length]);

  const selectedAvatar = avatars.find((a) => a.id === selectedAvatarId) || avatars[0];

  const handleSelectDemoProduct = (p: Product) => {
    setProductTitle(p.title);
    setProductCategory(p.category);
    setProductPrice(Number(p.price_uzs));
    setProductDiscount(p.discount_badge || '-30% Chegirma');
    setProductImage(p.image_url);
    handleRewriteScript(scriptTone, p.title, Number(p.price_uzs));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setProductImage(uploadEvent.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRewriteScript = async (
    tone: 'discount_hook' | 'quality_review' | 'short_reels',
    title = productTitle,
    price = productPrice,
  ) => {
    setScriptTone(tone);
    setIsGeneratingScript(true);
    try {
      const res = await api.generateScript({
        productTitle: title,
        category: productCategory,
        priceUzs: price,
        tone,
        dialect: selectedAvatar?.language_code,
      });
      if (res?.scriptText) {
        setScriptText(res.scriptText);
      }
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleToggleVoicePreview = () => {
    if (isPlayingAudio) {
      synthPlayerRef.current.stop();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      synthPlayerRef.current.playSyntheticVoice(
        scriptText,
        selectedAvatar?.slug || 'malika',
        (bars) => setWaveformBars(bars),
        () => setIsPlayingAudio(false),
      );
    }
  };

  const handleStartRender = async () => {
    if (!user) {
      const authMsg =
        locale === 'en'
          ? 'You must have an account to generate videos. Please sign in with Google first.'
          : locale === 'ru'
          ? 'Для создания видео необходимо войти в аккаунт. Пожалуйста, авторизуйтесь через Google.'
          : 'Video yaratish uchun avval hisobingizga kiring. Iltimos, Google orqali kiring.';
      setRenderError(authMsg);
      onOpenAuth?.();
      return;
    }

    if (user.credits_balance <= 0) {
      onOpenCheckout();
      return;
    }

    setRenderError(null);
    setIsRendering(true);
    setRenderProgress(10);
    setRenderStage(1);
    setRenderedVideoUrl(null);

    const updatedUser = {
      ...user,
      credits_balance: Math.max(0, user.credits_balance - 1),
    };
    onUpdateUser(updatedUser);

    try {
      const job = await api.renderVideoJob({
        userId: user.id,
        productId: 'demo-prod',
        avatarId: selectedAvatarId,
        platformPreset,
        scriptTone,
        scriptText,
      });

      if (onJobCreated) {
        onJobCreated(job);
      }

      setTimeout(() => {
        setRenderProgress(35);
        setRenderStage(2);
      }, 1600);

      setTimeout(() => {
        setRenderProgress(70);
        setRenderStage(3);
      }, 3400);

      setTimeout(() => {
        setRenderProgress(100);
        setRenderStage(4);
        setIsRendering(false);
        setRenderedVideoUrl(
          'https://n6ogfqlb21.ufs.sh/f/e4WrEcObdaG3xQRkL5D1FbQuz7SaXsDfAioc3JZvk59ORCG4',
        );

        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (e) {}
      }, 5200);
    } catch (e: any) {
      console.error('Studio render video error:', e);
      setIsRendering(false);
      setRenderError(e?.message || t.errorOccurred || 'Error occurred while creating video. Please try again.');
      if (user) {
        onUpdateUser(user);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-7 space-y-6">
        <section className="bg-surface rounded-studio border border-border p-5 sm:p-6 shadow-tactile transition-all hover:shadow-tactile-md">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-bento-peach text-coral font-bold text-sm">
                1
              </span>
              <div>
                <h2 className="text-base font-bold text-ink tracking-tight">
                  {t.step1Title}
                </h2>
                <p className="text-xs text-ink-muted">{t.step1Sub}</p>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-canvas text-ink-muted border border-border">
              {productCategory}
            </span>
          </div>

          <div className="mb-4">
            <span className="text-xs font-semibold text-ink-muted mb-2 block">
              {t.demoProducts}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {fallbackProducts.map((p) => {
                const isSelected = productTitle === p.title;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectDemoProduct(p)}
                    className={`p-2 rounded-xl text-left border transition-all text-xs tactile-btn ${
                      isSelected
                        ? 'border-coral bg-bento-peach ring-1 ring-coral shadow-sm'
                        : 'border-border bg-canvas hover:bg-white hover:border-ink/20'
                    }`}
                  >
                    <div className="font-semibold text-ink truncate line-clamp-1">
                      {p.title}
                    </div>
                    <div className="font-mono text-[11px] text-coral font-bold mt-0.5">
                      {Number(p.price_uzs).toLocaleString('uz-UZ')} soʻm
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="sm:col-span-4 h-32 rounded-xl border-2 border-dashed border-border hover:border-coral bg-canvas hover:bg-bento-peach/40 flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="h-9 w-9 rounded-full bg-white shadow-sm flex items-center justify-center text-coral mb-2 group-hover:scale-110 transition-transform">
                <Upload className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-ink">
                {locale === 'uz' ? 'Rasm almashtirish' : locale === 'en' ? 'Change photo' : 'Загрузить фото'}
              </span>
              <span className="text-[10px] text-ink-muted mt-0.5">
                PNG, JPG, WebP
              </span>
            </div>

            <div className="sm:col-span-8 space-y-3">
              <div>
                <label className="text-xs font-semibold text-ink-muted block mb-1">
                  {t.productName}
                </label>
                <input
                  type="text"
                  value={productTitle}
                  onChange={(e) => setProductTitle(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-border bg-surface-raised text-ink focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-ink-muted block mb-1">
                    {t.price}
                  </label>
                  <input
                    type="number"
                    value={productPrice}
                    onChange={(e) => setProductPrice(Number(e.target.value))}
                    className="w-full font-mono text-xs font-semibold px-3 py-2 rounded-lg border border-border bg-surface-raised text-ink focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-muted block mb-1">
                    {t.discount}
                  </label>
                  <input
                    type="text"
                    value={productDiscount}
                    onChange={(e) => setProductDiscount(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-border bg-surface-raised text-ink focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-surface rounded-studio border border-border p-5 sm:p-6 shadow-tactile transition-all hover:shadow-tactile-md">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-bento-mint text-emerald-700 font-bold text-sm">
                2
              </span>
              <div>
                <h2 className="text-base font-bold text-ink tracking-tight">
                  {t.step2Title}
                </h2>
                <p className="text-xs text-ink-muted">{t.step2Sub}</p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-medium text-emerald-700 bg-bento-mint px-2 py-0.5 rounded-full">
              4 ta presenter
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {avatars.map((av) => {
              const isSelected = selectedAvatarId === av.id;
              return (
                <div
                  key={av.id}
                  onClick={() => setSelectedAvatarId(av.id)}
                  className={`group relative rounded-xl border p-2.5 cursor-pointer transition-all tactile-btn ${
                    isSelected
                      ? 'border-coral bg-bento-peach ring-2 ring-coral/40 shadow-sm'
                      : 'border-border bg-white hover:border-ink/20 hover:bg-canvas'
                  }`}
                >
                  <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-canvas mb-2">
                    <img
                      src={av.avatar_image_url}
                      alt={av.display_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-coral text-white flex items-center justify-center shadow-sm">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </div>
                    )}
                    <div className="absolute bottom-1 left-1 bg-ink/75 backdrop-blur-xs text-white text-[9px] font-mono px-1.5 py-0.2 rounded">
                      {av.language_code}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-ink">
                        {av.display_name}
                      </div>
                      <div className="text-[10px] text-ink-muted font-medium line-clamp-1">
                        {av.dialect_label}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-surface rounded-studio border border-border p-5 sm:p-6 shadow-tactile transition-all hover:shadow-tactile-md">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-bento-sky text-cobalt font-bold text-sm">
                3
              </span>
              <div>
                <h2 className="text-base font-bold text-ink tracking-tight">
                  {t.step3Title}
                </h2>
                <p className="text-xs text-ink-muted">{t.step3Sub}</p>
              </div>
            </div>

            <button
              onClick={handleToggleVoicePreview}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all tactile-btn ${
                isPlayingAudio
                  ? 'border-coral bg-coral text-white shadow-sm'
                  : 'border-border bg-canvas hover:bg-white text-ink'
              }`}
            >
              {isPlayingAudio ? (
                <>
                  <VolumeX className="h-3.5 w-3.5" />
                  <span>{t.stopVoice}</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-3.5 w-3.5 text-coral" />
                  <span>{t.listenVoice}</span>
                </>
              )}

              <div className="flex items-end gap-0.5 h-3 ml-1">
                {waveformBars.slice(0, 5).map((height, idx) => (
                  <span
                    key={idx}
                    className={`w-0.5 rounded-full transition-all duration-100 ${
                      isPlayingAudio ? 'bg-white' : 'bg-coral'
                    }`}
                    style={{
                      height: isPlayingAudio ? `${Math.max(25, height)}%` : '40%',
                    }}
                  />
                ))}
              </div>
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => handleRewriteScript('discount_hook')}
              disabled={isGeneratingScript}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 tactile-btn ${
                scriptTone === 'discount_hook'
                  ? 'border-coral bg-bento-peach text-coral'
                  : 'border-border bg-canvas text-ink-muted hover:text-ink hover:bg-white'
              }`}
            >
              <Flame className="h-3.5 w-3.5 text-coral" />
              {t.toneDiscount}
            </button>
            <button
              onClick={() => handleRewriteScript('quality_review')}
              disabled={isGeneratingScript}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 tactile-btn ${
                scriptTone === 'quality_review'
                  ? 'border-emerald-600 bg-bento-mint text-emerald-700'
                  : 'border-border bg-canvas text-ink-muted hover:text-ink hover:bg-white'
              }`}
            >
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              {t.toneQuality}
            </button>
            <button
              onClick={() => handleRewriteScript('short_reels')}
              disabled={isGeneratingScript}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 tactile-btn ${
                scriptTone === 'short_reels'
                  ? 'border-cobalt bg-bento-sky text-cobalt'
                  : 'border-border bg-canvas text-ink-muted hover:text-ink hover:bg-white'
              }`}
            >
              <Zap className="h-3.5 w-3.5 text-cobalt" />
              {t.toneReels}
            </button>
          </div>

          <div className="relative">
            <textarea
              rows={4}
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              placeholder={t.scriptPlaceholder}
              className="w-full text-xs font-medium leading-relaxed p-3.5 rounded-xl border border-border bg-surface-raised text-ink focus:bg-surface-overlay focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
            />
            {isGeneratingScript && (
              <div className="absolute inset-0 bg-surface/80 backdrop-blur-xs rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-coral">
                <Sparkles className="h-4 w-4 animate-spin text-coral" />
                <span>AI ssenariy qayta yozilmoqda...</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted mt-2">
            <div className="flex items-center gap-3">
              <span>{scriptText.length} {t.characters}</span>
              <span>•</span>
              <span>{scriptWords.length} {t.words}</span>
              <span>•</span>
              <span className="text-coral font-semibold">{t.durationEst}</span>
            </div>
            <div className="text-[11px] font-sans text-ink-light">
              Dialekt: <span className="font-semibold text-ink">{selectedAvatar?.dialect_label}</span>
            </div>
          </div>
        </section>

        <section className="bg-surface rounded-studio border border-border p-5 sm:p-6 shadow-tactile transition-all hover:shadow-tactile-md">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-bento-lavender text-purple-700 font-bold text-sm">
                4
              </span>
              <div>
                <h2 className="text-base font-bold text-ink tracking-tight">
                  {t.step4Title}
                </h2>
                <p className="text-xs text-ink-muted">
                  Uzum Market, Instagram yoki Telegram uchun optimallashtirilgan
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { id: 'uzum_9_16', label: t.platformUzum, icon: ShoppingBag, color: 'text-purple-600' },
              { id: 'instagram_reels', label: t.platformReels, icon: Camera, color: 'text-pink-600' },
              { id: 'telegram_ad', label: t.platformTelegram, icon: Send, color: 'text-blue-500' },
            ].map((p) => {
              const isSelected = platformPreset === p.id;
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => setPlatformPreset(p.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all tactile-btn ${
                    isSelected
                      ? 'border-coral bg-bento-peach ring-1 ring-coral shadow-sm'
                      : 'border-border bg-canvas hover:bg-white text-ink-muted hover:text-ink'
                  }`}
                >
                  <Icon className={`h-4 w-4 mb-1.5 ${p.color}`} />
                  <div className="text-xs font-bold text-ink leading-tight">
                    {p.label}
                  </div>
                  <div className="text-[10px] text-ink-muted mt-0.5 font-mono">
                    9:16 Vertikal
                  </div>
                </button>
              );
            })}
          </div>

          {renderError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span className="font-semibold">{renderError}</span>
              </div>
              <button
                type="button"
                onClick={handleStartRender}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] transition-colors"
              >
                {t.tryAgain}
              </button>
            </div>
          )}

          {!user ? (
            <button
              type="button"
              onClick={() => onOpenAuth?.()}
              className="w-full py-4 px-6 rounded-xl bg-coral hover:bg-coral-hover text-white font-heading font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-tactile transition-all tactile-btn"
            >
              <Lock className="h-5 w-5" />
              <span>
                {locale === 'en'
                  ? '🔒 Sign In with Google to Generate Video'
                  : locale === 'ru'
                  ? '🔒 Войдите через Google для создания видео'
                  : '🔒 Video yaratish uchun avval tizimga kiring (Google)'}
              </span>
            </button>
          ) : (
            <button
              onClick={handleStartRender}
              disabled={isRendering}
              className={`w-full py-4 px-6 rounded-xl text-white font-heading font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-tactile transition-all tactile-btn ${
                isRendering
                  ? 'bg-ink-muted cursor-not-allowed opacity-90'
                  : 'bg-coral hover:bg-coral-hover active:scale-[0.99] shadow-coral/20'
              }`}
            >
              {isRendering ? (
                <>
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t.rendering} ({renderProgress}%)</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  <span>{t.renderBtn}</span>
                </>
              )}
            </button>
          )}
        </section>
      </div>

      <div className="lg:col-span-5 sticky top-20 space-y-4">
        <div className="bg-surface rounded-studio border border-border p-4 sm:p-5 shadow-tactile">
          <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-border/60">
            <div>
              <h3 className="text-sm font-bold text-ink">
                {t.previewTitle}
              </h3>
              <p className="text-[11px] text-ink-muted">{t.previewSub}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPip(!showPip)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-all ${
                  showPip
                    ? 'border-coral bg-bento-peach text-coral font-semibold'
                    : 'border-border bg-canvas text-ink-muted'
                }`}
                title="Boshlovchi pufakchasini yoqish/o'chirish"
              >
                PiP {showPip ? 'ON' : 'OFF'}
              </button>

              <button
                onClick={() => setIsPlayingPreview(!isPlayingPreview)}
                className="h-7 w-7 rounded-lg border border-border bg-surface hover:bg-surface-raised flex items-center justify-center text-ink"
              >
                {isPlayingPreview ? (
                  <Pause className="h-3.5 w-3.5" />
                ) : (
                  <Play className="h-3.5 w-3.5 fill-ink" />
                )}
              </button>
            </div>
          </div>

          <div className="relative mx-auto w-[290px] sm:w-[320px] aspect-[9/16] rounded-[38px] p-3 bg-ink shadow-2xl border-4 border-[#302F2D] overflow-hidden select-none">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 h-5 w-24 bg-black rounded-full flex items-center justify-between px-2.5 shadow-sm">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#181817] border border-white/20" />
            </div>

            <div className="absolute top-4 left-7 z-20 text-[10px] font-mono font-bold text-white/90">
              09:41
            </div>
            <div className="absolute top-4 right-7 z-20 text-[10px] font-mono font-bold text-white/90 flex items-center gap-1">
              <span>5G</span>
              <span>100%</span>
            </div>

            <div className="relative w-full h-full rounded-[30px] overflow-hidden bg-neutral-900 flex flex-col justify-between">
              <div className="absolute inset-0 z-0 overflow-hidden">
                <img
                  src={productImage}
                  alt={productTitle}
                  className={`w-full h-full object-cover transition-transform duration-700 ${
                    isPlayingPreview ? 'scale-105 animate-product-float' : 'scale-100'
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40" />
              </div>

              <div className="relative z-10 p-4 pt-10 flex items-center justify-between">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white text-[11px] font-medium">
                  {platformPreset === 'uzum_9_16' && (
                    <>
                      <ShoppingBag className="h-3 w-3 text-purple-400" />
                      <span>Uzum Market Ad</span>
                    </>
                  )}
                  {platformPreset === 'instagram_reels' && (
                    <>
                      <Camera className="h-3 w-3 text-pink-400" />
                      <span>Instagram Reels</span>
                    </>
                  )}
                  {platformPreset === 'telegram_ad' && (
                    <>
                      <Send className="h-3 w-3 text-sky-400" />
                      <span>Telegram Shop</span>
                    </>
                  )}
                </div>

                <div className="px-2 py-0.5 rounded-full bg-coral text-white text-[10px] font-bold tracking-wide uppercase">
                  {productDiscount}
                </div>
              </div>

              {showPip && (
                <div className="relative z-10 px-4 flex justify-end">
                  <div className="relative group">
                    <div className="h-20 w-20 rounded-full border-2 border-white shadow-xl overflow-hidden bg-neutral-800 ring-4 ring-coral/40">
                      <img
                        src={selectedAvatar?.avatar_image_url}
                        alt={selectedAvatar?.display_name}
                        className={`w-full h-full object-cover ${
                          isPlayingPreview ? 'scale-110' : 'scale-100'
                        }`}
                      />
                    </div>
                    {isPlayingPreview && (
                      <span className="absolute -bottom-1 -right-1 flex h-6 w-6">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-6 w-6 bg-coral text-white items-center justify-center text-[10px]">
                          🎙️
                        </span>
                      </span>
                    )}
                    <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md text-white text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full whitespace-nowrap border border-white/20">
                      {selectedAvatar?.display_name}
                    </div>
                  </div>
                </div>
              )}

              <div className="relative z-10 p-4 space-y-3 pb-6">
                <div className="min-h-[44px] bg-black/70 backdrop-blur-md border border-white/15 rounded-xl p-2.5 text-center">
                  <p className="text-xs leading-snug font-semibold text-white drop-shadow">
                    {scriptWords.map((word, index) => {
                      const isHighlighted = isPlayingPreview && index === karaokeIndex;
                      return (
                        <span
                          key={index}
                          className={`inline-block mr-1 transition-all duration-150 ${
                            isHighlighted
                              ? 'text-amber-400 scale-110 font-black underline decoration-coral decoration-2'
                              : 'text-white/90'
                          }`}
                        >
                          {word}
                        </span>
                      );
                    })}
                  </p>
                </div>

                <div className="bg-surface/95 backdrop-blur-md rounded-xl p-2.5 shadow-lg border border-border/40 flex items-center justify-between text-ink">
                  <div>
                    <h4 className="text-xs font-bold truncate max-w-[170px] line-clamp-1">
                      {productTitle}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-xs font-extrabold text-coral">
                        {Number(productPrice).toLocaleString('uz-UZ')} soʻm
                      </span>
                      <span className="font-mono text-[10px] text-ink-muted line-through">
                        {Math.round(productPrice * 1.35).toLocaleString('uz-UZ')}
                      </span>
                    </div>
                  </div>

                  <button className="px-3 py-1.5 rounded-lg bg-coral text-white text-xs font-bold shadow-sm tactile-btn flex items-center gap-1">
                    <span>Xarid</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {isRendering && (
                <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white">
                  <div className="h-16 w-16 rounded-2xl bg-coral/20 border border-coral text-coral flex items-center justify-center mb-4">
                    <Sparkles className="h-8 w-8 animate-spin" />
                  </div>

                  <h3 className="font-heading font-extrabold text-lg mb-1">
                    {renderStage === 1 && t.stage1}
                    {renderStage === 2 && t.stage2}
                    {renderStage === 3 && t.stage3}
                    {renderStage === 4 && t.stage4}
                  </h3>
                  <p className="text-xs text-white/70 mb-5 font-mono">
                    Progress: {renderProgress}%
                  </p>

                  <div className="w-full space-y-2 mb-4">
                    {[
                      { step: 1, label: t.stage1 },
                      { step: 2, label: t.stage2 },
                      { step: 3, label: t.stage3 },
                      { step: 4, label: t.stage4 },
                    ].map((st) => {
                      const isDone = renderStage > st.step;
                      const isCurrent = renderStage === st.step;
                      return (
                        <div
                          key={st.step}
                          className={`flex items-center justify-between text-xs px-3 py-1.5 rounded-lg border ${
                            isCurrent
                              ? 'border-coral bg-coral/20 text-coral font-bold'
                              : isDone
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                              : 'border-white/10 text-white/40'
                          }`}
                        >
                          <span>{st.label}</span>
                          <span>{isDone ? '✓' : isCurrent ? '...' : ''}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
                    <div
                      className="h-full bg-coral transition-all duration-300 rounded-full"
                      style={{ width: `${renderProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {renderedVideoUrl && (
            <div className="mt-4 p-3.5 rounded-xl bg-bento-mint border border-emerald-500/30 flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>9:16 Video muvaffaqiyatli render qilindi!</span>
              </div>
              <div>
                <a
                  href={renderedVideoUrl}
                  target="_blank"
                  rel="noreferrer"
                  download="tasvir-ad-9-16.mp4"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-tactile tactile-btn"
                >
                  <Download className="h-4 w-4" />
                  <span>MP4 Videoni Yuklab Olish</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

