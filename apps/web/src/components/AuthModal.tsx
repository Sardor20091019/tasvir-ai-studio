'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, Lock } from 'lucide-react';
import { User, LocaleType } from '../types';
import { Turnstile } from './Turnstile';
import { GoogleSignInButton } from './GoogleSignInButton';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  locale: LocaleType;
}

export function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  locale,
}: AuthModalProps) {
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  if (!isOpen) return null;

  const t = {
    uz: {
      title: 'Google orqali tizimga kirish',
      sub: 'Tasvir AI studiyasidan toʻliq foydalanish va video yaratish uchun Google hisobingiz orqali kiring.',
      googleNote: 'Bir bosishda xavfsiz autentifikatsiya',
      securityBadge: 'Google OAuth 2.0 & Cloudflare Turnstile bilan himoyalangan',
    },
    en: {
      title: 'Sign In with Google',
      sub: 'Sign in with your Google account to access all AI studio features and generate marketing videos.',
      googleNote: 'One-click secure authentication',
      securityBadge: 'Protected by Google OAuth 2.0 & Cloudflare Turnstile',
    },
    ru: {
      title: 'Вход через Google',
      sub: 'Войдите с помощью учетной записи Google для генерации видео в студии Tasvir AI.',
      googleNote: 'Безопасная авторизация в один клик',
      securityBadge: 'Защищено Google OAuth 2.0 & Cloudflare Turnstile',
    },
  }[locale] || {
    title: 'Sign In with Google',
    sub: 'Sign in with your Google account to access all studio features.',
    googleNote: 'One-click secure authentication',
    securityBadge: 'Protected by Google OAuth 2.0 & Cloudflare Turnstile',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white border border-border shadow-2xl p-6 sm:p-7">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 h-8 w-8 rounded-full border border-border bg-canvas hover:bg-white flex items-center justify-center text-ink-muted hover:text-ink transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-6">
          <div className="h-10 w-10 rounded-xl bg-bento-peach text-coral flex items-center justify-center font-bold mb-3 shadow-xs">
            <Lock className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-heading font-extrabold text-ink tracking-tight">
            {t.title}
          </h2>
          <p className="text-xs text-ink-muted mt-1 leading-relaxed">{t.sub}</p>
        </div>

        <div className="space-y-4">
          {/* Cloudflare Turnstile Bot Protection */}
          <div className="py-1">
            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
              onVerify={(token) => setTurnstileToken(token)}
              onExpire={() => setTurnstileToken(null)}
              locale={locale}
            />
          </div>

          {/* Official Google Sign-In Button */}
          <div className="pt-2">
            <GoogleSignInButton
              onSuccess={(googleUser) => {
                onLoginSuccess(googleUser);
                onClose();
              }}
              onError={(err) => {
                console.warn('Google auth warning:', err);
              }}
              locale={locale}
            />
          </div>

          {/* Security Badge */}
          <div className="pt-3 border-t border-border flex items-center justify-center gap-1.5 text-[11px] text-emerald-700 font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>{t.securityBadge}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
