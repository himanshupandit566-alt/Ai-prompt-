import React from 'react';

interface AppLogoProps {
  size?: number;
  className?: string;
  showGlow?: boolean;
}

/**
 * Modern High-Tech Vector Logo for FX Prompty:
 * - Sleek neon-purple rounded square / squircle
 * - Futuristic sharp geometric 'FX' typography
 * - Integrated glowing AI neural sparkle & circuit node
 */
export const AppLogo: React.FC<AppLogoProps> = ({
  size = 40,
  className = '',
  showGlow = true
}) => {
  const uniqueId = React.useId().replace(/:/g, '');

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible"
      >
        <defs>
          {/* Outer Border Gradient */}
          <linearGradient id={`borderGrad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="50%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>

          {/* Deep Dark Neon Background Fill */}
          <linearGradient id={`bgGrad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#141126" />
            <stop offset="60%" stopColor="#0B0D18" />
            <stop offset="100%" stopColor="#07080E" />
          </linearGradient>

          {/* FX Glyph Neon Gradient */}
          <linearGradient id={`fxGrad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5F3FF" />
            <stop offset="35%" stopColor="#E9D5FF" />
            <stop offset="70%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>

          {/* AI Neural Sparkle Gradient */}
          <linearGradient id={`sparkleGrad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="40%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>

          {/* Soft Neon Blur Filter */}
          {showGlow && (
            <filter id={`neonGlow-${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}

          {/* Radial Bloom for AI Sparkle */}
          <radialGradient id={`glowBloom-${uniqueId}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#A855F7" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Neon Backlight Glow */}
        {showGlow && (
          <rect
            x="4"
            y="4"
            width="56"
            height="56"
            rx="18"
            fill={`url(#sparkleGrad-${uniqueId})`}
            opacity="0.25"
            className="filter blur-md pointer-events-none"
          />
        )}

        {/* Base Squircle Box */}
        <rect
          x="3"
          y="3"
          width="58"
          height="58"
          rx="18"
          fill={`url(#bgGrad-${uniqueId})`}
          stroke={`url(#borderGrad-${uniqueId})`}
          strokeWidth="1.8"
        />

        {/* Futuristic Subtle Neural Circuit Grid Trace in Background */}
        <g opacity="0.18" stroke="#A855F7" strokeWidth="0.8" strokeLinecap="round">
          <line x1="8" y1="20" x2="20" y2="20" />
          <circle cx="20" cy="20" r="1.2" fill="#A855F7" />
          <line x1="44" y1="44" x2="56" y2="44" />
          <circle cx="44" cy="44" r="1.2" fill="#38BDF8" />
          <path d="M50 14 L50 24 L56 30" fill="none" />
        </g>

        {/* Sharp Typography: 'F' Glyph */}
        {/* Modern angled cut F with tech stencil geometry */}
        <path
          d="M13 18.5 H28.5 L26 23 H18.5 V28.5 H25.5 L23.5 33 H18.5 V45.5 H13 Z"
          fill={`url(#fxGrad-${uniqueId})`}
          filter={showGlow ? `url(#neonGlow-${uniqueId})` : undefined}
        />

        {/* Sharp Typography: 'X' Glyph */}
        {/* Left-to-Right diagonal blade */}
        <path
          d="M29 18.5 H34.5 L46.5 45.5 H41 Z"
          fill={`url(#fxGrad-${uniqueId})`}
          filter={showGlow ? `url(#neonGlow-${uniqueId})` : undefined}
        />

        {/* Right-to-Left diagonal blade with tech gap */}
        <path
          d="M44 18.5 H39.5 L34.8 29.5 L37.2 35 L42.5 45.5 H48 Z"
          fill={`url(#fxGrad-${uniqueId})`}
          filter={showGlow ? `url(#neonGlow-${uniqueId})` : undefined}
        />

        {/* Center Neural Connection Node */}
        <circle
          cx="37.5"
          cy="32"
          r="1.8"
          fill="#38BDF8"
          className="animate-pulse"
        />

        {/* Glowing AI Neural Sparkle at Top-Right Apex of X */}
        <g transform="translate(48, 14)">
          {/* Radial Bloom Glow */}
          <circle cx="0" cy="0" r="10" fill={`url(#glowBloom-${uniqueId})`} />
          {/* 4-Point Sharp AI Sparkle Star */}
          <path
            d="M0 -7.5 C0 -2.5 2.5 0 7.5 0 C2.5 0 0 2.5 0 7.5 C0 2.5 -2.5 0 -7.5 0 C-2.5 0 0 -2.5 0 -7.5 Z"
            fill={`url(#sparkleGrad-${uniqueId})`}
            className="filter drop-shadow-[0_0_6px_rgba(56,189,248,0.9)]"
          />
          {/* Sparkling Core Dot */}
          <circle cx="0" cy="0" r="1.4" fill="#FFFFFF" />
        </g>
      </svg>
    </div>
  );
};
