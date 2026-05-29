import { useRef, useEffect, memo } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* ── Warm Atmospheric Design Tokens ───────────────────── */
const GOLD = 'rgba(176, 122, 90, 0.82)'
const GOLD_SOLID = '#B07A5A'
const GOLD_DIM = 'rgba(176, 122, 90, 0.35)'
const IVORY = 'rgba(0, 0, 0, 1)'              // solid headings
const CHAMPAGNE = 'rgba(0, 0, 0, 1)'          // solid body text
const FONT_BODY = "'Bricolage Grotesque', sans-serif"

/* ── Editorial Text Lines ─────────────────────────────── */
const EDITORIAL_LINES = [
  { text: "We don't just build", type: 'heading' },
  { text: 'residences.', type: 'heading-accent' },
  { text: 'We compose', type: 'heading' },
  { text: 'experiences', type: 'heading-italic' },
  { text: 'in stone, light', type: 'heading' },
  { text: '& silence.', type: 'heading' },
]

const BODY_TEXT =
  'Each project begins with a conversation — not about square footage, but about how light falls across a room at dusk, how materials age with grace, and how architecture can hold the weight of a life well lived.'

/* ── Component ─────────────────────────────────────────── */
function EditorialSection() {
  const sectionRef = useRef(null)
  const linesRef = useRef([])
  const accentLineRef = useRef(null)
  const bodyRef = useRef(null)
  const labelRef = useRef(null)

  useEffect(() => {
    if (!sectionRef.current) return

    const ctx = gsap.context(() => {
      /* ── Main heading lines: staggered reveal on scroll ── */
      linesRef.current.forEach((line, i) => {
        if (!line) return

        gsap.fromTo(
          line,
          {
            y: 90,
            opacity: 0,
            rotateX: 8,
          },
          {
            y: 0,
            opacity: 1,
            rotateX: 0,
            duration: 1.4,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: line,
              start: 'top 88%',
              end: 'top 30%',
              toggleActions: 'play reverse play reverse',
            },
            delay: i * 0.06,
          }
        )
      })

      /* ── Gold accent line expands ── */
      if (accentLineRef.current) {
        gsap.fromTo(
          accentLineRef.current,
          { scaleX: 0, opacity: 0 },
          {
            scaleX: 1,
            opacity: 1,
            duration: 1.8,
            ease: 'power3.inOut',
            scrollTrigger: {
              trigger: accentLineRef.current,
              start: 'top 85%',
              end: 'top 35%',
              toggleActions: 'play reverse play reverse',
            },
          }
        )
      }

      /* ── Label tag reveal ── */
      if (labelRef.current) {
        gsap.fromTo(
          labelRef.current,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.2,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: labelRef.current,
              start: 'top 90%',
              end: 'top 40%',
              toggleActions: 'play reverse play reverse',
            },
          }
        )
      }

      /* ── Body text fade ── */
      if (bodyRef.current) {
        gsap.fromTo(
          bodyRef.current,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.4,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: bodyRef.current,
              start: 'top 85%',
              end: 'top 35%',
              toggleActions: 'play reverse play reverse',
            },
          }
        )
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  /* ── Determine line styles based on type ── */
  const getLineStyle = (type) => {
    const base = {
      fontFamily: FONT_BODY,
      fontWeight: 300,
      lineHeight: 1.12,
      color: IVORY,
      margin: 0,
      padding: 0,
      willChange: 'transform, opacity',
      perspective: '800px',
      textShadow: '0 0 120px rgba(176, 122, 90, 0.04), 0 0 40px rgba(245, 238, 225, 0.03)',
    }

    switch (type) {
      case 'heading':
        return {
          ...base,
          fontSize: 'clamp(2.6rem, 7vw, 7.5rem)',
          letterSpacing: '-0.02em',
        }
      case 'heading-accent':
        return {
          ...base,
          fontSize: 'clamp(2.6rem, 7vw, 7.5rem)',
          letterSpacing: '-0.02em',
          color: GOLD,
          fontStyle: 'italic',
          textShadow: '0 2px 60px rgba(176, 122, 90, 0.08), 0 0 30px rgba(176, 122, 90, 0.04)',
        }
      case 'heading-italic':
        return {
          ...base,
          fontSize: 'clamp(2.6rem, 7vw, 7.5rem)',
          letterSpacing: '-0.02em',
          fontStyle: 'italic',
        }
      default:
        return base
    }
  }

  return (
    <section
      ref={sectionRef}
      id="editorial-section"
      style={{
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        padding: 'clamp(8rem, 18vh, 16rem) clamp(2rem, 8vw, 10rem)',
      }}
    >
      {/* Subtle ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '-10%',
          width: '50vw',
          height: '50vw',
          maxWidth: '700px',
          maxHeight: '700px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(176, 122, 90, 0.045) 0%, rgba(245, 238, 225, 0.008) 35%, transparent 65%)',
          pointerEvents: 'none',
          filter: 'blur(80px)',
        }}
      />

      {/* Content Container — Left-aligned */}
      <div
        style={{
          maxWidth: '1100px',
          width: '100%',
          position: 'relative',
        }}
      >
        {/* Section Label */}
        <div
          ref={labelRef}
          style={{
            fontFamily: FONT_BODY,
            fontSize: 'clamp(0.6rem, 0.9vw, 0.75rem)',
            fontWeight: 400,
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            color: GOLD_DIM,
            marginBottom: 'clamp(2.5rem, 5vh, 4.5rem)',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            willChange: 'transform, opacity',
          }}
        >
          <span
            style={{
              width: '28px',
              height: '1px',
              background: `linear-gradient(90deg, ${GOLD_DIM}, transparent)`,
              display: 'inline-block',
            }}
          />
          Our Philosophy
        </div>

        {/* Main Editorial Typography */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(0.1rem, 0.5vw, 0.35rem)',
          }}
        >
          {EDITORIAL_LINES.map((line, i) => (
            <h2
              key={i}
              ref={(el) => (linesRef.current[i] = el)}
              style={getLineStyle(line.type)}
            >
              {line.text}
            </h2>
          ))}
        </div>

        {/* Gold Accent Line */}
        <div
          ref={accentLineRef}
          style={{
            width: 'clamp(60px, 8vw, 120px)',
            height: '1px',
            background: `linear-gradient(90deg, ${GOLD_SOLID}, ${GOLD_DIM})`,
            marginTop: 'clamp(2.5rem, 5vh, 4rem)',
            marginBottom: 'clamp(2rem, 4vh, 3.5rem)',
            transformOrigin: 'left center',
            willChange: 'transform, opacity',
          }}
        />

        {/* Body Text */}
        <p
          ref={bodyRef}
          style={{
            fontFamily: FONT_BODY,
            fontSize: 'clamp(0.85rem, 1.15vw, 1.05rem)',
            fontWeight: 300,
            lineHeight: 2.2,
            color: CHAMPAGNE,
            letterSpacing: '0.04em',
            maxWidth: '540px',
            willChange: 'transform, opacity',
          }}
        >
          {BODY_TEXT}
        </p>
      </div>
    </section>
  )
}

export default memo(EditorialSection)
