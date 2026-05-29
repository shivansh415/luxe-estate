import { useRef, useEffect, useState, memo } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* ─────────────────────────── Section Data ─────────────────────────── */

const SECTION_DATA = [
  {
    id: 0,
    title: 'The Residence',
    subtitle: 'Where Architecture Meets Art',
    description:
      'An unprecedented masterpiece of contemporary luxury living, where every surface tells a story of exquisite craftsmanship and visionary design.',
    tag: 'I',
  },
  {
    id: 1,
    title: 'The Ascent',
    subtitle: 'Sculptural Elegance',
    description:
      'Every step reveals a new dimension of refined craftsmanship, ascending through spaces that redefine the boundaries of luxury.',
    tag: 'II',
    stats: [
      { label: 'Square Feet', value: '12,500' },
      { label: 'Bedrooms', value: '7' },
      { label: 'Stories', value: '3' },
    ],
  },
  {
    id: 2,
    title: 'The Sanctuary',
    subtitle: 'Living Reimagined',
    description:
      'A curated space where luxury becomes a living experience, blending nature with architectural mastery.',
    tag: 'III',
    features: [
      'Private Infinity Pool',
      'Zen Garden & Spa',
      'Wine Cellar & Tasting Room',
      'Smart Home Automation',
    ],
  },
  {
    id: 3,
    title: 'The Horizon',
    subtitle: 'Infinite Perspectives',
    description:
      'Where the sky meets water in an eternal embrace, offering panoramic views that inspire and captivate.',
    tag: 'IV',
    quote: {
      text: 'Architecture should speak of its time and place, but yearn for timelessness.',
      author: 'Frank Gehry',
    },
  },
  {
    id: 4,
    title: 'The Legacy',
    subtitle: 'A Timeless Vision',
    description:
      'An architectural legacy that transcends generations, crafted for those who demand nothing less than extraordinary.',
    tag: 'V',
  },
]

/* ─────────────────────── Feature Icons Map ─────────────────────── */

const FEATURE_ICONS = {
  'Private Infinity Pool': '♒',
  'Zen Garden & Spa': '❋',
  'Wine Cellar & Tasting Room': '🍷',
  'Smart Home Automation': '◈',
}

/* ──────────────────── Animated Counter Hook ───────────────────── */

function useAnimatedCounter(targetStr, shouldAnimate) {
  const [display, setDisplay] = useState('0')
  const numericTarget = parseInt(targetStr.replace(/,/g, ''), 10)

  useEffect(() => {
    if (!shouldAnimate) {
      const frame = requestAnimationFrame(() => setDisplay('0'))
      return () => cancelAnimationFrame(frame)
    }

    const obj = { val: 0 }
    const tween = gsap.to(obj, {
      val: numericTarget,
      duration: 2.4,
      ease: 'power2.out',
      onUpdate: () => {
        setDisplay(Math.round(obj.val).toLocaleString())
      },
    })

    return () => tween.kill()
  }, [shouldAnimate, numericTarget])

  return display
}

/* ──────────────────────── Stat Card ────────────────────────────── */

function StatCard({ label, value, shouldAnimate, delay }) {
  const display = useAnimatedCounter(value, shouldAnimate)

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{
        flex: '1 1 0',
        minWidth: '160px',
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
        borderRight: '1px solid rgba(176, 122, 90, 0.12)',
        position: 'relative',
      }}
    >
      <div
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          fontWeight: 300,
          color: 'rgba(176, 122, 90, 0.9)',
          lineHeight: 1,
          marginBottom: '0.75rem',
          letterSpacing: '-0.02em',
        }}
      >
        {display}
      </div>
      <div
        style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontSize: '0.7rem',
          fontWeight: 400,
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: 'rgba(0, 0, 0, 1)',
        }}
      >
        {label}
      </div>
    </motion.div>
  )
}

/* ──────────────────────── CTA Button ──────────────────────────── */

function CTAButton({ children, large, onClick }) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      style={{
        position: 'relative',
        display: 'inline-block',
        padding: large ? '1.2rem 3.5rem' : '1rem 2.8rem',
        background: hovered
          ? 'rgba(176, 122, 90, 0.08)'
          : 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontFamily: "'Bricolage Grotesque', sans-serif",
        fontSize: large ? '0.8rem' : '0.72rem',
        fontWeight: 400,
        letterSpacing: '0.3em',
        textTransform: 'uppercase',
        color: 'rgba(176, 122, 90, 0.9)',
        transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        outline: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Animated gold gradient border */}
      <span
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '0px',
          padding: '1px',
          background: hovered
            ? 'linear-gradient(135deg, rgba(176, 122, 90, 0.8), rgba(255, 215, 100, 0.6), rgba(176, 122, 90, 0.8))'
            : 'linear-gradient(135deg, rgba(176, 122, 90, 0.35), rgba(255, 215, 100, 0.2), rgba(176, 122, 90, 0.35))',
          WebkitMask:
            'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          transition: 'background 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          pointerEvents: 'none',
        }}
      />
      {children}
    </motion.button>
  )
}

/* ──────────────────── Section-Specific Content ────────────────── */

function HeroContent({ shouldAnimate }) {
  return (
    <motion.div
      className="section-text"
      initial={{ opacity: 0, y: 30 }}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 1.2, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
      style={{ marginTop: '3rem' }}
    >
      <CTAButton large>Discover</CTAButton>
    </motion.div>
  )
}

function StatsContent({ stats, shouldAnimate }) {
  return (
    <div
      className="section-text"
      style={{
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginTop: '3rem',
        border: '1px solid rgba(176, 122, 90, 0.1)',
        borderRight: 'none',
        maxWidth: '700px',
        marginLeft: 'auto',
        marginRight: 'auto',
      }}
    >
      {stats.map((s, i) => (
        <StatCard
          key={s.label}
          label={s.label}
          value={s.value}
          shouldAnimate={shouldAnimate}
          delay={0.3 + i * 0.2}
        />
      ))}
    </div>
  )
}

function FeaturesContent({ features, shouldAnimate }) {
  return (
    <div
      className="section-text"
      style={{
        marginTop: '3rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.2rem',
      }}
    >
      {features.map((feature, i) => (
        <motion.div
          key={feature}
          initial={{ opacity: 0, x: -30 }}
          animate={shouldAnimate ? { opacity: 1, x: 0 } : {}}
          transition={{
            duration: 0.9,
            delay: 0.4 + i * 0.15,
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.2rem',
            padding: '0.9rem 2rem',
            width: '100%',
            maxWidth: '420px',
            borderBottom: '1px solid rgba(176, 122, 90, 0.08)',
          }}
        >
          <span
            style={{
              fontSize: '1.3rem',
              color: 'rgba(176, 122, 90, 0.7)',
              width: '2rem',
              textAlign: 'center',
              flexShrink: 0,
            }}
          >
            {FEATURE_ICONS[feature] || '◆'}
          </span>
          <span
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: '0.85rem',
              fontWeight: 300,
              letterSpacing: '0.12em',
              color: 'rgba(0, 0, 0, 1)',
              textTransform: 'uppercase',
            }}
          >
            {feature}
          </span>
        </motion.div>
      ))}
    </div>
  )
}

function QuoteContent({ quote, shouldAnimate }) {
  return (
    <motion.blockquote
      className="section-text"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={shouldAnimate ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 1.4, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        marginTop: '3rem',
        maxWidth: '600px',
        marginLeft: 'auto',
        marginRight: 'auto',
        padding: '2.5rem 2rem',
        position: 'relative',
        borderLeft: '2px solid rgba(176, 122, 90, 0.25)',
      }}
    >
      {/* Opening quote mark */}
      <span
        style={{
          position: 'absolute',
          top: '-0.5rem',
          left: '1rem',
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '5rem',
          color: 'rgba(176, 122, 90, 0.15)',
          lineHeight: 1,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        &ldquo;
      </span>
      <p
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 'clamp(1.1rem, 2vw, 1.5rem)',
          fontWeight: 300,
          fontStyle: 'italic',
          lineHeight: 1.7,
          color: 'rgba(0, 0, 0, 1)',
          letterSpacing: '0.02em',
          textAlign: 'left',
          margin: 0,
        }}
      >
        {quote.text}
      </p>
      <cite
        style={{
          display: 'block',
          marginTop: '1.5rem',
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontSize: '0.72rem',
          fontWeight: 400,
          fontStyle: 'normal',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: 'rgba(176, 122, 90, 0.6)',
          textAlign: 'left',
        }}
      >
        — {quote.author}
      </cite>
    </motion.blockquote>
  )
}

function LegacyCTA({ shouldAnimate }) {
  return (
    <motion.div
      className="section-text"
      initial={{ opacity: 0, y: 40 }}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 1.2, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
      style={{
        marginTop: '3rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2rem',
      }}
    >
      <CTAButton large>Schedule a Private Viewing</CTAButton>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.6rem',
          marginTop: '1rem',
        }}
      >
        <span
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: '0.7rem',
            fontWeight: 300,
            letterSpacing: '0.2em',
            color: 'rgba(0, 0, 0, 1)',
            textTransform: 'uppercase',
          }}
        >
          Private Inquiries
        </span>
        <a
          href="mailto:concierge@theresidence.com"
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '1.1rem',
            fontWeight: 300,
            fontStyle: 'italic',
            color: 'rgba(176, 122, 90, 0.65)',
            textDecoration: 'none',
            letterSpacing: '0.08em',
            transition: 'color 0.4s ease',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = 'rgba(176, 122, 90, 0.95)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = 'rgba(176, 122, 90, 0.65)')
          }
        >
          concierge@theresidence.com
        </a>
        <span
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: '0.78rem',
            fontWeight: 300,
            letterSpacing: '0.15em',
            color: 'rgba(0, 0, 0, 1)',
          }}
        >
          +1 (212) 555 — 0170
        </span>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════ MAIN COMPONENT ═══════════════════════ */

function Section({ index }) {
  const sectionRef = useRef(null)
  const contentRef = useRef(null)
  const dividerRef = useRef(null)
  const [inView, setInView] = useState(false)
  const data = SECTION_DATA[index]

  /* ── GSAP scroll-driven stagger animation ── */
  useEffect(() => {
    if (!contentRef.current) return

    const ctx = gsap.context(() => {
      // Text stagger reveal
      gsap.fromTo(
        contentRef.current.querySelectorAll('.section-text'),
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.2,
          ease: 'power3.out',
          stagger: 0.15,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            end: 'top 20%',
            toggleActions: 'play none none reverse',
            onEnter: () => setInView(true),
            onLeaveBack: () => setInView(false),
          },
        }
      )

      // Gold divider width animation
      if (dividerRef.current) {
        gsap.fromTo(
          dividerRef.current,
          { width: '0px' },
          {
            width: '80px',
            duration: 1.6,
            ease: 'power3.inOut',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 70%',
              toggleActions: 'play none none reverse',
            },
          }
        )
      }
    })

    return () => ctx.revert()
  }, [])

  /* ── Title letter-stagger for letter-by-letter reveal ── */
  const titleLetters = data.title.split('')

  return (
    <section
      ref={sectionRef}
      id={`section-${index}`}
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 1,
        padding: 'clamp(3rem, 8vh, 6rem) clamp(1rem, 4vw, 2rem)',
      }}
    >
      {/* Subtle radial glow behind content */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '600px',
          height: '600px',
          transform: 'translate(-50%, -50%)',
          background:
            'radial-gradient(circle, rgba(176, 122, 90, 0.03) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        ref={contentRef}
        style={{
          maxWidth: '900px',
          width: '100%',
          textAlign: 'center',
          pointerEvents: 'auto',
          position: 'relative',
        }}
      >
        {/* ── Chapter Number ── */}
        <motion.div
          className="section-text"
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(0.6rem, 1vw, 0.85rem)',
            letterSpacing: '0.5em',
            textTransform: 'uppercase',
            color: 'rgba(176, 122, 90, 0.5)',
            marginBottom: 'clamp(1.5rem, 3vh, 2.5rem)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5rem',
          }}
        >
          <span
            style={{
              width: '30px',
              height: '1px',
              background:
                'linear-gradient(90deg, transparent, rgba(176, 122, 90, 0.3))',
              display: 'inline-block',
            }}
          />
          <span>Chapter {data.tag}</span>
          <span
            style={{
              width: '30px',
              height: '1px',
              background:
                'linear-gradient(90deg, rgba(176, 122, 90, 0.3), transparent)',
              display: 'inline-block',
            }}
          />
        </motion.div>

        {/* ── Title with letter-stagger ── */}
        <h2
          className="section-text"
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(2.2rem, 7vw, 6rem)',
            fontWeight: 300,
            lineHeight: 1.05,
            color: 'rgba(0, 0, 0, 1)',
            letterSpacing: '0.04em',
            marginBottom: 'clamp(0.8rem, 2vh, 1.5rem)',
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            overflow: 'hidden',
          }}
        >
          {titleLetters.map((letter, i) => (
            <motion.span
              key={i}
              initial={{ y: 80, opacity: 0 }}
              animate={inView ? { y: 0, opacity: 1 } : { y: 80, opacity: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.1 + i * 0.04,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{
                display: 'inline-block',
                whiteSpace: letter === ' ' ? 'pre' : 'normal',
                minWidth: letter === ' ' ? '0.25em' : undefined,
              }}
            >
              {letter}
            </motion.span>
          ))}
        </h2>

        {/* ── Subtitle ── */}
        <p
          className="section-text"
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(0.85rem, 2vw, 1.6rem)',
            fontWeight: 300,
            fontStyle: 'italic',
            color: 'rgba(176, 122, 90, 0.8)',
            letterSpacing: 'clamp(0.08em, 1vw, 0.15em)',
            marginBottom: 'clamp(1.2rem, 2.5vh, 2rem)',
          }}
        >
          {data.subtitle}
        </p>

        {/* ── Gold Divider ── */}
        <div
          className="section-text"
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 'clamp(1.5rem, 3vh, 2.5rem)',
          }}
        >
          <div
            ref={dividerRef}
            style={{
              width: '0px',
              height: '1px',
              background:
                'linear-gradient(90deg, transparent, rgba(176, 122, 90, 0.6), transparent)',
            }}
          />
        </div>

        {/* ── Description ── */}
        <p
          className="section-text"
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: 'clamp(0.8rem, 1.1vw, 1rem)',
            fontWeight: 300,
            lineHeight: 1.9,
            color: 'rgba(0, 0, 0, 1)',
            letterSpacing: '0.05em',
            maxWidth: '520px',
            margin: '0 auto',
          }}
        >
          {data.description}
        </p>

        {/* ── Section-Specific Content ── */}
        {index === 0 && <HeroContent shouldAnimate={inView} />}
        {index === 1 && data.stats && (
          <StatsContent stats={data.stats} shouldAnimate={inView} />
        )}
        {index === 2 && data.features && (
          <FeaturesContent features={data.features} shouldAnimate={inView} />
        )}
        {index === 3 && data.quote && (
          <QuoteContent quote={data.quote} shouldAnimate={inView} />
        )}
        {index === 4 && <LegacyCTA shouldAnimate={inView} />}
      </div>
    </section>
  )
}

export default memo(Section)
