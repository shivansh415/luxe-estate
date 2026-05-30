import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { isCoarsePointer } from '../utils/mobile'

gsap.registerPlugin(ScrollTrigger)

/**
 * useSmoothScroll
 *
 * Manages Lenis smooth scrolling + GSAP ScrollTrigger integration.
 *
 * PERFORMANCE FIX: scrollProgress and currentSection are stored in
 * refs instead of state to avoid re-rendering the entire React tree
 * on every scroll frame (~60fps). The WebGL layer reads these refs
 * directly inside useFrame — zero re-renders.
 */
export function useSmoothScroll() {
  const lenisRef = useRef(null)
  const scrollProgressRef = useRef(0)
  const currentSectionRef = useRef(0)
  const sectionTriggersRef = useRef([])

  useEffect(() => {
    /* Mobile / touch devices:
       - touchMultiplier 1.0 (was 1.5): stop fighting native iOS momentum.
       - duration 1.0 (was 1.8): shorter settle time so finger-lift feels native.
       - smoothWheel still on for hybrid devices (trackpad on iPad with mouse).
       Desktop preserves the original cinematic 1.8s feel. */
    const coarse = isCoarsePointer()

    const lenis = new Lenis({
      autoRaf: false,
      duration: coarse ? 1.0 : 1.8,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.8,
      touchMultiplier: coarse ? 1.0 : 1.5,
    })

    lenisRef.current = lenis

    // Connect Lenis to GSAP ScrollTrigger
    const unsubscribeScrollTrigger = lenis.on('scroll', ScrollTrigger.update)

    // Drive Lenis from GSAP's ticker (unified RAF)
    const tickLenis = (time) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(tickLenis)
    gsap.ticker.lagSmoothing(0)

    // Track scroll progress into a ref — NO setState, NO re-renders
    const unsubscribeProgress = lenis.on('scroll', ({ progress }) => {
      scrollProgressRef.current = progress

      // Direct DOM updates for ultra-smooth performance
      const bar = document.getElementById('nav-progress-bar')
      if (bar) {
        bar.style.transform = `scaleX(${progress})`
      }

      const nav = document.getElementById('main-nav')
      if (nav) {
        if (progress > 0.02) {
          nav.classList.add('nav-scrolled')
        } else {
          nav.classList.remove('nav-scrolled')
        }
      }
    })

    return () => {
      unsubscribeScrollTrigger?.()
      unsubscribeProgress?.()
      gsap.ticker.remove(tickLenis)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  // Setup section triggers — write to ref, not state
  useEffect(() => {
    // FIX L-5: Keep timer ID in a stable closure variable so cleanup always
    // has the correct value, even after the timer fires and nulls sectionPulseTimerRef.
    let pulseTimerId = null
    let refreshTimer = null

    const triggerSectionPulse = (nextIndex) => {
      if (currentSectionRef.current === nextIndex) return

      currentSectionRef.current = nextIndex
      document.body.classList.add('cinematic-section-shift')

      if (pulseTimerId !== null) {
        clearTimeout(pulseTimerId)
        pulseTimerId = null
      }

      pulseTimerId = setTimeout(() => {
        document.body.classList.remove('cinematic-section-shift')
        pulseTimerId = null
      }, 1050)
    }

    const timer = setTimeout(() => {
      const sections = [
        { id: 'editorial-section', index: 1 },
        { id: 'cinematic-card-section', index: 2 },
        { id: 'center-text-section', index: 3 },
        { id: 'left-card-section', index: 4 },
        { id: 'vertical-card-section', index: 5 },
        { id: 'right-card-section', index: 6 },
        { id: 'left-vertical-card-section', index: 7 },
        { id: 'editorial-card-8', index: 8 },
        { id: 'editorial-card-9', index: 9 },
        { id: 'editorial-card-10', index: 10 },
        { id: 'editorial-card-11', index: 11 },
        { id: 'mission-section', index: 12 },
      ]

      // FIX C-6: Debounce ScrollTrigger.refresh to prevent multiple synchronous reflows.
      // A single 150ms delay batches any resize/layout changes that happen around mount.
      sections.forEach(({ id, index }) => {
        const el = document.getElementById(id)
        if (el) {
          const trigger = ScrollTrigger.create({
            trigger: el,
            start: 'top center',
            end: 'bottom center',
            onEnter: () => { triggerSectionPulse(index) },
            onLeaveBack: () => { triggerSectionPulse(index - 1) },
          })
          sectionTriggersRef.current.push(trigger)
        }
      })

      refreshTimer = setTimeout(() => {
        ScrollTrigger.refresh()
        refreshTimer = null
      }, 150)
    }, 100)

    return () => {
      clearTimeout(timer)
      // FIX #17: Also clear the nested refreshTimer to prevent stale refresh
      if (refreshTimer !== null) clearTimeout(refreshTimer)
      // FIX L-5: Use local variable, not ref, to ensure we always clear the right timer
      if (pulseTimerId !== null) {
        clearTimeout(pulseTimerId)
        pulseTimerId = null
      }
      document.body.classList.remove('cinematic-section-shift')
      sectionTriggersRef.current.forEach(trigger => trigger.kill())
      sectionTriggersRef.current = []
    }
  }, [])

  return { scrollProgressRef, currentSectionRef, lenisRef }
}
