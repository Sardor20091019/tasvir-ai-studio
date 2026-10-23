'use client';

import React, { useState, useEffect } from 'react';
import { Navbar, NavTabType } from '../../components/Navbar';
import { CapCutEditor } from '../../components/CapCutEditor';
import { AuthModal } from '../../components/AuthModal';
import { ProfileModal } from '../../components/ProfileModal';
import { User, LocaleType, VideoJob } from '../../types';
import { api } from '../../lib/api';
import { useRouter } from 'next/navigation';

export default function EditorPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [locale, setLocale] = useState<LocaleType>('uz');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [jobs, setJobs] = useState<VideoJob[]>([]);

  useEffect(() => {
    api.getMe().then((u) => {
      if (u) setUser(u);
    });
  }, []);

  const handleToggleLocale = () => {
    setLocale((prev) => {
      if (prev === 'uz') return 'en';
      if (prev === 'en') return 'ru';
      return 'uz';
    });
  };

  const handleTabSwitch = (tab: NavTabType) => {
    if (tab === 'editor') return;
    router.push(`/?tab=${tab}`);
  };

  return (
    <div className="min-h-screen bg-obsidian text-ink flex flex-col font-sans">
      <Navbar
        user={user}
        locale={locale}
        onToggleLocale={handleToggleLocale}
        activeTab="editor"
        setActiveTab={handleTabSwitch}
        onOpenCheckout={() => router.push('/?tab=pricing')}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        libraryCount={jobs.length}
      />

      <main className="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-6 flex flex-col">
        <CapCutEditor
          locale={locale}
          user={user}
          onBackToStudio={() => router.push('/?tab=prompt')}
        />
      </main>

      {/* Auth & Profile Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(u) => setUser(u)}
        locale={locale}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onUpdateUser={(u) => setUser(u)}
        onOpenCheckout={() => router.push('/?tab=pricing')}
        locale={locale}
      />
    </div>
  );
}
