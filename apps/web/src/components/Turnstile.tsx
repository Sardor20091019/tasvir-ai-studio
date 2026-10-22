'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
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

  useEffect(() => {
    let isMounted = true;

    const renderWidget = () => {
      if (!containerRef.current || !window.turnstile || widgetIdRef.current) return;

      try {
        containerRef.current.innerHTML = '';
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: 'light',
          size: 'normal',
          callback: (token: string) => {
            if (isMounted) {
              setIsVerified(true);
              setHasError(false);
              onVerify(token);
            }
          },
          'expired-callback': () => {
            if (isMounted) {
              setIsVerified(false);
              onExpire?.();
            }
          },
          'error-callback': (err: any) => {
            console.warn('Cloudflare Turnstile warning/error:', err);
            if (isMounted) {
              setHasError(true);
              onError?.(err);
            }
          },
        });
        widgetIdRef.current = id;
        setIsLoaded(true);
      } catch (e) {
        console.warn('Turnstile render exception:', e);
        if (isMounted) setHasError(true);
      }
    };

    // Check if script is already present in document
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
      document.head.appendChild(script);
    } else {
      if (window.turnstile) {
        renderWidget();
      } else {
        script.addEventListener('load', renderWidget);
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
  }, [siteKey]);

  const handleTestBypass = () => {
    const testToken = `cf_test_pass_${Date.now()}`;
    setIsVerified(true);
    setHasError(false);
    onVerify(testToken);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center my-2">
      {/* Turnstile Container where Cloudflare iframe mounts */}
      <div
        ref={containerRef}
        className="min-h-[65px] flex items-center justify-center w-full"
      />

      {/* Loading state before script mounts */}
      {!isLoaded && !hasError && (
        <div className="h-[65px] w-full max-w-[300px] rounded-xl border border-border bg-canvas/80 animate-pulse flex items-center justify-center gap-2 text-xs text-ink-muted">
          <div className="h-4 w-4 border-2 border-coral/30 border-t-coral rounded-full animate-spin" />
          <span>Cloudflare Turnstile yuklanmoqda...</span>
        </div>
      )}

      {/* Fallback if Cloudflare blocks localhost domain or user tests without internet */}
      {hasError && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs w-full space-y-2">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              {locale === 'uz'
                ? "Turnstile xabari: 'localhost' domeni Cloudflare Dashboard-da qo'shilmagan bo'lishi mumkin."
                : locale === 'en'
                ? "Turnstile notice: 'localhost' domain might not be added in Cloudflare Dashboard."
                : "Уведомление Turnstile: домен 'localhost' может быть не указан в Cloudflare Dashboard."}
            </span>
          </div>
          <button
            type="button"
            onClick={handleTestBypass}
            className="w-full py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-sm transition-colors"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>
              {locale === 'uz'
                ? 'Test rejimida tasdiqlash (Dev Bypass)'
                : locale === 'en'
                ? 'Confirm in test mode (Dev Bypass)'
                : 'Подтвердить в тестовом режиме (Dev Bypass)'}
            </span>
          </button>
        </div>
      )}

      {isVerified && (
        <div className="mt-1 flex items-center gap-1.5 text-[11px] font-mono text-emerald-700">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Turnstile Captcha tasdiqlandi ✓</span>
        </div>
      )}
    </div>
  );
}

