'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User as UserIcon,
  Coins,
  ShieldCheck,
  Save,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  Sparkles,
  Database,
} from 'lucide-react';
import { User, LocaleType } from '../types';
import { api } from '../lib/api';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUpdateUser: (user: User | null) => void;
  locale: LocaleType;
  onOpenCheckout: () => void;
}

export function ProfileModal({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  locale,
  onOpenCheckout,
}: ProfileModalProps) {
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhoneNumber(user.phone_number || '');
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const t = {
    uz: {
      title: 'Mening profilim',
      subtitle: 'Shaxsiy maʼlumotlar va maʼlumotlar bazasidagi tokenlar balansi',
      dbTokensTitle: 'Maʼlumotlar bazasida saqlangan tokenlar',
      dbTokensNote: 'PostgreSQL bazasida xavfsiz saqlangan va tasdiqlangan',
      requestTokens: 'Token soʻrash',
      fullNameLabel: 'Toʻliq ismingiz',
      fullNamePlaceholder: 'Ismingizni kiriting',
      phoneLabel: 'Telefon raqamingiz',
      phonePlaceholder: '+998 90 123 45 67',
      emailLabel: 'Google Email hisobingiz',
      roleLabel: 'Hisob turi',
      userRole: 'Standart Foydalanuvchi',
      saveBtn: 'Oʻzgarishlarni saqlash',
      savingBtn: 'Saqlanmoqda...',
      logoutBtn: 'Hisobdan chiqish',
      successSaved: 'Maʼlumotlar muvaffaqiyatli bazaga saqlandi!',
    },
    en: {
      title: 'My Profile',
      subtitle: 'Personal details and token balance verified in database',
      dbTokensTitle: 'Tokens Saved on Database',
      dbTokensNote: 'Safely persisted and verified in PostgreSQL database',
      requestTokens: 'Request tokens',
      fullNameLabel: 'Full Name',
      fullNamePlaceholder: 'Enter your name',
      phoneLabel: 'Phone Number',
      phonePlaceholder: '+998 90 123 45 67',
      emailLabel: 'Google Email Account',
      roleLabel: 'Account Role',
      userRole: 'Standard User',
      saveBtn: 'Save Changes',
      savingBtn: 'Saving...',
      logoutBtn: 'Sign Out',
      successSaved: 'Profile successfully updated and saved to database!',
    },
    ru: {
      title: 'Мой профиль',
      subtitle: 'Личные данные и баланс токенов в базе данных',
      dbTokensTitle: 'Токены, сохраненные в базе данных',
      dbTokensNote: 'Надежно сохранены и подтверждены в базе PostgreSQL',
      requestTokens: 'Запросить токены',
      fullNameLabel: 'Ваше имя и фамилия',
      fullNamePlaceholder: 'Введите ваше имя',
      phoneLabel: 'Номер телефона',
      phonePlaceholder: '+998 90 123 45 67',
      emailLabel: 'Google Email аккаунт',
      roleLabel: 'Тип аккаунта',
      userRole: 'Пользователь',
      saveBtn: 'Сохранить изменения',
      savingBtn: 'Сохранение...',
      logoutBtn: 'Выйти из аккаунта',
      successSaved: 'Данные успешно обновлены и сохранены в базе!',
    },
  }[locale] || {
    title: 'My Profile',
    subtitle: 'Personal details and token balance verified in database',
    dbTokensTitle: 'Tokens Saved on Database',
    dbTokensNote: 'Safely persisted and verified in PostgreSQL database',
    requestTokens: 'Request tokens',
    fullNameLabel: 'Full Name',
    fullNamePlaceholder: 'Enter your name',
    phoneLabel: 'Phone Number',
    phonePlaceholder: '+998 90 123 45 67',
    emailLabel: 'Google Email Account',
    roleLabel: 'Account Role',
    userRole: 'Standard User',
    saveBtn: 'Save Changes',
    savingBtn: 'Saving...',
    logoutBtn: 'Sign Out',
    successSaved: 'Profile successfully updated and saved to database!',
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updated = await api.updateProfile({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
      });
      onUpdateUser(updated);
      setSuccessMessage(t.successSaved);
      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Xatolik yuz berdi');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    onUpdateUser(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-border shadow-2xl p-6 sm:p-7 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-bento-peach text-coral font-bold flex items-center justify-center text-sm shadow-2xs">
                {user.full_name ? user.full_name[0] : <UserIcon className="h-4 w-4" />}
              </div>
              <h2 className="text-xl font-heading font-extrabold text-ink tracking-tight">
                {t.title}
              </h2>
            </div>
            <p className="text-xs text-ink-muted">
              {t.subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-canvas text-ink-muted hover:text-ink transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tokens Saved on DB Bento Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/30 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-amber-900">
              <Database className="h-3.5 w-3.5 text-coral" />
              <span>{t.dbTokensTitle}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-heading font-black text-3xl text-coral tracking-tight">
                {user.credits_balance}
              </span>
              <span className="text-xs font-mono font-semibold text-ink-muted">
                {locale === 'en' ? 'tokens' : locale === 'ru' ? 'токенов' : 'ta video tokeni'}
              </span>
            </div>
            <p className="text-[11px] text-ink-muted flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              <span>{t.dbTokensNote}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenCheckout();
            }}
            className="shrink-0 px-3 py-2 rounded-xl bg-coral hover:bg-coral-dark text-white font-heading font-bold text-xs shadow-xs transition-colors tactile-btn flex items-center gap-1.5"
          >
            <Coins className="h-3.5 w-3.5" />
            <span>{t.requestTokens}</span>
          </button>
        </div>

        {/* Success / Error Banners */}
        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* Profile Edit Form */}
        <form onSubmit={handleSave} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-heading font-bold text-ink flex items-center gap-1.5">
              <UserIcon className="h-3.5 w-3.5 text-coral" />
              <span>{t.fullNameLabel}</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t.fullNamePlaceholder}
              required
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-border bg-canvas/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-heading font-bold text-ink flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-coral" />
              <span>{t.phoneLabel}</span>
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder={t.phonePlaceholder}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono rounded-xl border border-border bg-canvas/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
            />
          </div>

          {/* Google Email (Readonly Verified) */}
          {user.email && (
            <div className="space-y-1.5">
              <label className="text-xs font-heading font-bold text-ink flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-emerald-600" />
                <span>{t.emailLabel}</span>
              </label>
              <div className="px-3.5 py-2.5 text-xs sm:text-sm font-mono rounded-xl border border-border bg-neutral-100 text-ink flex items-center justify-between">
                <span>{user.email}</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Google Verified</span>
                </span>
              </div>
            </div>
          )}

          {/* Role & Plan Information */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-canvas border border-border">
              <span className="text-[10px] font-mono uppercase text-ink-muted block">
                {t.roleLabel}
              </span>
              <span className="text-xs font-heading font-bold text-ink capitalize">
                {user.role === 'admin' ? 'Administrator' : t.userRole}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-canvas border border-border">
              <span className="text-[10px] font-mono uppercase text-ink-muted block">
                Tarif / Plan
              </span>
              <span className="text-xs font-heading font-bold text-coral capitalize">
                {user.plan_tier || 'Starter Shop'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 px-4 rounded-xl bg-coral hover:bg-coral-dark text-white font-heading font-bold text-xs shadow-xs transition-colors tactile-btn flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isSaving ? t.savingBtn : t.saveBtn}</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full sm:w-auto py-3 px-4 rounded-xl bg-canvas hover:bg-red-50 text-ink-muted hover:text-red-700 border border-border font-heading font-bold text-xs transition-colors tactile-btn flex items-center justify-center gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{t.logoutBtn}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

