'use client';

import React from 'react';
import {
  X,
  MoreVertical,
  ArrowLeft,
  Smartphone,
  Send,
  Zap,
  Info,
} from 'lucide-react';

interface TelegramContainerProps {
  children: React.ReactNode;
  onExit: () => void;
  locale: 'uz' | 'ru';
}

export function TelegramContainer({
  children,
  onExit,
  locale,
}: TelegramContainerProps) {
  return (
    <div className="min-h-screen bg-[#1F2937] py-4 sm:py-8 px-2 sm:px-4 flex flex-col items-center justify-center animate-in fade-in duration-300">
      {/* Top Banner with Exit button */}
      <div className="w-full max-w-md flex items-center justify-between mb-3 text-white text-xs font-medium px-2">
        <div className="flex items-center gap-1.5">
          <Smartphone className="h-4 w-4 text-sky-400" />
          <span>Telegram WebApp Emulyatori</span>
        </div>
        <button
          onClick={onExit}
          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          <span>Vebga qaytish</span>
        </button>
      </div>

      {/* Telegram Mobile Phone Window */}
      <div className="w-full max-w-md h-[88vh] bg-canvas rounded-[32px] border-4 border-[#374151] shadow-2xl overflow-hidden flex flex-col relative">
        {/* Telegram Top App Bar */}
        <div className="bg-[#242F3D] text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={onExit}
              className="text-white/80 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-coral text-white font-black text-xs flex items-center justify-center shadow-xs">
                T
              </div>
              <div className="leading-tight">
                <div className="text-xs font-bold flex items-center gap-1">
                  <span>Tasvir AI Studio</span>
                  <span className="text-[10px] bg-sky-500/30 text-sky-300 px-1 rounded font-mono">
                    bot
                  </span>
                </div>
                <div className="text-[10px] text-white/60">
                  @TasvirAdBot • Mini App
                </div>
              </div>
            </div>
          </div>

          <button className="text-white/80 hover:text-white">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>

        {/* Telegram Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="p-2.5 rounded-xl bg-bento-sky border border-cobalt/20 text-cobalt text-[11px] flex items-center gap-2">
            <Send className="h-3.5 w-3.5 shrink-0" />
            <span>
              {locale === 'uz'
                ? "Siz hozir Telegram WebApp rejimidasiz. Barcha funksiyalar mobil ko'rinishda moslashgan."
                : 'Вы находитесь в режиме Telegram WebApp. Все функции адаптированы для мобильного бота.'}
            </span>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}

