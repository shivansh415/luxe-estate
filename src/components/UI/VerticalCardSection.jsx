import { useRef, useEffect, memo } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import ProjectCard from './ProjectCard'

gsap.registerPlugin(ScrollTrigger)

/* ── Design Tokens ─────────────────────────────────────── */
const GOLD_DIM = 'rgba(176, 122, 90, 0.35)'
const FONT_BODY = "'Bricolage Grotesque', sans-serif"
const FONT_EDITORIAL = "'Bricolage Grotesque', sans-serif"

/* ── Component ─────────────────────────────────────────── */
function VerticalCardSection() {
  const sectionRef = useRef(null)
  const cardRef = useRef(null)
  const labelRef = useRef(null)
  const sideTextRef = useRef(null)

  useEffect(() => {
    if (!sectionRef.current) return

    const ctx = gsap.context(() => {
      // Label reveal
      if (labelRef.current) {
        gsap.fromTo(
          labelRef.current,
          { y: 35, opacity: 0 },
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

      // Card: elegant vertical reveal — slower, taller travel distance
      if (cardRef.current) {
        gsap.fromTo(
          cardRef.current,
          {
            y: 160,
            opacity: 0,
            scale: 0.93,
          },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 2.2,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: cardRef.current,
              start: 'top 90%',
              end: 'top 15%',
              toggleActions: 'play none none reverse',
            },
          }
        )

        // Subtle parallax
        gsap.to(cardRef.current, {
          y: -40,
          ease: 'none',
          scrollTrigger: {
            trigger: cardRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 2,
          },
        })
      }

      // Side text
      if (sideTextRef.current) {
        gsap.fromTo(
          sideTextRef.current,
          { y: 60, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.6,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sideTextRef.current,
              start: 'top 88%',
              end: 'top 35%',
              toggleActions: 'play none none reverse',
            },
            delay: 0.2,
          }
        )
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="vertical-card-section"
      style={{
        position: 'relative',
        zIndex: 1,
        padding: 'clamp(9rem, 20vh, 18rem) clamp(1.5rem, 6vw, 8rem)',
      }}
    >
      {/* Ambient glow — right side */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          right: '-10%',
          width: '50vw',
          height: '60vw',
          maxWidth: '750px',
          maxHeight: '900px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(176, 122, 90, 0.015) 0%, transparent 55%)',
          pointerEvents: 'none',
          filter: 'blur(100px)',
        }}
      />

      {/* Layout: side text + card */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 'clamp(3rem, 6vw, 8rem)',
          flexWrap: 'wrap',
        }}
      >
        {/* Left side — label + editorial text */}
        <div
          style={{
            flex: '0 1 380px',
            paddingTop: 'clamp(2rem, 8vh, 6rem)',
            minWidth: '240px',
          }}
        >
          {/* Section label */}
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
              marginBottom: 'clamp(2rem, 4vh, 3.5rem)',
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
            Private Collection
          </div>

          {/* Side text */}
          <div
            ref={sideTextRef}
            style={{ willChange: 'transform, opacity' }}
          >
            <h3
              style={{
                fontFamily: FONT_EDITORIAL,
                fontSize: 'clamp(1.6rem, 3vw, 2.8rem)',
                fontWeight: 300,
                color: 'rgba(0, 0, 0, 1)',
                lineHeight: 1.25,
                letterSpacing: '-0.01em',
                marginBottom: 'clamp(1.5rem, 3vh, 2.5rem)',
              }}
            >
              Spaces that hold
              <br />
              <em style={{ color: '#B07A5A', textShadow: '0 0 10px rgba(176, 122, 90, 0.6), 0 0 20px rgba(176, 122, 90, 0.4), 0 0 35px rgba(176, 122, 90, 0.2)' }}>
                the weight of silence
              </em>
            </h3>

            <div
              style={{
                width: 'clamp(30px, 4vw, 60px)',
                height: '1px',
                background: `linear-gradient(90deg, ${GOLD_DIM}, transparent)`,
                marginBottom: 'clamp(1.5rem, 3vh, 2.5rem)',
              }}
            />

            <p
              style={{
                fontFamily: FONT_BODY,
                fontSize: 'clamp(0.8rem, 1vw, 0.92rem)',
                fontWeight: 300,
                lineHeight: 2,
                color: 'rgba(0, 0, 0, 1)',
                letterSpacing: '0.03em',
                maxWidth: '380px',
              }}
            >
              A vertical sanctuary rising from the earth — where 
              double-height voids and sculptural staircases transform 
              circulation into ceremony. Each floor is a chapter, 
              each threshold a quiet revelation.
            </p>
          </div>
        </div>

        {/* Right side — tall vertical card */}
        <div
          style={{
            flex: '0 1 400px',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <ProjectCard
            cardRef={cardRef}
            aspectRatio="9 / 14.5"
            title="The Monolith"
            subtitle="Santorini, Greece"
            year="2027"
            playLabel="Interior Film"
            maxWidth="400px"
            youtubeId="3TCDy1L6dT8"
          />
        </div>
      </div>
    </section>
  )
}

export default memo(VerticalCardSection)
