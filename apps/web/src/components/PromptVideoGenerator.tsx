'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Video,
  Download,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Clock,
  Layers,
  Zap,
  ExternalLink,
  Flame,
  Film,
  Type,
  Radio,
  Lock,
  Scissors,
  Edit3,
  Check,
  ArrowRight,
  RefreshCw,
  FileText,
  Upload,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { api } from '../lib/api';
import { downloadMediaFile } from '../lib/download';
import { KaraokeWord, DramaScene, DramaVideoJob, LocaleType, User, VideoEditorProject, VideoJob } from '../types';
import { KaraokeSubtitles } from './KaraokeSubtitles';
import { SUBTITLE_PRESETS } from './CapCutEditor';

interface PromptVideoGeneratorProps {
  locale?: LocaleType;
  user?: User | null;
  onRequireAuth?: () => void;
  onJobStarted?: (job: VideoJob) => void;
  onVideoCreated?: (videoUrl: string) => void;
  onEditInCapCut?: (project: VideoEditorProject) => void;
  initialPrompt?: string;
  initialImage?: string;
}

const DRAMA_PROMPT_SUGGESTIONS = {
  uz: [
    {
      label: '🍓 Berry va Onasining Soʻnggi Xotirasi (Qulupnayli Sut)',
      prompt:
        "Kinematik, yuqori sifatli stilize qilingan 3D meva olamida Berry ismli kichkina qulupnay bola kasal onasiga har kuni qulupnayli sut tayyorlaydi. Bir kuni u onasining xonasiga sut olib kiradi, ammo xona jimjit, onasining sevimli kursisi esa boʻsh. Berry oshxonada yolgʻiz oʻtirib, onasining eski sut shishasini bagʻriga bosadi va birga oʻtkazgan baxtli tonglarini eslaydi. Yomgʻirli deraza, ifodali koʻzlar, sokin musiqa va iliq xotiralar bilan sovuq xona oʻrtasidagi kuchli kontrast. Yakunda kamera pushti rangli premium reklama studiyasiga silliq oʻtadi: yogʻoch stol ustidagi Berry Milk qulupnayli sut shishasi, yangi qulupnaylar, sekin harakatlanayotgan sut tomchilari va oltin rangli yorugʻlik. Ovozli matn: 'Baʼzan eng kichik narsalar eng shirin xotiralarni saqlaydi. Berry Milk — qalbingizda qoladigan shirinlik.' Barcha sahnalarda qahramon koʻrinishi bir xil saqlansin.",
    },
    {
      label: '💔 Qulupnayning Singan Yuragi (Yangi Hayot va Atir Reklamasi)',
      prompt:
        "Kinematik stilize qilingan 3D meva olamida qulupnay ayol sevgan avokadosi boshqa meva bilan yashirincha uchrashayotganini koʻrib qoladi. U qoʻlidagi sovgʻani sekin tushiradi, koʻzlariga yosh keladi va yomgʻir ostida yolgʻiz ketadi. Bir necha kun oʻtgach, u eski suratlarni yigʻishtirib, oʻz hayotini qayta boshlashga qaror qiladi. U nafis kiyim kiyib, hashamatli bogʻda oʻziga ishongan holda yuradi. Yakunda sahna premium atir reklamasiga aylanadi: nafis shisha idish, atrofida mayin tuman, oltin yorugʻlik va sekin makro kamera harakati. Ovozli matn: 'Baʼzi yakunlar yangi boshlanishlarga yoʻl ochadi.' Hissiy drama, tabiiy mimika, yomgʻirli koʻchalar, izchil qahramon dizayni va mahsulotga silliq oʻtish.",
    },
    {
      label: '🥛 Kichkina Banan va Oxirgi Nonushta (Shokoladli Sut Reklamasi)',
      prompt:
        "Kichkina banan bola har kuni ertalab bobosi bilan nonushta qiladi. Bobosi unga shokoladli sut quyib, hayotdagi eng muhim narsa mehr ekanini aytadi. Bir kuni bobosi uzoq safarga ketadi va uy jimjit boʻlib qoladi. Banan bola ertalab ikki stakan sut tayyorlaydi, keyin ikkinchi stakan qarshisida yolgʻiz oʻtiradi. U bobosining eski suratini koʻrib, tabassum bilan koʻz yoshlarini artadi. Iliq tonggi yorugʻlik, mayin kamera harakati, sokin musiqa va ifodali yuzlar. Yakunda shokoladli sut shishasi yogʻoch stol ustida premium reklama uslubida koʻrsatiladi, shokoladli sut stakanga sekin quyiladi. Ovozli matn: 'Mehr bilan boshlangan har bir kun — unutilmas xotira.' Mahsulot dizayni barcha reklama kadrlarida bir xil saqlansin.",
    },
    {
      label: '🌧️ Yolgʻiz Olma va Unutilgan Sovgʻa (Smart Watch Reklamasi)',
      prompt:
        "Kinematik 3D meva dramasi. Yosh olma yigit tugʻilgan kunida doʻstlaridan hech qanday tabrik olmagach, yomgʻirli koʻchalarda yolgʻiz yuradi. U telefonidagi eski suratlarni koʻrib, oʻzini hamma unutgandek his qiladi. Uyiga qaytgach, stol ustida yaqin insonidan qolgan kichik sovgʻa va samimiy maktubni topadi. Maktub unga hayotida hali ham uni qadrlaydigan insonlar borligini eslatadi. Uning yuzida sekin tabassum paydo boʻladi. Yakunda aqlli soatning ekrani yonadi, soat bilagiga taqiladi va premium studiyada makro kadrlarda namoyish etiladi. Ovozli matn: 'Siz uchun muhim boʻlgan lahzalarni qadrlang.' Yomgʻirli atmosfera, iliq ichki yorugʻlik, tabiiy emotsiyalar va silliq mahsulot reklamasiga oʻtish.",
    },
    {
      label: '🏃 Apelsinning Soʻnggi Qadami (Nike Pegasus Reklamasi)',
      prompt:
        "Kinematik stilize qilingan 3D meva olamida yosh apelsin yuguruvchi muhim poygada yutqazib, stadion zinapoyalarida yolgʻiz oʻtiradi. U eski medalini qoʻlida ushlab, orzularidan voz kechish haqida oʻylaydi. Ertasi tongda u quyosh chiqishidan oldin turib, mashgʻulotlarni qayta boshlaydi. Har kuni u koʻproq kuch va ishonch bilan yuguradi. Nihoyat, katta poyga kuni keladi. U marraga yetib kelganda, eng muhimi birinchi boʻlish emas, oʻziga boʻlgan ishonchini qayta topganini tushunadi. Yakunda Nike Pegasus krossovkalari qoramtir premium studiyada namoyish etiladi: kuchli yon yorugʻlik, sekin aylanuvchi kamera va poyabzal tagligi hamda matosining makro kadrlari. Ovozli matn: 'Har bir qadam — yangi imkoniyat.' Haqiqiy mahsulot dizaynini saqlash, dinamik sport kadrlari va kuchli hissiy yakun.",
    },
  ],

  en: [
    {
      label: '🍓 Berry and His Mother’s Last Memory (Strawberry Milk Ad)',
      prompt:
        "A cinematic, highly detailed stylized 3D fruit world. Berry, a small strawberry boy, prepares strawberry milk for his sick mother every morning. One day, he enters her room with a fresh glass, but the room is silent and her favorite chair is empty. Berry sits alone in the kitchen, holding her old milk bottle and remembering their happy mornings together. Rain runs down the window as tears fill his expressive eyes. Contrast the cold, quiet room with warm golden flashbacks of his mother smiling at breakfast. Transition smoothly into a premium pink advertising studio: a Berry Milk bottle on a wooden table, fresh strawberries, milk droplets floating in slow motion, and soft golden rim lighting. Voiceover: 'Sometimes the smallest things hold the sweetest memories. Berry Milk — a little sweetness that stays in your heart.' Maintain consistent character design, cinematic lighting, natural movement, and emotional continuity.",
    },
    {
      label: '💔 The Strawberry’s Broken Heart (A New Beginning & Perfume Ad)',
      prompt:
        "A cinematic stylized 3D fruit drama. A strawberry woman discovers her avocado partner secretly meeting another fruit. She slowly drops the gift she was holding, her eyes fill with tears, and she walks alone through the rain. Days later, she puts away their old photographs and decides to start a new chapter. Wearing an elegant outfit, she walks confidently through a luxurious garden at sunset. The emotional scene transitions into a premium perfume commercial: an elegant glass bottle surrounded by delicate mist, golden rim lighting, and slow macro camera movements. Voiceover: 'Sometimes an ending is the beginning of something beautiful.' Expressive facial animation, realistic micro-expressions, rainy streets, consistent character designs, and a seamless emotional-to-commercial transition.",
    },
    {
      label: '🥛 The Little Banana’s Last Breakfast (Chocolate Milk Ad)',
      prompt:
        "A cinematic stylized 3D fruit story. A little banana boy shares breakfast with his grandfather every morning. His grandfather pours him chocolate milk and reminds him that love is life's most precious gift. One day, his grandfather leaves for a long journey, and the house becomes quiet. The next morning, the little banana prepares two glasses of milk, then sits alone across from the untouched glass. He looks at an old photograph of his grandfather and gently wipes away his tears with a small smile. Warm morning sunlight, soft camera movements, expressive eyes, and gentle emotional music. The scene transitions into a premium chocolate milk commercial: a bottle on a wooden table as rich chocolate milk pours into a glass in slow motion. Voiceover: 'Every day that begins with love becomes a memory worth keeping.' Keep the product and character designs consistent.",
    },
    {
      label: '🌧️ The Lonely Apple and the Forgotten Gift (Smartwatch Ad)',
      prompt:
        "A cinematic stylized 3D fruit drama. A young apple man walks alone through rainy streets after receiving no birthday wishes from his friends. Looking through old photos on his phone, he feels forgotten. When he returns home, he discovers a small gift and a heartfelt letter from someone who still cares about him. The letter reminds him that he is not alone. A gentle smile returns to his face. Transition into a premium smartwatch commercial: the watch display lights up, the apple character fastens it around his wrist, and elegant macro shots reveal the screen, case, and strap under soft studio lighting. Voiceover: 'Make every moment that matters count.' Emotional storytelling, rain-soaked reflections, warm interior lighting, expressive character acting, and a smooth product reveal.",
    },
    {
      label: '🏃 The Orange Runner’s Final Step (Nike Pegasus Ad)',
      prompt:
        "A cinematic stylized 3D fruit sports drama. A young orange runner loses an important race and sits alone on the stadium steps, holding his old medal and wondering whether to give up. Before sunrise the next morning, he returns to training. Day after day, he runs with greater determination and confidence. Finally, race day arrives. As he crosses the finish line, he realizes that his greatest victory is not coming first but believing in himself again. Transition into a premium Nike Pegasus product commercial: the shoes are displayed in a dark studio with dramatic side lighting, a slowly rotating camera, and detailed macro shots of the sole and fabric. Voiceover: 'Every step is a new opportunity.' Preserve the authentic shoe design, cinematic sports movement, emotional storytelling, and a polished commercial ending.",
    },
  ],

  ru: [
    {
      label: '🍓 Берри и последнее воспоминание о маме (Реклама клубничного молока)',
      prompt:
        "Кинематографичный, детализированный стилизованный 3D-мир фруктов. Маленький клубничный мальчик Берри каждое утро готовит клубничное молоко для своей больной мамы. Однажды он входит в её комнату со стаканом молока, но там тихо, а любимое кресло мамы пустует. Берри сидит один на кухне, обнимает старую бутылочку и вспоминает счастливые завтраки с мамой. За окном идёт дождь, в его выразительных глазах появляются слёзы. Контраст холодной комнаты с тёплыми золотистыми воспоминаниями о маминой улыбке. Плавный переход в премиальную розовую рекламную студию: бутылочка Berry Milk на деревянном столе, свежая клубника, капли молока в замедленной съёмке и мягкий золотистый контровой свет. Голос за кадром: «Иногда самые маленькие вещи хранят самые сладкие воспоминания. Berry Milk — сладость, которая остаётся в сердце». Сохранять единый дизайн персонажей, естественные движения и эмоциональную непрерывность.",
    },
    {
      label: '💔 Разбитое сердце Клубники (Новое начало и реклама духов)',
      prompt:
        "Кинематографичная стилизованная 3D-драма в мире фруктов. Женщина-клубника узнаёт, что её партнёр-авокадо тайно встречается с другим фруктом. Подарок медленно выпадает из её рук, глаза наполняются слезами, и она уходит одна под дождём. Через несколько дней она убирает старые фотографии и решает начать новую жизнь. В элегантном наряде она уверенно идёт по роскошному саду на закате. Эмоциональная сцена плавно переходит в премиальную рекламу духов: изящный стеклянный флакон, лёгкий туман, золотистый контровой свет и медленные макрокадры. Голос за кадром: «Иногда конец становится началом чего-то прекрасного». Выразительная мимика, дождливые улицы, неизменный дизайн персонажей и плавный переход к рекламе.",
    },
    {
      label: '🥛 Последний завтрак маленького Банана (Реклама шоколадного молока)',
      prompt:
        "Кинематографичная стилизованная 3D-история в мире фруктов. Маленький банан каждое утро завтракает с дедушкой. Дедушка наливает ему шоколадное молоко и напоминает, что любовь — самое ценное в жизни. Однажды дедушка уезжает в долгое путешествие, и дом становится тихим. На следующее утро мальчик готовит два стакана молока, но садится один напротив нетронутого стакана. Он смотрит на старую фотографию дедушки, вытирает слёзы и слегка улыбается. Тёплый утренний свет, плавные движения камеры, выразительные глаза и нежная музыка. Затем плавный переход к премиальной рекламе шоколадного молока: бутылка на деревянном столе, густое шоколадное молоко медленно льётся в стакан. Голос за кадром: «Каждый день, начавшийся с любви, становится воспоминанием, которое хочется сохранить». Сохранять единый дизайн персонажей и продукта.",
    },
    {
      label: '🌧️ Одинокое Яблоко и забытый подарок (Реклама умных часов)',
      prompt:
        "Кинематографичная стилизованная 3D-драма. Молодой мужчина-яблоко идёт один по дождливым улицам, не получив поздравлений с днём рождения. Просматривая старые фотографии на телефоне, он чувствует себя забытым. Дома он находит небольшой подарок и искреннее письмо от человека, которому он по-прежнему дорог. Письмо напоминает ему, что он не одинок, и на его лице появляется улыбка. Плавный переход к премиальной рекламе умных часов: экран загорается, герой застёгивает часы на запястье, а изящные макрокадры показывают экран, корпус и ремешок в мягком студийном свете. Голос за кадром: «Цените каждое мгновение, которое действительно важно». Эмоциональная история, отражения на мокрой улице, тёплый интерьер и плавное появление продукта.",
    },
    {
      label: '🏃 Последний шаг Апельсина (Реклама Nike Pegasus)',
      prompt:
        "Кинематографичная стилизованная 3D-спортивная драма в мире фруктов. Молодой апельсин проигрывает важный забег и один сидит на ступенях стадиона, держа старую медаль и размышляя, стоит ли продолжать. На следующее утро, ещё до рассвета, он возвращается к тренировкам. День за днём он бежит всё увереннее. Наконец наступает день соревнований. Пересекая финишную черту, он понимает, что главная победа — не первое место, а возвращённая вера в себя. Плавный переход к премиальной рекламе Nike Pegasus: кроссовки на тёмном фоне, драматический боковой свет, медленное вращение камеры и детальные макрокадры подошвы и материала. Голос за кадром: «Каждый шаг открывает новую возможность». Сохранить настоящий дизайн обуви, динамику спортивных сцен и эмоциональный финал.",
    },
  ],
};

export function PromptVideoGenerator({
  locale = 'uz',
  user,
  onRequireAuth,
  onJobStarted,
  onVideoCreated,
  onEditInCapCut,
  initialPrompt,
  initialImage,
}: PromptVideoGeneratorProps) {
  const t = {
    uz: {
      badge: 'Gemini Omni 1.1 Flash & Vision Engine',
      title: 'Kinematografik AI Video (Gemini Omni 1.1)',
      subtitle:
        'Google Gemini Omni 1.1 Flash orqali yuqori emotsional ziddiyat, mahsulot integratsiyasi va 9:16 vertikal master video yarating.',
      promptLabel: 'Dramatik reklama gʻoyasi (Prompt)',
      promptPlaceholder:
        'Masalan: Xiyonat tufayli yigʻlayotgan qahramon va uning hayotini oʻzgartirgan kutilmagan sovgʻa...',
      suggestionsLabel: '🎭 Dramatik ssenariy gʻoyalari:',
      aspectRatioLabel: 'Video formati va Aniqligi:',
      ratioLockedNote: 'Gemini Omni 1.1 Flash vertikal 9:16 (360p).',
      durationBadge: '3–8 sahna • Har biri 4–8 soniya',
      planScenarioBtn: '🧠 AI Ssenariy Yaratish (Gemini)',
      planningScenarioBtn: 'Gemini ssenariyni shakllantirmoqda...',
      scenarioReviewTitle: '🎬 AI Ssenariy Tayyorlandi (Tasdiqlang yoki Tahrirlang)',
      scenarioReviewSub:
        'AI har bir sahna uchun kadr va dialoglarni yaratdi. Matnlarni xohishingizga koʻra oʻzgartirishingiz mumkin. Tasdiqlangach, video render boshlanadi.',
      confirmAndRenderBtn: '✅ Ssenariyni Tasdiqlash & Video Yaratish (Gemini Omni 1.1)',
      renderingBtn: 'Gemini Omni 1.1 videoni render qilmoqda...',
      regenerateScenarioBtn: '🔄 Qayta Ssenariy Yozish',
      backToPromptBtn: '✏️ Promptni Oʻzgartirish',
      sceneNumber: 'Sahna',
      dialogueLabel: 'Ovozli dialog (Subtitr):',
      captionLabel: 'Kadr ustidagi sarlavha:',
      durationLabel: 'Davomiyligi:',
      progressTitle: 'Gemini Omni 1.1 Flash Video Ishlab Chiqarilmoqda',
      completedTitle: 'Kinematografik Master Video Tayyorlandi!',
      downloadBtn: 'MP4 Master Yuklab Olish',
      createAnother: 'Yangi video yaratish',
      karaokeTitle: 'Karaoke Subtitr Rejimi:',
      karaokeDomMode: 'Dinamik Reels Matni',
      karaokeCanvasMode: 'Canvas Qatlami',
      actsTitle: 'Dramatik Sahnalar Ketma-ketligi (FFmpeg Concat):',
      errorOccurred: 'Video yaratishda xatolik yuz berdi. Iltimos, qayta urinib koʻring.',
      errorTitle: 'Xatolik yuz berdi',
      tryAgain: 'Qayta urinish',
      openVideo: 'Videoni ochish',
      placeholderTitle: '9:16 Dramatik Master Video koʻrinishi',
      placeholderSub: 'Dramatik prompt kiriting va avval AI ssenariyni shakllantiring.',
    },
    en: {
      badge: 'Gemini Omni 1.1 Flash & Vision Engine',
      title: 'Cinematic AI Video Ads (Gemini Omni 1.1 Flash)',
      subtitle:
        'Generate high-stakes 9:16 vertical video ads with Google Gemini Omni 1.1 Flash featuring emotional continuity, product finale, and resolution controls.',
      promptLabel: 'Dramatic Ad Idea (Prompt)',
      promptPlaceholder:
        'E.g., A protagonist crying after finding out they were betrayed, but a surprise product turns everything into victory...',
      suggestionsLabel: '🎭 Dramatic storyline concepts:',
      aspectRatioLabel: 'Video Format:',
      ratioLockedNote: 'Gemini Omni 1.1 Flash vertical 9:16 (360p).',
      durationBadge: '3–8 scenes • 4–8 seconds each',
      planScenarioBtn: '🧠 Generate AI Storyline (Gemini)',
      planningScenarioBtn: 'Gemini is framing scenes...',
      scenarioReviewTitle: '🎬 AI Storyline Ready (Review & Confirm)',
      scenarioReviewSub:
        'AI drafted the dramatic scenes and dialogue. You can tweak any script or caption before launching the video render.',
      confirmAndRenderBtn: '✅ Confirm Scenario & Render Video (Gemini Omni 1.1)',
      renderingBtn: 'Gemini Omni 1.1 rendering video...',
      regenerateScenarioBtn: '🔄 Regenerate Storyline',
      backToPromptBtn: '✏️ Edit Prompt',
      sceneNumber: 'Scene',
      dialogueLabel: 'Dialogue / Voiceover Script:',
      captionLabel: 'Screen Caption:',
      durationLabel: 'Duration:',
      progressTitle: 'Creating Video with Google Gemini Omni 1.1 Flash',
      completedTitle: 'Cinematic Master Video Ready!',
      downloadBtn: 'Download Master MP4',
      createAnother: 'Create another dramatic video',
      karaokeTitle: 'Karaoke Subtitle Mode:',
      karaokeDomMode: 'Dynamic Reels Text',
      karaokeCanvasMode: 'Canvas Layer',
      actsTitle: 'Dramatic Scenes Breakdown (FFmpeg Concat):',
      errorOccurred: 'An error occurred while creating the video. Please try again.',
      errorTitle: 'Error occurred',
      tryAgain: 'Try again',
      openVideo: 'Open video',
      placeholderTitle: '9:16 Dramatic Master Video Preview',
      placeholderSub: 'Enter a dramatic prompt and generate the AI scenes first.',
    },
    ru: {
      badge: 'Gemini Omni 1.1 Flash & Vision Engine',
      title: 'Кинематографический AI Видео Движок (Gemini Omni 1.1)',
      subtitle:
        'Создайте вертикальный 9:16 ролик через Google Gemini Omni 1.1 Flash с высоким накалом страстей, слезами и студийным финалом.',
      promptLabel: 'Драматическая идея рекламы (Промпт)',
      promptPlaceholder:
        'Например: Герой плачет из-за предательства партнера, но спасение приходит в виде неожиданного товара...',
      suggestionsLabel: '🎭 Идеи драматических сюжетов:',
      aspectRatioLabel: 'Формат видео:',
      ratioLockedNote: 'Gemini Omni 1.1 Flash 9:16 (360p).',
      durationBadge: '3–8 сцен • 4–8 сек каждая',
      planScenarioBtn: '🧠 Сгенерировать AI Сценарий (Gemini)',
      planningScenarioBtn: 'Gemini пишет драматический сценарий...',
      scenarioReviewTitle: '🎬 AI Сценарий Готов (Проверьте и Подтвердите)',
      scenarioReviewSub:
        'AI составил сцены с диалогами. Вы можете отредактировать фразы перед запуском финального рендера.',
      confirmAndRenderBtn: '✅ Подтвердить Сценарий & Рендерить Видео (Gemini Omni 1.1)',
      renderingBtn: 'Gemini Omni 1.1 рендерит сцены...',
      regenerateScenarioBtn: '🔄 Переписать Сценарий',
      backToPromptBtn: '✏️ Изменить Промпт',
      sceneNumber: 'Сцена',
      dialogueLabel: 'Озвучка / Диалог (Субтитры):',
      captionLabel: 'Текст на кадре:',
      durationLabel: 'Длительность:',
      progressTitle: 'Идет создание видео в Google Gemini Omni 1.1 Flash',
      completedTitle: 'Кинематографический Мастер-Ролик Готов!',
      downloadBtn: 'Скачать Мастер MP4',
      createAnother: 'Создать новый ролик',
      karaokeTitle: 'Режим Караоке Субтитров:',
      karaokeDomMode: 'Динамичный Reels Текст',
      karaokeCanvasMode: 'Слой Canvas',
      actsTitle: 'Сцены драмы (Объединение через FFmpeg Concat):',
      errorOccurred: 'Произошла ошибка при создании видео. Пожалуйста, попробуйте снова.',
      errorTitle: 'Произошла ошибка',
      tryAgain: 'Попробовать снова',
      openVideo: 'Открыть видео',
      placeholderTitle: 'Предпросмотр драматического 9:16 мастер-видео',
      placeholderSub: 'Введите промпт и сначала сгенерируйте AI сценарий.',
    },
  }[locale] || {
    badge: 'Gemini Omni 1.1 Flash & Vision Engine',
    title: 'Kinematografik AI Video (Gemini Omni 1.1)',
    subtitle: 'Google Gemini Omni 1.1 Flash orqali 9:16 vertikal video yarating.',
    promptLabel: 'Dramatik reklama gʻoyasi (Prompt)',
    promptPlaceholder: 'Mahsulot haqida maʼlumot kiriting...',
    suggestionsLabel: '🎭 Tavsiya etilgan gʻoyalar:',
    aspectRatioLabel: 'Format: 9:16',
    ratioLockedNote: '9:16 Vertikal format (360p).',
    durationBadge: '3–8 sahna • 15–30 soniya',
    planScenarioBtn: '🧠 AI Ssenariy Yaratish (Gemini)',
    planningScenarioBtn: 'Gemini ssenariyni shakllantirmoqda...',
    scenarioReviewTitle: '🎬 AI Ssenariy Tayyorlandi',
    scenarioReviewSub: 'Matnlarni tahrirlab, tasdiqlang.',
    confirmAndRenderBtn: '✅ Ssenariyni Tasdiqlash & Video Yaratish (Gemini Omni 1.1)',
    renderingBtn: 'Video render qilinmoqda...',
    regenerateScenarioBtn: '🔄 Qayta Ssenariy Yozish',
    backToPromptBtn: '✏️ Promptni Oʻzgartirish',
    sceneNumber: 'Sahna',
    dialogueLabel: 'Dialog:',
    captionLabel: 'Sarlavha:',
    durationLabel: 'Vaqt:',
    progressTitle: 'Video yaratilmoqda...',
    completedTitle: 'Video Tayyor!',
    downloadBtn: 'Yuklab Olish',
    createAnother: 'Yangi video yaratish',
    karaokeTitle: 'Karaoke Subtitr Rejimi:',
    karaokeDomMode: 'Reels Matni',
    karaokeCanvasMode: 'Canvas Qatlami',
    actsTitle: 'Sahnalar Ketma-ketligi:',
    errorOccurred: 'Xatolik yuz berdi.',
    errorTitle: 'Xatolik',
    tryAgain: 'Qayta urinish',
    openVideo: 'Videoni ochish',
    placeholderTitle: '9:16 Video koʻrinishi',
    placeholderSub: 'Dramatik prompt kiriting.',
  };

  const suggestions = DRAMA_PROMPT_SUGGESTIONS[locale] || DRAMA_PROMPT_SUGGESTIONS.uz;

  const [prompt, setPrompt] = useState(suggestions[0].prompt);
  const [productImage, setProductImage] = useState<string | null>(null);
  const resolution = '360p';
  const [subtitleMode, setSubtitleMode] = useState<'dom' | 'canvas'>('dom');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError(
          locale === 'en'
            ? 'Image file size exceeds 10MB limit.'
            : locale === 'ru'
            ? 'Размер изображения превышает 10 МБ.'
            : 'Rasm hajmi 10MB dan oshmasligi kerak.',
        );
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setProductImage(uploadEvent.target.result as string);
          setError(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveProductImage = () => {
    setProductImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt);
    if (initialImage) setProductImage(initialImage);
  }, [initialPrompt, initialImage]);

  // AI-first generation & confirmation states
  const [plannedScenes, setPlannedScenes] = useState<DramaScene[] | null>(null);
  const [isPlanningScenario, setIsPlanningScenario] = useState<boolean>(false);

  // Video render states
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [resultVideo, setResultVideo] = useState<{
    videoUrl: string;
    downloadUrl: string;
    scenes: DramaScene[];
    karaokeTimeline: KaraokeWord[];
    totalDurationSeconds: number;
    modelTier: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number | null>(null);

  const syncPlaybackTime = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (!videoRef.current.paused && !videoRef.current.ended) {
        rafRef.current = requestAnimationFrame(syncPlaybackTime);
      }
    }
  }, []);

  const handleVideoPlay = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(syncPlaybackTime);
  };

  const handleVideoPause = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // STEP 1: AI generates custom drama scenario from user's prompt
  const handlePlanScenario = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    if (!user) {
      const authMsg =
        locale === 'en'
          ? 'You must have an account to generate videos. Please sign in with Google first.'
          : locale === 'ru'
          ? 'Для создания видео необходимо войти в аккаунт. Пожалуйста, авторизуйтесь через Google.'
          : 'Video yaratish uchun avval hisobingizga kiring. Iltimos, Google orqali kiring.';
      setError(authMsg);
      onRequireAuth?.();
      return;
    }

    setIsPlanningScenario(true);
    setError(null);
    setResultVideo(null);

    try {
      const res = await api.planScenesFromPrompt({
        prompt: prompt.trim(),
        productImageUrl: productImage || undefined,
        dramaLevel: 'high_tension',
      });

      if (!res?.scenes || res.scenes.length === 0) {
        throw new Error('AI ssenariyni shakllantira olmadi. Iltimos qaytadan urinib koʻring.');
      }

      setPlannedScenes(res.scenes);
    } catch (err: any) {
      console.error('Plan scenario error:', err);
      setError(err?.message || t.errorOccurred);
    } finally {
      setIsPlanningScenario(false);
    }
  };

  // Scene editing handler by user
  const handleUpdateScene = (index: number, field: keyof DramaScene, value: any) => {
    setPlannedScenes((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };

      if (field === 'dialogueScript') {
        const words = String(value).split(/\s+/).filter(Boolean);
        const duration = next[index].durationSeconds || 5;
        const step = duration / Math.max(1, words.length);
        next[index].karaokeSubtitles = words.map((w, wIdx) => ({
          word: w,
          startSec: Number((wIdx * step).toFixed(2)),
          endSec: Number(((wIdx + 1) * step).toFixed(2)),
        }));
      }
      return next;
    });
  };

  // STEP 2: User confirms the AI scenario and starts rendering the video
  const handleConfirmAndRender = async () => {
    if (!plannedScenes || plannedScenes.length === 0) return;

    setIsRendering(true);
    setError(null);
    setProgress(10);
    setStatusMessage(
      locale === 'en'
        ? `Launching Gemini Omni 1.1 Flash (${resolution}) & dramatic scene rendering...`
        : locale === 'ru'
        ? `Запуск Gemini Omni 1.1 Flash (${resolution}) и рендеринга сцен...`
        : `Gemini Omni 1.1 Flash (${resolution}) orqali video generatsiyasi boshlanmoqda...`,
    );
    setResultVideo(null);
    setCurrentTime(0);

    try {
      const res = await api.generateVideoFromPrompt({
        prompt: prompt.trim(),
        productImageUrl: productImage || undefined,
        scenes: plannedScenes,
        aspectRatio: '9:16',
        resolution,
        includeBackgroundMusic: false,
      });

      if (!res?.jobId) {
        throw new Error(t.errorOccurred);
      }

      setJobId(res.jobId);
      setProgress(res.progress || 15);
      const initialStepMsg =
        res.message ||
        (locale === 'en'
          ? `Generating scenes with Gemini Omni 1.1 Flash (${resolution})...`
          : `Gemini Omni 1.1 Flash (${resolution}) sahnalari tayyorlanmoqda...`);
      setStatusMessage(initialStepMsg);

      const newJob: VideoJob = {
        id: res.jobId,
        user_id: user?.id || 'usr_demo',
        product_id: 'p-drama',
        platform_preset: '9:16 (360p)',
        script_tone: 'gemini_omni',
        script_text: prompt.trim().slice(0, 100),
        status: res.status || 'queued',
        progress_percent: res.progress || 10,
        step_message: initialStepMsg,
        audio_preview_url: null,
        output_video_url: null,
        credits_charged: 1,
        error_message: null,
        created_at: new Date().toISOString(),
        completed_at: null,
      };

      if (onJobStarted) {
        onJobStarted(newJob);
      }

      startPolling(res.jobId);
    } catch (err: any) {
      console.error('Video rendering error:', err);
      setIsRendering(false);
      setError(err?.message || t.errorOccurred);
    }
  };

  const startPolling = (targetJobId: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    let pollFailures = 0;

    pollIntervalRef.current = setInterval(async () => {
      try {
        const jobData: DramaVideoJob = await api.getPromptVideoStatus(targetJobId);
        pollFailures = 0;
        setProgress(jobData.progress || 25);
        setStatusMessage(
          jobData.currentStepMessage ||
            (locale === 'en'
              ? 'Processing Google Veo 3.1 dramatic video...'
              : 'Google Veo 3.1 dramatik video qayta ishlanmoqda...'),
        );

        if (jobData.status === 'completed' && jobData.videoUrl) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setIsRendering(false);
          setResultVideo({
            videoUrl: jobData.videoUrl,
            downloadUrl: jobData.downloadUrl || jobData.videoUrl,
            scenes: jobData.scenes || plannedScenes || [],
            karaokeTimeline: jobData.karaokeTimeline || [],
            totalDurationSeconds: jobData.totalDurationSeconds || 16,
            modelTier: jobData.modelTier || 'veo-3.1-lite-generate',
          });
          onVideoCreated?.(jobData.videoUrl);
        } else if (jobData.status === 'failed') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setIsRendering(false);
          setError(jobData.error || t.errorOccurred);
        }
      } catch (pollErr: any) {
        pollFailures++;
        console.warn('Polling check warning, attempt:', pollFailures);
        if (pollFailures >= 4) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setIsRendering(false);
          setError(pollErr?.message || t.errorOccurred);
        }
      }
    }, 1500);
  };

  const handleReset = () => {
    setResultVideo(null);
    setPlannedScenes(null);
    setJobId(null);
    setProgress(0);
    setIsRendering(false);
    setIsPlanningScenario(false);
    setError(null);
    setCurrentTime(0);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-2.5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-mono font-bold tracking-wide uppercase shadow-xs">
          <Flame className="h-4 w-4 text-amber-600 animate-pulse" />
          <span>{t.badge}</span>
        </div>
        <h2 className="font-heading font-black text-2xl sm:text-3xl text-ink tracking-tight">
          {t.title}
        </h2>
        <p className="text-sm text-ink-muted max-w-2xl mx-auto leading-relaxed">
          {t.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
        {/* LEFT COLUMN: Prompt Input OR AI Scenario Review & Confirmation */}
        <div className="lg:col-span-7 bg-surface rounded-2xl sm:rounded-3xl p-4 sm:p-6 sm:p-7 border border-border shadow-sm space-y-6">
          {!plannedScenes ? (
            /* STEP 1: Enter prompt and generate AI scenario */
            <form onSubmit={handlePlanScenario} className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-heading font-bold text-ink flex items-center gap-1.5">
                    <Film className="h-3.5 w-3.5 text-coral" />
                    <span>{t.promptLabel}</span>
                  </label>
                  <span className="text-[11px] font-mono text-ink-muted">
                    {prompt.length}/2000
                  </span>
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  required
                  disabled={isPlanningScenario || isRendering}
                  placeholder={t.promptPlaceholder}
                  className="w-full px-4 py-3 text-sm rounded-2xl border border-border bg-surface-raised focus:bg-surface-overlay text-ink focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all resize-none leading-relaxed placeholder:text-ink-dim"
                />
              </div>

              {/* Product Photo Upload (Optional) */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-surface-raised border border-border">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  onChange={handleFileUpload}
                  disabled={isPlanningScenario || isRendering}
                  className="hidden"
                />

                <div className="flex items-center justify-between">
                  <label className="text-xs font-heading font-bold text-ink flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-coral" />
                    <span>
                      {locale === 'en'
                        ? 'Product Reference Photo (Optional)'
                        : locale === 'ru'
                        ? 'Фотография товара (Опционально)'
                        : 'Mahsulot rasmi (Ixtiyoriy)'}
                    </span>
                  </label>
                  {productImage && (
                    <button
                      type="button"
                      onClick={handleRemoveProductImage}
                      disabled={isPlanningScenario || isRendering}
                      className="text-[11px] text-red-500 hover:text-red-600 flex items-center gap-1 font-semibold transition-colors"
                    >
                      <X className="h-3 w-3" />
                      {locale === 'en' ? 'Remove' : locale === 'ru' ? 'Удалить' : 'Oʻchirish'}
                    </button>
                  )}
                </div>

                {!productImage ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isPlanningScenario || isRendering}
                    className="w-full py-3 px-4 rounded-xl border border-dashed border-border hover:border-coral/60 bg-surface hover:bg-coral/5 transition-all flex items-center justify-center gap-2.5 text-ink group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-coral/10 text-coral flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-ink">
                        {locale === 'en'
                          ? 'Upload your product image'
                          : locale === 'ru'
                          ? 'Загрузить фото вашего товара'
                          : 'Mahsulotingiz rasmini yuklang'}
                      </p>
                      <p className="text-[10px] text-ink-muted">
                        {locale === 'en'
                          ? 'AI will feature this exact product in the emotional story and commercial studio finale'
                          : locale === 'ru'
                          ? 'AI встроит этот товар в сюжет и студийный рекламный финал'
                          : 'AI ushbu mahsulotni emotsional ssenariy va yakuniy studiya reklamasiga joylaydi'}
                      </p>
                    </div>
                  </button>
                ) : (
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-surface border border-coral/30">
                    <img
                      src={productImage}
                      alt="Product preview"
                      className="w-14 h-14 rounded-lg object-cover border border-border shrink-0 shadow-2xs"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                          <CheckCircle2 className="h-3 w-3" />
                          {locale === 'en' ? 'Product Attached' : locale === 'ru' ? 'Товар прикреплен' : 'Mahsulot biriktirildi'}
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-muted line-clamp-1 mt-1">
                        {locale === 'en'
                          ? 'Packaging & branding will be preserved throughout the story & studio ad'
                          : locale === 'ru'
                          ? 'Упаковка и стиль будут сохранены в сюжете и рекламном финале'
                          : 'Qadoq va ranglar hikoya hamda studiya reklamasida toʻliq saqlanadi'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isPlanningScenario || isRendering}
                      className="px-2.5 py-1 text-xs rounded-lg bg-surface-raised hover:bg-surface-overlay border border-border text-ink font-semibold shrink-0 transition-colors"
                    >
                      {locale === 'en' ? 'Change' : locale === 'ru' ? 'Изменить' : 'Almashtirish'}
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-ink-muted block">
                  {t.suggestionsLabel}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {suggestions.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      disabled={isPlanningScenario || isRendering}
                      onClick={() => setPrompt(sug.prompt)}
                      className="p-2.5 text-left rounded-xl text-xs bg-surface-raised hover:bg-surface-overlay border border-border text-ink transition-colors tactile-btn line-clamp-2 leading-snug"
                    >
                      {sug.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-heading font-bold text-ink flex items-center gap-1.5">
                    <Smartphone className="h-4 w-4 text-amber-500" />
                    <span>{t.aspectRatioLabel}</span>
                  </label>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-mono font-bold uppercase">
                    Gemini Omni 1.1 • 9:16 ({resolution})
                  </span>
                </div>
                <p className="text-[11px] text-ink-muted">
                  {t.ratioLockedNote}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface border border-amber-400/40 text-ink text-xs font-bold shadow-2xs">
                    📱 9:16 • 360p
                  </span>
                  <span className="text-xs text-ink-muted">
                    • {t.durationBadge}
                  </span>
                </div>
              </div>

              {error && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                    <span className="font-medium truncate">{error}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePlanScenario()}
                    className="shrink-0 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] transition-colors"
                  >
                    {t.tryAgain}
                  </button>
                </div>
              )}

              {!user ? (
                <button
                  type="button"
                  onClick={() => onRequireAuth?.()}
                  className="w-full py-4 px-6 rounded-2xl bg-coral hover:bg-coral-dark text-white font-heading font-extrabold text-sm shadow-md transition-all tactile-btn flex items-center justify-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  <span>
                    {locale === 'en'
                      ? '🔒 Sign in with Google to Generate Video'
                      : locale === 'ru'
                      ? '🔒 Войдите через Google для создания видео'
                      : '🔒 Video yaratish uchun avval tizimga kiring (Google)'}
                  </span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isPlanningScenario || !prompt.trim()}
                  className="w-full py-4 px-6 rounded-2xl bg-coral hover:bg-coral-dark disabled:opacity-50 text-white font-heading font-extrabold text-sm shadow-md transition-all tactile-btn flex items-center justify-center gap-2"
                >
                  <Sparkles className={`h-4 w-4 ${isPlanningScenario ? 'animate-spin' : ''}`} />
                  <span>
                    {isPlanningScenario ? t.planningScenarioBtn : t.planScenarioBtn}
                  </span>
                </button>
              )}
            </form>
          ) : (
            /* STEP 2: AI Scenario Review & User Confirmation Card */
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-heading font-bold text-ink text-sm sm:text-base">
                    {t.scenarioReviewTitle}
                  </h3>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    {t.scenarioReviewSub}
                  </p>
                </div>
              </div>

              {/* 3 Dramatic Scenes Cards */}
              <div className="space-y-4">
                {plannedScenes.map((scene, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-surface-raised border border-border space-y-3 transition-all hover:border-coral/40"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-coral text-white text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={scene.actTitle}
                          onChange={(e) => handleUpdateScene(idx, 'actTitle', e.target.value)}
                          disabled={isRendering}
                          className="font-heading font-bold text-xs sm:text-sm text-ink bg-transparent border-b border-transparent hover:border-border focus:border-coral focus:outline-none px-1 py-0.5 rounded transition-all"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {idx === plannedScenes.length - 1 && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            {locale === 'en'
                              ? '🎬 Product Ad Finale'
                              : locale === 'ru'
                              ? '🎬 Рекламный финал'
                              : '🎬 Studiya reklamasi'}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md bg-coral/10 text-coral text-[10px] font-bold">
                          ⚡ {scene.tensionLevel}/10
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-canvas border border-border text-ink-muted text-[10px] font-mono">
                          ⏱ {scene.durationSeconds}s
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-ink-muted italic pl-1">
                      {scene.emotion}
                    </p>

                    {/* Dialogue Textarea */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-ink flex items-center gap-1">
                        <Type className="h-3 w-3 text-coral" />
                        <span>{t.dialogueLabel}</span>
                      </label>
                      <textarea
                        rows={2}
                        value={scene.dialogueScript}
                        disabled={isRendering}
                        onChange={(e) => handleUpdateScene(idx, 'dialogueScript', e.target.value)}
                        className="w-full text-xs rounded-xl p-2.5 bg-canvas border border-border focus:border-coral focus:outline-none text-ink leading-relaxed resize-none"
                      />
                    </div>

                    {/* On-screen Caption */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-ink-muted">
                        {t.captionLabel}
                      </label>
                      <input
                        type="text"
                        value={scene.caption}
                        disabled={isRendering}
                        onChange={(e) => handleUpdateScene(idx, 'caption', e.target.value)}
                        className="w-full text-xs rounded-xl px-2.5 py-1.5 bg-canvas border border-border focus:border-coral focus:outline-none text-ink"
                      />
                    </div>

                    {/* Word tags preview */}
                    {scene.karaokeSubtitles && scene.karaokeSubtitles.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {scene.karaokeSubtitles.map((kw, kwIdx) => (
                          <span
                            key={kwIdx}
                            className="px-1.5 py-0.5 rounded bg-surface border border-border text-[10px] font-mono text-ink-muted"
                          >
                            {kw.word}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {error && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                    <span className="font-medium truncate">{error}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons: Confirm & Render OR Regenerate */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmAndRender}
                  disabled={isRendering}
                  className="w-full py-4 px-6 rounded-2xl bg-coral hover:bg-coral-dark disabled:opacity-50 text-white font-heading font-extrabold text-sm shadow-md transition-all tactile-btn flex items-center justify-center gap-2"
                >
                  <Sparkles className={`h-4 w-4 ${isRendering ? 'animate-spin' : ''}`} />
                  <span>{isRendering ? t.renderingBtn : t.confirmAndRenderBtn}</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePlanScenario()}
                    disabled={isRendering}
                    className="py-2.5 px-3 rounded-xl border border-border bg-surface hover:bg-surface-raised text-ink text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-ink-muted" />
                    <span>{t.regenerateScenarioBtn}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlannedScenes(null)}
                    disabled={isRendering}
                    className="py-2.5 px-3 rounded-xl border border-border bg-surface hover:bg-surface-raised text-ink-muted hover:text-ink text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>{t.backToPromptBtn}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Video Player / Progress / Empty State */}
        <div className="lg:col-span-5 bg-surface rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-border shadow-sm flex flex-col justify-center min-h-[380px] sm:min-h-[500px]">
          {!isRendering && !resultVideo && !error && (
            <div className="text-center py-14 px-4 space-y-4">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-canvas border border-border flex items-center justify-center text-ink-muted shadow-xs">
                <Video className="h-8 w-8 text-coral" />
              </div>
              <div className="space-y-1">
                <h4 className="font-heading font-bold text-ink text-base">
                  {t.placeholderTitle}
                </h4>
                <p className="text-xs text-ink-muted max-w-xs mx-auto leading-relaxed">
                  {t.placeholderSub}
                </p>
              </div>
            </div>
          )}

          {error && !isRendering && !resultVideo && (
            <div className="text-center py-12 px-4 space-y-4 animate-in fade-in duration-200">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-500 shadow-xs">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-heading font-bold text-red-700 text-base">
                  {t.errorTitle}
                </h4>
                <p className="text-xs text-red-600 max-w-sm mx-auto leading-relaxed">
                  {error}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (plannedScenes) {
                    handleConfirmAndRender();
                  } else {
                    handlePlanScenario();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{t.tryAgain}</span>
              </button>
            </div>
          )}

          {isRendering && (
            <div className="py-8 px-4 text-center space-y-6 animate-in fade-in duration-200">
              <div className="relative mx-auto h-20 w-20 flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral opacity-25"></span>
                <div className="h-16 w-16 rounded-2xl bg-coral text-white flex items-center justify-center shadow-lg">
                  <Sparkles className="h-8 w-8 animate-spin" />
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-heading font-bold text-ink text-base">
                  {t.progressTitle}
                </h4>
                <p className="text-xs text-ink-muted font-medium font-mono leading-relaxed">
                  {statusMessage}
                </p>
              </div>

              <div className="space-y-2 max-w-xs mx-auto">
                <div className="w-full h-2.5 rounded-full bg-canvas border border-border overflow-hidden">
                  <div
                    className="h-full bg-coral transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted">
                  <span>{locale === 'en' ? 'Progress:' : 'Jarayon:'}</span>
                  <span className="font-bold text-coral">{progress}%</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-canvas border border-border text-[11px] text-ink-muted text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink flex items-center gap-1.5">
                    <Zap className="h-3 w-3 text-coral" />
                    <span>AI Image & Motion Pipeline:</span>
                  </span>
                  <span className="font-mono text-[10px] bg-neutral-200 px-1.5 py-0.5 rounded">
                    9:16
                  </span>
                </div>
                <div className="space-y-1 text-[11px] text-ink-muted">
                  <p>• {locale === 'en' ? 'Phase 1: High-res AI Scene Images generation (FLUX / Sana)' : '1-Bosqich: Yuqori sifatli 9:16 AI sahna tasvirlari yaratish'}</p>
                  <p>• {locale === 'en' ? 'Phase 2: Product photography alignment & scene clips' : '2-Bosqich: Mahsulot fotosi va sahna video kliplari shakllantirish'}</p>
                  <p>• {locale === 'en' ? 'Phase 3: FFmpeg master concatenation & soundtrack blend' : '3-Bosqich: FFmpeg Concat master montaj va ovoz birlashtirish'}</p>
                </div>
              </div>
            </div>
          )}

          {resultVideo && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{t.completedTitle}</span>
                </div>
                <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                  9:16 • {resultVideo.totalDurationSeconds}s
                </span>
              </div>

              <div className="flex items-center justify-between px-2 text-xs">
                <span className="text-[11px] font-semibold text-ink-muted flex items-center gap-1">
                  <Type className="h-3 w-3 text-coral" />
                  <span>{t.karaokeTitle}</span>
                </span>
                <div className="flex items-center gap-1 bg-canvas p-0.5 rounded-lg border border-border">
                  <button
                    type="button"
                    onClick={() => setSubtitleMode('dom')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      subtitleMode === 'dom'
                        ? 'bg-white text-ink shadow-2xs'
                        : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    Reels (HTML)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubtitleMode('canvas')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      subtitleMode === 'canvas'
                        ? 'bg-white text-ink shadow-2xs'
                        : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    Canvas
                  </button>
                </div>
              </div>

              <div className="relative mx-auto rounded-3xl overflow-hidden bg-black shadow-xl border border-border/80 w-[210px] xs:w-[240px] sm:w-[260px] aspect-[9/16] flex items-center justify-center group">
                <video
                  ref={videoRef}
                  key={resultVideo.videoUrl}
                  src={resultVideo.videoUrl}
                  controls
                  autoPlay
                  playsInline
                  loop
                  onPlay={handleVideoPlay}
                  onPause={handleVideoPause}
                  onTimeUpdate={handleVideoTimeUpdate}
                  className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 pointer-events-none flex flex-col justify-end">
                  <KaraokeSubtitles
                    currentTime={currentTime}
                    subtitles={resultVideo.karaokeTimeline}
                    scenes={resultVideo.scenes}
                    renderMode={subtitleMode}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-ink-muted px-1">
                <span className="flex items-center gap-1 text-ink font-medium truncate max-w-[200px]">
                  <Film className="h-3.5 w-3.5 shrink-0 text-coral" />
                  <span className="truncate">
                    {locale === 'en' ? 'AI Vision & Motion • 9:16 Vertical' : 'AI Vision & Motion • 9:16 Vertikal'}
                  </span>
                </span>
                <span className="font-mono text-[10px] bg-canvas border border-border px-1.5 py-0.5 rounded shrink-0">
                  {currentTime.toFixed(1)}s / {resultVideo.totalDurationSeconds}s
                </span>
              </div>

              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={resultVideo.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-ink hover:bg-neutral-800 text-white font-heading font-bold text-xs shadow-sm transition-all tactile-btn flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>{t.openVideo}</span>
                  </a>

                  <button
                    type="button"
                    onClick={() =>
                      downloadMediaFile(
                        resultVideo.downloadUrl || resultVideo.videoUrl,
                        'tasvir-ai-dramatic-product-ad.mp4'
                      )
                    }
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold text-xs shadow-sm transition-all tactile-btn flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>{t.downloadBtn}</span>
                  </button>
                </div>

                {/* Edit in CapCut Studio Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (onEditInCapCut) {
                      onEditInCapCut({
                        id: jobId || `proj-${Date.now()}`,
                        title: prompt || 'AI Story Video',
                        videoUrl: resultVideo.videoUrl || '',
                        duration: resultVideo.totalDurationSeconds || 16,
                        scenes: resultVideo.scenes || [],
                        style: SUBTITLE_PRESETS.capcut_yellow,
                        subtitles: (resultVideo.scenes || []).map((s, idx) => {
                          const startSec = idx * 5;
                          const endSec = startSec + (s.durationSeconds || 5);
                          return {
                            id: `cue-${idx}`,
                            startSec,
                            endSec,
                            text: s.dialogueScript || s.caption || '',
                            words: s.karaokeSubtitles || [],
                          };
                        }),
                      });
                    }
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-accent-warm hover:bg-accent-warm-hover text-obsidian font-heading font-extrabold text-xs shadow-tactile transition-all tactile-btn flex items-center justify-center gap-2"
                >
                  <Scissors className="h-3.5 w-3.5" />
                  <span>
                    {locale === 'en'
                      ? '✂️ Edit Subtitles in CapCut Studio'
                      : locale === 'ru'
                      ? '✂️ Редактировать субтитры в CapCut Студии'
                      : '✂️ CapCut Muharririda subtitrlarni tahrirlash'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full py-2 px-3 rounded-xl border border-border bg-surface hover:bg-surface-raised text-ink-muted hover:text-ink text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>{t.createAnother}</span>
                </button>
              </div>

              {/* Generated AI Scene Images Gallery */}
              {resultVideo.scenes && resultVideo.scenes.some((s) => s.imageUrl) && (
                <div className="pt-4 border-t border-border/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-coral/10 text-coral flex items-center justify-center">
                        <ImageIcon className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-ink font-heading">
                          {locale === 'en'
                            ? 'AI Scene Images (FLUX 9:16)'
                            : locale === 'ru'
                            ? 'AI Кадры Сцен (FLUX 9:16)'
                            : 'Sahna Tasvirlari (AI Kadrlar 9:16)'}
                        </h4>
                        <p className="text-[10px] text-ink-muted">
                          {locale === 'en'
                            ? 'Generated high-resolution AI vertical images for each story scene'
                            : locale === 'ru'
                            ? 'Сгенерированные AI изображения для каждого акта сюжета'
                            : 'Har bir hikoya sahnasi uchun generatsiya qilingan AI tasvirlar'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono bg-coral/10 text-coral font-bold px-2 py-0.5 rounded-full border border-coral/20">
                      {resultVideo.scenes.filter((s) => s.imageUrl).length} {locale === 'en' ? 'images' : 'tasvir'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {resultVideo.scenes.map((scene, idx) => {
                      if (!scene.imageUrl) return null;
                      return (
                        <div
                          key={idx}
                          className="group relative rounded-2xl overflow-hidden border border-border bg-canvas shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                        >
                          <div
                            onClick={() => setPreviewImageUrl(scene.imageUrl!)}
                            className="relative aspect-[9/16] w-full bg-black overflow-hidden cursor-pointer"
                          >
                            <img
                              src={scene.imageUrl}
                              alt={scene.actTitle || `Scene ${scene.sceneIndex}`}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                            {/* Scene Number Badge */}
                            <div className="absolute top-2 left-2 z-10">
                              <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[9px] font-mono font-bold">
                                #{scene.sceneIndex}
                              </span>
                            </div>

                            {/* Download button on hover */}
                            <div className="absolute top-2 right-2 z-10 opacity-90 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadMediaFile(
                                    scene.imageUrl!,
                                    `scene-${scene.sceneIndex}-${jobId || 'image'}.jpg`
                                  );
                                }}
                                title={locale === 'en' ? 'Download Image' : 'Tasvirni yuklab olish'}
                                className="p-1.5 rounded-lg bg-black/70 hover:bg-coral text-white backdrop-blur-xs shadow-xs transition-colors cursor-pointer"
                              >
                                <Download className="h-3 w-3" />
                              </button>
                            </div>

                            {/* Scene Title at bottom */}
                            <div className="absolute bottom-2 inset-x-2 z-10">
                              <p className="text-[10px] font-bold text-white line-clamp-1">
                                {scene.actTitle}
                              </p>
                              <p className="text-[9px] text-white/80 line-clamp-1 italic font-sans">
                                &ldquo;{scene.dialogueScript || scene.caption}&rdquo;
                              </p>
                            </div>
                          </div>

                          {/* Card Action footer */}
                          <div className="p-2 bg-surface flex items-center justify-between border-t border-border/50 text-[10px]">
                            <span className="font-mono text-ink-muted text-[9px]">
                              {scene.durationSeconds || 5}s
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                downloadMediaFile(
                                  scene.imageUrl!,
                                  `scene-${scene.sceneIndex}-${jobId || 'image'}.jpg`
                                )
                              }
                              className="text-[10px] font-bold text-coral hover:text-coral-hover inline-flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Download className="h-2.5 w-2.5" />
                              <span>{locale === 'en' ? 'Download' : 'Yuklash'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal for Full-Size Scene Image Preview */}
      {previewImageUrl && (
        <div
          onClick={() => setPreviewImageUrl(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-sm w-full bg-surface rounded-3xl overflow-hidden border border-border shadow-2xl flex flex-col"
          >
            <div className="p-3 border-b border-border flex items-center justify-between">
              <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-coral" />
                <span>{locale === 'en' ? 'AI Scene Image Preview' : 'AI Sahna Tasviri'}</span>
              </span>
              <button
                type="button"
                onClick={() => setPreviewImageUrl(null)}
                className="p-1 rounded-full hover:bg-canvas text-ink-muted hover:text-ink transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="relative aspect-[9/16] w-full bg-black overflow-hidden flex items-center justify-center">
              <img
                src={previewImageUrl}
                alt="Scene full preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-3 bg-surface flex items-center justify-end gap-2 border-t border-border">
              <a
                href={previewImageUrl}
                target="_blank"
                rel="noreferrer"
                className="py-1.5 px-3 rounded-xl border border-border bg-canvas hover:bg-surface-raised text-xs font-semibold text-ink flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                <span>{locale === 'en' ? 'Open Full' : 'Ochish'}</span>
              </a>
              <button
                type="button"
                onClick={() => downloadMediaFile(previewImageUrl, 'ai-scene-image.jpg')}
                className="py-1.5 px-3 rounded-xl bg-coral hover:bg-coral-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download className="h-3 w-3" />
                <span>{locale === 'en' ? 'Download' : 'Yuklab olish'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
