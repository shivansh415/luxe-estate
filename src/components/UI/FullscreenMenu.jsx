import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { motion } from 'framer-motion'

/**
 * FullscreenMenu — Cinematic Architectural Menu
 *
 * Complete rewrite for performance and correct close behavior.
 *
 * Architecture:
 *   - Parent owns cinematic close/navigation orchestration.
 *   - Menu stays mounted until the global chapter overlay covers it.
 *   - This prevents local menu exits from exposing the previous scene early.
 *   - GPU-only animations: transform (translate3d) + opacity
 *   - NO clip-path, NO backdrop-filter, NO blur, NO box-shadow animations
 */

/* ── Design Tokens ─────────────────────────────────────── */
const FONT_DISPLAY = "'Bebas Neue', sans-serif"
const FONT_BODY = "'Bricolage Grotesque', sans-serif"
const EASE = [0.22, 1, 0.36, 1]

const MENU_ITEMS = [
  { label: 'Home' },
  { label: 'Projects' },
  { label: 'About' },
  { label: 'Contact' },
]

function FullscreenMenu({ isOpen, onClose, lenisRef }) {
  const [mounted, setMounted] = useState(false)
  const [isRequestingClose, setIsRequestingClose] = useState(false)

  const isRequestingCloseRef = useRef(false)

  /* ── OPEN: mount and lock scroll ───────────────────── */
  useEffect(() => {
    if (isOpen && !mounted) {
      // Lock scroll using Lenis and CSS class
      lenisRef.current?.stop()
      document.body.classList.add('menu-open')

      isRequestingCloseRef.current = false
      const frame = requestAnimationFrame(() => {
        setIsRequestingClose(false)
        setMounted(true)
      })
      return () => cancelAnimationFrame(frame)
    }
  }, [isOpen, mounted, lenisRef])

  /* ── Parent unmounts only after the global transition covers the menu. ── */
  useEffect(() => {
    if (isOpen || !mounted) return

    document.body.classList.remove('menu-open')
    isRequestingCloseRef.current = false

    const frame = requestAnimationFrame(() => {
      setIsRequestingClose(false)
      setMounted(false)
    })
    return () => cancelAnimationFrame(frame)
  }, [isOpen, mounted])

  /* ── Close trigger: request global transition from parent. ───────────── */
  const triggerClose = useCallback((targetLabel) => {
    if (isRequestingCloseRef.current) return
    isRequestingCloseRef.current = true
    setIsRequestingClose(true)
    onClose(targetLabel ? targetLabel.toLowerCase() : null)
  }, [onClose])

  /* ── ESC key ───────────────────────────────────────── */
  useEffect(() => {
    if (!mounted || isRequestingCloseRef.current) return
    const onKey = (e) => {
      if (e.key === 'Escape') triggerClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mounted, triggerClose])

  /* ── Don't render anything when closed ─────────────── */
  if (!mounted) return null

  return (
    <div
      className="fullscreen-menu"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        pointerEvents: isRequestingClose ? 'none' : 'auto',
      }}
    >

      {/* ═══════════════════════════════════════════════════
          BACKGROUND IMAGE — raw image only
          ═══════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        <img
          src="/menu-bg.jpeg"
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════
          MENU CONTENT — Staggered items
          ═══════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div>
          <nav style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.3rem',
          }}>
            {MENU_ITEMS.map((item, i) => (
              <MenuItem
                key={item.label}
                label={item.label}
                index={i}
                exiting={isRequestingClose}
                onItemClick={() => triggerClose(item.label)}
              />
            ))}
          </nav>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          BOTTOM LABELS
          ═══════════════════════════════════════════════════ */}
      <motion.div
        className="fullscreen-menu__footer"
        initial={{ opacity: 0, y: 15 }}
        animate={{
          opacity: isRequestingClose ? 0 : 1,
          y: isRequestingClose ? 15 : 0,
        }}
        transition={{
          duration: isRequestingClose ? 0.28 : 0.6,
          ease: EASE,
          delay: isRequestingClose ? 0 : 0.6,
        }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '2.5rem 3rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          zIndex: 4,
        }}
      >
        {/* Bottom-left micro-label */}
        <div style={{
          fontFamily: FONT_BODY,
          fontSize: '0.6rem',
          fontWeight: 400,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.25)',
        }}>
          Luxury Real Estate Experience
        </div>

        {/* Bottom-right socials */}
        <div style={{ display: 'flex', gap: '2rem' }}>
          {[
            { label: 'Instagram', href: 'https://www.instagram.com/shivansh.js?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==' },
            { label: 'LinkedIn', href: 'https://www.linkedin.com/in/shivansh-patidar/' },
          ].map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: FONT_BODY,
                fontSize: '0.6rem',
                fontWeight: 400,
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.3)',
                textDecoration: 'none',
                transition: 'color 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}
            >
              {social.label}
            </a>
          ))}
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════
          CLOSE BUTTON
          ═══════════════════════════════════════════════════ */}
      <motion.button
        className="fullscreen-menu__close"
        initial={{ opacity: 0 }}
        animate={{ opacity: isRequestingClose ? 0 : 1 }}
        transition={{
          duration: isRequestingClose ? 0.2 : 0.5,
          delay: isRequestingClose ? 0 : 0.6,
        }}
        onClick={() => triggerClose()}
        style={{
          position: 'absolute',
          top: '2rem',
          right: '3rem',
          zIndex: 5,
          background: 'none',
          border: 'none',
          fontFamily: FONT_BODY,
          fontSize: '0.7rem',
          fontWeight: 500,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.5)',
          cursor: 'pointer',
          padding: '0.6rem 0',
          transition: 'color 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.9)' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
      >
        Close
      </motion.button>

    </div>
  )
}


/* ── MenuItem ─────────────────────────────────────────── */

function MenuItem({ label, index, exiting, onItemClick }) {
  const lineRef = useRef(null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{
        opacity: exiting ? 0 : 0.88,
        y: exiting ? 40 : 0,
      }}
      transition={{
        duration: exiting ? 0.25 : 0.7,
        ease: EASE,
        delay: exiting ? 0 : 0.45 + index * 0.08,
      }}
      style={{
        position: 'relative',
        cursor: 'pointer',
        padding: '0.3rem 0',
      }}
      onClick={onItemClick}
    >
      <span
        className="fullscreen-menu__item"
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 'clamp(3.5rem, 8vw, 6.5rem)',
          fontWeight: 400,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.88)',
          lineHeight: 1.3,
          display: 'inline-block',
          transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1), letter-spacing 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
          userSelect: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1'
          e.currentTarget.style.transform = 'translateX(10px)'
          e.currentTarget.style.letterSpacing = '0.25em'
          if (lineRef.current) {
            lineRef.current.style.transform = 'scaleX(1)'
            lineRef.current.style.opacity = '1'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.88'
          e.currentTarget.style.transform = 'translateX(0px)'
          e.currentTarget.style.letterSpacing = '0.15em'
          if (lineRef.current) {
            lineRef.current.style.transform = 'scaleX(0)'
            lineRef.current.style.opacity = '0'
          }
        }}
      >
        {label}
      </span>
      {/* Underline reveal */}
      <div
        ref={lineRef}
        style={{
          position: 'absolute',
          bottom: '0.2rem',
          left: 0,
          width: '100%',
          height: '1px',
          background: 'linear-gradient(90deg, rgba(255,255,255,0.6), rgba(255,255,255,0.1))',
          transformOrigin: 'left center',
          transform: 'scaleX(0)',
          opacity: 0,
          transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease',
        }}
      />
    </motion.div>
  )
}

export default memo(FullscreenMenu)
