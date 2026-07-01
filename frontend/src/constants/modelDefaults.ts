/**
 * Default model names for transcription engines.
 * IMPORTANT: Keep in sync with Rust constants in src-tauri/src/config.rs
 */

/** True when running in the Windows desktop webview (WebView2 UA contains "Windows NT"). */
function isWindowsPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Windows/i.test(navigator.userAgent || '');
}

/**
 * Default Whisper model for transcription when no preference is configured. Platform-aware:
 * - macOS (Metal GPU): large-v3-q5_0 — full-decoder large-v3 accuracy on RU/KK, GPU-accelerated
 *   and real-time.
 * - Windows: GPU is forced off (loading Whisper via Vulkan crashes the driver — TDR), so Whisper
 *   runs on CPU; medium-q5_0 keeps live transcription real-time.
 * Keep in sync with DEFAULT_WHISPER_MODEL in src-tauri/src/config.rs.
 */
export const DEFAULT_WHISPER_MODEL = isWindowsPlatform() ? 'medium-q5_0' : 'large-v3-q5_0';

/**
 * Default Parakeet model for transcription when no preference is configured.
 * This is the quantized version optimized for speed.
 */
export const DEFAULT_PARAKEET_MODEL = 'parakeet-tdt-0.6b-v3-int8';

/**
 * Model defaults by provider type
 */
export const MODEL_DEFAULTS = {
  whisper: DEFAULT_WHISPER_MODEL,
  localWhisper: DEFAULT_WHISPER_MODEL,
  parakeet: DEFAULT_PARAKEET_MODEL,
} as const;

/**
 * Whether the given system/app locale should default to Whisper for transcription.
 * Parakeet does not support Russian or Kazakh, so for those locales we use local Whisper
 * (which covers ~99 languages). For everything else Parakeet is faster and just as accurate.
 * Used by the language-based ("hybrid") transcription engine auto-selection.
 */
export function localeNeedsWhisper(locale?: string | null): boolean {
  const l = (locale ?? '').toLowerCase();
  return l.startsWith('ru') || l.startsWith('kk');
}
