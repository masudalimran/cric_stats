const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

export const EditIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" {...s}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
)

export const TrashIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" {...s}>
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
  </svg>
)

export const PlayIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z" />
  </svg>
)

export const ChartIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" {...s}>
    <path d="M4 20V10M12 20V4M20 20v-7" />
  </svg>
)

export const FlagIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" {...s}>
    <path d="M4 22V3" />
    <path d="M4 4h14l-2.5 4L18 12H4" />
  </svg>
)

export const DownloadIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" {...s}>
    <path d="M12 3v12" />
    <path d="m7 10 5 5 5-5" />
    <path d="M4 20h16" />
  </svg>
)

export const UploadIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" {...s}>
    <path d="M12 21V9" />
    <path d="m7 14 5-5 5 5" />
    <path d="M4 20h16" />
  </svg>
)

export const PlusIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" {...s}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const UndoIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" {...s}>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h11a5 5 0 0 1 0 10h-1" />
  </svg>
)

export const ChevronDownIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" {...s}>
    <path d="m6 9 6 6 6-6" />
  </svg>
)

export const CheckIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" {...s}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

export const PhoneIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" {...s}>
    <rect x="6" y="2" width="12" height="20" rx="3" />
    <path d="M11 18h2" />
  </svg>
)

export const SpeakerIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" {...s}>
    <path d="M11 5 6 9H2v6h4l5 4z" fill="currentColor" stroke="none" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
  </svg>
)

export const SunIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" {...s}>
    <circle cx="12" cy="12" r="4.5" />
    <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8" />
  </svg>
)

export const CameraIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" {...s}>
    <path d="M4 7h3l2-2h6l2 2h3v12H4z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
)

// ---- Extras ----

export const WideIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" {...s}>
    <path d="M3 12h18" />
    <path d="m7 7-4 5 4 5" />
    <path d="m17 7 4 5-4 5" />
  </svg>
)

export const NoBallIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" {...s}>
    <path d="M3 17h18" />
    <path d="M7 17v-3a3 3 0 0 1 3-3h1" />
    <path d="M14 7.5 19 3l1.5 1.5L16 9" />
  </svg>
)

export const ByeIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" {...s}>
    <circle cx="15" cy="4" r="1.8" fill="currentColor" stroke="none" />
    <path d="M11 21l2-7-3-2 1-5 4 1 2 3h3" />
    <path d="M10 12 7 14l-2 7" />
  </svg>
)

export const LegByeIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" {...s}>
    <circle cx="15" cy="4" r="1.8" fill="currentColor" stroke="none" />
    <path d="M11 21l2-7-3-2 1-5 4 1 2 3h3" />
    <path d="M10 12 7 14l-2 7" />
    <rect x="4.5" y="15" width="3.5" height="7" rx="1" transform="rotate(-18 4.5 15)" />
  </svg>
)

export const WicketIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" {...s}>
    <path d="M7 4v17M12 4v17M17 4v17" />
    <path d="M5 4h4M10 4h4M15 4h4" />
    <path d="m18 2 3 2-3 2" />
  </svg>
)

// ---- Wicket types ----

export const BowledIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" {...s}>
    <path d="M8 6v15M12 6v15M16 6v15" />
    <path d="M6 6h5M11 6h5" />
    <path d="m18 3 4 2-5 3" />
  </svg>
)

export const CaughtIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" {...s}>
    <circle cx="17" cy="6" r="2" />
    <path d="M9 10c-2 1-4 3-4 6a5 5 0 0 0 10 0c0-2-1-3-2-4" />
    <path d="M9 10 15 6" />
  </svg>
)

export const LbwIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" {...s}>
    <path d="M7 5v16M12 5v16M17 5v16" />
    <rect x="3" y="9" width="5" height="9" rx="1.5" />
  </svg>
)

export const RunOutIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" {...s}>
    <path d="M17 4v16M20 4v16" />
    <circle cx="7" cy="5" r="1.8" fill="currentColor" stroke="none" />
    <path d="M5 20l1.5-6-2-2 1-4 3 1 1.5 2.5h2.5" />
    <path d="M4.5 11 3 13" />
  </svg>
)

export const StumpedIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" {...s}>
    <path d="M8 4v16M12 4v16M16 4v16" />
    <path d="M5 15c1-1 2-1.5 3-1.5s2 .5 2 1.5-1 1.5-2 1.5-2-.5-3-1.5Z" />
  </svg>
)

export const HitWicketIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" {...s}>
    <path d="M9 5v16M13 5v16M17 5v16" />
    <path d="M3 10l4-3 2 3-4 3z" />
  </svg>
)

export const RetiredIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" {...s}>
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
)

export const OtherIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" {...s}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.3a2.5 2.5 0 0 1 4.9.7c0 1.7-2.4 1.8-2.4 3.5" />
    <circle cx="12" cy="17" r="0.1" fill="currentColor" stroke="currentColor" strokeWidth={2.4} />
  </svg>
)
