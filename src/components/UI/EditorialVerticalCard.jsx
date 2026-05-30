import { useRef, useEffect, memo } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import ProjectCard from './ProjectCard'

gsap.registerPlugin(ScrollTrigger)

/* ── Warm Atmospheric Design Tokens ───────────────────── */
const GOLD_DIM = 'rgba(176, 122, 90, 0.35)'
const GOLD_SOLID = '#B07A5A'
const FONT_BODY = "'Bricolage Grotesque', sans-serif"
const FONT_EDITORIAL = "'Bricolage Grotesque', sans-serif"

/**
 * EditorialVerticalCard
 *
 * Modular, reusable vertical card section with alternating layout.
 * Inspired by immersive-g.com project card pacing.
 *
 * @param {string}   id            — Section DOM id for scroll tracking
 * @param {'left'|'right'} align   — Card alignment ('left' = card left/text right)
 * @param {string}   label         — Section label text
 * @param {string}   title         — Card title
 * @param {string}   subtitle      — Card subtitle/location
 * @param {string}   year          — Year label
 * @param {string}   playLabel     — Center play text
 * @param {string}   heading       — Editorial heading (plain text portion)
 * @param {string}   headingAccent — Editorial heading gold italic portion
 * @param {string[]} descriptions  — 2-3 lines of body text
 * @param {string}   aspectRatio   — Card aspect ratio (default '9 / 14')
 * @param {string}   maxCardWidth  — Max card width (default '520px')
 */
function EditorialVerticalCard({
  id,
  align = 'left',
  label = 'Collection',
  title = 'Untitled',
  subtitle = '',
  year = '2027',
  playLabel = 'Architectural Film',
  heading = 'Spaces designed for',
  headingAccent = 'timelessness',
  descriptions = [],
  aspectRatio = '9 / 14.5',
  maxCardWidth = '400px',
  youtubeId = null,
}) {
  const sectionRef = useRef(null)
  const cardRef = useRef(null)
  const labelRef = useRef(null)
  const sideTextRef = useRef(null)
  const dividerRef = useRef(null)

  const isRight = align === 'right'

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

      // Card: cinematic vertical reveal
      if (cardRef.current) {
        gsap.fromTo(
          cardRef.current,
          {
            y: 150,
            opacity: 0,
            scale: 0.92,
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
          y: -35,
          ease: 'none',
          scrollTrigger: {
            trigger: cardRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.8,
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
            delay: 0.25,
          }
        )
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
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  /* ── Shared sub-elements ── */
  const labelElement = (
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
        flexDirection: isRight ? 'row-reverse' : 'row',
      }}
    >
      <span
        style={{
          width: '28px',
          height: '1px',
          background: `linear-gradient(${isRight ? '270' : '90'}deg, ${GOLD_DIM}, transparent)`,
          display: 'inline-block',
        }}
      />
      {label}
    </div>
  )

  const cardElement = (
    <ProjectCard
      cardRef={cardRef}
      aspectRatio={aspectRatio}
      title={title}
      subtitle={subtitle}
      year={year}
      playLabel={playLabel}
      maxWidth={maxCardWidth}
      youtubeId={youtubeId}
    />
  )

  const textElement = (
    <div
      ref={sideTextRef}
      style={{
        flex: '0 1 380px',
        paddingTop: 'clamp(3rem, 12vh, 10rem)',
        minWidth: '240px',
        willChange: 'transform, opacity',
        textAlign: isRight ? 'right' : 'left',
      }}
    >
      <h3
        style={{
          fontFamily: FONT_EDITORIAL,
          fontSize: 'clamp(1.5rem, 2.8vw, 2.6rem)',
          fontWeight: 300,
          color: 'rgba(0, 0, 0, 1)',
          lineHeight: 1.3,
          letterSpacing: '-0.01em',
          marginBottom: 'clamp(1.5rem, 3vh, 2.5rem)',
          textShadow: '0 0 80px rgba(176, 122, 90, 0.03)',
        }}
      >
        {heading}
        <br />
        <em style={{ color: '#B07A5A', textShadow: '0 0 10px rgba(176, 122, 90, 0.6), 0 0 20px rgba(176, 122, 90, 0.4), 0 0 35px rgba(176, 122, 90, 0.2)' }}>
          {headingAccent}
        </em>
      </h3>

      <div
        ref={dividerRef}
        style={{
          width: 'clamp(30px, 4vw, 60px)',
          height: '1px',
          background: `linear-gradient(${isRight ? '270' : '90'}deg, ${GOLD_SOLID}, ${GOLD_DIM})`,
          marginBottom: 'clamp(1.5rem, 3vh, 2.5rem)',
          transformOrigin: isRight ? 'right center' : 'left center',
          willChange: 'transform, opacity',
          marginLeft: isRight ? 'auto' : 0,
          marginRight: isRight ? 0 : 'auto',
        }}
      />

      {descriptions.map((text, i) => (
        <p
          key={i}
          style={{
            fontFamily: FONT_BODY,
            fontSize: 'clamp(0.8rem, 1vw, 0.92rem)',
            fontWeight: 300,
            lineHeight: 2.1,
            color: i === 0
              ? 'rgba(0, 0, 0, 1)'
              : i === 1
                ? 'rgba(0, 0, 0, 1)'
                : 'rgba(0, 0, 0, 1)',
            letterSpacing: '0.03em',
            maxWidth: '380px',
            marginBottom: i < descriptions.length - 1
              ? 'clamp(1rem, 2vh, 1.6rem)'
              : 0,
            marginLeft: isRight ? 'auto' : 0,
            marginRight: isRight ? 0 : 'auto',
          }}
        >
          {text}
        </p>
      ))}
    </div>
  )

  return (
    <section
      ref={sectionRef}
      id={id}
      style={{
        position: 'relative',
        zIndex: 1,
        padding: 'clamp(9rem, 20vh, 18rem) clamp(1.5rem, 6vw, 8rem)',
      }}
    >
      {/* Ambient glow */}
      <div
        className="ambient-glow-blur"
        style={{
          position: 'absolute',
          top: '12%',
          [isRight ? 'right' : 'left']: '-12%',
          width: '50vw',
          height: '60vw',
          maxWidth: '750px',
          maxHeight: '900px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(176, 122, 90, 0.022) 0%, rgba(245, 238, 225, 0.005) 30%, transparent 55%)',
          pointerEvents: 'none',
          filter: 'blur(100px)',
        }}
      />

      {/* Main layout container */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 'clamp(3rem, 6vw, 8rem)',
          flexWrap: 'wrap',
          flexDirection: isRight ? 'row-reverse' : 'row',
        }}
      >
        {/* Card column */}
        <div
          style={{
            flex: `0 1 ${maxCardWidth}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: isRight ? 'flex-end' : 'flex-start',
          }}
        >
          {labelElement}
          {cardElement}
        </div>

        {/* Text column */}
        {textElement}
      </div>
    </section>
  )
}

export default memo(EditorialVerticalCard)
