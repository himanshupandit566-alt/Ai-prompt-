import { PromptItem } from '../types/prompt';
import { copyToClipboard } from './clipboard';

export interface ShareResult {
  success: boolean;
  method: 'native' | 'clipboard' | 'cancelled' | 'error';
  message: string;
}

/**
 * Shares a prompt using the device's native Web Share API (navigator.share).
 * Shares the prompt title and direct app URL.
 * Falls back to clipboard copying when Web Share API is not available.
 */
export async function sharePrompt(item: PromptItem): Promise<ShareResult> {
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const shareData: ShareData = {
    title: `${item.title} - FX Prompty`,
    text: `Check out "${item.title}" on FX Prompty:`,
    url: currentUrl,
  };

  // Try native Web Share API (Android, iOS, mobile Chrome, Safari)
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share(shareData);
      return {
        success: true,
        method: 'native',
        message: 'Shared successfully! 🚀',
      };
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') {
        return {
          success: false,
          method: 'cancelled',
          message: 'Share cancelled',
        };
      }
    }
  }

  // Fallback: Copy direct prompt link to clipboard
  const copied = await copyToClipboard(currentUrl);

  if (copied) {
    return {
      success: true,
      method: 'clipboard',
      message: 'Prompt link copied to clipboard! 📋',
    };
  }

  return {
    success: false,
    method: 'error',
    message: 'Unable to share or copy link.',
  };
}
