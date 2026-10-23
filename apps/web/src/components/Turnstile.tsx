'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, AlertCircle, RotateCcw } from 'lucide-react';
import { LocaleType } from '../types';

interface TurnstileProps {
  siteKey?: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (error: any) => void;
  locale?: LocaleType;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          'error-callback'?: (error: any) => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact';
          retry?: 'auto' | 'never';
          'retry-interval'?: number;
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

export function Turnstile({
  siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAAFdvkOhmRvnl6lUT',
  onVerify,
  onExpire,
  onError,
  locale = 'uz',
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const effectiveSiteKey =
    siteKey ||
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
    (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? '1x00000000000000000000AA'
      : '0x4AAAAAAFdvkOhmRvnl6lUT');

  const renderWidget = () => {
    if (!containerRef.current || !window.turnstile) return;

    try {
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {}
        widgetIdRef.current = null;
      }

      containerRef.current.innerHTML = '';
      const id = window.turnstile.render(containerRef.current, {
        sitekey: effectiveSiteKey,
        theme: 'auto',
        size: 'normal',
        callback: (token: string) => {
          setIsVerified(true);
          setHasError(false);
          setIsLoaded(true);
          onVerify(token);
        },
        'expired-callback': () => {
          setIsVerified(false);
          onExpire?.();
        },
        'error-callback': (err: any) => {
          console.warn('Cloudflare Turnstile error:', err);
          setIsVerified(false);
          setHasError(true);
          onError?.(err);
        },
      });
      widgetIdRef.current = id;
      setIsLoaded(true);
    } catch (e) {
      console.warn('Turnstile render exception:', e);
      setHasError(true);
      onError?.(e);
    }
  };

  const handleRetry = () => {
    setHasError(false);
    setIsVerified(false);
    setIsLoaded(false);
    onExpire?.();
    renderWidget();
  };

  useEffect(() => {
    let isMounted = true;

    const SCRIPT_ID = 'cf-turnstile-script';
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (isMounted) {
          renderWidget();
        }
      };
      script.onerror = () => {
        if (isMounted) {
          setHasError(true);
        }
      };
      document.head.appendChild(script);
    } else {
      if (window.turnstile) {
        renderWidget();
      } else {
        script.addEventListener('load', () => {
          if (isMounted) renderWidget();
        });
      }
    }

    return () => {
      isMounted = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {}
        widgetIdRef.current = null;
      }
    };
  }, [effectiveSiteKey]);

  return (
    <div className="w-full flex flex-col items-center justify-center my-2">
      <div
        ref={containerRef}
        className="min-h-[65px] flex items-center justify-center w-full"
      />

      {!isLoaded && !hasError && !isVerified && (
        <div className="h-[65px] w-full max-w-[300px] rounded-xl border border-border bg-canvas/80 animate-pulse flex items-center justify-center gap-2 text-xs text-ink-muted">
          <div className="h-4 w-4 border-2 border-coral/30 border-t-coral rounded-full animate-spin" />
          <span>Cloudflare Turnstile yuklanmoqda...</span>
        </div>
      )}

      {/* When Cloudflare fails: show error & retry button (NO bypass!) */}
      {hasError && !isVerified && (
        <div className="flex flex-col items-center gap-2 mt-2 p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-center animate-in fade-in duration-200 w-full max-w-[320px]">
          <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>
              {locale === 'uz'
                ? 'Cloudflare Turnstile tekshiruvida xatolik yuz berdi'
                : locale === 'en'
                ? 'Cloudflare Turnstile verification failed'
                : 'Ошибка проверки Cloudflare Turnstile'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-ink text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <RotateCcw className="h-3.5 w-3.5 text-ink-muted" />
            <span>
              {locale === 'uz' ? 'Qayta urinish' : locale === 'en' ? 'Retry' : 'Повторить'}
            </span>
          </button>
        </div>
      )}

      {isVerified && (
        <div className="mt-1 flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>
            {locale === 'uz'
              ? 'Xavfsizlik tekshiruvi tasdiqlandi ✓'
              : locale === 'en'
              ? 'Security check verified ✓'
              : 'Проверка безопасности пройдена ✓'}
          </span>
        </div>
      )}
    </div>
  );
}
