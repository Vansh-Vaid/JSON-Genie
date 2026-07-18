import { useEffect, useRef } from 'react'

export function LottieHero({ src }: { src: string }) {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // load lottie-player if not present
    if (!(window as any).customElements?.get('lottie-player')) {
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/@lottiefiles/lottie-player@^1.0.0/dist/lottie-player.js'
      script.async = true
      document.body.appendChild(script)
      return () => { document.body.removeChild(script) }
    }
  }, [])

  return <div className="lottie-hero" aria-hidden="true" ref={ref}>
    {/* the lottie-player will be available after script loads; using a hosted sample animation */}
    <div dangerouslySetInnerHTML={{ __html: `<lottie-player src="${src}" background="transparent" speed="1" loop autoplay style="width:100%;height:180px"></lottie-player>` }} />
  </div>
}
