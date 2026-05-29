import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { CinematicTransitionContext } from '../../context/CinematicTransitionContext'

const TRANSITION_TIMING = {
  enter: 960,
  hold: 220,
  reveal: 1080,
}

const IDLE_TRANSITION = {
  phase: 'idle',
  eyebrow: 'Chapter',
  chapter: 'Luxe Estates',
  detail: 'A cinematic real estate experience',
  runId: 0,
}

function clearBodyTransitionClasses() {
  document.body.classList.remove(
    'cinematic-transitioning',
    'cinematic-transition-entering',
    'cinematic-transition-covered',
    'cinematic-transition-revealing'
  )
}

function CinematicTransitionOverlay({ transition }) {
  const { phase, eyebrow, chapter, detail, runId } = transition
  const isActive = phase !== 'idle'

  useLayoutEffect(() => {
    clearBodyTransitionClasses()

    if (phase !== 'idle') {
      document.body.classList.add('cinematic-transitioning')
      document.body.classList.add(`cinematic-transition-${phase}`)
    }

    return () => {
      if (phase !== 'idle') clearBodyTransitionClasses()
    }
  }, [phase, runId])

  return (
    <div
      className={`cinematic-transition cinematic-transition--${phase}`}
      aria-hidden="true"
      data-active={isActive ? 'true' : 'false'}
    >
      <div className="cinematic-transition__depth" />
      <div className="cinematic-transition__marble" />
      <div className="cinematic-transition__ink cinematic-transition__ink--top" />
      <div className="cinematic-transition__ink cinematic-transition__ink--bottom" />
      <div className="cinematic-transition__gold-line" />
      <div className="cinematic-transition__copy">
        <span>{eyebrow}</span>
        <strong>{chapter}</strong>
        <em>{detail}</em>
      </div>
    </div>
  )
}

export default function CinematicTransitionProvider({ children, lenisRef }) {
  const [transition, setTransition] = useState(IDLE_TRANSITION)
  const timersRef = useRef([])
  const activePromiseRef = useRef(null)
  const runTransitionRef = useRef(null)

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer))
    timersRef.current = []
  }, [])

  useEffect(() => {
    return () => {
      clearTimers()
      clearBodyTransitionClasses()
    }
  }, [clearTimers])

  const runTransition = useCallback((options = {}) => {
    if (activePromiseRef.current) {
      return activePromiseRef.current.then(() => runTransitionRef.current?.(options))
    }

    clearTimers()

    const {
      eyebrow = 'Chapter',
      chapter = 'Next Scene',
      detail = 'Entering a new luxury environment',
      onCovered,
      resumeScroll = true,
      lockScroll = true,
    } = options

    const runId = Date.now()

    const transitionPromise = new Promise((resolve) => {
      if (lockScroll) lenisRef?.current?.stop()

      setTransition({
        phase: 'entering',
        eyebrow,
        chapter,
        detail,
        runId,
      })

      const coverTimer = setTimeout(() => {
        setTransition({
          phase: 'covered',
          eyebrow,
          chapter,
          detail,
          runId,
        })

        try {
          onCovered?.()
        } catch (error) {
          console.error('[CinematicTransition] onCovered failed:', error)
        }

        const revealTimer = setTimeout(() => {
          setTransition({
            phase: 'revealing',
            eyebrow,
            chapter,
            detail,
            runId,
          })

          const doneTimer = setTimeout(() => {
            setTransition(IDLE_TRANSITION)
            if (resumeScroll) lenisRef?.current?.start()
            timersRef.current = []
            activePromiseRef.current = null
            resolve()
          }, TRANSITION_TIMING.reveal)

          timersRef.current.push(doneTimer)
        }, TRANSITION_TIMING.hold)

        timersRef.current.push(revealTimer)
      }, TRANSITION_TIMING.enter)

      timersRef.current.push(coverTimer)
    })

    activePromiseRef.current = transitionPromise
    return transitionPromise
  }, [clearTimers, lenisRef])

  useEffect(() => {
    runTransitionRef.current = runTransition
  }, [runTransition])

  const value = useMemo(() => ({
    isTransitioning: transition.phase !== 'idle',
    runTransition,
  }), [runTransition, transition.phase])

  return (
    <CinematicTransitionContext.Provider value={value}>
      {children}
      <CinematicTransitionOverlay transition={transition} />
    </CinematicTransitionContext.Provider>
  )
}
