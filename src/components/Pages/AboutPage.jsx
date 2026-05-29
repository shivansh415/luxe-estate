import { memo, useRef, useEffect, useState, useCallback } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* ── Constants ── */
const TOTAL_FRAMES = 300
const INITIAL_FRAME_BATCH = 12
const FRAME_PATH_PREFIX = '/frames/ezgif-frame-'
const MOBILE_QUERY = '(max-width: 768px)'
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const COARSE_POINTER_QUERY = '(hover: none), (pointer: coarse)'

/** Generate zero-padded frame path */
const getFrameSrc = (i) =>
  `${FRAME_PATH_PREFIX}${String(i).padStart(3, '0')}.jpg`

const matchesQuery = (query) =>
  typeof window !== 'undefined' && window.matchMedia(query).matches

// FIX L-11: Cache media query results at module level and update on resize.
// Calling window.matchMedia().matches inside the 60fps drawFrame was causing
// a style resolution on every canvas paint frame.
let _isMobileCache = matchesQuery(MOBILE_QUERY)
const updateMediaCache = () => { _isMobileCache = matchesQuery(MOBILE_QUERY) }
if (typeof window !== 'undefined') {
  window.addEventListener('resize', updateMediaCache, { passive: true })
}

/**
 * Static particle configs — generated once, never recreated.
 * Each particle floats upward with random position/size/speed.
 */
const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  left: `${4 + Math.random() * 92}%`,
  bottom: `${-8 + Math.random() * 50}%`,
  size: 1 + Math.random() * 2.5,
  delay: Math.random() * 14,
  duration: 10 + Math.random() * 18,
  opacity: 0.04 + Math.random() * 0.14,
}))

/** Manifesto word data */
const MANIFESTO = [
  { word: 'LEGACY', desc: 'Built to outlast generations' },
  { word: 'PRECISION', desc: 'Every detail, intentional' },
  { word: 'ELEGANCE', desc: 'Beauty lives in restraint' },
  { word: 'CRAFTSMANSHIP', desc: 'The art of the exceptional' },
]

const HERO_MARKERS = [
  { value: 'Private Estates', label: 'Bespoke residential commissions' },
  { value: 'Material Silence', label: 'Architecture shaped by restraint' },
  { value: 'Lasting Value', label: 'Spaces designed as heirlooms' },
]

/** Hallway journey scenes */
const HALLWAY_SCENES = [
  {
    src: '/timeline/hallway-1.jpeg',
    label: 'The Arrival',
    desc: 'First impressions are forever',
  },
  {
    src: '/timeline/hallway-2.jpeg',
    label: 'The Corridor',
    desc: 'Where light choreographs shadow',
  },
  {
    src: '/timeline/hallway-3.jpeg',
    label: 'The Gallery',
    desc: 'Architecture speaks in silence',
  },
  {
    src: '/timeline/hallway-4.jpeg',
    label: 'The Destination',
    desc: 'Every journey ends in wonder',
  },
]

/** Luxury materials data */
const MATERIALS = [
  {
    id: 'marble',
    name: 'Black Marble',
    desc: 'Veined darkness, eternal depth',
    video: '/materials/black-marble-loop.mp4.mp4',
    poster: '/textures/black marble.jpeg',
  },
  {
    id: 'gold',
    name: 'Brushed Gold',
    desc: 'Warmth forged in luminance',
    video: '/materials/gold-loop.mp4.mp4',
    poster: '/textures/brushed gold.jpeg',
  },
  {
    id: 'concrete',
    name: 'Raw Concrete',
    desc: 'Strength distilled to surface',
    video: '/materials/concrete-loop.mp4.mp4',
    poster: '/textures/matte concrete.jpeg',
  },
  {
    id: 'glass',
    name: 'Crystal Glass',
    desc: 'Transparency as architecture',
    video: '/materials/glass-loop.mp4.mp4',
    poster: '/textures/white marble.jpeg',
  },
  {
    id: 'walnut',
    name: 'Walnut Wood',
    desc: 'Nature\'s grain, perfected',
    video: '/materials/wood-loop.mp4.mp4',
    poster: '/textures/luxury wood.jpeg',
  },
]

/* ══════════════════════════════════════════════════════════════
   AboutPage — Cinematic Luxury Experience
   Section 1: Hero (video bg + blur-reveal type)
   Section 2: Blueprint Transformation (canvas image sequence)
   Section 3: Luxury Manifesto (editorial typography)
   Section 4: Architectural Journey (hallway perspective gallery)
   Section 5: Materials Showcase (interactive video cards)
   Section 6: Cinematic CTA (emotional ending)
   ══════════════════════════════════════════════════════════════ */
function AboutPage({ onBackToHome, onRequestConsultation, lenisRef }) {
  /* ── Hero Refs ── */
  const pageRef = useRef(null)
  const heroRef = useRef(null)
  const videoRef = useRef(null)
  const contentRef = useRef(null)

  /* ── Blueprint Refs ── */
  const blueprintRef = useRef(null)
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)
  const framesRef = useRef([])
  const drawnFrameRef = useRef(-1)
  const phase1Ref = useRef(null)
  const phase2Ref = useRef(null)
  const phase3Ref = useRef(null)
  const progressFillRef = useRef(null)
  const counterRef = useRef(null)
  const glowRef = useRef(null)

  // Performance optimization refs
  const pendingFrameRef = useRef(0)
  const displayedCounterFrameRef = useRef(-1)
  const rafIdRef = useRef(null)
  const canvasLayoutRef = useRef({ cw: 0, ch: 0, iw: 0, ih: 0, dx: 0, dy: 0, dw: 0, dh: 0 })
  const lastWidthRef = useRef(0)
  const lastHeightRef = useRef(0)
  const loadFrameRef = useRef(null)
  const lastDrawTimeRef = useRef(0)

  /* ── Manifesto Refs ── */
  const manifestoRef = useRef(null)

  /* ── Hallway Journey Refs ── */
  const hallwayRef = useRef(null)

  /* ── Materials Showcase Refs ── */
  const materialsRef = useRef(null)

  /* ── CTA Ending Refs ── */
  const ctaRef = useRef(null)
  const ctaVideoRef = useRef(null)
  const ctaBtnRef = useRef(null)
  const ctaVideoObserverRef = useRef(null)

  const [isRevealed, setIsRevealed] = useState(false)

  /* ────────────────────────────────────────────────
     HERO EFFECTS
     ──────────────────────────────────────────────── */

  /* Staggered entrance reveal */
  useEffect(() => {
    const timer = setTimeout(() => setIsRevealed(true), 200)
    return () => clearTimeout(timer)
  }, [])

  /* GSAP Scroll-Driven Parallax (Hero) */
  useEffect(() => {
    const hero = heroRef.current
    const video = videoRef.current
    const content = contentRef.current
    if (!hero || !video || !content) return
    if (matchesQuery(REDUCED_MOTION_QUERY)) return

    let ctx = null
    const initTimer = setTimeout(() => {
      const isMobile = matchesQuery(MOBILE_QUERY)

      ctx = gsap.context(() => {
        gsap.fromTo(
          video,
          { scale: 1.15, y: '0%' },
          {
            scale: 1.05,
            y: isMobile ? '6%' : '12%',
            ease: 'none',
            scrollTrigger: {
              trigger: hero,
              start: 'top top',
              end: 'bottom top',
              scrub: 0.8,
            },
          }
        )
        gsap.to(content, {
          y: isMobile ? -44 : -80,
          opacity: 0,
          filter: isMobile ? 'blur(5px)' : 'blur(10px)',
          ease: 'none',
          scrollTrigger: {
            trigger: hero,
            start: '25% top',
            end: '85% top',
            scrub: 0.8,
          },
        })
        gsap.to('.about-hero__overlay', {
          opacity: 0.9,
          ease: 'none',
          scrollTrigger: {
            trigger: hero,
            start: '50% top',
            end: 'bottom top',
            scrub: 0.8,
          },
        })
      }, hero)
    }, 150)

    return () => {
      clearTimeout(initTimer)
      if (ctx) ctx.revert()
    }
  }, [])

  /* Video autoplay safeguard */
  const handleVideoRef = useCallback((node) => {
    videoRef.current = node
    if (node) {
      node.play().catch(() => {})
    }
  }, [])

  /* ────────────────────────────────────────────────
     BLUEPRINT — Canvas Frame Drawing
     ──────────────────────────────────────────────── */

  /** Draw a single frame to the canvas with cover-fit */
  const drawFrame = useCallback((index) => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (!ctxRef.current) {
      ctxRef.current = canvas.getContext('2d', { alpha: false, desynchronized: true })
    }

    const ctx = ctxRef.current
    if (!ctx) return

    // Throttle draws to max 60fps, skip if same frame
    const now = performance.now()
    if (now - lastDrawTimeRef.current < 16 && index === drawnFrameRef.current) {
      return
    }
    lastDrawTimeRef.current = now

    let frameIndex = index
    let entry = framesRef.current[frameIndex]

    if (!entry?.loaded || !entry.img?.naturalWidth) {
      for (let offset = 1; offset <= 8; offset += 1) {
        const previous = framesRef.current[frameIndex - offset]
        if (previous?.loaded && previous.img?.naturalWidth) {
          frameIndex -= offset
          entry = previous
          break
        }

        const next = framesRef.current[frameIndex + offset]
        if (next?.loaded && next.img?.naturalWidth) {
          frameIndex += offset
          entry = next
          break
        }
      }
    }

    const img = entry?.img
    if (!entry?.loaded || !img?.naturalWidth) return

    const cw = canvas.width
    const ch = canvas.height
    const iw = img.naturalWidth
    const ih = img.naturalHeight
    let layout = canvasLayoutRef.current

    if (layout.cw !== cw || layout.ch !== ch || layout.iw !== iw || layout.ih !== ih) {
      const scale = Math.max(cw / iw, ch / ih)
      layout = {
        cw,
        ch,
        iw,
        ih,
        dw: iw * scale,
        dh: ih * scale,
        dx: (cw - iw * scale) * 0.5,
        dy: (ch - ih * scale) * 0.5,
      }
      canvasLayoutRef.current = layout
    }

    ctx.imageSmoothingEnabled = true
    // FIX L-11: Use cached isMobile flag — not a live matchMedia call each frame
    ctx.imageSmoothingQuality = _isMobileCache ? 'low' : 'medium'
    ctx.drawImage(img, layout.dx, layout.dy, layout.dw, layout.dh)
    drawnFrameRef.current = frameIndex
    entry.lastUsed = performance.now()
  }, [])

  /* ── Frame Preloading: predictive bounded cache, not an all-at-once decode ── */
  useEffect(() => {
    let cancelled = false
    let observer = null
    let queueTimer = null
    let activeLoads = 0
    let activeCenter = 0
    let lastPreloadCenter = -999

    const isMobile = matchesQuery(MOBILE_QUERY)
    const maxActiveLoads = isMobile ? 1 : 2
    const cacheLimit = isMobile ? 32 : 48
    const preloadBehind = isMobile ? 4 : 6
    const preloadAhead = isMobile ? 12 : 20
    const frames = Array.from({ length: TOTAL_FRAMES })
    const queuedFrames = new Set()
    const loadQueue = []

    const clearQueueTimer = () => {
      if (queueTimer === null) return
      window.clearTimeout(queueTimer)
      queueTimer = null
    }

    const evictFarFrames = () => {
      const loaded = frames
        .map((entry, index) => ({ entry, index }))
        .filter(({ entry }) => entry?.loaded)

      if (loaded.length <= cacheLimit) return

      const protectedStart = Math.max(0, activeCenter - preloadBehind)
      const protectedEnd = Math.min(TOTAL_FRAMES - 1, activeCenter + preloadAhead)
      const removable = loaded
        .filter(({ index }) => (
          index < protectedStart ||
          index > protectedEnd
        ) && index !== drawnFrameRef.current)
        .sort((a, b) => (a.entry.lastUsed || 0) - (b.entry.lastUsed || 0))

      let excess = loaded.length - cacheLimit
      for (const { entry, index } of removable) {
        if (excess <= 0) break
        // FIX C-4: Clearing img.src releases the decoded bitmap from browser memory.
        // Without this, the JS object is nulled but the bitmap stays allocated.
        entry.img.onload = null
        entry.img.onerror = null
        entry.img.src = ''
        frames[index] = null
        excess -= 1
      }
    }

    const scheduleQueue = (delay = 36) => {
      if (queueTimer !== null) return
      queueTimer = window.setTimeout(processQueue, delay)
    }

    const finishLoad = (index, entry) => {
      if (cancelled) return

      activeLoads -= 1
      entry.loaded = true
      entry.loading = false
      entry.lastUsed = performance.now()

      if (index === 0 || index === pendingFrameRef.current || drawnFrameRef.current < 0) {
        drawFrame(index)
      }

      evictFarFrames()
      processQueue()
    }

    const startLoad = (index) => {
      if (cancelled || index < 0 || index >= TOTAL_FRAMES) return

      const existing = frames[index]
      if (existing?.loaded || existing?.loading) return

      const img = new Image()
      const entry = {
        img,
        loaded: false,
        loading: true,
        lastUsed: 0,
      }

      frames[index] = entry
      activeLoads += 1

      img.decoding = 'async'
      img.loading = 'eager'
      img.fetchPriority = Math.abs(index - activeCenter) <= 2 ? 'high' : 'auto'
      img.onload = () => {
        finishLoad(index, entry)
      }
      img.onerror = () => {
        activeLoads -= 1
        frames[index] = null
        processQueue()
      }
      img.src = getFrameSrc(index + 1)
    }

    function processQueue() {
      queueTimer = null
      if (cancelled) return

      while (activeLoads < maxActiveLoads && loadQueue.length > 0) {
        const index = loadQueue.shift()
        queuedFrames.delete(index)
        startLoad(index)
      }

      if (loadQueue.length > 0) {
        scheduleQueue()
      }
    }

    const enqueueFrame = (index, front = false) => {
      if (
        cancelled ||
        index < 0 ||
        index >= TOTAL_FRAMES ||
        queuedFrames.has(index) ||
        frames[index]?.loaded ||
        frames[index]?.loading
      ) return

      queuedFrames.add(index)

      if (front) {
        loadQueue.unshift(index)
      } else {
        loadQueue.push(index)
      }
    }

    const preloadAround = (center, force = false) => {
      if (cancelled) return
      const clampedCenter = Math.max(0, Math.min(TOTAL_FRAMES - 1, center))

      if (!force && Math.abs(clampedCenter - lastPreloadCenter) < 5) {
        return
      }

      activeCenter = clampedCenter
      lastPreloadCenter = clampedCenter

      enqueueFrame(clampedCenter, true)
      enqueueFrame(clampedCenter + 1, true)
      enqueueFrame(clampedCenter - 1, true)

      const start = Math.max(0, clampedCenter - preloadBehind)
      const end = Math.min(TOTAL_FRAMES - 1, clampedCenter + preloadAhead)

      for (let i = clampedCenter + 2; i <= end; i += 1) {
        enqueueFrame(i)
      }

      for (let i = clampedCenter - 2; i >= start; i -= 1) {
        enqueueFrame(i)
      }

      evictFarFrames()
      scheduleQueue(force ? 0 : 24)
    }

    const trimAround = (center, behind = 4, ahead = 8) => {
      activeCenter = Math.max(0, Math.min(TOTAL_FRAMES - 1, center))
      const keepStart = Math.max(0, activeCenter - behind)
      const keepEnd = Math.min(TOTAL_FRAMES - 1, activeCenter + ahead)

      queuedFrames.clear()
      loadQueue.length = 0
      clearQueueTimer()

      frames.forEach((entry, index) => {
        if (!entry || (index >= keepStart && index <= keepEnd)) return
        entry.img.onload = null
        entry.img.onerror = null
        frames[index] = null
      })
    }

    framesRef.current = frames

    loadFrameRef.current = {
      load: (index) => {
        activeCenter = Math.max(0, Math.min(TOTAL_FRAMES - 1, index))
        enqueueFrame(activeCenter, true)
        scheduleQueue(0)
      },
      preloadAround,
      trimAround,
    }

    for (let i = 0; i < INITIAL_FRAME_BATCH; i += 1) {
      enqueueFrame(i)
    }
    // Only preload first batch initially, rest on scroll
    scheduleQueue(100)
    scheduleQueue(0)

    if (typeof IntersectionObserver !== 'undefined' && blueprintRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            preloadAround(pendingFrameRef.current, true)
          }
        },
        { rootMargin: '90% 0px' }
      )
      observer.observe(blueprintRef.current)
    } else {
      preloadAround(0, true)
    }

    return () => {
      cancelled = true
      observer?.disconnect()
      clearQueueTimer()
      queuedFrames.clear()
      loadQueue.length = 0
      frames.forEach((entry) => {
        if (!entry?.img) return
        entry.img.onload = null
        entry.img.onerror = null
        // FIX #8: Release decoded bitmap memory immediately on unmount
        entry.img.src = ''
      })
      loadFrameRef.current = null
    }
  }, [drawFrame])

  /* ── Blueprint activity gate: pause decorative CSS work outside this scene ── */
  useEffect(() => {
    const section = blueprintRef.current
    if (!section || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => {
        section.classList.toggle('is-active', entry.isIntersecting)
      },
      { threshold: 0.01 }
    )

    observer.observe(section)
    return () => {
      observer.disconnect()
      section.classList.remove('is-active')
    }
  }, [])

  /* ── Canvas Sizing + DPR ── */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const isMobile = matchesQuery(MOBILE_QUERY)
      const dpr = isMobile ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.25)
      const rect = canvas.getBoundingClientRect()
      const w = Math.round(rect.width || window.innerWidth)
      const h = Math.round(rect.height || window.innerHeight)

      const widthChanged = Math.abs(w - lastWidthRef.current) > 4
      const heightChanged = Math.abs(h - lastHeightRef.current) > 4

      if (lastWidthRef.current === 0 || widthChanged || heightChanged) {
        lastWidthRef.current = w
        lastHeightRef.current = h

        const canvasW = Math.round(w * dpr)
        const canvasH = Math.round(h * dpr)

        if (canvas.width !== canvasW || canvas.height !== canvasH) {
          canvas.width = canvasW
          canvas.height = canvasH
          ctxRef.current = null // force context refresh

          const firstFrame = framesRef.current[0]?.img
          const iw = firstFrame?.naturalWidth || 1920
          const ih = firstFrame?.naturalHeight || 1080
          const scale = Math.max(canvasW / iw, canvasH / ih)
          canvasLayoutRef.current = {
            cw: canvasW,
            ch: canvasH,
            iw,
            ih,
            dw: iw * scale,
            dh: ih * scale,
            dx: (canvasW - iw * scale) * 0.5,
            dy: (canvasH - ih * scale) * 0.5
          }

          if (drawnFrameRef.current >= 0) {
            requestAnimationFrame(() => drawFrame(drawnFrameRef.current))
          }
        }
      }
    }

    resize()
    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(resize)
      : null

    resizeObserver?.observe(canvas)
    window.addEventListener('resize', resize)
    window.addEventListener('orientationchange', resize)

    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', resize)
      window.removeEventListener('orientationchange', resize)
    }
  }, [drawFrame])

  /* ── Blueprint GSAP ScrollTrigger ── */
  useEffect(() => {
    const section = blueprintRef.current
    if (!section) return
    if (matchesQuery(REDUCED_MOTION_QUERY)) {
      gsap.set(
        [phase1Ref.current, phase2Ref.current, phase3Ref.current],
        { opacity: 1, y: 0, filter: 'none' }
      )
      return
    }

    let ctx = null
    const initTimer = setTimeout(() => {
      const isMobile = matchesQuery(MOBILE_QUERY)

      ctx = gsap.context(() => {
        const requestBlueprintFrame = (progress) => {
          const sequenceProgress = Math.min(progress, 1)
          const frameIndex = Math.max(
            0,
            Math.min(TOTAL_FRAMES - 1, Math.round(sequenceProgress * (TOTAL_FRAMES - 1)))
          )

          pendingFrameRef.current = frameIndex
          loadFrameRef.current?.preloadAround(frameIndex)

          if (!rafIdRef.current) {
            rafIdRef.current = requestAnimationFrame(() => {
              const targetIdx = pendingFrameRef.current
              if (targetIdx !== drawnFrameRef.current) {
                drawFrame(targetIdx)
              }
              rafIdRef.current = null
            })
          }

          // Throttle counter updates to reduce DOM writes
          if (counterRef.current && displayedCounterFrameRef.current !== frameIndex) {
            displayedCounterFrameRef.current = frameIndex
            counterRef.current.textContent =
              `${String(frameIndex + 1).padStart(3, '0')} / ${TOTAL_FRAMES}`
          }
        }

        const pinDistance = () => Math.round(window.innerHeight * (isMobile ? 2.85 : 3.65))
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: () => `+=${pinDistance()}`,
            pin: true,
            pinSpacing: true,
            scrub: isMobile ? 0.5 : 0.8,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            refreshPriority: 1,
            fastScrollEnd: true,
            onEnter: () => {
              section.classList.add('is-active')
              loadFrameRef.current?.preloadAround(pendingFrameRef.current, true)
            },
            onEnterBack: () => {
              section.classList.add('is-active')
              loadFrameRef.current?.preloadAround(pendingFrameRef.current, true)
            },
            onLeave: () => {
              requestBlueprintFrame(1)
              loadFrameRef.current?.trimAround(TOTAL_FRAMES - 1, 10, 0)
            },
            onLeaveBack: () => {
              requestBlueprintFrame(0)
              loadFrameRef.current?.trimAround(0, 0, 10)
            },
            onUpdate: (self) => {
              requestBlueprintFrame(self.progress)
            },
          },
        })

        /* ── Progress bar fill ── */
        tl.fromTo(
          progressFillRef.current,
          { scaleX: 0 },
          { scaleX: 1, duration: 1.0, ease: 'none' },
          0
        )

        /* ── Ambient glow intensification ── */
        tl.fromTo(
          glowRef.current,
          { opacity: 0.06 },
          { opacity: 0.48, duration: 0.48, ease: 'power1.in' },
          0.25
        )

        /* ── Phase I: FROM BLUEPRINT (0%–18%) ── */
        tl.fromTo(
          phase1Ref.current,
          { opacity: 0, y: 35 },
          { opacity: 1, y: 0, duration: 0.07 },
          0.02
        ).to(
          phase1Ref.current,
          { opacity: 0, y: -25, duration: 0.05 },
          0.16
        )

        /* ── Phase II: TO VISION (36%–58%) ── */
        tl.fromTo(
          phase2Ref.current,
          { opacity: 0, y: 35 },
          { opacity: 1, y: 0, duration: 0.07 },
          0.36
        ).to(
          phase2Ref.current,
          { opacity: 0, y: -25, duration: 0.05 },
          0.56
        )

        /* ── Phase III: TO REALITY (76%–100%) ── */
        tl.fromTo(
          phase3Ref.current,
          { opacity: 0, y: 35 },
          { opacity: 1, y: 0, duration: 0.07 },
          0.76
        )


      }, section)
    }, 250)

    return () => {
      clearTimeout(initTimer)
      if (ctx) ctx.revert()
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
    }
  }, [drawFrame])

  /* ────────────────────────────────────────────────
     MANIFESTO — Scroll-driven word reveals
     ──────────────────────────────────────────────── */
  useEffect(() => {
    const section = manifestoRef.current
    if (!section) return
    if (matchesQuery(REDUCED_MOTION_QUERY)) {
      gsap.set(
        [
          '.about-manifesto__opening',
          '.about-manifesto__statement',
          '.about-manifesto__word-block',
          '.about-manifesto__closing',
        ],
        { opacity: 1, y: 0, filter: 'none', scale: 1 }
      )
      return
    }

    let ctx = null
    const initTimer = setTimeout(() => {
      ctx = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            end: 'bottom 90%',
            scrub: 0.5,
          },
        })

        // FIX C-7: Use section.querySelectorAll instead of global string selectors
        // to prevent cross-page selector collisions and double-animation on remount.
        const openingEl   = section.querySelector('.about-manifesto__opening')
        const statementEl = section.querySelector('.about-manifesto__statement')
        const closingEl   = section.querySelector('.about-manifesto__closing')

        // 1. Opening & Statement Reveal
        tl.fromTo(
          [openingEl, statementEl].filter(Boolean),
          { opacity: 0, y: 35 },
          { opacity: 1, y: 0, stagger: 0.15, duration: 1.2, ease: 'power2.out' }
        )

        // 2. Word Blocks Reveal — these are multiple elements, querySelectorAll is safe
        const wordBlocks = gsap.utils.toArray(section.querySelectorAll('.about-manifesto__word-block'))
        wordBlocks.forEach((block, index) => {
          const line = block.querySelector('.about-manifesto__word-line')

          tl.fromTo(
            block,
            { opacity: 0, y: 45, scale: 0.98 },
            { opacity: 1, y: 0, scale: 1, duration: 1.0, ease: 'power2.out' },
            `-=${index === 0 ? 0.3 : 0.6}`
          )

          if (line) {
            tl.fromTo(
              line,
              { scaleX: 0 },
              { scaleX: 1, duration: 0.8, ease: 'power1.inOut' },
              '<'
            )
          }
        })

        // 3. Closing Statement Reveal
        if (closingEl) {
          tl.fromTo(
            closingEl,
            { opacity: 0, y: 30 },
            { opacity: 0.38, y: 0, duration: 1.2, ease: 'power2.out' },
            '-=0.4'
          )
        }
      }, section)
    }, 250)

    return () => {
      clearTimeout(initTimer)
      if (ctx) ctx.revert()
    }
  }, [])

  /* ────────────────────────────────────────────────
     HALLWAY — Perspective gallery walkthrough
     ──────────────────────────────────────────────── */
  useEffect(() => {
    const section = hallwayRef.current
    if (!section) return
    if (matchesQuery(REDUCED_MOTION_QUERY)) {
      // FIX #3: Scope to section — avoids global selector collision
      gsap.set(section.querySelectorAll('.about-hallway__frame:first-child, .about-hallway__label:first-of-type'), {
        opacity: 1,
        scale: 1,
        y: 0,
        filter: 'none',
      })
      return
    }

    let ctx = null
    const initTimer = setTimeout(() => {
      const isMobile = matchesQuery(MOBILE_QUERY)

      ctx = gsap.context(() => {
        const frames = gsap.utils.toArray('.about-hallway__frame')
        const labels = gsap.utils.toArray('.about-hallway__label')
        const total = frames.length

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: isMobile ? '+=220%' : '+=320%',
            pin: true,
            scrub: isMobile ? 0.4 : 0.5,
            anticipatePin: 0,
          },
        })

        frames.forEach((frame, i) => {
          const label = labels[i]
          const segStart = i / total
          const segPeak = (i + 0.4) / total
          const segEnd = (i + 1) / total

          // Frame: starts far away, scales up to full, then zooms past
          tl.fromTo(
            frame,
            {
              scale: 0.35,
              opacity: 0,
              z: -600,
            },
            {
              scale: 1,
              opacity: 1,
              z: 0,
              ease: 'power2.out',
              duration: segPeak - segStart,
            },
            segStart
          ).to(
            frame,
            {
              scale: 1.35,
              opacity: 0,
              z: 300,
              ease: 'power2.in',
              duration: segEnd - segPeak,
            },
            segPeak
          )

          // Darkener animation (CPU-friendly replacement for CSS brightness filter)
          const darkener = frame.querySelector('.about-hallway__image-darkener')
          if (darkener) {
            tl.fromTo(
              darkener,
              { opacity: 0.65 },
              {
                opacity: 0,
                duration: segPeak - segStart,
                ease: 'power2.out',
              },
              segStart
            ).to(
              darkener,
              {
                opacity: 0.9,
                duration: segEnd - segPeak,
                ease: 'power2.in',
              },
              segPeak
            )
          }

          // Label: fade in during approach, fade out during pass
          if (label) {
            tl.fromTo(
              label,
              { opacity: 0, y: 25 },
              {
                opacity: 1,
                y: 0,
                ease: 'power2.out',
                duration: (segPeak - segStart) * 0.7,
              },
              segStart + (segPeak - segStart) * 0.3
            ).to(
              label,
              {
                opacity: 0,
                y: -15,
                ease: 'power1.in',
                duration: (segEnd - segPeak) * 0.6,
              },
              segPeak
            )
          }
        })

        // Ambient glow pulsing across journey
        tl.fromTo(
          '.about-hallway__glow',
          { opacity: 0.04 },
          { opacity: 0.4, ease: 'sine.inOut', yoyo: true, repeat: total - 1 },
          0
        )
      }, section)
    }, 300)

    return () => {
      clearTimeout(initTimer)
      if (ctx) ctx.revert()
    }
  }, [])

  /* ────────────────────────────────────────────────
     MATERIALS — Scroll reveal + hover video
     ──────────────────────────────────────────────── */
  useEffect(() => {
    const section = materialsRef.current
    if (!section) return
    if (matchesQuery(REDUCED_MOTION_QUERY)) {
      // FIX #3: Scope to section — avoids global selector collision
      gsap.set(section.querySelectorAll('.about-materials__header, .about-materials__card'), {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'none',
      })
      return
    }

    let ctx = null
    const initTimer = setTimeout(() => {
      ctx = gsap.context(() => {
        // Section heading reveal
        gsap.fromTo(
          '.about-materials__header',
          { opacity: 0, y: 35 },
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '.about-materials__header',
              start: 'top 88%',
              end: 'top 50%',
              scrub: 0.65,
            },
          }
        )

        // Batched reveal avoids a scrubbed trigger for every material card.
        const cards = gsap.utils.toArray('.about-materials__card')
        gsap.set(cards, {
          opacity: 0,
          y: 44,
          scale: 0.96,
        })

        ScrollTrigger.batch(cards, {
          start: 'top 88%',
          once: true,
          onEnter: (batch) => {
            gsap.to(batch, {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 1.05,
              stagger: 0.08,
              ease: 'power3.out',
              overwrite: true,
            })
          },
        })
      }, section)
    }, 300)

    return () => {
      clearTimeout(initTimer)
      if (ctx) ctx.revert()
    }
  }, [])

  /** Play video on hover, pause on leave */
  const handleMaterialEnter = useCallback((e) => {
    if (matchesQuery(REDUCED_MOTION_QUERY) || matchesQuery(COARSE_POINTER_QUERY)) return
    const video = e.currentTarget.querySelector('video')
    if (video) {
      video.currentTime = 0
      video.play().catch(() => {})
    }
  }, [])

  const handleMaterialLeave = useCallback((e) => {
    const video = e.currentTarget.querySelector('video')
    if (video) {
      video.pause()
    }
  }, [])

  /* ────────────────────────────────────────────────
     CTA — Scroll reveal + magnetic button
     ──────────────────────────────────────────────── */
  useEffect(() => {
    const section = ctaRef.current
    if (!section) return
    if (matchesQuery(REDUCED_MOTION_QUERY)) {
      // FIX #3: Scope to section — avoids global selector collision
      gsap.set(section.querySelectorAll('.about-cta__content'), { opacity: 1, y: 0, filter: 'none' })
      return
    }

    let ctx = null
    const initTimer = setTimeout(() => {
      ctx = gsap.context(() => {
        // Content reveal
        gsap.fromTo(
          '.about-cta__content',
          { opacity: 0, y: 60 },
          {
            opacity: 1,
            y: 0,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 70%',
              end: 'top 20%',
              scrub: 0.7,
            },
          }
        )

        // Video parallax
        gsap.fromTo(
          '.about-cta__video',
          { scale: 1.15, y: '0%' },
          {
            scale: 1.05,
            y: '8%',
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.8,
            },
          }
        )
      }, section)
    }, 300)

    return () => {
      clearTimeout(initTimer)
      if (ctx) ctx.revert()
    }
  }, [])

  /* CTA video autoplay */
  const handleCtaVideoRef = useCallback((node) => {
    ctaVideoRef.current = node
  }, [])

  useEffect(() => {
    const video = ctaVideoRef.current
    const section = ctaRef.current
    if (!video || !section) return

    if (matchesQuery(REDUCED_MOTION_QUERY)) {
      video.pause()
      return
    }

    if (typeof IntersectionObserver === 'undefined') {
      video.play().catch(() => {})
      return
    }

    ctaVideoObserverRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {})
        } else {
          video.pause()
        }
      },
      { rootMargin: '25% 0px' }
    )
    ctaVideoObserverRef.current.observe(section)

    return () => {
      ctaVideoObserverRef.current?.disconnect()
      ctaVideoObserverRef.current = null
    }
  }, [])

  /* ── Sync Lenis on mount & navigation ── */
  useEffect(() => {
    // FIX #15: Removed duplicate ScrollTrigger.refresh() — useSmoothScroll already handles it.
    // Only keep Lenis resize to sync its internal dimensions.
    const timer = setTimeout(() => {
      if (lenisRef?.current) {
        lenisRef.current.resize()
      }
    }, 450)

    return () => clearTimeout(timer)
  }, [lenisRef])

  /* Magnetic button effect */
  const handleBtnMove = useCallback((e) => {
    const btn = ctaBtnRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) * 0.2
    const y = (e.clientY - rect.top - rect.height / 2) * 0.2
    gsap.to(btn, {
      x,
      y,
      duration: 0.45,
      ease: 'power3.out',
      overwrite: true,
    })
  }, [])

  const handleBtnLeave = useCallback(() => {
    const btn = ctaBtnRef.current
    if (!btn) return
    gsap.to(btn, { x: 0, y: 0, duration: 0.65, ease: 'elastic.out(1, 0.45)' })
  }, [])

  /* ══════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════ */
  return (
    <div ref={pageRef} className="standalone-page about-page">

      {/* ════════════════════════════════════════════
          SECTION 1 — Cinematic Hero
          ════════════════════════════════════════════ */}
      <section ref={heroRef} className="about-hero" aria-label="About hero">
        <video
          ref={handleVideoRef}
          className="about-hero__video"
          src="/videos/about-hero-bg.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
        <div className="about-hero__overlay" aria-hidden="true" />
        <div className="about-hero__vignette" aria-hidden="true" />
        <div className="about-hero__light-sweep" aria-hidden="true" />

        <div ref={contentRef} className="about-hero__content">
          <span
            className={`about-hero__chapter${isRevealed ? ' is-revealed' : ''}`}
          >
            III — About
          </span>
          <h1 className="about-hero__headline">
            <span
              className={`about-hero__line${isRevealed ? ' is-revealed' : ''}`}
              style={{ transitionDelay: '0.4s' }}
            >
              We Don't Build Homes.
            </span>
            <span
              className={`about-hero__line${isRevealed ? ' is-revealed' : ''}`}
              style={{ transitionDelay: '0.72s' }}
            >
              We Craft Timeless
            </span>
            <span
              className={`about-hero__line${isRevealed ? ' is-revealed' : ''}`}
              style={{ transitionDelay: '1.04s' }}
            >
              Experiences.
            </span>
          </h1>
          <p
            className={`about-hero__subtitle${isRevealed ? ' is-revealed' : ''}`}
            style={{ transitionDelay: '1.35s' }}
          >
            Where architecture becomes emotion, and every space
            whispers a story of permanence and grace.
          </p>
          <div
            className={`about-hero__accent-line${isRevealed ? ' is-revealed' : ''}`}
            style={{ transitionDelay: '1.6s' }}
          />
        </div>

        <div
          className={`about-hero__meta${isRevealed ? ' is-revealed' : ''}`}
          aria-label="Studio principles"
        >
          {HERO_MARKERS.map((marker) => (
            <div key={marker.value} className="about-hero__meta-item">
              <span className="about-hero__meta-value">{marker.value}</span>
              <span className="about-hero__meta-label">{marker.label}</span>
            </div>
          ))}
        </div>

        <div
          className={`about-hero__scroll-indicator${isRevealed ? ' is-revealed' : ''}`}
        >
          <span className="about-hero__scroll-label">Scroll</span>
          <div className="about-hero__scroll-track">
            <div className="about-hero__scroll-thumb" />
          </div>
        </div>

        <div className="about-hero__bottom-fade" aria-hidden="true" />
      </section>

      {/* ════════════════════════════════════════════
          SECTION 2 — Blueprint Transformation
          Scroll-driven Canvas image sequence
          ════════════════════════════════════════════ */}
      <section
        ref={blueprintRef}
        className="about-blueprint"
        aria-label="Blueprint transformation"
      >
        {/* ── Canvas Layer ── */}
        <canvas ref={canvasRef} className="about-blueprint__canvas" />

        {/* ── Atmospheric Overlays ── */}
        <div className="about-blueprint__grid" aria-hidden="true" />
        <div className="about-blueprint__vignette" aria-hidden="true" />
        <div
          ref={glowRef}
          className="about-blueprint__glow"
          aria-hidden="true"
        />

        <div className="about-blueprint__rail" aria-hidden="true">
          <span>II</span>
          <span>Blueprint To Residence</span>
        </div>

        {/* ── Floating Particles ── */}
        <div className="about-blueprint__particles" aria-hidden="true">
          {PARTICLES.map((p) => (
            <div
              key={p.id}
              className="about-blueprint__particle"
              style={{
                left: p.left,
                bottom: p.bottom,
                width: `${p.size}px`,
                height: `${p.size}px`,
                opacity: p.opacity,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
              }}
            />
          ))}
        </div>

        {/* ── Phase I — Blueprint ── */}
        <div ref={phase1Ref} className="about-blueprint__phase" aria-hidden="true">
          <span className="about-blueprint__phase-eyebrow">Phase I</span>
          <h2 className="about-blueprint__phase-title">From Blueprint</h2>
          <p className="about-blueprint__phase-desc">
            Where vision meets precision on paper
          </p>
        </div>

        {/* ── Phase II — Vision ── */}
        <div ref={phase2Ref} className="about-blueprint__phase" aria-hidden="true">
          <span className="about-blueprint__phase-eyebrow">Phase II</span>
          <h2 className="about-blueprint__phase-title">To Vision</h2>
          <p className="about-blueprint__phase-desc">
            Structure materializes from imagination
          </p>
        </div>

        {/* ── Phase III — Reality ── */}
        <div ref={phase3Ref} className="about-blueprint__phase" aria-hidden="true">
          <span className="about-blueprint__phase-eyebrow">Phase III</span>
          <h2 className="about-blueprint__phase-title">To Reality</h2>
          <p className="about-blueprint__phase-desc">
            The residence awakens into existence
          </p>
        </div>

        {/* ── Progress Track ── */}
        <div className="about-blueprint__progress">
          <div
            ref={progressFillRef}
            className="about-blueprint__progress-fill"
          />
        </div>

        {/* ── Frame Counter ── */}
        <span ref={counterRef} className="about-blueprint__counter">
          001 / 300
        </span>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 3 — Luxury Manifesto
          ════════════════════════════════════════════ */}
      <section
        ref={manifestoRef}
        className="about-manifesto"
        aria-label="Our manifesto"
      >
        {/* ── Atmospheric Layers ── */}
        <div className="about-manifesto__depth" aria-hidden="true" />

        <div className="about-manifesto__content">
          {/* Opening Statement */}
          <p className="about-manifesto__opening">
            A philosophy etched in stone
          </p>

          <p className="about-manifesto__statement">
            Luxury is not louder material. It is the discipline of proportion,
            light, tactility, and silence working together until a residence
            feels inevitable.
          </p>

          {/* Manifesto Words */}
          {MANIFESTO.map((item, i) => (
            <div
              key={item.word}
              className="about-manifesto__word-block"
            >
              <span className="about-manifesto__word-index">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h2 className={`about-manifesto__word about-manifesto__word--${item.word.toLowerCase()}`}>
                {item.word}
              </h2>
              <span className="about-manifesto__word-desc">
                {item.desc}
              </span>
              <div className="about-manifesto__word-line" />
            </div>
          ))}

          {/* Closing Statement */}
          <p className="about-manifesto__closing">
            This is our promise. This is our standard.
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 4 — Architectural Journey
          ════════════════════════════════════════════ */}
      <section
        ref={hallwayRef}
        className="about-hallway"
        aria-label="Architectural journey"
      >
        {/* Atmospheric overlays */}
        <div className="about-hallway__vignette" aria-hidden="true" />
        <div className="about-hallway__glow" aria-hidden="true" />
        <div className="about-hallway__axis" aria-hidden="true" />

        <div className="about-hallway__chapter" aria-hidden="true">
          <span>IV — Spatial Memory</span>
          <p>Each room is paced like a quiet architectural reveal.</p>
        </div>

        {/* Perspective stage */}
        <div className="about-hallway__stage">
          {HALLWAY_SCENES.map((scene, i) => (
            <div key={scene.label} className="about-hallway__frame">
              <img
                className="about-hallway__image"
                src={scene.src}
                alt={scene.label}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                sizes="(max-width: 768px) 86vw, 65vw"
              />
              {/* Cinematic image overlay for depth */}
              <div className="about-hallway__frame-overlay" />
              {/* Darkener overlay to replace CSS brightness filter */}
              <div className="about-hallway__image-darkener" />
            </div>
          ))}
        </div>

        {/* Scene Labels */}
        {HALLWAY_SCENES.map((scene, i) => (
          <div key={`label-${scene.label}`} className="about-hallway__label">
            <span className="about-hallway__label-index">
              {String(i + 1).padStart(2, '0')} / {String(HALLWAY_SCENES.length).padStart(2, '0')}
            </span>
            <h3 className="about-hallway__label-title">{scene.label}</h3>
            <p className="about-hallway__label-desc">{scene.desc}</p>
          </div>
        ))}
      </section>

      {/* ════════════════════════════════════════════
          SECTION 5 — Materials Showcase
          ════════════════════════════════════════════ */}
      <section
        ref={materialsRef}
        className="about-materials"
        aria-label="Luxury materials"
      >
        {/* Section Header */}
        <div className="about-materials__header">
          <span className="about-materials__eyebrow">V — Our Palette</span>
          <h2 className="about-materials__title">Materials of Distinction</h2>
          <p className="about-materials__subtitle">
            Each surface chosen for its character, its story, its permanence.
          </p>
        </div>

        {/* Materials Grid */}
        <div className="about-materials__grid">
          {MATERIALS.map((mat, i) => (
            <div
              key={mat.id}
              className="about-materials__card"
              style={{ '--material-poster': `url("${mat.poster}")` }}
              onMouseEnter={handleMaterialEnter}
              onMouseLeave={handleMaterialLeave}
              onFocus={handleMaterialEnter}
              onBlur={handleMaterialLeave}
              tabIndex={0}
              role="button"
              aria-label={`${mat.name}: ${mat.desc}`}
            >
              {/* Video — paused by default, plays on hover */}
              <video
                className="about-materials__video"
                src={mat.video}
                poster={mat.poster}
                muted
                loop
                playsInline
                preload="metadata"
              />

              {/* Dark overlay + light sweep */}
              <div className="about-materials__card-overlay" />
              <div className="about-materials__light-sweep" />

              {/* Card Content */}
              <div className="about-materials__card-content">
                <span className="about-materials__card-index">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="about-materials__card-name">{mat.name}</span>
                <span className="about-materials__card-desc">{mat.desc}</span>
              </div>

              {/* Corner accent */}
              <div className="about-materials__card-corner" />
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 6 — Cinematic CTA Ending
          ════════════════════════════════════════════ */}
      <section
        ref={ctaRef}
        className="about-cta"
        aria-label="Schedule consultation"
      >
        {/* Background Video */}
        <video
          ref={handleCtaVideoRef}
          className="about-cta__video"
          src="/videos/about-cta-bg.mp4"
          muted
          loop
          playsInline
          preload="metadata"
        />

        {/* Overlays */}
        <div className="about-cta__overlay" aria-hidden="true" />
        <div className="about-cta__vignette" aria-hidden="true" />
        <div className="about-cta__light-sweep" aria-hidden="true" />

        {/* Content */}
        <div className="about-cta__content">
          <span className="about-cta__chapter">VI — The Invitation</span>

          <h2 className="about-cta__headline">
            <span className="about-cta__headline-line">
              The Future Of Luxury
            </span>
            <span className="about-cta__headline-line about-cta__headline-line--accent">
              Is Emotional.
            </span>
          </h2>

          <div className="about-cta__accent-line" />

          <p className="about-cta__body">
            Experience spaces that don’t just shelter — they inspire,
            they breathe, they become part of who you are.
          </p>

          {/* Magnetic CTA Button */}
          <div
            className="about-cta__btn-wrap"
            onMouseMove={handleBtnMove}
            onMouseLeave={handleBtnLeave}
          >
            <button
              ref={ctaBtnRef}
              className="about-cta__btn"
              type="button"
              onClick={onRequestConsultation}
            >
              <span className="about-cta__btn-text">
                Schedule A Private Consultation
              </span>
              <span className="about-cta__btn-glow" aria-hidden="true" />
            </button>
          </div>

          {/* Return Home */}
          <button
            className="about-cta__back"
            onClick={onBackToHome}
            type="button"
          >
            ← Return Home
          </button>
        </div>

        {/* Bottom gradient */}
        <div className="about-cta__bottom-fade" aria-hidden="true" />
      </section>

      {/* Root fixed grain overlay for the entire About page */}
      <div className="about-page__grain" aria-hidden="true" />
    </div>
  )
}

export default memo(AboutPage)
