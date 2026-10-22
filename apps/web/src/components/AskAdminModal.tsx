'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Send,
  Sparkles,
  CheckCircle2,
  Lock,
  Clock,
  Coins,
  UserCheck,
  AlertCircle,
  ExternalLink,
  Users,
} from 'lucide-react';
import { User } from '../types';
import { api } from '../lib/api';

interface AskAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUpdateUser: (user: User) => void;
  locale?: 'uz' | 'ru';
  initialPlanId?: string;
}

export function AskAdminModal({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  locale = 'uz',
  initialPlanId,
}: AskAdminModalProps) {
  const [activeTab, setActiveTab] = useState<'request' | 'telegram' | 'admin'>('request');
  const [requestedTokens, setRequestedTokens] = useState<number>(35);
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialPlanId === 'starter') {
      setRequestedTokens(10);
    } else if (initialPlanId === 'agency') {
      setRequestedTokens(100);
    } else if (initialPlanId === 'shop_pro') {
      setRequestedTokens(35);
    }
  }, [initialPlanId]);

  // Admin Panel State
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [adminTargetPhone, setAdminTargetPhone] = useState('');
  const [adminTokensToGrant, setAdminTokensToGrant] = useState<number>(20);
  const [adminReason, setAdminReason] = useState('Admin orqali ajratildi');
  const [adminActionSuccess, setAdminActionSuccess] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isOpen && isAdmin) {
      loadAdminRequests();
    }
  }, [isOpen, isAdmin]);

  const loadAdminRequests = async () => {
    try {
      const list = await api.adminListRequests();
      setPendingRequests(list || []);
    } catch (e) {}
  };

  if (!isOpen) return null;

  const t = {
    uz: {
      title: 'Tokenlar & Balansni Toʻldirish',
      subtitle: 'Toʻlov tizimlari oʻchirildi. Tokenlar faqat platforma administratori tomonidan beriladi.',
      currentBalance: 'Mavjud balansingiz:',
      tokensUnit: 'ta video tokeni',
      tabRequest: 'Adminga soʻrov yuborish',
      tabTelegram: 'Telegram orqali bogʻlanish',
      tabAdmin: 'Admin Paneli',
      tokenPackages: 'Kerakli tokenlar miqdorini tanlang:',
      noteLabel: 'Qoʻshimcha izoh (ixtiyoriy):',
      notePlaceholder: 'Masalan: Uzum doʻkonimiz yangi mahsulotlari uchun 35 ta video rolik olmoqchimiz...',
      submitRequest: 'Adminga Soʻrov Yuborish',
      submitting: 'Yuborilmoqda...',
      successTitle: 'Soʻrovingiz adminga yuborildi!',
      successSub: 'Platforma administratori soʻrovingizni koʻrib chiqib, hisobingizga tez orada tokenlarni qoʻshadi.',
      tgTitle: 'Administrator bilan Telegramda toʻgʻridan-toʻgʻri bogʻlaning',
      tgSub: 'Xabaringizda oʻz telefon raqamingiz va kerakli tokenlar sonini koʻrsating:',
      tgButton: 'Telegramda Yozish (@astro_spectrum)',
      adminTitle: 'Administrator Boshqaruvi: Token Berish',
      grantButton: 'Tokenlarni Taqdim Etish',
    },
    ru: {
      title: 'Токены & Пополнение Баланса',
      subtitle: 'Платежные системы отключены. Токены выдаются исключительно администратором платформы.',
      currentBalance: 'Ваш баланс:',
      tokensUnit: 'видео токенов',
      tabRequest: 'Запрос администратору',
      tabTelegram: 'Связаться в Telegram',
      tabAdmin: 'Панель Админа',
      tokenPackages: 'Выберите необходимое количество токенов:',
      noteLabel: 'Дополнительное примечание (необязательно):',
      notePlaceholder: 'Например: Планируем создать 35 видео для магазина на Uzum...',
      submitRequest: 'Отправить запрос админу',
      submitting: 'Отправка...',
      successTitle: 'Запрос отправлен администратору!',
      successSub: 'Администратор платформы рассмотрит запрос и начислит токены на ваш аккаунт.',
      tgTitle: 'Свяжитесь напрямую с администратором в Telegram',
      tgSub: 'В сообщении укажите ваш номер телефона и желаемое количество токенов:',
      tgButton: 'Написать в Telegram (@astro_spectrum)',
      adminTitle: 'Управление Администратора: Выдача Токенов',
      grantButton: 'Начислить токены',
    },
  }[locale];

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.requestTokens(requestedTokens, note);
      setRequestSuccess(true);
      setSuccessMessage(res.message);
    } catch (err: any) {
      setError(err?.message || 'Xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminGrantToUser = async (targetPhone?: string, tokens?: number, reqId?: string) => {
    setIsLoading(true);
    setAdminActionSuccess(null);
    try {
      const res = await api.adminGrantTokens({
        targetPhoneNumber: targetPhone || adminTargetPhone,
        tokensToAdd: tokens || adminTokensToGrant,
        reason: adminReason,
        requestId: reqId,
      });

      setAdminActionSuccess(res.message);

      // Refresh admin requests and user balance if current user was target
      await loadAdminRequests();
      const me = await api.getMe();
      if (me) onUpdateUser(me);
    } catch (err: any) {
      alert(`Xatolik: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const telegramPrefillMessage = encodeURIComponent(
    `Assalomu alaykum! Tasvir.ai hisobimga ${requestedTokens} ta token soʻramoqchiman.\nFoydalanuvchi: ${user?.full_name || 'Mijoz'}\nTelefon: ${user?.phone_number || ''}\nID: ${user?.id || ''}`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-canvas/40">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-coral/10 border border-coral/20 flex items-center justify-center text-coral shadow-xs">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base sm:text-lg text-ink">
                {t.title}
              </h3>
              <p className="text-xs text-ink-muted">
                {t.currentBalance} <strong className="text-coral font-bold">{user?.credits_balance || 0}</strong> {t.tokensUnit}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-ink-muted hover:text-ink hover:bg-canvas transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Security Alert: Payments Removed */}
        <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center gap-2">
          <Lock className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="font-medium">{t.subtitle}</span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border text-xs font-semibold bg-canvas/20">
          <button
            onClick={() => setActiveTab('request')}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              activeTab === 'request'
                ? 'border-coral text-coral font-bold bg-white'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {t.tabRequest}
          </button>
          <button
            onClick={() => setActiveTab('telegram')}
            className={`flex-1 py-3 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'telegram'
                ? 'border-coral text-coral font-bold bg-white'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <Send className="h-3.5 w-3.5 text-sky-500" />
            <span>{t.tabTelegram}</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex-1 py-3 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'border-purple-600 text-purple-700 font-bold bg-purple-50/50'
                  : 'border-transparent text-purple-600 hover:text-purple-800'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
              <span>{t.tabAdmin}</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6">
          {/* TAB 1: USER REQUEST FORM */}
          {activeTab === 'request' && (
            <div>
              {!requestSuccess ? (
                <form onSubmit={handleSendRequest} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-ink block">
                      {t.tokenPackages}
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { tokens: 10, label: '10 Token', badge: 'Starter' },
                        { tokens: 35, label: '35 Token', badge: 'Pro Doʻkon' },
                        { tokens: 100, label: '100 Token', badge: 'Agentlik' },
                      ].map((pkg) => {
                        const isSelected = requestedTokens === pkg.tokens;
                        return (
                          <button
                            key={pkg.tokens}
                            type="button"
                            onClick={() => setRequestedTokens(pkg.tokens)}
                            className={`p-3 rounded-xl border text-left transition-all tactile-btn ${
                              isSelected
                                ? 'border-coral bg-coral/5 ring-2 ring-coral/20 font-bold'
                                : 'border-border bg-canvas/40 hover:bg-canvas'
                            }`}
                          >
                            <span className="text-[10px] uppercase font-bold text-coral block">
                              {pkg.badge}
                            </span>
                            <span className="font-heading text-sm text-ink font-extrabold mt-0.5 block">
                              {pkg.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-ink block">
                      {t.noteLabel}
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      placeholder={t.notePlaceholder}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border bg-canvas/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all resize-none"
                    />
                  </div>

                  {error && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-4 rounded-xl bg-coral hover:bg-coral-dark text-white font-heading font-extrabold text-sm shadow-md transition-all tactile-btn flex items-center justify-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>{isLoading ? t.submitting : t.submitRequest}</span>
                  </button>
                </form>
              ) : (
                <div className="py-6 text-center space-y-4">
                  <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-ink text-base">
                      {t.successTitle}
                    </h4>
                    <p className="text-xs text-ink-muted mt-1 max-w-sm mx-auto leading-relaxed">
                      {successMessage || t.successSub}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setRequestSuccess(false);
                      onClose();
                    }}
                    className="px-6 py-2.5 rounded-xl bg-ink text-white text-xs font-bold transition-opacity hover:opacity-90"
                  >
                    Tushundim
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TELEGRAM DIRECT CONTACT */}
          {activeTab === 'telegram' && (
            <div className="space-y-5 text-center py-3">
              <div className="h-14 w-14 mx-auto rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                <Send className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h4 className="font-heading font-bold text-ink text-sm sm:text-base">
                  {t.tgTitle}
                </h4>
                <p className="text-xs text-ink-muted max-w-md mx-auto leading-relaxed">
                  {t.tgSub}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-canvas border border-border text-xs font-mono text-left space-y-1 text-ink-muted">
                <p>👤 Foydalanuvchi: <strong className="text-ink">{user?.full_name}</strong></p>
                <p>📞 Telefon: <strong className="text-ink">{user?.phone_number}</strong></p>
                <p>🪙 Soʻralayotgan token: <strong className="text-coral">{requestedTokens} ta</strong></p>
              </div>

              <a
                href={`https://t.me/astro_spectrum?text=${telegramPrefillMessage}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 px-4 rounded-xl bg-[#229ED9] hover:bg-[#1E88E5] text-white font-heading font-bold text-xs shadow-md transition-all tactile-btn flex items-center justify-center gap-2"
              >
                <Send className="h-4 w-4" />
                <span>{t.tgButton}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          {/* TAB 3: ADMIN MANAGEMENT PANEL (Admin Only) */}
          {activeTab === 'admin' && isAdmin && (
            <div className="space-y-6 max-h-[420px] overflow-y-auto pr-1">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-800">
                  <ShieldCheck className="h-4 w-4 text-purple-600" />
                  <span>{t.adminTitle}</span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                  Admin: {user?.phone_number || '+998-99-099-11-12'}
                </span>
              </div>

              {adminActionSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{adminActionSuccess}</span>
                </div>
              )}

              {/* Direct Token Grant Form */}
              <div className="p-4 rounded-xl bg-canvas/60 border border-border space-y-3">
                <span className="text-xs font-bold text-ink block">
                  Toʻgʻridan-toʻgʻri telefon raqamga token berish:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <input
                    type="text"
                    value={adminTargetPhone}
                    onChange={(e) => setAdminTargetPhone(e.target.value)}
                    placeholder="+998-99-099-11-12"
                    className="sm:col-span-6 px-3 py-2 text-xs rounded-lg border border-border bg-white"
                  />
                  <input
                    type="number"
                    value={adminTokensToGrant}
                    onChange={(e) => setAdminTokensToGrant(Number(e.target.value))}
                    placeholder="Token soni"
                    className="sm:col-span-3 px-3 py-2 text-xs rounded-lg border border-border bg-white"
                  />
                  <button
                    type="button"
                    disabled={isLoading || !adminTargetPhone}
                    onClick={() => handleAdminGrantToUser()}
                    className="sm:col-span-3 py-2 px-3 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold tactile-btn disabled:opacity-50"
                  >
                    {t.grantButton}
                  </button>
                </div>
              </div>

              {/* Pending Requests List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-ink block">
                  Kutilayotgan foydalanuvchi soʻrovlari ({pendingRequests.length}):
                </span>
                {pendingRequests.length === 0 ? (
                  <p className="text-xs text-ink-muted py-3 text-center bg-canvas/40 rounded-xl border border-border">
                    Hozirda kutilayotgan soʻrovlar yoʻq.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {pendingRequests.map((req) => (
                      <div
                        key={req.requestId}
                        className="p-3 rounded-xl border border-border bg-white flex items-center justify-between text-xs gap-3"
                      >
                        <div>
                          <div className="font-bold text-ink flex items-center gap-1.5">
                            <span>{req.userName || 'Mijoz'}</span>
                            <span className="font-mono text-ink-muted font-normal">({req.userPhone})</span>
                          </div>
                          <div className="text-[11px] text-coral font-bold mt-0.5">
                            Soʻralmoqda: {req.requestedTokens} ta token
                          </div>
                          {req.note && (
                            <p className="text-[10px] text-ink-muted italic mt-0.5 max-w-xs truncate">
                              &quot;{req.note}&quot;
                            </p>
                          )}
                        </div>

                        {req.status === 'pending' ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleAdminGrantToUser(req.userPhone, req.requestedTokens, req.requestId)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] tactile-btn"
                            >
                              Tasdiqlash
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await api.adminRejectRequest(req.requestId);
                                await loadAdminRequests();
                              }}
                              className="px-2 py-1.5 rounded-lg border border-border hover:bg-red-50 text-red-600 text-[11px]"
                            >
                              Rad etish
                            </button>
                          </div>
                        ) : (
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                            {req.status}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
