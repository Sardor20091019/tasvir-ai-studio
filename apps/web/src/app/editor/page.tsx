'use client';

import React, { useState, useEffect } from 'react';
import { Navbar, NavTabType } from '../../components/Navbar';
import { CapCutEditor } from '../../components/CapCutEditor';
import { AuthModal } from '../../components/AuthModal';
import { ProfileModal } from '../../components/ProfileModal';
import { User, LocaleType, VideoJob, VideoEditorProject } from '../../types';
import { api } from '../../lib/api';
import { useRouter } from 'next/navigation';
import { useAppLocale } from '../../lib/useAppLocale';

export default function EditorPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const { locale, setLocale, toggleLocale: handleToggleLocale } = useAppLocale();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [initialProject, setInitialProject] = useState<VideoEditorProject | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('tasvir_editor_current_project');
      if (saved) {
        setInitialProject(JSON.parse(saved));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    api.getMe().then((u) => {
      if (u) setUser(u);
    });
  }, []);

  const handleTabSwitch = (tab: NavTabType) => {
    if (tab === 'editor') return;
    router.push(`/?tab=${tab}`);
  };

  return (
    <div className="h-screen max-h-screen bg-obsidian text-ink flex flex-col font-sans overflow-hidden">
      <Navbar
        user={user}
        locale={locale}
        onToggleLocale={handleToggleLocale}
        onChangeLocale={setLocale}
        activeTab="editor"
        setActiveTab={handleTabSwitch}
        onOpenCheckout={() => router.push('/?tab=pricing')}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        libraryCount={jobs.length}
      />

      <main className="flex-1 w-full flex flex-col overflow-hidden min-h-0">
        <CapCutEditor
          locale={locale}
          user={user}
          initialProject={initialProject}
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
