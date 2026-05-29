import { useRef, useEffect, useState, useCallback, useId, memo } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useYouTubePlayer } from '../../context/YouTubePlayerContext'
import { useCardGlassEffect } from '../../hooks/useCardGlassEffect'
import { useCinematicTransition } from '../../hooks/useCinematicTransition'

gsap.registerPlugin(ScrollTrigger)

/* ── Warm Atmospheric Design Tokens ───────────────────── */
const GOLD = 'rgba(176, 122, 90, 0.82)'
const GOLD_SOLID = '#B07A5A'
const GOLD_DIM = 'rgba(176, 122, 90, 0.35)'
const FONT_EDITORIAL = "'Bricolage Grotesque', sans-serif"
const FONT_BODY = "'Bricolage Grotesque', sans-serif"
const FONT_DISPLAY = "'Bebas Neue', sans-serif"
const EASE_CSS = 'cubic-bezier(0.16, 1, 0.3, 1)'

/* ── YouTube Helpers ──────────────────────────────────── */
const YOUTUBE_ID = 'vo2_tsMRtEU'
const getYouTubeThumbnail = (id) =>
  `https://img.youtube.com/vi/${id}/maxresdefault.jpg`
const getYouTubeEmbedUrl = (id) =>
  `https://www.youtube.com/embed/${id}?autoplay=1&mute=0&controls=0&modestbranding=1&rel=0&showinfo=0&playsinline=1&enablejsapi=1&iv_load_policy=3&disablekb=1&fs=0`
const getYouTubeWatchUrl = (id) =>
  `https://www.youtube.com/watch?v=${id}`

const CLICK_DELAY = 280

/* ── Description Lines ─────────────────────────────────── */
const DESCRIPTION_LINES = [
  'Where panoramic horizons meet hand-selected Italian marble — each residence is a private sanctuary conceived for those who understand that true luxury is felt, never merely seen.',
  'Floor-to-ceiling glazing dissolves the boundary between interior and landscape, while bespoke joinery and museum-grade lighting compose spaces of effortless grandeur.',
  'From penthouse terraces suspended above the city to waterfront estates that breathe with the tide — we curate addresses that become legacies.',
]

function CinematicCard() {
  const sectionRef = useRef(null)
  const cardRef = useRef(null)
  const canvasRef = useRef(null)
  const overlayRef = useRef(null)
  const borderGlowRef = useRef(null)
  const labelRef = useRef(null)
  const descLinesRef = useRef([])
  const dividerRef = useRef(null)
  const clickTimerRef = useRef(null)
  const playLabelRef = useRef(null)
  const uniqueId = useId()

  const [isHovered, setIsHovered] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false)
  const [iframeFadedIn, setIframeFadedIn] = useState(false)

  const { activeCardId, activateCard, deactivateCard } = useYouTubePlayer()
  const { runTransition } = useCinematicTransition()
  const isPlaying = activeCardId === uniqueId

  // Lightweight WebGL glass distortion (inits once when thumbnail loads)
  useCardGlassEffect(canvasRef, cardRef, thumbnailLoaded)

  const handleMouseEnter = useCallback(() => setIsHovered(true), [])
  const handleMouseLeave = useCallback(() => setIsHovered(false), [])

  /* ── Cursor-follow PLAY label ── */
  const handleMouseMove = useCallback((e) => {
    const label = playLabelRef.current
    const container = cardRef.current
    if (!label || !container) return
    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    label.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`
  }, [])

  /* ── Viewport Lazy Loading ── */
  useEffect(() => {
    const el = cardRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting)
        if (!entry.isIntersecting && isPlaying) {
          deactivateCard(uniqueId)
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [isPlaying, deactivateCard, uniqueId])

  /* ── Iframe fade-in ── */
  useEffect(() => {
    let firstFrame = null
    let secondFrame = null

    if (isPlaying) {
      firstFrame = requestAnimationFrame(() => {
        setIframeFadedIn(false)
        secondFrame = requestAnimationFrame(() => setIframeFadedIn(true))
      })
      return () => {
        if (firstFrame) cancelAnimationFrame(firstFrame)
        if (secondFrame) cancelAnimationFrame(secondFrame)
      }
    } else {
      firstFrame = requestAnimationFrame(() => setIframeFadedIn(false))
      return () => cancelAnimationFrame(firstFrame)
    }
  }, [isPlaying])

  /* ── Click handlers ── */
  const handleClick = useCallback(() => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current)
      clickTimerRef.current = null
      window.open(getYouTubeWatchUrl(YOUTUBE_ID), '_blank')
      return
    }

    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null
      runTransition({
        eyebrow: isPlaying ? 'Close Film' : 'Featured Film',
        chapter: 'The Aether Collection',
        detail: isPlaying
          ? 'Returning from the featured residence'
          : 'Entering the residence through cinematic motion',
        onCovered: () => {
          if (isPlaying) {
            deactivateCard(uniqueId)
          } else {
            activateCard(uniqueId)
          }
        },
      })
    }, CLICK_DELAY)
  }, [isPlaying, activateCard, deactivateCard, uniqueId, runTransition])

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current)
    }
  }, [])

  // ── GSAP Scroll Reveal Animations ──
  useEffect(() => {
    if (!sectionRef.current) return

    const ctx = gsap.context(() => {
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

      if (cardRef.current) {
        gsap.fromTo(
          cardRef.current,
          { y: 120, opacity: 0, scale: 0.94 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 1.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: cardRef.current,
              start: 'top 85%',
              end: 'top 25%',
              toggleActions: 'play none none reverse',
            },
          }
        )
      }

      if (borderGlowRef.current) {
        gsap.fromTo(
          borderGlowRef.current,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 2.5,
            ease: 'power2.inOut',
            scrollTrigger: {
              trigger: cardRef.current,
              start: 'top 75%',
              toggleActions: 'play none none reverse',
            },
            delay: 0.4,
          }
        )
      }

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
      id="cinematic-card-section"
      style={{
        position: 'relative',
        zIndex: 1,
        padding: 'clamp(8rem, 16vh, 14rem) clamp(1.5rem, 6vw, 8rem)',
      }}
    >
      {/* ── Ambient background glow ── */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          right: '-15%',
          width: '60vw',
          height: '60vw',
          maxWidth: '900px',
          maxHeight: '900px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(176, 122, 90, 0.02) 0%, transparent 60%)',
          pointerEvents: 'none',
          filter: 'blur(80px)',
        }}
      />

      {/* ── Section Label ── */}
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
          maxWidth: '1400px',
          margin: '0 auto',
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
        Featured Residence
      </div>

      {/* ═══ THE CINEMATIC CARD ═══ */}
      <div
        className="cinematic-feature-card"
        ref={cardRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={!isPlaying ? handleMouseMove : undefined}
        onClick={handleClick}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '1400px',
          margin: '0 auto',
          aspectRatio: '16 / 8',
          borderRadius: 'clamp(6px, 0.6vw, 12px)',
          overflow: 'hidden',
          cursor: isPlaying ? 'default' : 'none',
          willChange: 'transform, opacity',
          transition: `box-shadow 0.8s ${EASE_CSS}`,
          boxShadow: isHovered
            ? '0 30px 80px rgba(0, 0, 0, 0.5), 0 0 60px rgba(176, 122, 90, 0.06), inset 0 0 80px rgba(176, 122, 90, 0.03)'
            : '0 15px 50px rgba(0, 0, 0, 0.4), 0 0 0 rgba(176, 122, 90, 0)',
        }}
      >
        {/* ── YouTube Thumbnail ── */}
        {isInView && (
          <img
            src={getYouTubeThumbnail(YOUTUBE_ID)}
            alt="The Aether Collection"
            crossOrigin="anonymous"
            loading="lazy"
            onLoad={() => setThumbnailLoaded(true)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center center',
              display: 'block',
              pointerEvents: 'none',
              opacity: thumbnailLoaded ? 1 : 0,
              transition: 'opacity 0.6s ease',
              zIndex: 1,
            }}
          />
        )}

        {/* ── WebGL Distortion Canvas (always mounted, shown on hover) ── */}
        {thumbnailLoaded && (
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              display: 'block',
              opacity: isHovered && !isPlaying ? 1 : 0,
              transition: `opacity 0.5s ${EASE_CSS}`,
              pointerEvents: 'none',
              zIndex: isPlaying ? -1 : 2,
            }}
          />
        )}

        {/* ── YouTube Iframe ── */}
        {isPlaying && (
          <div
            style={{
              position: 'absolute',
              top: '-1%',
              left: '-1%',
              width: '102%',
              height: '102%',
              overflow: 'hidden',
              zIndex: 3,
              opacity: iframeFadedIn ? 1 : 0,
              transition: 'opacity 0.4s ease',
            }}
          >
            <iframe
              src={getYouTubeEmbedUrl(YOUTUBE_ID)}
              title="The Aether Collection"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none',
              }}
            />
          </div>
        )}

        {/* ── Floating PLAY cursor label ── */}
        {!isPlaying && (
          <div
            ref={playLabelRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 7,
              pointerEvents: 'none',
              opacity: isHovered ? 1 : 0,
              transition: `opacity 0.3s ${EASE_CSS}`,
              willChange: 'transform',
            }}
          >
            <span
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 'clamp(0.7rem, 1.1vw, 0.95rem)',
                fontWeight: 400,
                letterSpacing: '0.4em',
                textTransform: 'uppercase',
                color: 'rgba(255, 255, 255, 0.88)',
                textShadow: '0 1px 12px rgba(0, 0, 0, 0.5)',
                whiteSpace: 'nowrap',
              }}
            >
              PLAY
            </span>
          </div>
        )}

        {/* ── Off-screen Placeholder ── */}
        {!isInView && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(ellipse 120% 100% at 50% 50%, rgba(20, 18, 14, 0.02) 0%, rgba(12, 11, 10, 0.95) 50%, rgba(8, 8, 8, 0.98) 100%)',
            }}
          />
        )}

        {/* ── Glass overlay ── */}
        <div
          ref={overlayRef}
          style={{
            position: 'absolute',
            inset: 0,
            background: isHovered
              ? 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 40%, rgba(212,175,55,0.015) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.015) 0%, transparent 50%, transparent 100%)',
            transition: `background 0.8s ${EASE_CSS}`,
            pointerEvents: 'none',
            zIndex: isPlaying ? -1 : 4,
          }}
        />

        {/* ── Border glow frame ── */}
        <div
          ref={borderGlowRef}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            border: `1px solid ${isHovered ? 'rgba(176, 122, 90, 0.2)' : 'rgba(210, 200, 180, 0.06)'}`,
            transition: `border-color 0.8s ${EASE_CSS}`,
            pointerEvents: 'none',
            zIndex: isPlaying ? -1 : 5,
            opacity: 0,
          }}
        />

        {/* ── Corner accents — Top-left ── */}
        <div style={{
          position: 'absolute',
          top: 'clamp(16px, 2vw, 32px)',
          left: 'clamp(16px, 2vw, 32px)',
          zIndex: isPlaying ? -1 : 6,
          pointerEvents: 'none',
          opacity: isPlaying ? 0 : 1,
          transition: 'opacity 0.4s ease',
        }}>
          <div style={{
            width: 'clamp(24px, 3vw, 48px)',
            height: '1px',
            background: `linear-gradient(90deg, ${isHovered ? GOLD : 'rgba(255,255,255,0.12)'}, transparent)`,
            transition: `background 0.8s ${EASE_CSS}`,
            marginBottom: '-1px',
          }} />
          <div style={{
            width: '1px',
            height: 'clamp(24px, 3vw, 48px)',
            background: `linear-gradient(180deg, ${isHovered ? GOLD : 'rgba(255,255,255,0.12)'}, transparent)`,
            transition: `background 0.8s ${EASE_CSS}`,
          }} />
        </div>

        {/* ── Corner accents — Bottom-right ── */}
        <div style={{
          position: 'absolute',
          bottom: 'clamp(16px, 2vw, 32px)',
          right: 'clamp(16px, 2vw, 32px)',
          zIndex: isPlaying ? -1 : 6,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          opacity: isPlaying ? 0 : 1,
          transition: 'opacity 0.4s ease',
        }}>
          <div style={{
            width: '1px',
            height: 'clamp(24px, 3vw, 48px)',
            background: `linear-gradient(0deg, ${isHovered ? GOLD : 'rgba(255,255,255,0.12)'}, transparent)`,
            transition: `background 0.8s ${EASE_CSS}`,
            alignSelf: 'flex-end',
            marginBottom: '-1px',
          }} />
          <div style={{
            width: 'clamp(24px, 3vw, 48px)',
            height: '1px',
            background: `linear-gradient(270deg, ${isHovered ? GOLD : 'rgba(255,255,255,0.12)'}, transparent)`,
            transition: `background 0.8s ${EASE_CSS}`,
          }} />
        </div>

        {/* ── Bottom info bar ── */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 'clamp(16px, 2.5vw, 32px) clamp(20px, 3vw, 40px)',
            background: 'linear-gradient(0deg, rgba(0,0,0,0.5) 0%, transparent 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            zIndex: isPlaying ? -1 : 8,
            pointerEvents: 'none',
            opacity: isPlaying ? 0 : 1,
            transition: 'opacity 0.4s ease',
          }}
        >
          <div>
            <h3
              style={{
                fontFamily: FONT_EDITORIAL,
                fontSize: 'clamp(1.1rem, 2vw, 1.6rem)',
                fontWeight: 300,
                color: 'rgba(0, 0, 0, 1)',
                letterSpacing: '0.02em',
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              The Aether Collection
            </h3>
            <p
              style={{
                fontFamily: FONT_BODY,
                fontSize: 'clamp(0.6rem, 0.85vw, 0.7rem)',
                fontWeight: 300,
                color: 'rgba(0, 0, 0, 1)',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginTop: '0.4rem',
              }}
            >
              Malibu, California
            </p>
          </div>

          <span
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 'clamp(0.55rem, 0.8vw, 0.65rem)',
              fontWeight: 400,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: GOLD_DIM,
            }}
          >
            2026
          </span>
        </div>
      </div>

      {/* ═══ DESCRIPTION TEXT BELOW CARD ═══ */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
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
            maxWidth: '780px',
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
                color: 'rgba(0, 0, 0, 1)',
                letterSpacing: '0.03em',
                willChange: 'transform, opacity',
              }}
            >
              {text}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}

export default memo(CinematicCard)
