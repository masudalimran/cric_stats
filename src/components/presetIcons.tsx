import type { ReactNode } from 'react'

// A fixed set of built-in logo/avatar choices — bundled with the app (no uploads), so they always
// render the same way regardless of device or browser storage, and travel cleanly through export/import
// as a plain string id instead of an image blob.

const HUES = Array.from({ length: 20 }, (_, i) => Math.round((360 / 20) * i))
const hsl = (h: number, s = 60, l = 48) => `hsl(${h} ${s}% ${l}%)`

// ---------- Player avatars: shared head+shoulders base, distinct hair/headwear accessory per id ----------

const SHADOW = 'rgba(0,0,0,0.34)'
const LIGHT = 'rgba(255,255,255,0.85)'

function BaseFigure({ color }: { color: string }) {
  return (
    <>
      <circle cx="12" cy="12" r="12" fill={color} />
      <circle cx="12" cy="9.6" r="4" fill={SHADOW} />
      <path d="M3.5 21.5c0-4.5 3.8-7.2 8.5-7.2s8.5 2.7 8.5 7.2" fill={SHADOW} />
    </>
  )
}

type Accessory = (props: Record<string, never>) => ReactNode

const ACCESSORIES: Accessory[] = [
  // 0 bald — no accessory
  () => null,
  // 1 short hair cap on top of head
  () => <path d="M7.7 7.1a4.4 4.4 0 0 1 8.6 0c-1-.6-2.4-.9-4.3-.9s-3.3.3-4.3.9Z" fill={SHADOW} />,
  // 2 cap with brim
  () => (
    <g fill={LIGHT}>
      <path d="M7.3 7.6a4.7 4.7 0 0 1 9.4 0H7.3Z" />
      <path d="M15.8 7.3h3.3a1 1 0 0 1 0 1.6h-3.3Z" />
    </g>
  ),
  // 3 beanie
  () => (
    <g fill={LIGHT}>
      <path d="M7 7.3a5 5 0 0 1 10 0v0.6H7Z" />
      <rect x="6.8" y="7.6" width="10.4" height="1.3" rx="0.6" />
    </g>
  ),
  // 4 mohawk
  () => <path d="M10.6 2.2c.5 1.6.5 3.4 0 5.4h2.8c-.5-2-.5-3.8 0-5.4-.9-.5-1.9-.5-2.8 0Z" fill={LIGHT} />,
  // 5 afro
  () => <circle cx="12" cy="7.6" r="5.6" fill={SHADOW} />,
  // 6 ponytail
  () => (
    <g fill={SHADOW}>
      <path d="M7.7 7.1a4.4 4.4 0 0 1 8.6 0c-1-.6-2.4-.9-4.3-.9s-3.3.3-4.3.9Z" />
      <circle cx="18" cy="10.5" r="1.7" />
    </g>
  ),
  // 7 headband
  () => (
    <g>
      <path d="M7.7 7.1a4.4 4.4 0 0 1 8.6 0c-1-.6-2.4-.9-4.3-.9s-3.3.3-4.3.9Z" fill={SHADOW} />
      <rect x="7.4" y="7.9" width="9.2" height="1.1" fill={LIGHT} />
    </g>
  ),
  // 8 man bun
  () => (
    <g fill={SHADOW}>
      <path d="M7.7 7.1a4.4 4.4 0 0 1 8.6 0c-1-.6-2.4-.9-4.3-.9s-3.3.3-4.3.9Z" />
      <circle cx="12" cy="4.1" r="1.6" />
    </g>
  ),
  // 9 spiky hair
  () => (
    <g fill={LIGHT}>
      <path d="M7.4 7.3 6.6 4.1 9 6.2 9.4 3l1.7 3 1-3.1 1 3.1 1.7-3 .4 3.2 2.4-2.1-.8 3.2a5 5 0 0 0-9.4 0Z" />
    </g>
  ),
  // 10 side part
  () => (
    <g fill={SHADOW}>
      <path d="M7.7 7.1a4.4 4.4 0 0 1 8.6 0c-1-.6-2.4-.9-4.3-.9s-3.3.3-4.3.9Z" />
      <path d="M11 2.6 15.4 6.4" stroke={LIGHT} strokeWidth="0.7" fill="none" />
    </g>
  ),
  // 11 buzz cut with stubble
  () => (
    <g fill={SHADOW}>
      <path d="M8 7a4 4 0 0 1 8 0c-1-.5-2.3-.7-4-.7S9 6.5 8 7Z" />
      <circle cx="10" cy="12.3" r="0.35" />
      <circle cx="11.3" cy="13" r="0.35" />
      <circle cx="12.6" cy="13" r="0.35" />
      <circle cx="13.9" cy="12.3" r="0.35" />
    </g>
  ),
  // 12 long hair both sides
  () => (
    <g fill={SHADOW}>
      <path d="M7.7 7.1a4.4 4.4 0 0 1 8.6 0c-1-.6-2.4-.9-4.3-.9s-3.3.3-4.3.9Z" />
      <path d="M7 7.5c-.8 2-1 4-.6 6h1.4c-.4-2 .2-4.2 .2-6Z" />
      <path d="M17 7.5c.8 2 1 4 .6 6h-1.4c.4-2-.2-4.2-.2-6Z" />
    </g>
  ),
  // 13 bandana knot
  () => (
    <g fill={LIGHT}>
      <path d="M7.7 7.1a4.4 4.4 0 0 1 8.6 0c-1-.6-2.4-.9-4.3-.9s-3.3.3-4.3.9Z" />
      <path d="M16 7.4 18.3 8.7 16.6 9.6Z" />
    </g>
  ),
  // 14 wide brim hat
  () => (
    <g fill={LIGHT}>
      <ellipse cx="12" cy="8" rx="7.2" ry="1.6" />
      <path d="M8.6 7.6a3.4 3.4 0 0 1 6.8 0Z" />
    </g>
  ),
  // 15 cricket helmet with grille
  () => (
    <g>
      <path d="M6.9 8.6a5.1 5.1 0 0 1 10.2 0v1H6.9Z" fill={LIGHT} />
      <path d="M8.3 9.6v3.4M10.3 9.6v4M12.3 9.6v4.2M14.3 9.6v4M16.3 9.6v3.4" stroke={SHADOW} strokeWidth="0.6" />
    </g>
  ),
  // 16 sunglasses
  () => (
    <g>
      <path d="M7.7 7.1a4.4 4.4 0 0 1 8.6 0c-1-.6-2.4-.9-4.3-.9s-3.3.3-4.3.9Z" fill={SHADOW} />
      <rect x="7.6" y="8.7" width="3.6" height="1.6" rx="0.5" fill="#111" />
      <rect x="12.8" y="8.7" width="3.6" height="1.6" rx="0.5" fill="#111" />
      <rect x="11.2" y="9.1" width="1.6" height="0.6" fill="#111" />
    </g>
  ),
  // 17 beard
  () => (
    <g fill={SHADOW}>
      <path d="M7.7 7.1a4.4 4.4 0 0 1 8.6 0c-1-.6-2.4-.9-4.3-.9s-3.3.3-4.3.9Z" />
      <path d="M8.6 10.5c.4 2 1.7 3.3 3.4 3.3s3-1.3 3.4-3.3c-1.1.5-2.2.8-3.4.8s-2.3-.3-3.4-.8Z" />
    </g>
  ),
  // 18 curly hair
  () => (
    <g fill={SHADOW}>
      <circle cx="8.2" cy="6.6" r="1.5" />
      <circle cx="10.4" cy="5.3" r="1.6" />
      <circle cx="12.6" cy="4.9" r="1.6" />
      <circle cx="14.8" cy="5.3" r="1.6" />
      <circle cx="16.6" cy="6.6" r="1.5" />
    </g>
  ),
  // 19 thin visor
  () => <rect x="7.4" y="8.4" width="9.2" height="0.9" rx="0.45" fill={LIGHT} />,
]

function PersonGlyph({ color, variant }: { color: string; variant: number }) {
  const Accessory = ACCESSORIES[variant % ACCESSORIES.length]
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%">
      <BaseFigure color={color} />
      <Accessory />
    </svg>
  )
}

// ---------- Team logos: distinct glyph per id, cycled across a few badge container shapes ----------

function badgeShape(shape: number, color: string) {
  switch (shape % 4) {
    case 0:
      return <circle cx="12" cy="12" r="12" fill={color} />
    case 1:
      return <path d="M12 0 23 6v12L12 24 1 18V6z" fill={color} />
    case 2:
      return <rect x="0" y="0" width="24" height="24" rx="7" fill={color} />
    default:
      return <path d="M12 0 22 3v8c0 7-5 10.5-10 13C7 21.5 2 18 2 11V3Z" fill={color} />
  }
}

type Glyph = () => ReactNode

const G: Record<string, string> = { s: '#fff', f: '#fff' }

const LOGO_GLYPHS: Glyph[] = [
  // 0 bat & ball
  () => (
    <g stroke={G.s} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <circle cx="9.3" cy="14.7" r="3" />
      <path d="M12 12 16.8 7.2a1.3 1.3 0 0 1 1.9 1.9L13.9 13.9" fill={G.f} stroke="none" />
      <path d="M17.4 6.6 18.8 5.2" />
    </g>
  ),
  // 1 stumps
  () => (
    <g stroke={G.s} strokeWidth="1.5" strokeLinecap="round" fill="none">
      <path d="M8 7v11M12 6v12M16 7v11" />
      <path d="M7 7h2.4M11 6h2M15 7h2.4" />
    </g>
  ),
  // 2 trophy
  () => (
    <g stroke={G.s} strokeWidth="1.4" strokeLinejoin="round" fill="none">
      <path d="M9 6h6v4a3 3 0 0 1-6 0Z" />
      <path d="M9 7H6.5a1.5 1.5 0 0 0 0 3H8M15 7h2.5a1.5 1.5 0 0 1 0 3H15" />
      <path d="M12 13v2.5M9 18.5h6M9.8 18.5c0-1.6.6-2.3 2.2-3 1.6.7 2.2 1.4 2.2 3" />
    </g>
  ),
  // 3 star
  () => <path d="M12 5.5 13.9 10l4.9.4-3.7 3.2 1.2 4.8L12 15.9l-4.3 2.5 1.2-4.8-3.7-3.2 4.9-.4Z" fill={G.f} />,
  // 4 shield check
  () => (
    <g>
      <path d="M12 5 18 7v4.2c0 4-2.6 6.3-6 7.8-3.4-1.5-6-3.8-6-7.8V7Z" fill="none" stroke={G.s} strokeWidth="1.4" />
      <path d="M9.3 12.2 11.3 14.2 15 10" fill="none" stroke={G.s} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  // 5 lightning
  () => <path d="M13 4 7.5 13.2h3.6L10 20l6.5-9.4h-3.4Z" fill={G.f} />,
  // 6 flame
  () => (
    <path
      d="M12 4.5c1.6 2.4.3 3.6 2 5.6 1.3 1.6 1.7 3.3 1.7 4.7a5.7 5.7 0 0 1-11.4 0c0-2 1-3.5 2.2-4.6-.2 1.3.2 2 .9 2.4-.3-3 1.1-5.7 4.6-8.1Z"
      fill={G.f}
    />
  ),
  // 7 crown
  () => (
    <path
      d="M5 17 4 9l3.6 2.6L12 6l4.4 5.6L20 9l-1 8Z"
      fill="none"
      stroke={G.s}
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  ),
  // 8 chevron up
  () => (
    <g fill="none" stroke={G.s} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 15 12 9 18 15" />
      <path d="M6 19.5 12 13.5 18 19.5" opacity="0.55" />
    </g>
  ),
  // 9 diamond
  () => <path d="M12 4 18 12 12 20 6 12Z" fill={G.f} />,
  // 10 laurel wreath
  () => (
    <g fill="none" stroke={G.s} strokeWidth="1.3" strokeLinecap="round">
      <path d="M8 19C5.5 15.5 5.5 9.5 8.5 6" />
      <path d="M16 19c2.5-3.5 2.5-9.5-.5-13" />
      <path d="M7 8.5 9 9M6.3 11.5l2.1.2M6.3 14.5l2.1-.3M7 17.5 9 17" />
      <path d="M17 8.5 15 9M17.7 11.5l-2.1.2M17.7 14.5l-2.1-.3M17 17.5 15 17" />
      <path d="M9.5 20h5" />
    </g>
  ),
  // 11 paw print
  () => (
    <g fill={G.f}>
      <circle cx="12" cy="15" r="3.2" />
      <circle cx="7.3" cy="11.5" r="1.7" />
      <circle cx="16.7" cy="11.5" r="1.7" />
      <circle cx="9" cy="7.3" r="1.5" />
      <circle cx="15" cy="7.3" r="1.5" />
    </g>
  ),
  // 12 mountain peak
  () => (
    <g>
      <path d="M3 18 9 7l3 4 2-2.5L20 18Z" fill={G.f} />
      <path d="M8 9.3 9 7l1 1.8-1 .9Z" fillOpacity="0.4" fill="#000" />
    </g>
  ),
  // 13 wave
  () => (
    <g fill="none" stroke={G.s} strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 10c1.6-2 3.4-2 5 0s3.4 2 5 0 3.4-2 5 0" />
      <path d="M4 15c1.6-2 3.4-2 5 0s3.4 2 5 0 3.4-2 5 0" opacity="0.55" />
    </g>
  ),
  // 14 gear
  () => (
    <g fill="none" stroke={G.s} strokeWidth="1.5" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3.4" />
      <path d="M12 4.8v2.1M12 17.1v2.1M19.2 12h-2.1M6.9 12H4.8M17.1 6.9l-1.5 1.5M8.4 15.6l-1.5 1.5M17.1 17.1l-1.5-1.5M8.4 8.4 6.9 6.9" />
    </g>
  ),
  // 15 crossed swords
  () => (
    <g stroke={G.s} strokeWidth="1.5" strokeLinecap="round" fill="none">
      <path d="M5 19 17 7M19 19 7 7" />
      <path d="M15.5 5.5 18.5 8.5M8.5 5.5 5.5 8.5" />
    </g>
  ),
  // 16 eagle wings
  () => (
    <path
      d="M12 8c-2.5-2.2-5.5-2.8-8-1.4 1.6 1 2.6 2 3.1 3.6-1.5.2-2.6.9-3.6 2.2 2.6.6 4.8.3 6.8-1.6.2 1.6.9 2.9 1.7 4 .8-1.1 1.5-2.4 1.7-4 2 1.9 4.2 2.2 6.8 1.6-1-1.3-2.1-2-3.6-2.2.5-1.6 1.5-2.6 3.1-3.6-2.5-1.4-5.5-.8-8 1.4Z"
      fill={G.f}
    />
  ),
  // 17 sunburst
  () => (
    <g stroke={G.s} strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="3.6" fill={G.f} stroke="none" />
      <path d="M12 4.2v2.3M12 17.5v2.3M19.8 12h-2.3M6.5 12H4.2M17.5 6.5l-1.6 1.6M8.1 15.9l-1.6 1.6M17.5 17.5l-1.6-1.6M8.1 8.1 6.5 6.5" />
    </g>
  ),
  // 18 target
  () => (
    <g fill="none" stroke={G.s} strokeWidth="1.5">
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1.1" fill={G.f} stroke="none" />
    </g>
  ),
  // 19 horseshoe
  () => (
    <g fill="none" stroke={G.s} strokeWidth="2" strokeLinecap="round">
      <path d="M7 18V12a5 5 0 0 1 10 0v6" />
      <circle cx="7" cy="19" r="0.9" fill={G.f} stroke="none" />
      <circle cx="17" cy="19" r="0.9" fill={G.f} stroke="none" />
    </g>
  ),
]

function TeamBadge({ color, shape, glyph }: { color: string; shape: number; glyph: number }) {
  const Glyph = LOGO_GLYPHS[glyph % LOGO_GLYPHS.length]
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%">
      {badgeShape(shape, color)}
      <Glyph />
    </svg>
  )
}

export interface PresetIcon {
  id: string
  label: string
  render: () => ReactNode
}

export const PLAYER_AVATARS: PresetIcon[] = HUES.map((h, i) => ({
  id: `avatar-${i + 1}`,
  label: `Avatar ${i + 1}`,
  render: () => <PersonGlyph color={hsl(h)} variant={i} />,
}))

export const TEAM_LOGOS: PresetIcon[] = HUES.map((h, i) => ({
  id: `logo-${i + 1}`,
  label: `Logo ${i + 1}`,
  render: () => <TeamBadge color={hsl(h)} shape={i} glyph={i} />,
}))

export function findPreset(list: PresetIcon[], id?: string): PresetIcon | undefined {
  return id ? list.find((p) => p.id === id) : undefined
}
