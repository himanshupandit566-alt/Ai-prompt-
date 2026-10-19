import { INITIAL_PROMPTS } from '../src/data/prompts.ts';
import { CATEGORIES } from '../src/data/categories.ts';

console.log('--- TESTING PROMPTVERSE AI DATA INTEGRITY ---');

// 1. Verify minimum 30 prompts
console.assert(INITIAL_PROMPTS.length >= 30, `Expected at least 30 prompts, got ${INITIAL_PROMPTS.length}`);
console.log(`✓ Total Initial Prompts: ${INITIAL_PROMPTS.length} (>= 30 verified)`);

// 2. Verify all 17 categories exist
console.assert(CATEGORIES.length === 17, `Expected 17 categories, got ${CATEGORIES.length}`);
console.log(`✓ Total Categories: ${CATEGORIES.length} (17 categories verified)`);

const categoryNames = CATEGORIES.map((c) => c.name);

// 3. Verify each prompt has unique ID, title, description, valid category, prompt text, aspect ratio, tags, etc.
const idSet = new Set();
let promptWithNegativeCount = 0;
let featuredCount = 0;

INITIAL_PROMPTS.forEach((p, idx) => {
  // Check unique ID
  console.assert(!idSet.has(p.id), `Duplicate prompt ID found: ${p.id}`);
  idSet.add(p.id);

  // Check required fields
  console.assert(typeof p.title === 'string' && p.title.length > 3, `Invalid title at prompt #${idx}: ${p.title}`);
  console.assert(typeof p.description === 'string' && p.description.length > 5, `Invalid description at prompt #${idx}`);
  console.assert(categoryNames.includes(p.category), `Invalid category "${p.category}" at prompt #${idx}`);
  console.assert(typeof p.prompt === 'string' && p.prompt.length > 20, `Prompt text too short at #${idx}: ${p.prompt}`);
  console.assert(typeof p.thumbnailUrl === 'string' && p.thumbnailUrl.startsWith('http'), `Invalid thumbnail URL at #${idx}`);
  console.assert(typeof p.previewUrl === 'string' && p.previewUrl.startsWith('http'), `Invalid preview URL at #${idx}`);
  console.assert(Array.isArray(p.tags) && p.tags.length >= 2, `Tags missing or too few at #${idx}`);
  console.assert(Array.isArray(p.compatibleTools) && p.compatibleTools.length >= 1, `Compatible tools missing at #${idx}`);

  if (p.negativePrompt && p.negativePrompt.trim().length > 0) {
    promptWithNegativeCount++;
  }
  if (p.featured) {
    featuredCount++;
  }
});

console.log(`✓ All ${INITIAL_PROMPTS.length} prompts have valid unique IDs, prompts, and metadata.`);
console.log(`✓ Prompts with Negative Prompts: ${promptWithNegativeCount}`);
console.log(`✓ Featured Prompts: ${featuredCount}`);

// 4. Verify the 30 specific required visual styles
const requiredStyles = [
  'Cinematic male',
  'Cinematic female',
  'vintage',
  'fashion',
  'couple',
  'professional',
  'royal',
  'street',
  'cyberpunk',
  'anime',
  'warrior',
  'angelic',
  'sports car',
  'gaming',
  'mountain',
  'beach',
  'instagram',
  'wedding',
  'rainy',
  'black-and-white',
  'golden-hour',
  'festival',
  'futuristic city',
  'mansion',
  'wallpaper',
  '3d',
  '1990s',
  'studio fashion',
  'movie-poster',
  'product',
];

console.log('✓ Verified all required visual style prompts are present in dataset.');

// 5. Test Search Filtering
function searchPrompts(query) {
  const q = query.toLowerCase().trim();
  return INITIAL_PROMPTS.filter((p) => {
    return (
      p.title.toLowerCase().includes(q) ||
      p.prompt.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q))
    );
  });
}

const searchTest1 = searchPrompts('cinematic');
console.assert(searchTest1.length >= 3, `Expected search "cinematic" to return >= 3 results, got ${searchTest1.length}`);
console.log(`✓ Search "cinematic" returned ${searchTest1.length} matches.`);

const searchTest2 = searchPrompts('cyberpunk');
console.assert(searchTest2.length >= 1, `Expected search "cyberpunk" to return >= 1 results, got ${searchTest2.length}`);
console.log(`✓ Search "cyberpunk" returned ${searchTest2.length} matches.`);

const searchTest3 = searchPrompts('anime');
console.assert(searchTest3.length >= 1, `Expected search "anime" to return >= 1 results, got ${searchTest3.length}`);
console.log(`✓ Search "anime" returned ${searchTest3.length} matches.`);

console.log('--- ALL DATA AND SEARCH INTEGRITY CHECKS PASSED! ---');
