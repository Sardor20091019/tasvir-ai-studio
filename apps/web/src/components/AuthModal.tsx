'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
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
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isOpen) return null;

  const t = {
    uz: {
      title: 'Google orqali tizimga kirish',
      sub: 'Tasvir AI studiyasidan toʻliq foydalanish va video yaratish uchun Google hisobingiz orqali kiring.',
      googleNote: 'Bir bosishda xavfsiz autentifikatsiya',
      securityBadge: 'Google OAuth 2.0 & Cloudflare Turnstile bilan himoyalangan',
      cfRequiredNotice: 'Google orqali kirish uchun avval yuqoridagi Cloudflare tekshiruvini tasdiqlang',
      cfVerified: 'Cloudflare tasdiqlandi ✓ Google orqali kiring',
    },
    en: {
      title: 'Sign In with Google',
      sub: 'Sign in with your Google account to access all AI studio features and generate marketing videos.',
      googleNote: 'One-click secure authentication',
      securityBadge: 'Protected by Google OAuth 2.0 & Cloudflare Turnstile',
      cfRequiredNotice: 'Please complete the Cloudflare verification above to enable Google Sign-In',
      cfVerified: 'Cloudflare verified ✓ Proceed with Google',
    },
    ru: {
      title: 'Вход через Google',
      sub: 'Войдите с помощью учетной записи Google для генерации видео в студии Tasvir AI.',
      googleNote: 'Безопасная авторизация в один клик',
      securityBadge: 'Защищено Google OAuth 2.0 & Cloudflare Turnstile',
      cfRequiredNotice: 'Сначала подтвердите проверку Cloudflare выше для входа через Google',
      cfVerified: 'Cloudflare подтвержден ✓ Войдите через Google',
    },
  }[locale] || {
    title: 'Sign In with Google',
    sub: 'Sign in with your Google account to access all studio features.',
    googleNote: 'One-click secure authentication',
    securityBadge: 'Protected by Google OAuth 2.0 & Cloudflare Turnstile',
    cfRequiredNotice: 'Please complete Cloudflare verification above to enable Google Sign-In',
    cfVerified: 'Cloudflare verified ✓ Proceed with Google',
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
          {/* Cloudflare Turnstile Bot Protection - MANDATORY FOR GOOGLE LOGIN */}
          <div className="py-1">
            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
              onVerify={(token) => {
                setTurnstileToken(token);
                setAuthError(null);
              }}
              onExpire={() => setTurnstileToken(null)}
              locale={locale}
            />
          </div>

          {/* Error Message if auth or turnstile fails */}
          {authError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{authError}</span>
            </div>
          )}

          {/* Conditional Google Login: STRICTLY BLOCKED WITHOUT CLOUDFLARE CONFIRMATION */}
          {!turnstileToken ? (
            <div className="p-3.5 rounded-xl bg-neutral-100 border border-neutral-200 text-neutral-600 text-xs flex items-center justify-center gap-2 select-none text-center">
              <Lock className="h-4 w-4 text-neutral-400 shrink-0" />
              <span className="font-medium">{t.cfRequiredNotice}</span>
            </div>
          ) : (
            <div className="space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-emerald-700 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>{t.cfVerified}</span>
              </div>
              <GoogleSignInButton
                turnstileToken={turnstileToken}
                onSuccess={(googleUser) => {
                  onLoginSuccess(googleUser);
                  onClose();
                }}
                onError={(err: any) => {
                  console.warn('Google auth warning:', err);
                  setAuthError(err?.message || 'Google auth error');
                }}
                locale={locale}
              />
            </div>
          )}

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
