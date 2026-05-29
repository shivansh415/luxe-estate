import { useState, useCallback, useRef, memo } from 'react'
import { motion } from 'framer-motion'
import AtmosphericHover from './AtmosphericHover'

/**
 * Navigation
 *
 * Minimal luxury nav — logo left, "VIEW ALL PROJECTS" right.
 * The right element triggers the atmospheric cursor hover system
 * (SYSTEM 1) inspired by immersive-g.com.
 *
 * Reads scroll state from REFS via a low-frequency polling interval
 * (4fps) instead of re-rendering on every scroll frame.
 */

/* ── Design Tokens ─────────────────────────────────────── */
const FONT_DISPLAY = "'Bebas Neue', sans-serif"
const FONT_BODY = "'Bricolage Grotesque', sans-serif"
const EASE_LUXURY = [0.16, 1, 0.3, 1]

function Navigation({ onMenuOpen, onNavigate, navTextColor }) {
  // Atmospheric hover state
  const [isHovering, setIsHovering] = useState(false)
  const buttonRef = useRef(null)
  const openRequestRef = useRef(false)

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false)
  }, [])

  const requestMenuOpen = useCallback(() => {
    if (openRequestRef.current) return

    openRequestRef.current = true
    setIsHovering(false)
    onMenuOpen?.()

    window.setTimeout(() => {
      openRequestRef.current = false
    }, 1400)
  }, [onMenuOpen])

  return (
    <>
      {/* Atmospheric Hover Canvas — renders behind nav, above content */}
      <AtmosphericHover isActive={isHovering} />

      <nav
        id="main-nav"
        className="site-nav"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          zIndex: 110,
          padding: '2rem 3rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'auto',
          transition: 'background-color 0.45s cubic-bezier(0.16, 1, 0.3, 1), padding 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1), transform 1s cubic-bezier(0.16, 1, 0.3, 1)',
          background: 'transparent',
        }}
      >
        {/* Logo */}
        <motion.div
          className="nav-brand"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: EASE_LUXURY }}
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 'clamp(1rem, 1.8vw, 1.4rem)',
            fontWeight: 300,
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: navTextColor || 'var(--nav-text-color, black)',
            pointerEvents: 'auto',
            cursor: 'pointer',
            userSelect: 'none',
          }}
          onClick={() => {
            if (onNavigate) {
              onNavigate('home')
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }
          }}
          whileHover={{ color: 'rgba(176, 122, 90, 0.9)' }}
        >
          Luxe Estates
        </motion.div>

        {/* VIEW ALL PROJECTS — atmospheric hover trigger + menu open */}
        <motion.button
          type="button"
          className="nav-hover-trigger"
          ref={buttonRef}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: EASE_LUXURY, delay: 0.3 }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onPointerDown={requestMenuOpen}
          onClick={requestMenuOpen}
          style={{
            background: 'none',
            border: 'none',
            fontFamily: FONT_BODY,
            fontSize: '0.75rem',
            fontWeight: 500,
            lineHeight: 1.6,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: isHovering ? 'white' : navTextColor || 'var(--nav-text-color, black)',
            pointerEvents: 'auto',
            cursor: 'pointer',
            userSelect: 'none',
            padding: '0.6rem 0',
            position: 'relative',
            zIndex: 1,
            outline: 'none',
            transition: 'color 0.9s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          View All Projects

          {/* Underline indicator — animates on hover */}
          <motion.div
            style={{
              position: 'absolute',
              bottom: '0.3rem',
              left: 0,
              right: 0,
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent)',
              transformOrigin: 'center',
            }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{
              scaleX: isHovering ? 1 : 0,
              opacity: isHovering ? 1 : 0,
            }}
            transition={{
              duration: 0.6,
              ease: [0.16, 1, 0.3, 1],
            }}
          />
        </motion.button>

        {/* Scroll progress bar */}
        <div
          id="nav-progress-bar"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: '1px',
            background: 'linear-gradient(90deg, rgba(176, 122, 90, 0), rgba(176, 122, 90, 0.5), rgba(176, 122, 90, 0))',
            width: '100%',
            transform: 'scaleX(0)',
            transformOrigin: 'left center',
            willChange: 'transform',
          }}
        />
      </nav>
    </>
  )
}

export default memo(Navigation)
