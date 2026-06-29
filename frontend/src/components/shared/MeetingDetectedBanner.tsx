'use client';

import React, { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useRouter, usePathname } from 'next/navigation';
import { Video, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useT } from '@/contexts/I18nContext';
import { useRecordingState, RecordingStatus } from '@/contexts/RecordingStateContext';
import { Analytics } from '@/lib/analytics';

/**
 * Автодетект встречи.
 *
 * Слушает события из Rust-вотчера (meeting_detector), который ловит активную
 * аудио-сессию приложений-звонилок (Zoom, Teams, десктоп-Телемост) и активный
 * микрофон в браузере (Google Meet, веб-Телемост, веб-Zoom). При обнаружении
 * показывает плашку «Записать встречу?». Запись стартует тем же путём, что и из
 * сайдбара (событие start-recording-from-sidebar / autoStartRecording flag).
 *
 * Не показывается во время онбординга (компонент монтируется только в main app)
 * и пока уже идёт запись.
 */
export function MeetingDetectedBanner() {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const { status, isRecording } = useRecordingState();

  const [visible, setVisible] = useState(false);
  const [appName, setAppName] = useState<string | null>(null);
  // Чтобы не показывать плашку повторно для той же встречи после «Не сейчас».
  const dismissedRef = useRef(false);

  const busy = isRecording || status !== RecordingStatus.IDLE;

  // Запускаем Rust-вотчер один раз при входе в основное приложение.
  useEffect(() => {
    invoke('start_meeting_detection').catch((e) =>
      console.error('[MeetingDetectedBanner] start_meeting_detection failed:', e)
    );
  }, []);

  // Слушаем события детектора.
  useEffect(() => {
    const unlistenDetected = listen<{ app: string }>('meeting-detected', (event) => {
      const name = event.payload?.app || null;
      setAppName(name);
      if (!dismissedRef.current) {
        setVisible(true);
        Analytics.track('meeting_autodetected', { app: name ?? 'unknown' });
      }
    });

    const unlistenEnded = listen('meeting-ended', () => {
      // Встреча закончилась — прячем плашку и сбрасываем «не сейчас» для следующей.
      setVisible(false);
      setAppName(null);
      dismissedRef.current = false;
    });

    return () => {
      unlistenDetected.then((fn) => fn());
      unlistenEnded.then((fn) => fn());
    };
  }, []);

  // Если началась запись (любым способом) — убираем плашку.
  useEffect(() => {
    if (busy) setVisible(false);
  }, [busy]);

  const handleRecord = () => {
    setVisible(false);
    Analytics.track('meeting_autodetect_accepted', { app: appName ?? 'unknown' });
    // Тот же механизм, что и кнопка записи в сайдбаре.
    if (pathname === '/') {
      window.dispatchEvent(new CustomEvent('start-recording-from-sidebar'));
    } else {
      try {
        sessionStorage.setItem('autoStartRecording', 'true');
      } catch {
        /* noop */
      }
      router.push('/');
    }
  };

  const handleDismiss = () => {
    dismissedRef.current = true;
    setVisible(false);
    Analytics.track('meeting_autodetect_dismissed', { app: appName ?? 'unknown' });
  };

  if (!visible || busy) return null;

  const description = appName
    ? t('meetingDetect.description', { app: appName })
    : t('meetingDetect.descriptionGeneric');

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[min(420px,calc(100vw-2rem))]">
      <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white shadow-lg p-4">
        <div className="flex-shrink-0 mt-0.5 w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center">
          <Video className="w-4 h-4 text-violet-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{t('meetingDetect.title')}</p>
          <p className="text-sm text-gray-600 mt-0.5 leading-snug">{description}</p>
          <div className="flex gap-2 mt-3">
            <Button
              onClick={handleRecord}
              className="h-8 px-3 bg-violet-600 hover:bg-violet-700 text-white text-sm"
            >
              {t('meetingDetect.record')}
            </Button>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              className="h-8 px-3 text-gray-600 hover:text-gray-900 text-sm"
            >
              {t('meetingDetect.dismiss')}
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          aria-label={t('meetingDetect.dismiss')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
