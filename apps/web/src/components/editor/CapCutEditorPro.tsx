'use client';

import React, { useState } from 'react';
import { EditorProvider, useEditor } from './context/EditorContext';
import { EditorHeader } from './components/EditorHeader';
import { AssetPanel, AssetTabType } from './components/AssetPanel/AssetPanel';
import { PreviewPlayer } from './components/PreviewPlayer/PreviewPlayer';
import { PropertyInspector } from './components/Inspector/PropertyInspector';
import { Timeline } from './components/Timeline/Timeline';
import { ExportModal } from './components/ExportModal/ExportModal';
import { ReplaceMediaModal } from './components/ReplaceMediaModal/ReplaceMediaModal';
import { VideoEditorProject, LocaleType, User } from '../../types';
import {
  FolderOpen,
  Film,
  Music,
  Type,
  Sparkles,
  SlidersHorizontal,
  X,
} from 'lucide-react';

interface CapCutEditorProProps {
  initialProject?: VideoEditorProject | null;
  locale?: LocaleType;
  user?: User | null;
  onBackToStudio?: () => void;
  onSave?: (project: VideoEditorProject) => void;
}

type MobileTabType = AssetTabType | 'inspector';

function EditorWorkspace({ onBackToStudio }: { onBackToStudio?: () => void }) {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTabType | null>(null);
  const { locale, selectedClip } = useEditor();

  const labels = ({
    uz: {
      media: 'Fayllar',
      stock: 'Videolar',
      audio: 'Audio',
      text: 'Matn',
      effects: 'Filtrlar',
      inspector: 'Klip',
    },
    en: {
      media: 'Files',
      stock: 'Stock',
      audio: 'Audio',
      text: 'Text',
      effects: 'Filters',
      inspector: 'Clip',
    },
    ru: {
      media: 'Файлы',
      stock: 'Видео',
      audio: 'Аудио',
      text: 'Текст',
      effects: 'Фильтры',
      inspector: 'Клип',
    },
  } as Record<LocaleType, any>)[(locale as LocaleType) || 'uz'];

  return (
    <div className="flex-1 flex flex-col h-[100dvh] max-h-[100dvh] bg-obsidian text-ink overflow-hidden select-none">
      {/* ── TOP HEADER ── */}
      <EditorHeader
        onBack={onBackToStudio}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* ── MIDDLE WORKSPACE: ASSET PANEL + STAGE + INSPECTOR ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left: Asset Library Side Panel (Desktop only) */}
        <AssetPanel />

        {/* Center: Live Preview Stage */}
        <PreviewPlayer />

        {/* Right: Contextual Property Inspector (Desktop only) */}
        <PropertyInspector />
      </div>

      {/* ── BOTTOM MULTI-TRACK TIMELINE ── */}
      <Timeline />

      {/* ── MOBILE CAPCUT ACTION BAR (Phones / Tablets < lg) ── */}
      <div className="lg:hidden h-14 bg-obsidian-card border-t border-stroke flex items-center justify-around px-2 shrink-0 z-30 pb-[env(safe-area-inset-bottom,0px)]">
        {[
          { key: 'media' as MobileTabType, label: labels.media, icon: FolderOpen },
          { key: 'stock' as MobileTabType, label: labels.stock, icon: Film },
          { key: 'audio' as MobileTabType, label: labels.audio, icon: Music },
          { key: 'text' as MobileTabType, label: labels.text, icon: Type },
          { key: 'effects' as MobileTabType, label: labels.effects, icon: Sparkles },
          { key: 'inspector' as MobileTabType, label: labels.inspector, icon: SlidersHorizontal, badge: Boolean(selectedClip) },
        ].map((item) => {
          const isActive = mobileTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setMobileTab(isActive ? null : item.key)}
              className={`flex-1 flex flex-col items-center justify-center py-1 gap-1 text-[10px] font-mono transition-colors relative cursor-pointer ${
                isActive
                  ? 'text-accent-warm font-bold'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <item.icon className={`w-4 h-4 ${isActive ? 'text-accent-warm' : ''}`} />
              <span className="truncate max-w-[50px]">{item.label}</span>
              {item.badge && (
                <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-accent-warm animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── MOBILE SLIDE-UP DRAWER SHEET ── */}
      {mobileTab !== null && (
        <div className="fixed inset-0 z-50 lg:hidden bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200">
          {/* Backdrop click dismiss */}
          <div className="flex-1" onClick={() => setMobileTab(null)} />

          {/* Drawer content card */}
          <div className="bg-obsidian border-t border-stroke rounded-t-3xl max-h-[65vh] h-[60vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Top Drag Handle Indicator */}
            <div className="w-12 h-1 rounded-full bg-stroke/80 mx-auto my-2 shrink-0" />

            {mobileTab === 'inspector' ? (
              <PropertyInspector
                isMobileDrawer
                onCloseMobile={() => setMobileTab(null)}
              />
            ) : (
              <AssetPanel
                isMobileDrawer
                forcedTab={mobileTab as AssetTabType}
                onCloseMobile={() => setMobileTab(null)}
              />
            )}
          </div>
        </div>
      )}

      {/* ── EXPORT MODAL ── */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      <ReplaceMediaModal />
    </div>
  );
}

export function CapCutEditorPro({
  initialProject,
  locale = 'uz',
  user,
  onBackToStudio,
  onSave,
}: CapCutEditorProProps) {
  return (
    <EditorProvider initialProject={initialProject} locale={locale}>
      <EditorWorkspace onBackToStudio={onBackToStudio} />
    </EditorProvider>
  );
}

