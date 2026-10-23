'use client';

import React, { useState } from 'react';
import { EditorProvider } from './context/EditorContext';
import { EditorHeader } from './components/EditorHeader';
import { AssetPanel } from './components/AssetPanel/AssetPanel';
import { PreviewPlayer } from './components/PreviewPlayer/PreviewPlayer';
import { PropertyInspector } from './components/Inspector/PropertyInspector';
import { Timeline } from './components/Timeline/Timeline';
import { ExportModal } from './components/ExportModal/ExportModal';
import { VideoEditorProject, LocaleType, User } from '../../types';

interface CapCutEditorProProps {
  initialProject?: VideoEditorProject | null;
  locale?: LocaleType;
  user?: User | null;
  onBackToStudio?: () => void;
  onSave?: (project: VideoEditorProject) => void;
}

function EditorWorkspace({ onBackToStudio }: { onBackToStudio?: () => void }) {
  const [isExportOpen, setIsExportOpen] = useState(false);

  return (
    <div className="flex-1 flex flex-col h-screen max-h-screen bg-obsidian text-ink overflow-hidden select-none">
      {/* ── TOP HEADER ── */}
      <EditorHeader
        onBack={onBackToStudio}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* ── MIDDLE WORKSPACE: ASSET PANEL + STAGE + INSPECTOR ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left: Asset Library Side Panel */}
        <AssetPanel />

        {/* Center: Live Preview Stage */}
        <PreviewPlayer />

        {/* Right: Contextual Property Inspector */}
        <PropertyInspector />
      </div>

      {/* ── BOTTOM MULTI-TRACK TIMELINE ── */}
      <Timeline />

      {/* ── EXPORT MODAL ── */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
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

