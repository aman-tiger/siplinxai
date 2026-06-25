import React, { useEffect, useRef } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Analytics } from '@/lib/analytics';
import {
  WelcomeStep,
  PermissionsStep,
  DownloadProgressStep,
  SetupOverviewStep,
} from './steps';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { currentStep, startBackgroundDownloads, parakeetDownloaded, summaryModelDownloaded, isBackgroundDownloading } = useOnboarding();
  const [isMac, setIsMac] = React.useState(false);
  const downloadsStartedRef = useRef(false);

  useEffect(() => {
    const checkPlatform = async () => {
      try {
        const { platform } = await import('@tauri-apps/plugin-os');
        setIsMac(platform() === 'macos');
      } catch (e) {
        console.error('Failed to detect platform:', e);
        setIsMac(navigator.userAgent.includes('Mac'));
      }
    };
    checkPlatform();
  }, []);

  // Track step views
  useEffect(() => {
    const stepNames: Record<number, string> = { 1: 'welcome', 2: 'setup', 3: 'download', 4: 'permissions' };
    const name = stepNames[currentStep];
    if (name) Analytics.track('onboarding_step_viewed', { step: name });
  }, [currentStep]);

  // Start downloads immediately when onboarding mounts so they run in background
  // during the welcome/setup steps.
  useEffect(() => {
    if (downloadsStartedRef.current) return;
    if (parakeetDownloaded && summaryModelDownloaded) return;
    if (isBackgroundDownloading) return;
    downloadsStartedRef.current = true;
    startBackgroundDownloads(true).catch(() => {
      // Will be retried from DownloadProgressStep if needed
    });
  }, []);

  // 4-Step Onboarding Flow (System-Recommended Models):
  // Step 1: Welcome - Introduce Meetily features
  // Step 2: Setup Overview - Database initialization + show recommended downloads
  // Step 3: Download Progress - Download Parakeet + Gemma (auto-selected based on RAM)
  // Step 4: Permissions - Request mic + system audio (macOS only)

  return (
    <div className="onboarding-flow">
      {currentStep === 1 && <WelcomeStep />}
      {currentStep === 2 && <SetupOverviewStep />}
      {currentStep === 3 && <DownloadProgressStep />}
      {currentStep === 4 && isMac && <PermissionsStep />}
    </div>
  );
}
