import type { ReactNode, SVGProps } from 'react'

export type IconName = 'sparkles' | 'sun' | 'moon' | 'github' | 'settings' | 'arrow-up-right' | 'arrow-left' | 'arrow-right' | 'copy' | 'download' | 'code' | 'list' | 'check' | 'alert' | 'plus' | 'trash' | 'file'

const paths: Record<IconName, ReactNode> = {
  sparkles: <><path d="m12 3-1.2 4.1L7 8.3l3.8 1.2L12 13l1.2-3.5L17 8.3l-3.8-1.2L12 3Z" /><path d="m19 13-.7 2.3L16 16l2.3.7L19 19l.7-2.3L22 16l-2.3-.7L19 13Z" /><path d="m5 15-.6 2L2.5 17l1.9.6L5 19.5l.6-1.9 1.9-.6-1.9-.6L5 15Z" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" /></>,
  moon: <path d="M20.8 15.3A8.5 8.5 0 0 1 8.7 3.2 8.5 8.5 0 1 0 20.8 15.3Z" />,
  github: <><path d="M15 22v-3.9c.1-1.2-.4-2.1-1-2.6 3.3-.4 6.7-1.6 6.7-7.2 0-1.6-.6-2.9-1.6-3.9.2-.4.7-1.9-.2-3.9 0 0-1.3-.4-4.1 1.5a14 14 0 0 0-7.5 0C4.5.1 3.2.5 3.2.5c-.9 2-.4 3.5-.2 3.9-1 1-1.6 2.3-1.6 3.9 0 5.6 3.4 6.8 6.7 7.2-.6.5-1 1.2-1 2.5V22" /><path d="M7.5 18c-3.1 1.5-3.5-1.5-5-1.5" /></>,
  settings: <><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" /><path d="m19.4 15 .1.1a1.8 1.8 0 0 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3.1 1.3v.2a1.8 1.8 0 0 1-3.6 0v-.2a1.8 1.8 0 0 0-3.1-1.3l-.1.1a1.8 1.8 0 1 1-2.5-2.5l.1-.1a1.8 1.8 0 0 0-1.3-3.1h-.2a1.8 1.8 0 0 1 0-3.6h.2a1.8 1.8 0 0 0 1.3-3.1l-.1-.1A1.8 1.8 0 1 1 7 2.6l.1.1a1.8 1.8 0 0 0 3.1-1.3v-.2a1.8 1.8 0 0 1 3.6 0v.2a1.8 1.8 0 0 0 3.1 1.3l.1-.1a1.8 1.8 0 1 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 1.3 3.1h.2a1.8 1.8 0 0 1 0 3.6h-.2a1.8 1.8 0 0 0-1.3 3.1Z" /></>,
  'arrow-up-right': <><path d="M7 17 17 7" /><path d="M7 7h10v10" /></>,
  'arrow-left': <path d="M15 6 9 12l6 6" />,
  'arrow-right': <path d="M9 6l6 6-6 6" />,

  copy: <><rect x="9" y="9" width="10" height="10" rx="2" /><path d="M15 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /></>,
  download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>,
  code: <><path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14" /></>,
  list: <><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  alert: <><path d="M10.3 3.6 2.5 17a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  trash: <><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h5" /></>,
}

export function Icon({ name, size = 16, strokeWidth = 1.8, className = '', ...props }: { name: IconName; size?: number; strokeWidth?: number; className?: string } & SVGProps<SVGSVGElement>) {
  // Animate only a small set of decorative icons; CSS honors prefers-reduced-motion
  const animated = ['sparkles', 'check', 'download', 'plus'] as const
  const animClass = (animated as readonly string[]).includes(name) ? 'icon-animate' : ''
  return <svg {...props} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`${className} ${animClass}`}>{paths[name]}</svg>
}
