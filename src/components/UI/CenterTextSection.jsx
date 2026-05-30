import { useRef, useEffect, memo } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* ── Warm Atmospheric Design Tokens ───────────────────── */
const GOLD = 'rgba(176, 122, 90, 0.82)'
const GOLD_SOLID = '#B07A5A'
const GOLD_DIM = 'rgba(176, 122, 90, 0.35)'
const IVORY = 'rgba(0, 0, 0, 1)'
const CHAMPAGNE = 'rgba(0, 0, 0, 1)'
const WARM_MIST = 'rgba(0, 0, 0, 0.9)'
const FONT_EDITORIAL = "'Bricolage Grotesque', sans-serif"
const FONT_BODY = "'Bricolage Grotesque', sans-serif"

/* ── Editorial Content ─────────────────────────────────── */
const HEADLINE_LINES = [
  { text: 'Architecture', type: 'large' },
  { text: 'should speak of', type: 'medium' },
  { text: 'its time and place,', type: 'medium-italic' },
  { text: 'but yearn for', type: 'medium' },
  { text: 'timelessness.', type: 'accent' },
]

const ATTRIBUTION = '— Frank Gehry'

const BODY_TEXT =
  'We believe that the finest residences are not built — they are composed. Every material, proportion, and threshold is orchestrated to create spaces that transcend trends and become part of the landscape of memory itself.'

/* ── Component ─────────────────────────────────────────── */
function CenterTextSection() {
  const sectionRef = useRef(null)
  const linesRef = useRef([])
  const topDividerRef = useRef(null)
  const bottomDividerRef = useRef(null)
  const attributionRef = useRef(null)
  const bodyRef = useRef(null)
  const ornamentRef = useRef(null)

  useEffect(() => {
    if (!sectionRef.current) return

    const ctx = gsap.context(() => {
      /* ── Top ornamental divider ── */
      if (ornamentRef.current) {
        gsap.fromTo(
          ornamentRef.current,
          { opacity: 0, scale: 0.7 },
          {
            opacity: 1,
            scale: 1,
            duration: 1.6,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: ornamentRef.current,
              start: 'top 88%',
              end: 'top 35%',
              toggleActions: 'play none none reverse',
            },
          }
        )
      }

      /* ── Headline lines: staggered cinematic reveal ── */
      linesRef.current.forEach((line, i) => {
        if (!line) return

        gsap.fromTo(
          line,
          {
            y: 70,
            opacity: 0,
            rotateX: 6,
          },
          {
            y: 0,
            opacity: 1,
            rotateX: 0,
            duration: 1.5,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: line,
              start: 'top 90%',
              end: 'top 30%',
              toggleActions: 'play none none reverse',
            },
            delay: i * 0.08,
          }
        )
      })

      /* ── Top divider expand ── */
      if (topDividerRef.current) {
        gsap.fromTo(
          topDividerRef.current,
          { scaleX: 0, opacity: 0 },
          {
            scaleX: 1,
            opacity: 1,
            duration: 2.0,
            ease: 'power3.inOut',
            scrollTrigger: {
              trigger: topDividerRef.current,
              start: 'top 88%',
              end: 'top 40%',
              toggleActions: 'play none none reverse',
            },
          }
        )
      }

      /* ── Attribution reveal ── */
      if (attributionRef.current) {
        gsap.fromTo(
          attributionRef.current,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.3,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: attributionRef.current,
              start: 'top 88%',
              end: 'top 40%',
              toggleActions: 'play none none reverse',
            },
            delay: 0.3,
          }
        )
      }

      /* ── Bottom divider expand ── */
      if (bottomDividerRef.current) {
        gsap.fromTo(
          bottomDividerRef.current,
          { scaleX: 0, opacity: 0 },
          {
            scaleX: 1,
            opacity: 1,
            duration: 2.0,
            ease: 'power3.inOut',
            scrollTrigger: {
              trigger: bottomDividerRef.current,
              start: 'top 88%',
              end: 'top 40%',
              toggleActions: 'play none none reverse',
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
            duration: 1.5,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: bodyRef.current,
              start: 'top 88%',
              end: 'top 35%',
              toggleActions: 'play none none reverse',
            },
          }
        )
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  /* ── Line style resolver ── */
  const getLineStyle = (type) => {
    const base = {
      fontFamily: FONT_EDITORIAL,
      fontWeight: 300,
      lineHeight: 1.12,
      color: IVORY,
      margin: 0,
      padding: 0,
      textAlign: 'center',
      willChange: 'transform, opacity',
      perspective: '800px',
      textShadow: '0 0 100px rgba(176, 122, 90, 0.035), 0 0 35px rgba(245, 238, 225, 0.025)',
    }

    switch (type) {
      case 'large':
        return {
          ...base,
          fontSize: 'clamp(3.2rem, 8.5vw, 9rem)',
          letterSpacing: '-0.025em',
          fontWeight: 300,
        }
      case 'medium':
        return {
          ...base,
          fontSize: 'clamp(1.8rem, 4.5vw, 4.2rem)',
          letterSpacing: '0.01em',
          color: CHAMPAGNE,
        }
      case 'medium-italic':
        return {
          ...base,
          fontSize: 'clamp(1.8rem, 4.5vw, 4.2rem)',
          letterSpacing: '0.01em',
          fontStyle: 'italic',
          color: CHAMPAGNE,
        }
      case 'accent':
        return {
          ...base,
          fontSize: 'clamp(3rem, 7.5vw, 8rem)',
          letterSpacing: '-0.015em',
          color: GOLD,
          fontStyle: 'italic',
          textShadow: '0 2px 60px rgba(176, 122, 90, 0.08), 0 0 30px rgba(176, 122, 90, 0.04)',
        }
      default:
        return base
    }
  }

  return (
    <section
      ref={sectionRef}
      id="center-text-section"
      style={{
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(8rem, 18vh, 16rem) clamp(1.5rem, 6vw, 6rem)',
      }}
    >
      {/* ── Ambient double glow ── */}
      <div
        className="ambient-glow-blur"
        style={{
          position: 'absolute',
          top: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '70vw',
          height: '70vw',
          maxWidth: '1000px',
          maxHeight: '1000px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(176, 122, 90, 0.025) 0%, rgba(245, 238, 225, 0.006) 35%, transparent 55%)',
          pointerEvents: 'none',
          filter: 'blur(100px)',
        }}
      />
      <div
        className="ambient-glow-blur"
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '-10%',
          width: '40vw',
          height: '40vw',
          maxWidth: '600px',
          maxHeight: '600px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(245, 238, 225, 0.008) 0%, transparent 55%)',
          pointerEvents: 'none',
          filter: 'blur(80px)',
        }}
      />

      {/* ── Content container ── */}
      <div
        style={{
          maxWidth: '1000px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* ── Ornamental diamond ── */}
        <div
          ref={ornamentRef}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(1rem, 2.5vw, 2rem)',
            marginBottom: 'clamp(3rem, 7vh, 6rem)',
            willChange: 'transform, opacity',
          }}
        >
          <div
            style={{
              width: 'clamp(30px, 5vw, 60px)',
              height: '1px',
              background: `linear-gradient(90deg, transparent, ${GOLD_DIM})`,
            }}
          />
          <div
            style={{
              width: '6px',
              height: '6px',
              border: `1px solid ${GOLD_DIM}`,
              transform: 'rotate(45deg)',
            }}
          />
          <div
            style={{
              width: 'clamp(30px, 5vw, 60px)',
              height: '1px',
              background: `linear-gradient(90deg, ${GOLD_DIM}, transparent)`,
            }}
          />
        </div>

        {/* ── Main Editorial Typography — Centered ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'clamp(0.15rem, 0.6vw, 0.4rem)',
          }}
        >
          {HEADLINE_LINES.map((line, i) => (
            <h2
              key={i}
              ref={(el) => (linesRef.current[i] = el)}
              style={getLineStyle(line.type)}
            >
              {line.text}
            </h2>
          ))}
        </div>

        {/* ── Top gold divider ── */}
        <div
          ref={topDividerRef}
          style={{
            width: 'clamp(50px, 7vw, 100px)',
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${GOLD_SOLID}, transparent)`,
            marginTop: 'clamp(3rem, 6vh, 5rem)',
            marginBottom: 'clamp(1.5rem, 3vh, 2.5rem)',
            transformOrigin: 'center center',
            willChange: 'transform, opacity',
          }}
        />

        {/* ── Attribution ── */}
        <p
          ref={attributionRef}
          style={{
            fontFamily: FONT_BODY,
            fontSize: 'clamp(0.65rem, 0.9vw, 0.8rem)',
            fontWeight: 300,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: GOLD_DIM,
            textAlign: 'center',
            willChange: 'transform, opacity',
          }}
        >
          {ATTRIBUTION}
        </p>

        {/* ── Bottom gold divider ── */}
        <div
          ref={bottomDividerRef}
          style={{
            width: 'clamp(40px, 5vw, 80px)',
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${GOLD_DIM}, transparent)`,
            marginTop: 'clamp(3.5rem, 7vh, 6rem)',
            marginBottom: 'clamp(3rem, 6vh, 5rem)',
            transformOrigin: 'center center',
            willChange: 'transform, opacity',
          }}
        />

        {/* ── Body text ── */}
        <p
          ref={bodyRef}
          style={{
            fontFamily: FONT_BODY,
            fontSize: 'clamp(0.85rem, 1.15vw, 1.05rem)',
            fontWeight: 300,
            lineHeight: 2.2,
            color: WARM_MIST,
            letterSpacing: '0.04em',
            maxWidth: '560px',
            textAlign: 'center',
            willChange: 'transform, opacity',
          }}
        >
          {BODY_TEXT}
        </p>
      </div>
    </section>
  )
}

export default memo(CenterTextSection)
