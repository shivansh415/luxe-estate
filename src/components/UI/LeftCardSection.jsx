import { useRef, useEffect, memo } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import ProjectCard from './ProjectCard'

gsap.registerPlugin(ScrollTrigger)

/* ── Warm Atmospheric Design Tokens ───────────────────── */
const GOLD_SOLID = '#B07A5A'
const GOLD_DIM = 'rgba(176, 122, 90, 0.35)'
const FONT_BODY = "'Bricolage Grotesque', sans-serif"

/* ── Description Lines ─────────────────────────────────── */
const DESCRIPTION_LINES = [
  'Conceived as a dialogue between earth and horizon, every volume is sculpted to frame the landscape — an architecture of restraint where negative space becomes the defining luxury.',
  'Hand-laid travertine floors flow uninterrupted from interior to terrace, while cantilevered overhangs dissolve the threshold between shelter and sky.',
  'Each residence is a private observatory — designed not to dominate the view, but to disappear into it.',
]

/* ── Component ─────────────────────────────────────────── */
function LeftCardSection() {
  const sectionRef = useRef(null)
  const cardRef = useRef(null)
  const labelRef = useRef(null)
  const descLinesRef = useRef([])
  const dividerRef = useRef(null)

  useEffect(() => {
    if (!sectionRef.current) return

    const ctx = gsap.context(() => {
      // Label reveal
      if (labelRef.current) {
        gsap.fromTo(
          labelRef.current,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.4,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: labelRef.current,
              start: 'top 90%',
              end: 'top 40%',
              toggleActions: 'play none none reverse',
            },
          }
        )
      }

      // Card: cinematic scale + parallax-like reveal
      if (cardRef.current) {
        gsap.fromTo(
          cardRef.current,
          {
            y: 140,
            opacity: 0,
            scale: 0.92,
          },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 2.0,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: cardRef.current,
              start: 'top 88%',
              end: 'top 20%',
              toggleActions: 'play none none reverse',
            },
          }
        )

        // Subtle parallax on scroll
        gsap.to(cardRef.current, {
          y: -30,
          ease: 'none',
          scrollTrigger: {
            trigger: cardRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.5,
          },
        })
      }

      // Divider
      if (dividerRef.current) {
        gsap.fromTo(
          dividerRef.current,
          { scaleX: 0, opacity: 0 },
          {
            scaleX: 1,
            opacity: 1,
            duration: 1.8,
            ease: 'power3.inOut',
            scrollTrigger: {
              trigger: dividerRef.current,
              start: 'top 88%',
              end: 'top 40%',
              toggleActions: 'play none none reverse',
            },
          }
        )
      }

      // Description lines
      descLinesRef.current.forEach((line, i) => {
        if (!line) return
        gsap.fromTo(
          line,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.3,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: line,
              start: 'top 90%',
              end: 'top 40%',
              toggleActions: 'play none none reverse',
            },
            delay: i * 0.12,
          }
        )
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="left-card-section"
      style={{
        position: 'relative',
        zIndex: 1,
        padding: 'clamp(8rem, 18vh, 16rem) clamp(1.5rem, 6vw, 8rem)',
      }}
    >
      {/* Ambient glow — left side */}
      <div
        style={{
          position: 'absolute',
          top: '25%',
          left: '-20%',
          width: '55vw',
          height: '55vw',
          maxWidth: '800px',
          maxHeight: '800px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(176, 122, 90, 0.02) 0%, transparent 60%)',
          pointerEvents: 'none',
          filter: 'blur(90px)',
        }}
      />

      {/* Main layout container — left-aligned content grid */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          width: '100%',
        }}
      >
        {/* Section Label — left aligned */}
        <div
          ref={labelRef}
          style={{
            fontFamily: FONT_BODY,
            fontSize: 'clamp(0.6rem, 0.9vw, 0.75rem)',
            fontWeight: 400,
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            color: GOLD_DIM,
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            willChange: 'transform, opacity',
            paddingBottom: 'clamp(2.5rem, 5vh, 4.5rem)',
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
          The Horizon Series
        </div>

        {/* Card — left-aligned (not centered) */}
        <div style={{ width: '100%', maxWidth: '920px' }}>
          <ProjectCard
            cardRef={cardRef}
            aspectRatio="16 / 9"
            title="Horizon One"
            subtitle="Big Sur, California"
            year="2026"
            playLabel="Aerial Tour"
            maxWidth="920px"
            youtubeId="0pHwBPFHMGU"
          />
        </div>

        {/* Description below card */}
        <div
          style={{
            width: '100%',
            maxWidth: '920px',
            paddingTop: 'clamp(3rem, 6vh, 5rem)',
          }}
        >
          <div
            ref={dividerRef}
            style={{
              width: 'clamp(40px, 6vw, 90px)',
              height: '1px',
              background: `linear-gradient(90deg, ${GOLD_SOLID}, ${GOLD_DIM})`,
              marginBottom: 'clamp(2rem, 4vh, 3.5rem)',
              transformOrigin: 'left center',
              willChange: 'transform, opacity',
            }}
          />

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'clamp(1rem, 2vh, 1.8rem)',
              maxWidth: '700px',
            }}
          >
            {DESCRIPTION_LINES.map((text, i) => (
              <p
                key={i}
                ref={(el) => (descLinesRef.current[i] = el)}
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: 'clamp(0.82rem, 1.1vw, 1rem)',
                  fontWeight: 300,
                  lineHeight: 2,
                  color: i === 0
                    ? 'rgba(0, 0, 0, 1)'
                    : i === 1
                      ? 'rgba(0, 0, 0, 1)'
                      : 'rgba(0, 0, 0, 1)',
                  letterSpacing: '0.03em',
                  willChange: 'transform, opacity',
                }}
              >
                {text}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default memo(LeftCardSection)
