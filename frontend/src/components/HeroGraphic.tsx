export function HeroGraphic() {
  return (
    <div className="hero-graphic hero-parallax" aria-hidden="true">
      <svg viewBox="0 0 1200 260" preserveAspectRatio="none" className="hero-svg">
        <defs>
          <linearGradient id="g1" x1="0" x2="1">
            <stop offset="0%" stopColor="#6C63FF" stopOpacity="0.96" />
            <stop offset="60%" stopColor="#8E7BFF" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#34D399" stopOpacity="0.82" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="18" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <rect x="0" y="0" width="1200" height="260" fill="url(#g1)" className="hero-gradient" filter="url(#glow)" />
        <g className="hero-shapes" fill="rgba(255,255,255,0.07)">
          <circle cx="120" cy="80" r="62" />
          <rect x="300" y="36" width="160" height="160" rx="22" />
          <ellipse cx="680" cy="120" rx="140" ry="68" />
          <path d="M980 80c-28 0-50 24-50 52s22 52 50 52 50-24 50-52-22-52-50-52z" />
        </g>
        <g className="hero-animated" fill="white" fillOpacity="0.95">
          <circle className="spark" cx="210" cy="46" r="4" />
          <circle className="spark" cx="680" cy="34" r="4" />
          <circle className="spark" cx="820" cy="84" r="4" />
        </g>
      </svg>
    </div>
  )
}
