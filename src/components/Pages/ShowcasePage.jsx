import { memo, useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useYouTubePlayer } from '../../context/YouTubePlayerContext'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const wrap = (value, length) => ((value % length) + length) % length
const smoothstep = (edge0, edge1, value) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

const circularDelta = (target, current) => {
  let delta = target - current
  if (delta > 0.5) delta -= 1
  if (delta < -0.5) delta += 1
  return delta
}

const circularLerp = (current, target, ease) => {
  return wrap(current + circularDelta(target, current) * ease, 1)
}

const signedLoopDistance = (screenDepth, cameraDepth, loopDepth) => {
  const halfLoop = loopDepth * 0.5
  return wrap(screenDepth - cameraDepth + halfLoop, loopDepth) - halfLoop
}

const SHOWCASE_LOOP_COUNT = 7
const SHOWCASE_CENTER_LOOP = 3
const SHOWCASE_CLICK_DELAY = 220

const getShowcaseCardId = (screenId) => `showcase-${screenId}`
const getYouTubeThumbnail = (id, quality = 'maxresdefault') =>
  `https://img.youtube.com/vi/${id}/${quality}.jpg`
const getYouTubeEmbedUrl = (id) =>
  `https://www.youtube.com/embed/${id}?autoplay=1&mute=0&controls=0&modestbranding=1&rel=0&showinfo=0&playsinline=1&enablejsapi=1&iv_load_policy=3&disablekb=1&fs=0`
const getYouTubeWatchUrl = (id) =>
  `https://www.youtube.com/watch?v=${id}`

const SHOWCASE_SCREENS = [
  {
    id: 'aether',
    index: '01',
    title: 'The Aether Collection',
    location: 'Malibu, California',
    note: 'Panoramic residence film',
    x: -350,
    y: 70,
    compactY: -30,
    rotateY: 11,
    rotateZ: -1.8,
    scale: 1.08,
    aspect: '16 / 10',
    tone: 'copper',
    youtubeId: '_93gJM3JSns',
  },
  {
    id: 'horizon',
    index: '02',
    title: 'Horizon One',
    location: 'Big Sur, California',
    note: 'Cliffside architectural passage',
    x: 360,
    y: -10,
    compactY: -15,
    rotateY: -10,
    rotateZ: 1.5,
    scale: 1.16,
    aspect: '16 / 9',
    tone: 'ivory',
    youtubeId: 'ZVT4Rg3qG30',
  },
  {
    id: 'monolith',
    index: '03',
    title: 'The Monolith',
    location: 'Santorini, Greece',
    note: 'Vertical sanctuary study',
    x: -270,
    y: -70,
    compactY: 10,
    rotateY: 8,
    rotateZ: -1.2,
    scale: 0.95,
    aspect: '16 / 10',
    tone: 'smoke',
    youtubeId: 'fU6b9JKnAF4',
  },
  {
    id: 'meridian',
    index: '04',
    title: 'The Meridian Estate',
    location: 'Byron Bay, Australia',
    note: 'Coastal reserve flythrough',
    x: 330,
    y: 85,
    compactY: 20,
    rotateY: -9,
    rotateZ: 1.1,
    scale: 1.06,
    aspect: '16 / 10',
    tone: 'blue',
    youtubeId: 'IT1-lHTTbIs',
  },
  {
    id: 'atelier',
    index: '05',
    title: 'Atelier Noire',
    location: 'Kyoto, Japan',
    note: 'Shadow and material archive',
    x: -390,
    y: 0,
    compactY: 5,
    rotateY: 12,
    rotateZ: -1.6,
    scale: 1.12,
    aspect: '16 / 9',
    tone: 'green',
    youtubeId: 'WyveOJVHaHE',
  },
  {
    id: 'summit',
    index: '06',
    title: 'Summit Pinnacle',
    location: 'Zermatt, Switzerland',
    note: 'Alpine exhibition chamber',
    x: 250,
    y: -60,
    compactY: -10,
    rotateY: -7,
    rotateZ: 0.9,
    scale: 0.98,
    aspect: '16 / 10',
    tone: 'gold',
    youtubeId: 'XtCabIoof_Q',
  },
]

const CARD_ID_TO_INDEX = Object.fromEntries(
  SHOWCASE_SCREENS.map((screen, index) => [getShowcaseCardId(screen.id), index])
)


function ShowcasePage({ onBackToProjects, lenisRef }) {
  const pageRef = useRef(null)
  const stageRef = useRef(null)
  const cameraRef = useRef(null)
  const environmentRef = useRef(null)
  const corridorRef = useRef(null)
  const floorRef = useRef(null)
  const airRef = useRef(null)
  const progressRef = useRef(0)
  const cameraStateRef = useRef({
    x: 0,
    y: 0,
    velocity: 0,
    roll: 0,
  })
  const metricsRef = useRef({
    loopDepth: 1,
    loopScroll: 1,
    centerScroll: 0,
    scrollLoops: SHOWCASE_LOOP_COUNT,
  })
  const activeIndexRef = useRef(-1)
  const activeCardIdRef = useRef(null)
  const hasSeededScrollRef = useRef(false)
  const clickTimerRef = useRef(null)
  const screenRefs = useRef([])
  const cursorRefs = useRef([])
  const cursorStatesRef = useRef([])
  const railRefs = useRef([])
  const isCompactRef = useRef(false)
  const framesRef = useRef(
    SHOWCASE_SCREENS.map((screen) => ({
      screen,
      side: 0,
      worldX: 0,
      worldY: 0,
      depth: 0,
      distance: 0,
      absDistance: 0,
    }))
  )
  const [iframeFadedIn, setIframeFadedIn] = useState(false)
  const { activeCardId, activateCard, deactivateCard } = useYouTubePlayer()
  const activeShowcaseCardId = activeCardId?.startsWith('showcase-')
    ? activeCardId
    : null

  const assignScreenRef = useCallback((node, index) => {
    screenRefs.current[index] = node
  }, [])

  const assignCursorRef = useCallback((node, index) => {
    cursorRefs.current[index] = node
  }, [])

  const assignRailRef = useCallback((node, index) => {
    railRefs.current[index] = node
  }, [])

  const readScrollY = useCallback(() => {
    const lenis = lenisRef.current
    return lenis?.animatedScroll ?? window.scrollY
  }, [lenisRef])

  const setScrollY = useCallback((value) => {
    const lenis = lenisRef.current
    if (lenis) {
      lenis.scrollTo(value, { immediate: true, force: true })
      return
    }

    window.scrollTo(0, value)
  }, [lenisRef])

  const scrollToScreen = useCallback((index) => {
    const { loopScroll } = metricsRef.current
    if (!loopScroll) return

    const currentScroll = readScrollY()
    const targetLocal = (index / SHOWCASE_SCREENS.length) * loopScroll
    const currentLocal = wrap(currentScroll, loopScroll)
    let delta = targetLocal - currentLocal

    if (delta > loopScroll * 0.5) delta -= loopScroll
    if (delta < loopScroll * -0.5) delta += loopScroll

    const lenis = lenisRef.current
    const targetScroll = currentScroll + delta

    if (lenis) {
      lenis.scrollTo(targetScroll, {
        duration: 1.45,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      })
      return
    }

    window.scrollTo({ top: targetScroll, behavior: 'smooth' })
  }, [lenisRef, readScrollY])

  const handleScreenClick = useCallback((event, screen) => {
    if (!screen.youtubeId || event.detail > 1) return

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current)
    }

    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null
      const cardId = getShowcaseCardId(screen.id)

      if (activeCardIdRef.current === cardId) {
        // Toggle OFF — deactivate the playing card
        deactivateCard(cardId)
        activeCardIdRef.current = null
      } else {
        // Toggle ON — hide cursors immediately, then activate
        cursorRefs.current.forEach((label) => {
          if (label) label.style.opacity = '0'
        })
        cursorStatesRef.current.forEach((state) => {
          if (state) state.visible = false
        })
        activateCard(cardId)
      }
    }, SHOWCASE_CLICK_DELAY)
  }, [activateCard, deactivateCard])

  const handleScreenDoubleClick = useCallback((event, screen) => {
    if (!screen.youtubeId) return
    event.preventDefault()

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current)
      clickTimerRef.current = null
    }

    window.open(getYouTubeWatchUrl(screen.youtubeId), '_blank', 'noopener,noreferrer')
  }, [])

  const handleScreenKeyDown = useCallback((event, screen) => {
    if (!screen.youtubeId || (event.key !== 'Enter' && event.key !== ' ')) return
    event.preventDefault()
    const cardId = getShowcaseCardId(screen.id)
    if (activeCardIdRef.current === cardId) {
      deactivateCard(cardId)
      activeCardIdRef.current = null
    } else {
      activateCard(cardId)
    }
  }, [activateCard, deactivateCard])

  const updateScreenCursor = useCallback((event, index, forceVisible = false) => {
    // Never show cursor if ANY showcase card is playing
    if (activeCardIdRef.current?.startsWith('showcase-')) return

    const el = screenRefs.current[index]
    const label = cursorRefs.current[index]
    if (!el || !label) return

    const rect = el.getBoundingClientRect()
    const targetX = event.clientX - rect.left
    const targetY = event.clientY - rect.top
    const existing = cursorStatesRef.current[index]

    let state
    if (existing) {
      state = {
        ...existing,
        targetX,
        targetY,
      }
    } else {
      state = {
        x: rect.width * 0.5,
        y: rect.height * 0.5,
        targetX,
        targetY,
        visible: false,
      }
    }

    if (forceVisible || !state.visible) {
      state = {
        ...state,
        x: targetX,
        y: targetY,
        visible: true,
      }
      label.style.opacity = '1'
    }

    cursorStatesRef.current[index] = state
  }, [])

  const hideScreenCursor = useCallback((index) => {
    const state = cursorStatesRef.current[index]
    const label = cursorRefs.current[index]
    if (state) {
      cursorStatesRef.current[index] = { ...state, visible: false }
    }
    if (label) label.style.opacity = '0'
  }, [])

  useEffect(() => {
    activeCardIdRef.current = activeCardId

    // When any showcase card becomes active, scrub ALL cursor labels hidden
    if (activeCardId?.startsWith('showcase-')) {
      cursorRefs.current.forEach((label) => {
        if (label) label.style.opacity = '0'
      })
      cursorStatesRef.current.forEach((state, index) => {
        if (state) {
          cursorStatesRef.current[index] = { ...state, visible: false }
        }
      })
    }
  }, [activeCardId])

  useEffect(() => {
    let firstFrame = null
    let secondFrame = null

    if (activeShowcaseCardId) {
      firstFrame = requestAnimationFrame(() => {
        setIframeFadedIn(false)
        secondFrame = requestAnimationFrame(() => setIframeFadedIn(true))
      })
    } else {
      firstFrame = requestAnimationFrame(() => setIframeFadedIn(false))
    }

    return () => {
      if (firstFrame) cancelAnimationFrame(firstFrame)
      if (secondFrame) cancelAnimationFrame(secondFrame)
    }
  }, [activeShowcaseCardId])

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    document.body.classList.add('showcase-active')

    const page = pageRef.current
    const stage = stageRef.current
    const camera = cameraRef.current
    const lenis = lenisRef.current
    const enterFrame = requestAnimationFrame(() => {
      stage?.classList.add('is-entered')
    })

    const updateViewportMode = () => {
      const compact = window.innerWidth < 800
      const screenCount = SHOWCASE_SCREENS.length
      const spacing = compact ? 980 : 1280
      const loopDepth = spacing * screenCount
      const loopScroll = Math.max(
        window.innerHeight * screenCount * (compact ? 1.02 : 1.14),
        loopDepth * (compact ? 0.62 : 0.72)
      )
      const centerScroll = loopScroll * SHOWCASE_CENTER_LOOP
      const scrollHeight = loopScroll * SHOWCASE_LOOP_COUNT + window.innerHeight

      isCompactRef.current = compact
      metricsRef.current = {
        loopDepth,
        loopScroll,
        centerScroll,
        scrollLoops: SHOWCASE_LOOP_COUNT,
        spacing,
      }

      page?.style.setProperty('--showcase-scroll-height', `${scrollHeight}px`)
      lenisRef.current?.resize?.()

      if (!hasSeededScrollRef.current) {
        hasSeededScrollRef.current = true
        requestAnimationFrame(() => {
          setScrollY(centerScroll)
        })
      }
    }

    const renderFrame = () => {
      // FIX C-8: Skip computation entirely during page transitions or when tab is hidden.
      // gsap.ticker still fires during cinematic transition (screen is blacked out).
      // document.hidden also covers background tabs — free CPU when not visible.
      if (document.hidden || document.body.classList.contains('cinematic-transitioning')) return

      const {
        loopDepth,
        loopScroll,
        centerScroll,
        scrollLoops,
        spacing,
      } = metricsRef.current
      const compact = isCompactRef.current
      let scrollY = readScrollY()

      if (loopScroll > 1) {
        const lowerBound = loopScroll * 0.75
        const upperBound = loopScroll * (scrollLoops - 0.75)

        if (scrollY < lowerBound || scrollY > upperBound) {
          scrollY = centerScroll + wrap(scrollY, loopScroll)
          setScrollY(scrollY)
        }
      }

      const targetProgress = wrap(scrollY, loopScroll) / loopScroll
      const progressDelta = circularDelta(targetProgress, progressRef.current)
      progressRef.current = circularLerp(
        progressRef.current,
        targetProgress,
        compact ? 0.052 : 0.046
      )
      const progress = progressRef.current
      const cameraZ = progress * loopDepth
      const visibleAhead = compact ? 900 : 1180
      const visibleBehind = compact ? 430 : 620
      const focusRange = compact ? 330 : 430
      const laneFollow = compact ? 0.86 : 0.79
      const scrollVelocity = clamp(progressDelta * 92, -1, 1)
      let weightedX = 0
      let weightedY = 0
      let totalWeight = 0
      let activeIndex = 0
      let closestDistance = Number.POSITIVE_INFINITY

      const frames = framesRef.current
      SHOWCASE_SCREENS.forEach((screen, index) => {
        const side = index % 2 === 0 ? -1 : 1
        const worldX = compact ? side * 92 : screen.x
        const worldY = compact ? screen.compactY : screen.y
        const depth = index * spacing
        const distance = signedLoopDistance(depth, cameraZ, loopDepth)
        const absDistance = Math.abs(distance)
        const railWeight = Math.pow(
          clamp(1 - absDistance / (spacing * 0.78), 0, 1),
          2.55
        )

        weightedX += worldX * railWeight
        weightedY += worldY * railWeight
        totalWeight += railWeight

        if (absDistance < closestDistance) {
          closestDistance = absDistance
          activeIndex = index
        }

        const frame = frames[index]
        frame.side = side
        frame.worldX = worldX
        frame.worldY = worldY
        frame.depth = depth
        frame.distance = distance
        frame.absDistance = absDistance
      })

      const cameraState = cameraStateRef.current
      cameraState.velocity += (scrollVelocity - cameraState.velocity) * 0.08

      const driftX =
        Math.sin(progress * Math.PI * 4.2) * (compact ? 4 : 11) +
        cameraState.velocity * (compact ? 10 : 28)
      const driftY =
        Math.sin(progress * Math.PI * 2.6 + 0.8) * (compact ? 3 : 7)
      const targetCameraX =
        (totalWeight > 0 ? (weightedX / totalWeight) * laneFollow : 0) + driftX
      const targetCameraY =
        (totalWeight > 0 ? (weightedY / totalWeight) * 0.22 : 0) + driftY
      const targetRoll =
        cameraState.velocity * (compact ? 0.16 : 0.26) +
        Math.sin(progress * Math.PI * 2.1) * (compact ? 0.025 : 0.045)

      cameraState.x += (targetCameraX - cameraState.x) * 0.045
      cameraState.y += (targetCameraY - cameraState.y) * 0.04
      cameraState.roll += (targetRoll - cameraState.roll) * 0.045

      stage?.style.setProperty('--showcase-progress', progress.toFixed(4))

      if (camera) {
        const cameraScale = compact
          ? 1.07 + Math.sin(progress * Math.PI * 2) * 0.006 + Math.abs(cameraState.velocity) * 0.004
          : 1.055 + Math.sin(progress * Math.PI * 2) * 0.009 + Math.abs(cameraState.velocity) * 0.006
        camera.style.transform = `translate3d(${cameraState.x * -0.12}px, ${cameraState.y * -0.2}px, 0) scale(${cameraScale}) rotateZ(${cameraState.roll}deg)`
      }

      if (environmentRef.current) {
        const environmentScale = compact ? 1.08 : 1.04
        environmentRef.current.style.transform = `translate3d(${cameraState.x * -0.025}px, ${cameraState.y * -0.035}px, 0) scale(${environmentScale})`
      }

      if (corridorRef.current) {
        corridorRef.current.style.transform = `translate3d(${cameraState.x * -0.17}px, ${cameraState.y * -0.08}px, 0) scale(${1.015 + Math.abs(cameraState.velocity) * 0.006})`
      }

      if (floorRef.current) {
        floorRef.current.style.transform = `translate3d(${cameraState.x * -0.26}px, ${cameraState.y * -0.04}px, 0) scale(${1.01 + Math.abs(cameraState.velocity) * 0.008})`
      }

      if (airRef.current) {
        const airOpacity = compact
          ? 0.32 + Math.abs(cameraState.velocity) * 0.08
          : 0.42 + Math.abs(cameraState.velocity) * 0.1
        airRef.current.style.opacity = airOpacity.toFixed(3)
        airRef.current.style.transform = `translate3d(${cameraState.x * -0.09}px, ${cameraState.y * -0.12}px, 0) scale(${1.02 + Math.abs(cameraState.velocity) * 0.01})`
      }

      cursorRefs.current.forEach((label, index) => {
        const state = cursorStatesRef.current[index]
        if (!label || !state || !state.visible) return

        state.x += (state.targetX - state.x) * 0.24
        state.y += (state.targetY - state.y) * 0.24
        label.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) translate3d(-50%, -50%, 0)`
      })

      if (activeIndexRef.current !== activeIndex) {
        activeIndexRef.current = activeIndex
        screenRefs.current.forEach((node, index) => {
          node?.classList.toggle('is-focused', index === activeIndex)
        })
        railRefs.current.forEach((node, index) => {
          node?.classList.toggle('is-active', index === activeIndex)
          if (index === activeIndex) {
            node?.setAttribute('aria-current', 'true')
          } else {
            node?.removeAttribute('aria-current')
          }
        })
      }

      const playingCardId = activeCardIdRef.current
      if (playingCardId?.startsWith('showcase-')) {
        const playingIndex = CARD_ID_TO_INDEX[playingCardId] ?? -1
        const playingFrame = frames[playingIndex]

        if (!playingFrame || playingFrame.absDistance > spacing * 0.92) {
          activeCardIdRef.current = null
          deactivateCard(playingCardId)
        }
      }

      frames.forEach(({ screen, side, worldX, worldY, distance, absDistance }, index) => {
        const el = screenRefs.current[index]
        if (!el) return

        const aheadFade = 1 - smoothstep(focusRange * 0.62, visibleAhead, distance)
        const behindFade = 1 - smoothstep(focusRange * 0.46, visibleBehind, -distance)
        const visibility = clamp(Math.min(aheadFade, behindFade), 0, 1)
        const focus = 1 - smoothstep(0, focusRange, absDistance)
        const focusGlow = Math.pow(focus, 0.74)
        const depthPresence = clamp(1 - absDistance / (spacing * 0.96), 0, 1)
        const opacity = visibility < 0.07 ? 0 : Math.pow(visibility, 2.25)
        const approach = clamp(1 - absDistance / spacing, 0, 1)
        const pass = clamp(-distance / visibleBehind, 0, 1)
        const depthRatio = clamp(distance / spacing, -1, 1)
        const convergence = distance > 0
          ? -side * distance * (compact ? 0.045 : 0.118)
          : -side * distance * (compact ? 0.082 : 0.19)
        const velocityCounter = cameraState.velocity * (compact ? -8 : -22)
        const x = worldX - cameraState.x + convergence + velocityCounter
        const y =
          worldY -
          cameraState.y +
          Math.sin(progress * Math.PI * 2 + index * 0.7) * (compact ? 2.5 : 4.5) * (1 - focusGlow) -
          depthRatio * (compact ? 8 : 16)
        const scale =
          screen.scale *
          (compact
            ? 0.63 + depthPresence * 0.27 + focusGlow * 0.29 + pass * 0.05
            : 0.58 + depthPresence * 0.36 + focusGlow * 0.34 + pass * 0.075)
        const rotateY = compact
          ? screen.rotateY * 0.14 - depthRatio * side * 2
          : screen.rotateY * (1 - focusGlow * 0.62) - depthRatio * side * 6.5 + pass * side * 4.5
        const rotateX = depthRatio * (compact ? -0.55 : -0.9)
        const rotateZ = compact
          ? screen.rotateZ * 0.22 + cameraState.roll * 0.14
          : screen.rotateZ * (1 - focusGlow * 0.42) + cameraState.roll * 0.18
        const light = 0.38 + focusGlow * 0.44 + approach * 0.08
        const reflection = 0.14 + focusGlow * 0.2 + pass * 0.05
        const copyLift = (1 - focusGlow) * (compact ? 7 : 10)
        const lineScale = 0.55 + focusGlow * 0.45

        el.style.opacity = opacity.toFixed(3)
        el.style.setProperty('--screen-focus', focusGlow.toFixed(3))
        el.style.setProperty('--screen-light-opacity', light.toFixed(3))
        el.style.setProperty('--screen-reflection-opacity', reflection.toFixed(3))
        el.style.setProperty('--screen-copy-y', `${copyLift.toFixed(2)}px`)
        el.style.setProperty('--screen-line-opacity', (0.34 + focusGlow * 0.58).toFixed(3))
        el.style.setProperty('--screen-line-scale', lineScale.toFixed(3))
        el.style.pointerEvents = opacity > 0.18 ? 'auto' : 'none'
        el.style.zIndex = `${Math.round(1000 - absDistance)}`
        el.style.transform = `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), 0) perspective(1400px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`
      })
    }

    updateViewportMode()
    window.addEventListener('resize', updateViewportMode)
    gsap.ticker.add(renderFrame)
    renderFrame()

    return () => {
      cancelAnimationFrame(enterFrame)
      window.removeEventListener('resize', updateViewportMode)
      gsap.ticker.remove(renderFrame)
      document.body.classList.remove('showcase-active')
      const playingCardId = activeCardIdRef.current
      if (playingCardId?.startsWith('showcase-')) {
        deactivateCard(playingCardId)
      }
      lenis?.start()
    }
  }, [deactivateCard, lenisRef, readScrollY, setScrollY])

  return (
    <section ref={pageRef} className="showcase-page" aria-label="Project showcase exhibition">
      <div ref={stageRef} className="showcase-stage">
        <div ref={cameraRef} className="showcase-camera" aria-hidden="true">
          <img
            ref={environmentRef}
            className="showcase-environment"
            src="/project-showcase-bg.jpeg"
            alt=""
            draggable="false"
          />
          <div ref={corridorRef} className="showcase-corridor-lines" />
          <div ref={floorRef} className="showcase-floor-depth" />
          <div ref={airRef} className="showcase-depth-air" />
        </div>

        <div className="showcase-screens">
          {SHOWCASE_SCREENS.map((screen, index) => {
            const cardId = getShowcaseCardId(screen.id)
            const isPlaying = activeCardId === cardId

            return (
            <article
              id={screen.id}
              key={screen.id}
              ref={(node) => assignScreenRef(node, index)}
              className={`showcase-screen showcase-screen--${screen.tone}${isPlaying ? ' is-playing' : ''}`}
              role="button"
              tabIndex={0}
              aria-label={`${isPlaying ? 'Pause' : 'Play'} ${screen.title} film`}
              onClick={(event) => handleScreenClick(event, screen)}
              onDoubleClick={(event) => handleScreenDoubleClick(event, screen)}
              onKeyDown={(event) => handleScreenKeyDown(event, screen)}
              onMouseEnter={(event) => { if (!isPlaying) updateScreenCursor(event, index, true) }}
              onMouseMove={(event) => { if (!isPlaying) updateScreenCursor(event, index) }}
              onMouseLeave={() => hideScreenCursor(index)}
              style={{
                aspectRatio: screen.aspect,
                outlineOffset: '4px',
              }}
            >
              <img
                className="showcase-screen__thumbnail"
                src={getYouTubeThumbnail(screen.youtubeId)}
                srcSet={[
                  `${getYouTubeThumbnail(screen.youtubeId, 'mqdefault')} 320w`,
                  `${getYouTubeThumbnail(screen.youtubeId, 'hqdefault')} 480w`,
                  `${getYouTubeThumbnail(screen.youtubeId, 'sddefault')} 640w`,
                  `${getYouTubeThumbnail(screen.youtubeId)} 1280w`,
                ].join(', ')}
                sizes="(max-width: 768px) 82vw, 650px"
                alt=""
                loading="lazy"
                decoding="async"
                draggable="false"
              />
              <div className="showcase-screen__emissive" aria-hidden="true" />

              {isPlaying && (
                <div className={`showcase-screen__player${iframeFadedIn ? ' is-visible' : ''}`}>
                  <iframe
                    src={getYouTubeEmbedUrl(screen.youtubeId)}
                    title={`${screen.title} film`}
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                </div>
              )}

              <div className="showcase-screen__chrome">
                <span>{screen.index}</span>
                <span>{screen.location}</span>
              </div>
              <div className="showcase-screen__body">
                <p>{screen.note}</p>
                <h2>{screen.title}</h2>
              </div>
              <div
                ref={(node) => assignCursorRef(node, index)}
                className="showcase-screen__cursor"
                aria-hidden="true"
              >
                <span>PLAY</span>
              </div>
              <div className="showcase-screen__line" />
            </article>
            )
          })}
        </div>

        <aside className="showcase-rail" aria-label="Showcase index">
          <strong>Luxe Showcase</strong>
          <span>Architectural Exhibition</span>
          <nav>
            {SHOWCASE_SCREENS.map((screen, index) => (
              <a
                key={screen.id}
                ref={(node) => assignRailRef(node, index)}
                href={`#${screen.id}`}
                onClick={(event) => {
                  event.preventDefault()
                  scrollToScreen(index)
                }}
              >
                {screen.index} {screen.title}
              </a>
            ))}
          </nav>
        </aside>

        <button
          className="showcase-exit"
          type="button"
          onClick={onBackToProjects}
        >
          Exit Archive
        </button>

        <div className="showcase-chapter">
          <span>Phase I</span>
          <strong>Cinematic Showcase</strong>
          <em>Scroll to move through the exhibition</em>
        </div>
      </div>
    </section>
  )
}

export default memo(ShowcasePage)
