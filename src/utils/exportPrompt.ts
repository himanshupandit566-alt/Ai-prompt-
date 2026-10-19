import { PromptItem } from '../types/prompt';

/**
 * Generates and triggers the download of a formatted plain-text (.txt) file for a prompt.
 * Preserves exact line breaks, uses UTF-8 encoding, and generates a clean filename based on the title.
 */
export function exportPromptToTxt(item: PromptItem): boolean {
  try {
    const lines: string[] = [
      'FX PROMPTY',
      '==========',
      '',
      'Title:',
      item.title,
      '',
      'Category:',
      item.category,
      '',
      'Aspect Ratio:',
      item.aspectRatio,
      '',
      'Compatible AI Tools:',
      item.compatibleTools.length > 0 ? item.compatibleTools.join(', ') : 'Universal (Midjourney, DALL-E, SDXL, Flux)',
      '',
      'PROMPT:',
      item.prompt,
      '',
    ];

    if (item.negativePrompt && item.negativePrompt.trim().length > 0) {
      lines.push('NEGATIVE PROMPT:');
      lines.push(item.negativePrompt.trim());
      lines.push('');
    }

    lines.push('Tags:');
    lines.push(item.tags.join(', '));
    lines.push('');
    lines.push('Application:');
    lines.push('FX Prompty - Discover. Copy. Create. (by Himanshu Pandey)');
    lines.push('');

    const content = lines.join('\r\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    // Sanitize title for filename
    const safeTitle = item.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') || 'prompt';

    const filename = `fx-prompty-${safeTitle}.txt`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Cleanup object URL
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  } catch (err) {
    console.error('Error generating TXT download:', err);
    return false;
  }
}
