'use client'

import React from 'react';
import { ArrowUpCircle } from 'lucide-react';
import { UpdateInfo } from '@/services/updateService';
import { useT } from '@/contexts/I18nContext';

interface UpdateBannerProps {
  updateInfo: UpdateInfo | null;
  onUpdate: () => void;
}

/**
 * Persistent, non-blocking "update available" banner pinned to the bottom-left
 * corner (Claude Desktop style). It stays visible until the user installs the
 * update, so updates are never missed - unlike the transient toast it replaces.
 * Clicking "Update" opens the existing install dialog (download + relaunch).
 *
 * Non-blocking: the wrapper passes pointer events through; only the pill itself
 * is interactive. z-40 keeps it below modal dialogs (z-50) so the install dialog
 * always sits on top.
 */
export function UpdateBanner({ updateInfo, onUpdate }: UpdateBannerProps) {
  const t = useT();

  if (!updateInfo?.available) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-40 pointer-events-none select-none">
      <div className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-blue-200 bg-white/95 py-1.5 pl-3 pr-1.5 shadow-lg backdrop-blur-sm">
        <ArrowUpCircle className="h-4 w-4 shrink-0 text-blue-600" />
        <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
          {t('misc.updateBanner.label', { version: updateInfo.version })}
        </span>
        <button
          onClick={onUpdate}
          className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
        >
          {t('misc.updateBanner.action')}
        </button>
      </div>
    </div>
  );
}
