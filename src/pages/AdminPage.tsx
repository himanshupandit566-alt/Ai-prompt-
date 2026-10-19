import React, { useState } from 'react';
import { useFavorites } from '../context/FavoritesContext';
import { CATEGORIES } from '../data/categories';
import { PromptItem, CategoryName, AspectRatio } from '../types/prompt';
import { PlusCircle, Sparkles, Eye, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const AdminPage: React.FC = () => {
  const { addCustomPrompt, showToast } = useFavorites();
  const navigate = useNavigate();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CategoryName>('Cinematic Portraits');
  const [imageUrl, setImageUrl] = useState('');
  const [promptText, setPromptText] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('4:5');
  const [tagsInput, setTagsInput] = useState('');
  const [compatibleTools, setCompatibleTools] = useState<string[]>([
    'Midjourney v6',
    'Flux.1',
    'DALL-E 3',
  ]);
  const [featured, setFeatured] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const toolOptions = ['Midjourney v6', 'Flux.1', 'DALL-E 3', 'Stable Diffusion XL'];
  const aspectRatios: AspectRatio[] = ['1:1', '4:5', '3:4', '16:9', '9:16', '2:3'];

  const toggleTool = (tool: string) => {
    if (compatibleTools.includes(tool)) {
      setCompatibleTools(compatibleTools.filter((t) => t !== tool));
    } else {
      setCompatibleTools([...compatibleTools, tool]);
    }
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Please provide a title for the prompt.');
      return;
    }
    if (!promptText.trim()) {
      setErrorMsg('The image generation prompt cannot be empty.');
      return;
    }

    const defaultImage =
      imageUrl.trim() ||
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const newPrompt: PromptItem = {
      id: `custom-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || 'A custom crafted visual prompt.',
      category,
      thumbnailUrl: defaultImage,
      previewUrl: defaultImage,
      prompt: promptText.trim(),
      negativePrompt: negativePrompt.trim() || undefined,
      aspectRatio,
      compatibleTools: compatibleTools.length > 0 ? compatibleTools : ['Universal AI'],
      tags: tags.length > 0 ? tags : ['custom', 'ai-art'],
      featured,
      popularity: 5000,
      createdAt: new Date().toISOString().split('T')[0],
    };

    addCustomPrompt(newPrompt);
    showToast(`Created "${newPrompt.title}"! Redirecting...`, 'success');
    setTimeout(() => {
      navigate(`/prompt/${newPrompt.id}`);
    }, 600);
  };

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-purple-400 mb-1">
            <PlusCircle className="w-5 h-5" />
            <span className="text-xs font-bold tracking-wider uppercase">Content Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Create New Prompt
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Publish custom prompts into your local library with image previews and instant export support.
          </p>
        </div>

        <Link
          to="/explore"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-900 border border-slate-800 text-xs text-slate-300 hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column */}
        <form onSubmit={handlePublish} className="lg:col-span-7 space-y-5 bg-dark-900 border border-slate-800 rounded-2xl p-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cyberpunk Samurai in Monsoon"
              className="w-full px-4 py-2.5 bg-dark-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Style Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Gritty neon-lit street warrior with glowing katana"
              className="w-full px-4 py-2.5 bg-dark-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Category & Aspect Ratio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryName)}
                className="w-full px-3 py-2.5 bg-dark-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                {CATEGORIES.filter((c) => c.name !== 'All').map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Aspect Ratio
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                className="w-full px-3 py-2.5 bg-dark-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                {aspectRatios.map((ratio) => (
                  <option key={ratio} value={ratio}>
                    {ratio}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Image URL (Unsplash or Direct Link)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full px-4 py-2.5 bg-dark-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Leave blank to use an abstract generative cover.
            </span>
          </div>

          {/* Full Prompt */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Complete Image Generation Prompt *
            </label>
            <textarea
              required
              rows={4}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Enter the detailed AI prompt here including camera specs, lighting, mood, etc..."
              className="w-full px-4 py-3 bg-dark-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Negative Prompt */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Negative Prompt (Optional)
            </label>
            <textarea
              rows={2}
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="e.g. blurry, low quality, deformed hands, cartoonish..."
              className="w-full px-4 py-2.5 bg-dark-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Tags (Comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="portrait, cinematic, moody, 8k"
              className="w-full px-4 py-2 bg-dark-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Compatible AI Tools */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Compatible Tools
            </label>
            <div className="flex flex-wrap gap-2">
              {toolOptions.map((tool) => {
                const isSelected = compatibleTools.includes(tool);
                return (
                  <button
                    key={tool}
                    type="button"
                    onClick={() => toggleTool(tool)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-dark-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {isSelected && '✓ '} {tool}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Featured Toggle */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="featured"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="w-4 h-4 rounded accent-purple-600"
            />
            <label htmlFor="featured" className="text-sm font-medium text-slate-300 cursor-pointer">
              Mark as Featured Prompt
            </label>
          </div>

          {/* Buttons */}
          <div className="pt-4 flex items-center gap-3">
            <button
              type="submit"
              className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-glow-purple transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Publish to Library
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className="py-3 px-4 rounded-xl bg-dark-950 border border-slate-700 text-slate-300 hover:text-white text-sm font-semibold transition-colors flex items-center gap-1.5"
            >
              <Eye className="w-4 h-4" /> Preview
            </button>
          </div>
        </form>

        {/* Live Preview Column */}
        <div className="lg:col-span-5 space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-purple-400" /> Live Card Preview
          </span>

          <div className="bg-dark-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="aspect-[4/5] bg-dark-950 relative overflow-hidden flex items-center justify-center">
              {imageUrl ? (
                <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-6 text-slate-600">
                  <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <span className="text-xs">Image Preview</span>
                </div>
              )}
              {featured && (
                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-600 text-white">
                  Featured
                </span>
              )}
              <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] bg-black/60 text-slate-300">
                {aspectRatio}
              </span>
            </div>

            <div className="p-4 space-y-2">
              <span className="text-xs font-semibold text-purple-400">{category}</span>
              <h3 className="text-base font-bold text-white line-clamp-1">
                {title || 'Untitled Prompt'}
              </h3>
              <p className="text-xs text-slate-400 font-mono line-clamp-3 bg-dark-950 p-2.5 rounded-lg border border-slate-800/80">
                {promptText || 'Your prompt text will preview here...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
