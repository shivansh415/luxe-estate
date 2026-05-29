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
const FONT_EDITORIAL = "'Bricolage Grotesque', sans-serif"
const FONT_BODY = "'Bricolage Grotesque', sans-serif"
const FONT_DISPLAY = "'Bebas Neue', sans-serif"

/* ── Content ───────────────────────────────────────────── */
const OVERLINE = 'Our Mission'

const STATEMENT_LINES = [
  { text: 'We do not sell', type: 'medium' },
  { text: 'homes.', type: 'accent' },
  { text: 'We compose', type: 'medium' },
  { text: 'legacies', type: 'large' },
  { text: 'in stone, light,', type: 'medium-italic' },
  { text: '& silence.', type: 'accent' },
]

const PHILOSOPHY_PARAGRAPHS = [
  'Every residence in our portfolio is a thesis on how life should be lived — not louder, but deeper. We seek architects who think in centuries, materials that improve with the passage of time, and sites that have been waiting millennia to be understood.',
  'Our clients do not come to us for square footage. They come because they recognize that the rarest commodity on earth is not marble or land — it is vision. The vision to see what a place could become, and the patience to let it arrive.',
]

const CLOSING_MARK = '—  Luxe Estates, Est. 2024'

/* ── Component ─────────────────────────────────────────── */
function MissionSection() {
  const sectionRef = useRef(null)
  const overlineRef = useRef(null)
  const topOrnamentRef = useRef(null)
  const linesRef = useRef([])
  const divider1Ref = useRef(null)
  const divider2Ref = useRef(null)
  const parasRef = useRef([])
  const closingRef = useRef(null)
  const bottomOrnamentRef = useRef(null)

  useEffect(() => {
    if (!sectionRef.current) return

    const ctx = gsap.context(() => {
      /* ── Top ornament ── */
      if (topOrnamentRef.current) {
        gsap.fromTo(
          topOrnamentRef.current,
          { opacity: 0, scale: 0.6 },
          {
            opacity: 1,
            scale: 1,
            duration: 1.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: topOrnamentRef.current,
              start: 'top 88%',
              end: 'top 35%',
              toggleActions: 'play none none reverse',
            },
          }
        )
      }

      /* ── Overline ── */
      if (overlineRef.current) {
        gsap.fromTo(
          overlineRef.current,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.4,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: overlineRef.current,
              start: 'top 88%',
              end: 'top 40%',
              toggleActions: 'play none none reverse',
            },
          }
        )
      }

      /* ── Statement lines: staggered cinematic reveal ── */
      linesRef.current.forEach((line, i) => {
        if (!line) return
        gsap.fromTo(
          line,
          {
            y: 65,
            opacity: 0,
            rotateX: 5,
          },
          {
            y: 0,
            opacity: 1,
            rotateX: 0,
            duration: 1.6,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: line,
              start: 'top 90%',
              end: 'top 30%',
              toggleActions: 'play none none reverse',
            },
            delay: i * 0.06,
          }
        )
      })

      /* ── Dividers ── */
      ;[divider1Ref, divider2Ref].forEach((ref) => {
        if (ref.current) {
          gsap.fromTo(
            ref.current,
            { scaleX: 0, opacity: 0 },
            {
              scaleX: 1,
              opacity: 1,
              duration: 2.0,
              ease: 'power3.inOut',
              scrollTrigger: {
                trigger: ref.current,
                start: 'top 88%',
                end: 'top 40%',
                toggleActions: 'play none none reverse',
              },
            }
          )
        }
      })

      /* ── Philosophy paragraphs ── */
      parasRef.current.forEach((para, i) => {
        if (!para) return
        gsap.fromTo(
          para,
          { y: 45, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.5,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: para,
              start: 'top 88%',
              end: 'top 35%',
              toggleActions: 'play none none reverse',
            },
            delay: i * 0.15,
          }
        )
      })

      /* ── Closing mark ── */
      if (closingRef.current) {
        gsap.fromTo(
          closingRef.current,
          { y: 25, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.3,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: closingRef.current,
              start: 'top 88%',
              end: 'top 40%',
              toggleActions: 'play none none reverse',
            },
            delay: 0.2,
          }
        )
      }

      /* ── Bottom ornament ── */
      if (bottomOrnamentRef.current) {
        gsap.fromTo(
          bottomOrnamentRef.current,
          { opacity: 0, scale: 0.6 },
          {
            opacity: 1,
            scale: 1,
            duration: 1.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: bottomOrnamentRef.current,
              start: 'top 88%',
              end: 'top 40%',
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
      textShadow: '0 0 100px rgba(176, 122, 90, 0.03), 0 0 35px rgba(245, 238, 225, 0.02)',
    }

    switch (type) {
      case 'large':
        return {
          ...base,
          fontSize: 'clamp(3.2rem, 8.5vw, 9rem)',
          letterSpacing: '-0.02em',
          fontStyle: 'italic',
          color: GOLD,
          textShadow: '0 2px 80px rgba(176, 122, 90, 0.1), 0 0 40px rgba(176, 122, 90, 0.05)',
        }
      case 'medium':
        return {
          ...base,
          fontSize: 'clamp(1.6rem, 4vw, 3.8rem)',
          letterSpacing: '0.01em',
          color: CHAMPAGNE,
        }
      case 'medium-italic':
        return {
          ...base,
          fontSize: 'clamp(1.6rem, 4vw, 3.8rem)',
          letterSpacing: '0.01em',
          fontStyle: 'italic',
          color: 'rgba(0, 0, 0, 1)',
        }
      case 'accent':
        return {
          ...base,
          fontSize: 'clamp(2.8rem, 7vw, 7.5rem)',
          letterSpacing: '-0.015em',
          color: GOLD,
          fontStyle: 'italic',
          textShadow: '0 2px 60px rgba(176, 122, 90, 0.08), 0 0 30px rgba(176, 122, 90, 0.04)',
        }
      default:
        return base
    }
  }

  /* ── Ornament element ── */
  const renderOrnament = (ornRef) => (
    <div
      ref={ornRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'clamp(0.8rem, 2vw, 1.8rem)',
        willChange: 'transform, opacity',
      }}
    >
      <div
        style={{
          width: 'clamp(25px, 4vw, 50px)',
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${GOLD_DIM})`,
        }}
      />
      <div
        style={{
          width: '5px',
          height: '5px',
          border: `1px solid ${GOLD_DIM}`,
          transform: 'rotate(45deg)',
        }}
      />
      <div
        style={{
          width: 'clamp(25px, 4vw, 50px)',
          height: '1px',
          background: `linear-gradient(90deg, ${GOLD_DIM}, transparent)`,
        }}
      />
    </div>
  )

  return (
    <section
      ref={sectionRef}
      id="mission-section"
      style={{
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(10rem, 22vh, 20rem) clamp(1.5rem, 6vw, 6rem)',
      }}
    >
      {/* ── Ambient radial glows ── */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80vw',
          height: '80vw',
          maxWidth: '1100px',
          maxHeight: '1100px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(176, 122, 90, 0.03) 0%, rgba(245, 238, 225, 0.006) 30%, transparent 50%)',
          pointerEvents: 'none',
          filter: 'blur(120px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '5%',
          left: '20%',
          width: '35vw',
          height: '35vw',
          maxWidth: '500px',
          maxHeight: '500px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(245, 238, 225, 0.008) 0%, transparent 50%)',
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
        {/* ── Top ornament ── */}
        <div style={{ marginBottom: 'clamp(2.5rem, 5vh, 4rem)' }}>
          {renderOrnament(topOrnamentRef)}
        </div>

        {/* ── Overline ── */}
        <p
          ref={overlineRef}
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 'clamp(0.6rem, 0.85vw, 0.75rem)',
            fontWeight: 400,
            letterSpacing: '0.5em',
            textTransform: 'uppercase',
            color: GOLD_DIM,
            marginBottom: 'clamp(3rem, 7vh, 6rem)',
            willChange: 'transform, opacity',
          }}
        >
          {OVERLINE}
        </p>

        {/* ── Main Statement Typography ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'clamp(0.1rem, 0.4vw, 0.3rem)',
          }}
        >
          {STATEMENT_LINES.map((line, i) => (
            <h2
              key={i}
              ref={(el) => (linesRef.current[i] = el)}
              style={getLineStyle(line.type)}
            >
              {line.text}
            </h2>
          ))}
        </div>

        {/* ── First divider ── */}
        <div
          ref={divider1Ref}
          style={{
            width: 'clamp(50px, 7vw, 100px)',
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${GOLD_SOLID}, transparent)`,
            marginTop: 'clamp(4rem, 8vh, 7rem)',
            marginBottom: 'clamp(4rem, 8vh, 7rem)',
            transformOrigin: 'center center',
            willChange: 'transform, opacity',
          }}
        />

        {/* ── Philosophy paragraphs ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'clamp(1.8rem, 3.5vh, 3rem)',
            maxWidth: '620px',
          }}
        >
          {PHILOSOPHY_PARAGRAPHS.map((text, i) => (
            <p
              key={i}
              ref={(el) => (parasRef.current[i] = el)}
              style={{
                fontFamily: FONT_BODY,
                fontSize: 'clamp(0.85rem, 1.1vw, 1.02rem)',
                fontWeight: 300,
                lineHeight: 2.2,
                color: i === 0
                  ? 'rgba(0, 0, 0, 1)'
                  : 'rgba(0, 0, 0, 1)',
                letterSpacing: '0.035em',
                textAlign: 'center',
                willChange: 'transform, opacity',
              }}
            >
              {text}
            </p>
          ))}
        </div>

        {/* ── Second divider ── */}
        <div
          ref={divider2Ref}
          style={{
            width: 'clamp(40px, 5vw, 80px)',
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${GOLD_DIM}, transparent)`,
            marginTop: 'clamp(4rem, 8vh, 7rem)',
            marginBottom: 'clamp(3rem, 6vh, 5rem)',
            transformOrigin: 'center center',
            willChange: 'transform, opacity',
          }}
        />

        {/* ── Closing signature ── */}
        <p
          ref={closingRef}
          style={{
            fontFamily: FONT_BODY,
            fontSize: 'clamp(0.6rem, 0.8vw, 0.72rem)',
            fontWeight: 300,
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: GOLD_DIM,
            textAlign: 'center',
            willChange: 'transform, opacity',
            marginBottom: 'clamp(3rem, 6vh, 5rem)',
          }}
        >
          {CLOSING_MARK}
        </p>

        {/* ── Bottom ornament ── */}
        {renderOrnament(bottomOrnamentRef)}
      </div>
    </section>
  )
}

export default memo(MissionSection)
