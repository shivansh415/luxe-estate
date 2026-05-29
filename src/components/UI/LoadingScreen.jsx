import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * LoadingScreen
 *
 * Ultra-cinematic luxury preloader with:
 * - Centered LUXE ESTATES branding with breathing motion
 * - Giant cinematic percentage in bottom-right
 * - Elegant architectural progress line
 * - Premium film-grade micro-animations
 */
export default function LoadingScreen({ isLoaded, realProgress = 0, onComplete }) {
  const [isVisible, setIsVisible] = useState(true)
  const animFrameRef = useRef(null)
  const displayRef = useRef(0)
  const targetRef = useRef(0)
  const counterElRef = useRef(null)
  const progressBarElRef = useRef(null)

  // FIX #1: Pipe real progress (0-100) as the pre-loaded target.
  // When isLoaded fires, ramp quickly from current → 100.
  useEffect(() => {
    if (!isLoaded) {
      // Real progress drives the counter while loading
      targetRef.current = Math.min(realProgress, 85)
    }
  }, [isLoaded, realProgress])

  useEffect(() => {
    if (isLoaded) {
      // Finish ramp: 85 → 100 quickly
      targetRef.current = 100
    }
  }, [isLoaded])

  // FIX #7: Self-terminating RAF loop.
  // Uses ref + direct DOM write — zero React re-renders during animation.
  useEffect(() => {
    let stopped = false

    const animate = () => {
      if (stopped) return

      const target = targetRef.current
      const diff = target - displayRef.current

      if (Math.abs(diff) < 0.5) {
        displayRef.current = Math.round(target)
      } else {
        displayRef.current += diff * 0.08
      }

      const displayNum = Math.round(displayRef.current)
      const formatted = displayNum < 10 ? `0${displayNum}` : `${displayNum}`

      // Direct DOM write — no setState, no re-render
      if (counterElRef.current) {
        counterElRef.current.textContent = formatted
      }
      if (progressBarElRef.current) {
        progressBarElRef.current.style.width = `${displayRef.current}%`
      }

      // Self-terminate when settled at 100
      if (displayNum >= 100 && Math.abs(diff) < 0.5) {
        // Trigger exit after brief hold
        setTimeout(() => {
          if (!stopped) setIsVisible(false)
        }, 800)
        animFrameRef.current = null
        return
      }

      animFrameRef.current = requestAnimationFrame(animate)
    }

    animFrameRef.current = requestAnimationFrame(animate)

    return () => {
      stopped = true
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  const handleExitComplete = () => {
    onComplete?.()
  }
  // Initial display value (the RAF loop will dynamically update the DOM element via counterElRef)
  const formattedPercent = '00'

  // Cinematic easing
  const luxeEase = [0.16, 1, 0.3, 1]

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {isVisible && (
        <motion.div
          key="loading-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: luxeEase }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: '#080808',
            zIndex: 9999,
            overflow: 'hidden',
          }}
        >

          {/* ═══════════ FILM GRAIN OVERLAY ═══════════ */}
          <div style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.025,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: '128px 128px',
            pointerEvents: 'none',
            mixBlendMode: 'overlay',
          }} />

          {/* ═══════════ CINEMATIC HORIZONTAL LINES ═══════════ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 3, delay: 0.5 }}
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 3px,
                rgba(245, 238, 225, 0.008) 3px,
                rgba(245, 238, 225, 0.008) 4px
              )`,
            }}
          />

          {/* ═══════════ AMBIENT GOLD ORB ═══════════ */}
          <motion.div
            animate={{
              opacity: [0.02, 0.06, 0.02],
              scale: [1, 1.15, 1],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '700px',
              height: '700px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(176, 122, 90, 0.15) 0%, transparent 70%)',
              filter: 'blur(100px)',
              pointerEvents: 'none',
            }}
          />

          {/* ═══════════ SECONDARY GLOW — bottom right ═══════════ */}
          <motion.div
            animate={{
              opacity: [0.01, 0.04, 0.01],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            style={{
              position: 'absolute',
              bottom: '-10%',
              right: '-5%',
              width: '500px',
              height: '500px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(176, 122, 90, 0.12) 0%, transparent 70%)',
              filter: 'blur(80px)',
              pointerEvents: 'none',
            }}
          />

          {/* ═══════════ CORNER ACCENTS ═══════════ */}
          {/* Top-left */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.12 }}
            transition={{ duration: 2.5, delay: 0.8 }}
            style={{
              position: 'absolute',
              top: 'clamp(1.5rem, 4vw, 3.5rem)',
              left: 'clamp(1.5rem, 4vw, 3.5rem)',
              width: '35px',
              height: '35px',
              borderLeft: '1px solid rgba(176, 122, 90, 0.25)',
              borderTop: '1px solid rgba(176, 122, 90, 0.25)',
            }}
          />
          {/* Top-right */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.12 }}
            transition={{ duration: 2.5, delay: 1.0 }}
            style={{
              position: 'absolute',
              top: 'clamp(1.5rem, 4vw, 3.5rem)',
              right: 'clamp(1.5rem, 4vw, 3.5rem)',
              width: '35px',
              height: '35px',
              borderRight: '1px solid rgba(176, 122, 90, 0.25)',
              borderTop: '1px solid rgba(176, 122, 90, 0.25)',
            }}
          />
          {/* Bottom-left */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.12 }}
            transition={{ duration: 2.5, delay: 1.2 }}
            style={{
              position: 'absolute',
              bottom: 'clamp(1.5rem, 4vw, 3.5rem)',
              left: 'clamp(1.5rem, 4vw, 3.5rem)',
              width: '35px',
              height: '35px',
              borderLeft: '1px solid rgba(176, 122, 90, 0.25)',
              borderBottom: '1px solid rgba(176, 122, 90, 0.25)',
            }}
          />

          {/* ═══════════ CENTER BRANDING ═══════════ */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0',
          }}>
            {/* Decorative line above logo */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 2, delay: 0.6, ease: luxeEase }}
              style={{
                width: '50px',
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(176, 122, 90, 0.4), transparent)',
                marginBottom: '2.5rem',
                transformOrigin: 'center',
              }}
            />

            {/* LUXE */}
            <motion.div
              initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 2, ease: luxeEase, delay: 0.3 }}
            >
              <motion.div
                animate={{
                  opacity: [0.85, 1, 0.85],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 'clamp(2.2rem, 5.5vw, 4rem)',
                  fontWeight: 300,
                  textTransform: 'uppercase',
                  color: 'rgba(176, 122, 90, 0.9)',
                  lineHeight: 1,
                  letterSpacing: '0.55em',
                  textAlign: 'center',
                  paddingLeft: '0.55em', // Optical center for letter-spacing
                }}
              >
                Luxe
              </motion.div>
            </motion.div>

            {/* Diamond separator */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.3, scale: 1 }}
              transition={{ duration: 1.5, delay: 1, ease: luxeEase }}
              style={{
                width: '5px',
                height: '5px',
                background: 'rgba(176, 122, 90, 0.5)',
                transform: 'rotate(45deg)',
                margin: '1rem 0',
              }}
            />

            {/* ESTATES */}
            <motion.div
              initial={{ opacity: 0, y: 25, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 1.8, ease: luxeEase, delay: 0.6 }}
            >
              <motion.div
                animate={{
                  opacity: [0.35, 0.5, 0.35],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                style={{
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  fontSize: 'clamp(0.55rem, 1.3vw, 0.75rem)',
                  fontWeight: 200,
                  letterSpacing: '0.7em',
                  textTransform: 'uppercase',
                  color: 'rgba(220, 210, 190, 0.45)',
                  textAlign: 'center',
                  paddingLeft: '0.7em',
                }}
              >
                Estates
              </motion.div>
            </motion.div>

            {/* Decorative line below logo */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 2, delay: 1.2, ease: luxeEase }}
              style={{
                width: '50px',
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(176, 122, 90, 0.3), transparent)',
                marginTop: '2.5rem',
                transformOrigin: 'center',
              }}
            />

            {/* Tagline */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2, delay: 1.8 }}
            >
              <motion.div
                animate={{
                  opacity: [0.15, 0.25, 0.15],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  fontSize: '0.55rem',
                  fontWeight: 200,
                  letterSpacing: '0.35em',
                  textTransform: 'uppercase',
                  color: 'rgba(210, 200, 180, 0.22)',
                  marginTop: '1.8rem',
                  textAlign: 'center',
                  paddingLeft: '0.35em',
                }}
              >
                Preparing your experience
              </motion.div>
            </motion.div>
          </div>


          {/* ═══════════ BOTTOM-RIGHT LOADING SYSTEM ═══════════ */}
          <div style={{
            position: 'absolute',
            bottom: 'clamp(2rem, 5vw, 4rem)',
            right: 'clamp(2rem, 5vw, 4rem)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '0',
          }}>

            {/* "Loading" label */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.5, delay: 1.2, ease: luxeEase }}
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontSize: '0.5rem',
                fontWeight: 300,
                letterSpacing: '0.4em',
                textTransform: 'uppercase',
                color: 'rgba(210, 200, 180, 0.22)',
                marginBottom: '0.8rem',
                paddingLeft: '0.4em',
              }}
            >
              Loading
            </motion.div>

            {/* GIANT PERCENTAGE */}
            <motion.div
              initial={{ opacity: 0, y: 60, filter: 'blur(12px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 2, delay: 0.8, ease: luxeEase }}
              style={{
                position: 'relative',
                lineHeight: 0.85,
              }}
            >
              <motion.div
                animate={{
                  opacity: [0.85, 1, 0.85],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 'clamp(5rem, 14vw, 11rem)',
                  fontWeight: 300,
                  color: 'rgba(245, 238, 225, 0.9)',
                  lineHeight: 0.85,
                  letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums',
                  position: 'relative',
                }}
              >
                <span ref={counterElRef}>{formattedPercent}</span>

                {/* Percent sign — smaller, elegant offset */}
                <span style={{
                  fontSize: 'clamp(1rem, 2.5vw, 1.8rem)',
                  fontWeight: 200,
                  color: 'rgba(176, 122, 90, 0.5)',
                  verticalAlign: 'super',
                  marginLeft: '0.15em',
                  letterSpacing: '0',
                }}>
                  %
                </span>
              </motion.div>

              {/* Subtle glow behind percentage */}
              <motion.div
                animate={{
                  opacity: [0.02, 0.06, 0.02],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '30%',
                  transform: 'translate(50%, -50%)',
                  width: '200px',
                  height: '200px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(176, 122, 90, 0.15) 0%, transparent 70%)',
                  filter: 'blur(60px)',
                  pointerEvents: 'none',
                  zIndex: -1,
                }}
              />
            </motion.div>

            {/* Progress line */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.5, delay: 1, ease: luxeEase }}
              style={{
                marginTop: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                width: 'clamp(140px, 18vw, 220px)',
              }}
            >
              {/* Progress bar track */}
              <div style={{
                flex: 1,
                height: '1px',
                background: 'rgba(245, 238, 225, 0.06)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div
                  ref={progressBarElRef}
                  style={{
                    width: '0%',
                    height: '100%',
                    background: 'linear-gradient(90deg, rgba(176, 122, 90, 0.15), rgba(176, 122, 90, 0.6))',
                    position: 'relative',
                  }}
                >
                  {/* Glowing tip */}
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'rgba(176, 122, 90, 0.8)',
                    boxShadow: '0 0 12px rgba(176, 122, 90, 0.4), 0 0 4px rgba(176, 122, 90, 0.6)',
                  }} />
                </div>
              </div>
            </motion.div>
          </div>


          {/* ═══════════ TOP-RIGHT — CINEMATIC LABEL ═══════════ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 2 }}
            style={{
              position: 'absolute',
              top: 'clamp(1.5rem, 4vw, 3.5rem)',
              right: 'clamp(5rem, 8vw, 7rem)',
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: '0.45rem',
              fontWeight: 300,
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color: 'rgba(210, 200, 180, 0.14)',
              writingMode: 'vertical-rl',
            }}
          >
            Est. MMXXV
          </motion.div>

          {/* ═══════════ BOTTOM-LEFT — ARCHITECTURAL DETAIL ═══════════ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 1.8 }}
            style={{
              position: 'absolute',
              bottom: 'clamp(2rem, 5vw, 4rem)',
              left: 'clamp(2rem, 5vw, 4rem)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
            }}
          >
            <div style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: '0.45rem',
              fontWeight: 200,
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color: 'rgba(210, 200, 180, 0.14)',
            }}>
              Cinematic Experience
            </div>
            <div style={{
              width: '30px',
              height: '1px',
              background: 'linear-gradient(90deg, rgba(176, 122, 90, 0.2), transparent)',
            }} />
          </motion.div>

        </motion.div>
      )}
    </AnimatePresence>
  )
}
