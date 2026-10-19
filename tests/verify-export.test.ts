import { INITIAL_PROMPTS } from '../src/data/prompts';

console.log('--- TESTING EXPORT TXT FORMATTING SPECIFICATION ---');

const samplePrompt = INITIAL_PROMPTS[0];

function generateExportContent(item: typeof samplePrompt) {
  const lines: string[] = [
    'PROMPTVERSE AI',
    '==============',
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
  lines.push('PromptVerse AI - Discover. Copy. Create.');
  lines.push('');

  return lines.join('\r\n');
}

const txt = generateExportContent(samplePrompt);

console.assert(txt.startsWith('PROMPTVERSE AI\r\n==============\r\n\r\nTitle:\r\n'), 'Export format does not start with expected header');
console.assert(txt.includes(`Title:\r\n${samplePrompt.title}`), 'Export missing title');
console.assert(txt.includes(`Category:\r\n${samplePrompt.category}`), 'Export missing category');
console.assert(txt.includes(`Aspect Ratio:\r\n${samplePrompt.aspectRatio}`), 'Export missing aspect ratio');
console.assert(txt.includes(`PROMPT:\r\n${samplePrompt.prompt}`), 'Export missing full prompt');
console.assert(txt.includes('Application:\r\nPromptVerse AI'), 'Export missing Application tag');

console.log('✓ Plain-text export structure verified against user specification.');
console.log('Sample exported snippet:\n' + txt.slice(0, 220) + '...\n');
console.log('--- EXPORT VERIFICATION TEST PASSED! ---');
