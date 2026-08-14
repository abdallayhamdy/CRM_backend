'use client'

import { useRef, useEffect, useCallback } from 'react'

type Circuit = {
  pts: { x: number; y: number }[]
  len: number
  color: 'cyan' | 'blue'
  width: number
  dashed: boolean
  chevrons: boolean
  endGlowPhase: number
  dots: { dist: number; speed: number; r: number }[]
}

function randChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generatePath(W: number, H: number, startX: number, startY: number) {
  const cx = W / 2, cy = H / 2
  const points: { x: number; y: number }[] = [{ x: startX, y: startY }]
  let x = startX, y = startY
  let angle = Math.atan2(cy - y, cx - x)

  const distToCenter = Math.hypot(cx - x, cy - y)
  const travelBudget = distToCenter * (0.45 + Math.random() * 0.35)
  let traveled = 0

  const segCount = 3 + Math.floor(Math.random() * 4)
  for (let i = 0; i < segCount && traveled < travelBudget; i++) {
    const len = Math.min(60 + Math.random() * 150, travelBudget - traveled)
    if (i > 0) {
      const turnChoices = [0, 0, 0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2]
      angle += randChoice(turnChoices)
    }
    x += Math.cos(angle) * len
    y += Math.sin(angle) * len
    points.push({ x, y })
    traveled += len
  }
  return points
}

function pathLength(pts: { x: number; y: number }[]): number {
  let total = 0
  for (let i = 1; i < pts.length; i++) {
    total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
  }
  return total
}

function pointAtDistance(pts: { x: number; y: number }[], dist: number): { x: number; y: number; angle: number } {
  let remaining = dist
  for (let i = 1; i < pts.length; i++) {
    const segLen = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
    if (remaining <= segLen) {
      const t = segLen === 0 ? 0 : remaining / segLen
      return {
        x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t,
        y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t,
        angle: Math.atan2(pts[i].y - pts[i - 1].y, pts[i].x - pts[i - 1].x),
      }
    }
    remaining -= segLen
  }
  const last = pts[pts.length - 1]
  const prev = pts[pts.length - 2] || last
  return { x: last.x, y: last.y, angle: Math.atan2(last.y - prev.y, last.x - prev.x) }
}

function edgeStartPoints(W: number, H: number) {
  const pts: { x: number; y: number }[] = []
  const spacingX = Math.max(90, W / 14)
  const spacingY = Math.max(90, H / 10)

  for (let x = spacingX * 0.5; x < W; x += spacingX) {
    if (Math.random() < 0.75) pts.push({ x: x + (Math.random() - 0.5) * 30, y: -4 })
    if (Math.random() < 0.75) pts.push({ x: x + (Math.random() - 0.5) * 30, y: H + 4 })
  }
  for (let y = spacingY * 0.5; y < H; y += spacingY) {
    if (Math.random() < 0.75) pts.push({ x: -4, y: y + (Math.random() - 0.5) * 30 })
    if (Math.random() < 0.75) pts.push({ x: W + 4, y: y + (Math.random() - 0.5) * 30 })
  }

  const corners = [{ x: 0, y: 0 }, { x: W, y: 0 }, { x: 0, y: H }, { x: W, y: H }]
  corners.forEach((c) => {
    for (let i = 0; i < 5; i++) {
      pts.push({
        x: c.x + (Math.random() - 0.5) * 120,
        y: c.y + (Math.random() - 0.5) * 120,
      })
    }
  })
  return pts
}

function traceColor(kind: 'cyan' | 'blue', alpha: number) {
  if (kind === 'cyan') return `rgba(80, 220, 240, ${alpha})`
  return `rgba(70, 140, 230, ${alpha})`
}

function dotColor(kind: 'cyan' | 'blue', alpha: number) {
  if (kind === 'cyan') return `rgba(80, 180, 210, ${alpha})`
  return `rgba(60, 120, 180, ${alpha})`
}

export function CircuitBoardBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animRef = useRef<number | null>(null)
  const circuitsRef = useRef<Circuit[]>([])
  const lastTimeRef = useRef(performance.now())

  const buildCircuits = useCallback((W: number, H: number) => {
    const circuits: Circuit[] = []
    const starts = edgeStartPoints(W, H)

    starts.forEach((s) => {
      const pts = generatePath(W, H, s.x, s.y)
      if (pts.length < 2) return
      const len = pathLength(pts)
      if (len < 30) return

      const isCyan = Math.random() < 0.35
      const isDashed = Math.random() < 0.28
      const hasChevrons = !isDashed && Math.random() < 0.3

      circuits.push({
        pts,
        len,
        color: isCyan ? 'cyan' : 'blue',
        width: Math.random() < 0.2 ? 1.6 : 1,
        dashed: isDashed,
        chevrons: hasChevrons,
        endGlowPhase: Math.random() * Math.PI * 2,
        dots: [
          {
            dist: Math.random() * len,
            speed: 18 + Math.random() * 35,
            r: 1 + Math.random() * 0.8,
          },
        ],
      })
    })

    circuitsRef.current = circuits
  }, [])

  const drawBackground = useCallback((ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const diag = ctx.createLinearGradient(0, 0, W, H)
    diag.addColorStop(0, '#020810')
    diag.addColorStop(0.5, '#061225')
    diag.addColorStop(1, '#020810')
    ctx.fillStyle = diag
    ctx.fillRect(0, 0, W, H)

    const radial = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.65)
    radial.addColorStop(0, 'rgba(10, 30, 55, 0.55)')
    radial.addColorStop(0.55, 'rgba(5, 15, 30, 0.25)')
    radial.addColorStop(1, 'rgba(2, 5, 12, 0)')
    ctx.fillStyle = radial
    ctx.fillRect(0, 0, W, H)

    const vignette = ctx.createRadialGradient(W / 2, H / 2, Math.max(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75)
    vignette.addColorStop(0, 'rgba(0,0,0,0)')
    vignette.addColorStop(1, 'rgba(1, 3, 8, 0.6)')
    ctx.fillStyle = vignette
    ctx.fillRect(0, 0, W, H)
  }, [])

  const drawPath = useCallback((ctx: CanvasRenderingContext2D, c: Circuit, alpha: number) => {
    ctx.beginPath()
    ctx.moveTo(c.pts[0].x, c.pts[0].y)
    for (let i = 1; i < c.pts.length; i++) ctx.lineTo(c.pts[i].x, c.pts[i].y)
    ctx.strokeStyle = traceColor(c.color, alpha)
    ctx.lineWidth = c.width
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    if (c.dashed) ctx.setLineDash([6, 5])
    ctx.stroke()
    ctx.setLineDash([])
  }, [])

  const drawChevrons = useCallback((ctx: CanvasRenderingContext2D, c: Circuit, alpha: number) => {
    const spacing = 34
    const size = 4.5
    for (let d = spacing; d < c.len - 10; d += spacing) {
      const p = pointAtDistance(c.pts, d)
      const bx = Math.cos(p.angle), by = Math.sin(p.angle)
      const nx = -by, ny = bx
      ctx.beginPath()
      ctx.moveTo(p.x - bx * size + nx * size * 0.7, p.y - by * size + ny * size * 0.7)
      ctx.lineTo(p.x + bx * size * 0.3, p.y + by * size * 0.3)
      ctx.lineTo(p.x - bx * size - nx * size * 0.7, p.y - by * size - ny * size * 0.7)
      ctx.strokeStyle = traceColor(c.color, alpha)
      ctx.lineWidth = 1.2
      ctx.stroke()
    }
  }, [])

  const animate = useCallback((now: number) => {
    if (!canvasRef.current) {
      animRef.current = requestAnimationFrame(animate)
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const DPR = Math.min(window.devicePixelRatio || 1, 2)
    const W = canvas.width / DPR
    const H = canvas.height / DPR

    const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05)
    lastTimeRef.current = now
    const t = now / 1000

    drawBackground(ctx, W, H)

    ctx.save()
    ctx.translate(0, H)
    ctx.scale(1, -1)

    circuitsRef.current.forEach((c, ci) => {
      const pulse = 0.55 + 0.2 * Math.sin(t * 0.6 + ci * 0.7)
      ctx.save()
      ctx.shadowBlur = 6
      ctx.shadowColor = traceColor(c.color, 0.6)
      drawPath(ctx, c, pulse * 0.5)
      if (c.chevrons) drawChevrons(ctx, c, pulse * 0.6)
      ctx.restore()
    })

    circuitsRef.current.forEach((c) => {
      const end = c.pts[c.pts.length - 1]
      const glow = 0.5 + 0.5 * Math.sin(t * 1.5 + c.endGlowPhase)
      const r = 1.2 + glow * 0.8

      const grad = ctx.createRadialGradient(end.x, end.y, 0, end.x, end.y, r * 4)
      grad.addColorStop(0, dotColor(c.color, 0.4 + glow * 0.2))
      grad.addColorStop(1, dotColor(c.color, 0))
      ctx.beginPath()
      ctx.arc(end.x, end.y, r * 4, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()

      ctx.beginPath()
      ctx.arc(end.x, end.y, r * 0.5, 0, Math.PI * 2)
      ctx.fillStyle = dotColor(c.color, 0.7 + glow * 0.15)
      ctx.fill()
    })

    circuitsRef.current.forEach((c) => {
      c.dots.forEach((d) => {
        d.dist += d.speed * dt
        if (d.dist > c.len) {
          d.dist = 0
          d.speed = 18 + Math.random() * 35
        }
        const p = pointAtDistance(c.pts, d.dist)

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, d.r * 4)
        grad.addColorStop(0, dotColor(c.color, 0.7))
        grad.addColorStop(1, dotColor(c.color, 0))
        ctx.beginPath()
        ctx.arc(p.x, p.y, d.r * 4, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()

        ctx.beginPath()
        ctx.arc(p.x, p.y, d.r, 0, Math.PI * 2)
        ctx.fillStyle = dotColor(c.color, 1)
        ctx.fill()
      })
    })

    ctx.restore()

    animRef.current = requestAnimationFrame(animate)
  }, [drawBackground, drawPath, drawChevrons])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return

    const setup = () => {
      const DPR = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = parent.offsetWidth * DPR
      canvas.height = parent.offsetHeight * DPR
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      buildCircuits(parent.offsetWidth, parent.offsetHeight)
    }

    setup()
    lastTimeRef.current = performance.now()
    animRef.current = requestAnimationFrame(animate)

    window.addEventListener('resize', setup)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', setup)
    }
  }, [animate, buildCircuits])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
}
