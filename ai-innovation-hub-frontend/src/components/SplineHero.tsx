"use client"

import dynamic from "next/dynamic"
import { useEffect, useRef } from "react"

const Spline = dynamic(() => import("@splinetool/react-spline"), { ssr: false })

export function SplineHero() {
  const innerRef = useRef<HTMLDivElement | null>(null)

  // Smooth cursor-follow without React re-renders (prevents shaking).
  useEffect(() => {
    let raf = 0

    const target: { x: number; y: number; nx: number; ny: number } = {
      x: 0,
      y: 0,
      nx: 0,
      ny: 0,
    }

    const current: { x: number; y: number } = { x: 0, y: 0 }

    function onMove(e: MouseEvent) {
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      const nx = (e.clientX - cx) / cx // [-1..1]
      const ny = (e.clientY - cy) / cy // [-1..1]

      // Larger range so the effect is visible even when the scene fills the hero.
      const max = 28
      target.x = Math.max(-max, Math.min(max, nx * max))
      target.y = Math.max(-max, Math.min(max, ny * max))

      target.nx = nx
      target.ny = ny
    }

    function animate() {
      current.x += (target.x - current.x) * 0.07
      current.y += (target.y - current.y) * 0.07

      const el = innerRef.current
      if (el) {
        const nx = target.nx
        const ny = target.ny
        const rotY = nx * 4 // deg
        const rotX = -ny * 3 // deg
        el.style.transform = `translate3d(${current.x}px, ${current.y}px, 0) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.06)`
      }

      raf = window.requestAnimationFrame(animate)
    }

    window.addEventListener("mousemove", onMove, { passive: true })
    raf = window.requestAnimationFrame(animate)

    return () => {
      window.removeEventListener("mousemove", onMove)
      window.cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="spline-bg" aria-hidden>
      <div ref={innerRef} className="spline-bg-inner">
        <Spline scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode" />
      </div>
    </div>
  )
}
