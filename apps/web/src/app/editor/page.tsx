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

export default function EditorPage(): React.ReactElement {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const { locale, setLocale, toggleLocale: handleToggleLocale } = useAppLocale();
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [initialProject, setInitialProject] = useState<VideoEditorProject | null>(null);

  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const urlJobId = searchParams.get('jobId');
      const urlVideoUrl = searchParams.get('videoUrl');

      if (urlVideoUrl) {
        setInitialProject({
          id: `proj-${Date.now()}`,
          title: 'Import qilingan video',
          videoUrl: urlVideoUrl,
          duration: 15,
          subtitles: [],
          style: {
            preset: 'capcut_yellow',
            fontSize: 32,
            position: 'bottom',
            textColor: '#FFFFFF',
            highlightColor: '#FACC15',
            bgColor: 'rgba(0,0,0,0.4)',
            bgOpacity: 0.4,
            fontFamily: 'heading',
            animation: 'karaoke_active',
            textTransform: 'uppercase',
          },
        });
        return;
      }

      if (urlJobId) {
        api.getPromptVideoStatus(urlJobId).then((job) => {
          if (job && (job.videoUrl || (job.scenes && job.scenes.length > 0))) {
            setInitialProject({
              id: job.jobId || urlJobId,
              title: job.prompt || 'AI Video',
              videoUrl: job.videoUrl || '',
              duration: job.totalDurationSeconds || 15,
              scenes: job.scenes || [],
              subtitles: (job.scenes || []).map((s: any, idx: number) => ({
                id: `cue-${idx}`,
                startSec: idx * 5,
                endSec: (idx + 1) * 5,
                text: s.dialogueScript || s.caption || '',
                words: s.karaokeSubtitles || [],
              })),
              style: {
                preset: 'capcut_yellow',
                fontSize: 32,
                position: 'bottom',
                textColor: '#FFFFFF',
                highlightColor: '#FACC15',
                bgColor: 'rgba(0,0,0,0.4)',
                bgOpacity: 0.4,
                fontFamily: 'heading',
                animation: 'karaoke_active',
                textTransform: 'uppercase',
              },
            });
          }
        }).catch(() => {});
        return;
      }

      const saved = localStorage.getItem('tasvir_editor_current_project');
      if (saved) {
        setInitialProject(JSON.parse(saved));
      }
    } catch {
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
    <div className="h-[100dvh] max-h-[100dvh] bg-obsidian text-ink flex flex-col font-sans overflow-hidden">
      <div className="hidden lg:block flex-shrink-0">
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
      </div>

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
