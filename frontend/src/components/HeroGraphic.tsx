export function HeroGraphic() {
  return (
    <div className="hero-graphic" aria-hidden="true">
      <svg viewBox="0 0 800 180" preserveAspectRatio="none" className="hero-svg">
        <defs>
          <linearGradient id="g1" x1="0" x2="1">
            <stop offset="0%" stopColor="#6C63FF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#34D399" stopOpacity="0.75" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="800" height="180" fill="url(#g1)" className="hero-gradient" />
        <g className="hero-shapes" fill="rgba(255,255,255,0.06)">
          <circle cx="90" cy="60" r="48" />
          <rect x="220" y="30" width="120" height="120" rx="16" />
          <ellipse cx="520" cy="80" rx="100" ry="48" />
          <path d="M700 60c-20 0-36 18-36 40s16 40 36 40 36-18 36-40-16-40-36-40z" />
        </g>
        <g className="hero-animated" fill="white" fillOpacity="0.9">
          <circle className="spark" cx="150" cy="36" r="3" />
          <circle className="spark" cx="480" cy="24" r="3" />
          <circle className="spark" cx="620" cy="52" r="3" />
        </g>
      </svg>
    </div>
  )
}
