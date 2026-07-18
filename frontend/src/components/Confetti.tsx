import { useEffect, useRef } from 'react'

// Lightweight canvas confetti for celebratory effect; consumer can call window.triggerConfetti()
export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const particlesRef = useRef<any[]>([])

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let w = (canvas.width = window.innerWidth)
    let h = (canvas.height = window.innerHeight)

    const resize = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', resize)

    function rand(min: number, max: number) { return Math.random() * (max - min) + min }

    function spawnBurst(x: number, y: number, count = 80) {
      const colors = ['#6C63FF', '#34D399', '#FFD166', '#FF6B6B', '#9B8CFF']
      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          x, y,
          vx: rand(-8, 8),
          vy: rand(-12, -2),
          size: rand(6, 14),
          color: colors[Math.floor(rand(0, colors.length))],
          life: rand(60, 140),
        })
      }
    }

    function step() {
      ctx.clearRect(0, 0, w, h)
      const grav = 0.36
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i]
        p.vy += grav
        p.x += p.vx
        p.y += p.vy
        p.life -= 1
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.ellipse(p.x, p.y, p.size, p.size * 0.7, Math.PI * 0.2, 0, Math.PI * 2)
        ctx.fill()
        if (p.life <= 0 || p.y > h + 50) particlesRef.current.splice(i, 1)
      }
      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)

    // listen for a custom event to trigger confetti (avoids polluting global namespace)
    const handler = (ev: Event) => {
      const detail = (ev as CustomEvent)?.detail || {}
      spawnBurst(detail.x ?? w / 2, detail.y ?? h / 4, detail.count ?? 120)
    }
    window.addEventListener('json-genie-confetti', handler as EventListener)

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('json-genie-confetti', handler as EventListener)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50 }} />
}
