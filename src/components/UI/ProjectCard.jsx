import { useRef, useState, useCallback, useEffect, useId, memo } from 'react'
import { useYouTubePlayer } from '../../context/YouTubePlayerContext'
import { useCardGlassEffect } from '../../hooks/useCardGlassEffect'
import { useCinematicTransition } from '../../hooks/useCinematicTransition'

/* ── Warm Atmospheric Design Tokens ───────────────────── */
const GOLD = 'rgba(176, 122, 90, 0.82)'
const GOLD_DIM = 'rgba(176, 122, 90, 0.35)'
const FONT_EDITORIAL = "'Bricolage Grotesque', sans-serif"
const FONT_BODY = "'Bricolage Grotesque', sans-serif"
const FONT_DISPLAY = "'Bebas Neue', sans-serif"
const EASE_CSS = 'cubic-bezier(0.16, 1, 0.3, 1)'

/* ── YouTube Helpers ──────────────────────────────────── */
const getYouTubeThumbnail = (id) =>
  `https://img.youtube.com/vi/${id}/maxresdefault.jpg`

// Controls hidden, autoplay with sound, no YT branding
const getYouTubeEmbedUrl = (id) =>
  `https://www.youtube.com/embed/${id}?autoplay=1&mute=0&controls=0&modestbranding=1&rel=0&showinfo=0&playsinline=1&enablejsapi=1&iv_load_policy=3&disablekb=1&fs=0`

const getYouTubeWatchUrl = (id) =>
  `https://www.youtube.com/watch?v=${id}`

/* ── Click Delay (to distinguish single vs double click) ── */
const CLICK_DELAY = 280

function ProjectCard({
  aspectRatio = '16 / 8',
  title = 'Untitled Project',
  subtitle = '',
  year = '2026',
  maxWidth = '1400px',
  cardStyle = {},
  cardRef: externalCardRef,
  youtubeId = null,
}) {
  const isVerticalCard = String(aspectRatio).includes('9 / 14')
  const internalCardRef = useRef(null)
  const cardRef = externalCardRef || internalCardRef
  const canvasRef = useRef(null)
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

  // Initialize lightweight WebGL glass distortion (inits once when thumbnail loads)
  useCardGlassEffect(canvasRef, cardRef, thumbnailLoaded)

  const handleMouseEnter = useCallback(() => setIsHovered(true), [])
  const handleMouseLeave = useCallback(() => setIsHovered(false), [])

  /* ── Cursor-follow PLAY label (Immersive Garden style) ── */
  const handleMouseMove = (e) => {
    const label = playLabelRef.current
    const container = cardRef.current
    if (!label || !container) return
    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    // Direct DOM mutation — no React rerender
    label.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`
  }

  /* ── Viewport Lazy Loading ── */
  useEffect(() => {
    const el = cardRef.current
    if (!el || !youtubeId) return

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
  }, [youtubeId, cardRef, isPlaying, deactivateCard, uniqueId])

  /* ── Iframe fade-in after activation ── */
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

  /* ── Click handlers — single vs double click ── */
  const handleClick = useCallback(() => {
    if (!youtubeId) return

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current)
      clickTimerRef.current = null
      window.open(getYouTubeWatchUrl(youtubeId), '_blank')
      return
    }

    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null
      runTransition({
        eyebrow: isPlaying ? 'Close Film' : 'Project Film',
        chapter: title,
        detail: isPlaying
          ? 'Returning from the architectural film'
          : 'The residence opens as a cinematic study',
        onCovered: () => {
          if (isPlaying) {
            deactivateCard(uniqueId)
          } else {
            activateCard(uniqueId)
          }
        },
      })
    }, CLICK_DELAY)
  }, [youtubeId, isPlaying, activateCard, deactivateCard, uniqueId, runTransition, title])

  /* ── Cleanup click timer on unmount ── */
  useEffect(() => {
    return () => {
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current)
    }
  }, [])

  return (
    <div
      className={`project-card ${isVerticalCard ? 'project-card--vertical' : 'project-card--wide'}`}
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={!isPlaying ? handleMouseMove : undefined}
      onClick={handleClick}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth,
        aspectRatio,
        borderRadius: 'clamp(6px, 0.6vw, 12px)',
        overflow: 'hidden',
        cursor: isPlaying ? 'default' : 'none',
        willChange: 'transform, opacity',
        transition: `box-shadow 0.8s ${EASE_CSS}`,
        boxShadow: isHovered
          ? '0 30px 80px rgba(20, 15, 8, 0.5), 0 0 60px rgba(176, 122, 90, 0.06), inset 0 0 80px rgba(176, 122, 90, 0.03)'
          : '0 15px 50px rgba(20, 15, 8, 0.4), 0 0 0 rgba(176, 122, 90, 0)',
        ...cardStyle,
      }}
    >
      {/* ── YouTube Thumbnail (Poster) — edge-to-edge cover ── */}
      {youtubeId && isInView && (
        <img
          src={getYouTubeThumbnail(youtubeId)}
          alt={title}
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
            transition: `opacity 0.6s ease`,
            zIndex: 1,
          }}
        />
      )}

      {/* ── WebGL Distortion Canvas (always mounted, shown on hover via opacity) ── */}
      {youtubeId && thumbnailLoaded && (
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

      {/* ── YouTube Iframe (Injected on Click) — covers entire card ── */}
      {isPlaying && youtubeId && (
        <div
          style={{
            position: 'absolute',
            // Overshoot by 2% on all sides to hide YouTube's residual chrome/borders
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
            src={getYouTubeEmbedUrl(youtubeId)}
            title={title}
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

      {/* ── Floating PLAY cursor label (Immersive Garden style) ── */}
      {youtubeId && !isPlaying && (
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

      {/* ── Off-screen Placeholder Fallback ── */}
      {(!youtubeId || !isInView) && (
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
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          border: `1px solid ${isHovered ? 'rgba(176, 122, 90, 0.2)' : 'rgba(210, 200, 180, 0.06)'}`,
          transition: `border-color 0.8s ${EASE_CSS}`,
          pointerEvents: 'none',
          zIndex: isPlaying ? -1 : 5,
        }}
      />

      {/* ── Corner accents — Top-left ── */}
      <div style={{
        position: 'absolute',
        top: 'clamp(14px, 1.8vw, 28px)',
        left: 'clamp(14px, 1.8vw, 28px)',
        zIndex: isPlaying ? -1 : 6,
        pointerEvents: 'none',
        opacity: isPlaying ? 0 : 1,
        transition: 'opacity 0.4s ease',
      }}>
        <div style={{
          width: 'clamp(20px, 2.5vw, 40px)',
          height: '1px',
          background: `linear-gradient(90deg, ${isHovered ? GOLD : 'rgba(255,255,255,0.12)'}, transparent)`,
          transition: `background 0.8s ${EASE_CSS}`,
          marginBottom: '-1px',
        }} />
        <div style={{
          width: '1px',
          height: 'clamp(20px, 2.5vw, 40px)',
          background: `linear-gradient(180deg, ${isHovered ? GOLD : 'rgba(255,255,255,0.12)'}, transparent)`,
          transition: `background 0.8s ${EASE_CSS}`,
        }} />
      </div>

      {/* ── Corner accents — Bottom-right ── */}
      <div style={{
        position: 'absolute',
        bottom: 'clamp(14px, 1.8vw, 28px)',
        right: 'clamp(14px, 1.8vw, 28px)',
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
          height: 'clamp(20px, 2.5vw, 40px)',
          background: `linear-gradient(0deg, ${isHovered ? GOLD : 'rgba(255,255,255,0.12)'}, transparent)`,
          transition: `background 0.8s ${EASE_CSS}`,
          alignSelf: 'flex-end',
          marginBottom: '-1px',
        }} />
        <div style={{
          width: 'clamp(20px, 2.5vw, 40px)',
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
          padding: 'clamp(14px, 2vw, 28px) clamp(16px, 2.5vw, 36px)',
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
              fontSize: 'clamp(1rem, 1.8vw, 1.5rem)',
              fontWeight: 300,
              color: 'rgba(0, 0, 0, 1)',
              letterSpacing: '0.02em',
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            {title}
          </h3>
          {subtitle && (
            <p
              style={{
                fontFamily: FONT_BODY,
                fontSize: 'clamp(0.55rem, 0.8vw, 0.65rem)',
                fontWeight: 300,
                color: 'rgba(0, 0, 0, 1)',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginTop: '0.35rem',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        <span
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 'clamp(0.5rem, 0.75vw, 0.6rem)',
            fontWeight: 400,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: GOLD_DIM,
          }}
        >
          {year}
        </span>
      </div>
    </div>
  )
}

export default memo(ProjectCard)
