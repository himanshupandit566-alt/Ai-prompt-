import { PromptItem } from '../types/prompt';
import { copyToClipboard } from './clipboard';

export interface ShareResult {
  success: boolean;
  method: 'native' | 'clipboard' | 'cancelled' | 'error';
  message: string;
}

/**
 * Shares a prompt using the device's native Web Share API where supported.
 * Falls back to clipboard copying when Web Share API is not supported.
 */
export async function sharePrompt(item: PromptItem): Promise<ShareResult> {
  const shareData: ShareData = {
    title: `PromptVerse AI: ${item.title}`,
    text: `"${item.title}" (${item.category})\n\nPrompt: ${item.prompt}`,
    url: window.location.href,
  };

  // Try native Web Share API (commonly available on Android, iOS, modern macOS)
  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      return {
        success: true,
        method: 'native',
        message: 'Shared successfully!',
      };
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') {
        return {
          success: false,
          method: 'cancelled',
          message: 'Share cancelled',
        };
      }
      // If native sharing fails for another reason, fallback below
    }
  }

  // Fallback: Copy the shareable text to clipboard
  const copied = await copyToClipboard(
    `PromptVerse AI - ${item.title}\nCategory: ${item.category}\n\nPrompt:\n${item.prompt}\n\nExplore more at: ${window.location.origin}/prompt/${item.id}`
  );

  if (copied) {
    return {
      success: true,
      method: 'clipboard',
      message: 'Native share not available. Prompt link copied to clipboard!',
    };
  }

  return {
    success: false,
    method: 'error',
    message: 'Unable to share or copy prompt.',
  };
}
