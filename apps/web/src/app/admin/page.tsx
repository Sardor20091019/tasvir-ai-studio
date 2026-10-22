'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Crown } from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { AdminPanel } from '../../components/AdminPanel';
import { AuthModal } from '../../components/AuthModal';
import { User, LocaleType } from '../../types';
import { api } from '../../lib/api';

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [locale, setLocale] = useState<LocaleType>('uz');
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    api.getMe().then((u) => {
      if (u) setUser(u);
    });
  }, []);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <Navbar
        user={user}
        locale={locale}
        onToggleLocale={() => setLocale((prev) => (prev === 'uz' ? 'en' : prev === 'en' ? 'ru' : 'uz'))}
        onChangeLocale={setLocale}
        activeTab={'studio' as any}
        setActiveTab={() => {}}
        onOpenCheckout={() => {}}
        onOpenAuth={() => setIsAuthOpen(true)}
        libraryCount={0}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-20">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-border text-xs font-semibold text-ink-muted hover:text-ink tactile-btn"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Asosiy Studiyaga Qaytish</span>
          </Link>

          {user?.role === 'admin' && (
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-red-700 bg-red-100 px-3 py-1 rounded-full">
              <Crown className="h-3.5 w-3.5" />
              <span>Admin Rejimi Faol (role = admin)</span>
            </div>
          )}
        </div>

        <AdminPanel user={user} locale={locale} />
      </main>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(loggedInUser) => setUser(loggedInUser)}
        locale={locale}
      />
    </div>
  );
}
