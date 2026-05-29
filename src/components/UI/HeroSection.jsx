import { memo, useCallback } from 'react'
import { motion } from 'framer-motion'

/* ── Design Tokens ─────────────────────────────────────── */
const GOLD = 'rgba(176, 122, 90, 0.8)'
const GOLD_SOLID = '#B07A5A'
const EASE_LUXURY = [0.16, 1, 0.3, 1]
const FONT_DISPLAY = "'Bebas Neue', sans-serif"
const FONT_BODY = "'Bricolage Grotesque', sans-serif"

/* ── Shared animation factory ──────────────────────────── */
const riseUp = (delay = 0) => ({
  initial: { opacity: 0, y: 80 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 2, ease: EASE_LUXURY, delay },
})

const fadeIn = (delay = 0, duration = 1.5) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration, ease: EASE_LUXURY, delay },
})

/* ── Component ─────────────────────────────────────────── */
function HeroSection({ onEnterExperience }) {
  const handleScrollPrompt = useCallback(() => {
    if (onEnterExperience) {
      onEnterExperience()
      return
    }

    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })
  }, [onEnterExperience])

  return (
    <section
      className="hero-section"
      style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        pointerEvents: 'none',
      }}
    >
      {/* ── Brand Name: LUXE ─────────────────────────── */}
      <motion.h1
        className="hero-title"
        {...riseUp(0.5)}
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 'clamp(3rem, 13vw, 12rem)',
          fontWeight: 100,
          letterSpacing: 'clamp(0.2em, 3vw, 0.5em)',
          textTransform: 'uppercase',
          color: 'black',
          margin: 0,
          lineHeight: 1,
          textAlign: 'center',
          /* Offset the trailing letter-spacing for visual centering */
          paddingLeft: '0.5em',
          userSelect: 'none',
        }}
      >
        Luxe
      </motion.h1>

      {/* ── Sub-brand: ESTATES ────────────────────────── */}
      <motion.h2
        className="hero-subtitle"
        {...riseUp(0.8)}
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 'clamp(0.8rem, 3vw, 3rem)',
          fontWeight: 300,
          letterSpacing: 'clamp(0.35em, 2vw, 0.75em)',
          textTransform: 'uppercase',
          color: 'black',
          margin: 0,
          marginTop: 'clamp(0.15rem, 0.8vw, 0.75rem)',
          lineHeight: 1.2,
          textAlign: 'center',
          paddingLeft: '0.75em',
          userSelect: 'none',
        }}
      >
        Estates
      </motion.h2>

      {/* ── Decorative Gold Line ──────────────────────── */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.8, ease: EASE_LUXURY, delay: 1.2 }}
        style={{
          width: '60px',
          height: '1px',
          marginTop: 'clamp(1rem, 2.5vw, 2.5rem)',
          background: `linear-gradient(90deg, transparent, ${GOLD_SOLID}, transparent)`,
          transformOrigin: 'center',
        }}
      />

      {/* ── Tagline ──────────────────────────────────── */}
      <motion.p
        className="hero-tagline"
        {...fadeIn(1.5)}
        style={{
          fontFamily: FONT_BODY,
          fontSize: 'clamp(0.7rem, 1.3vw, 1.1rem)',
          fontWeight: 300,
          fontStyle: 'italic',
          color: 'black',
          letterSpacing: '0.15em',
          margin: 0,
          marginTop: 'clamp(0.8rem, 2vw, 2rem)',
          textAlign: 'center',
          userSelect: 'none',
        }}
      >
        Redefining Modern Living - LUXE ESTATE A Real Estate Agency
      </motion.p>

      {/* ── Scroll Prompt ────────────────────────────── */}
      <motion.button
        className="hero-enter"
        {...fadeIn(2.5, 1.8)}
        onClick={handleScrollPrompt}
        aria-label="Scroll down to explore"
        style={{
          position: 'absolute',
          bottom: 'clamp(2rem, 5vh, 4rem)',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          pointerEvents: 'auto',
          outline: 'none',
          padding: '0.5rem 1rem',
        }}
      >
        <motion.span
          style={{
            fontFamily: FONT_BODY,
            fontSize: '0.6rem',
            fontWeight: 400,
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: 'black',
            transition: 'color 0.6s ease',
          }}
          whileHover={{ color: 'rgba(176, 122, 90, 0.7)' }}
        >
          Enter the Experience
        </motion.span>

        {/* Animated chevron / line */}
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
          }}
        >
          <div
            style={{
              width: '1px',
              height: '24px',
              background: `linear-gradient(180deg, ${GOLD}, transparent)`,
            }}
          />
          <svg
            width="10"
            height="6"
            viewBox="0 0 10 6"
            fill="none"
            style={{ opacity: 0.5 }}
          >
            <path
              d="M1 1L5 5L9 1"
              stroke={GOLD_SOLID}
              strokeWidth="0.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      </motion.button>
    </section>
  )
}

export default memo(HeroSection)
