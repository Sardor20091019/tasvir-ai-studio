'use client';

import React from 'react';
import {
  SubtitlePresetStyle,
  SubtitleStyleConfig,
  VideoEditorProject,
  LocaleType,
  User,
} from '../types';
import { CapCutEditorPro } from './editor/CapCutEditorPro';

/* ──────────────────────────────────────────────────────────
   CAPCUT STYLE PRESETS
   ────────────────────────────────────────────────────────── */

export const SUBTITLE_PRESETS: Record<SubtitlePresetStyle, SubtitleStyleConfig> = {
  capcut_yellow: {
    preset: 'capcut_yellow',
    fontSize: 32,
    position: 'bottom',
    textColor: '#FFFFFF',
    highlightColor: '#FACC15', // Vibrant yellow
    bgColor: 'rgba(0, 0, 0, 0.4)',
    bgOpacity: 0.4,
    fontFamily: 'heading',
    animation: 'karaoke_active',
    textTransform: 'uppercase',
  },
  tiktok_green: {
    preset: 'tiktok_green',
    fontSize: 30,
    position: 'bottom',
    textColor: '#F8FAFC',
    highlightColor: '#4ADE80', // Neon emerald
    bgColor: 'rgba(15, 23, 42, 0.85)',
    bgOpacity: 0.85,
    fontFamily: 'sans',
    animation: 'word_pop',
    textTransform: 'none',
  },
  reels_cyan: {
    preset: 'reels_cyan',
    fontSize: 28,
    position: 'bottom',
    textColor: '#FFFFFF',
    highlightColor: '#38BDF8', // Cyan electric
    bgColor: 'rgba(0, 0, 0, 0.65)',
    bgOpacity: 0.65,
    fontFamily: 'heading',
    animation: 'karaoke_active',
    textTransform: 'uppercase',
  },
  minimal_white: {
    preset: 'minimal_white',
    fontSize: 26,
    position: 'bottom',
    textColor: '#FFFFFF',
    highlightColor: '#F8FAFC',
    bgColor: 'rgba(0, 0, 0, 0.25)',
    bgOpacity: 0.25,
    fontFamily: 'sans',
    animation: 'none',
    textTransform: 'none',
  },
  cinema_gold: {
    preset: 'cinema_gold',
    fontSize: 30,
    position: 'bottom',
    textColor: '#FEF3C7',
    highlightColor: '#E0AC75', // Warm cinematic gold
    bgColor: 'rgba(10, 10, 15, 0.6)',
    bgOpacity: 0.6,
    fontFamily: 'serif',
    animation: 'typewriter',
    textTransform: 'none',
  },
  uzum_coral: {
    preset: 'uzum_coral',
    fontSize: 32,
    position: 'bottom',
    textColor: '#FFFFFF',
    highlightColor: '#FB923C', // Uzum warm orange
    bgColor: 'rgba(20, 20, 28, 0.85)',
    bgOpacity: 0.85,
    fontFamily: 'heading',
    animation: 'word_pop',
    textTransform: 'uppercase',
  },
};

/* ──────────────────────────────────────────────────────────
   CAPCUT VIDEO EDITOR PRO COMPONENT
   ────────────────────────────────────────────────────────── */

interface CapCutEditorProps {
  initialProject?: VideoEditorProject | null;
  locale?: LocaleType;
  user?: User | null;
  onSave?: (project: VideoEditorProject) => void;
  onBackToStudio?: () => void;
}

export function CapCutEditor(props: CapCutEditorProps) {
  return <CapCutEditorPro {...props} />;
}
