import { memo, useRef, useEffect, useState, useCallback } from 'react'
import gsap from 'gsap'

/* ── Constants ── */
const MOBILE_QUERY = '(max-width: 768px)'
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

const matchesQuery = (query) =>
  typeof window !== 'undefined' && window.matchMedia(query).matches

/** Floating dust particles — generated once */
const DUST_PARTICLES = Array.from({ length: 32 }, (_, i) => ({
  id: i,
  left: `${2 + Math.random() * 96}%`,
  top: `${Math.random() * 100}%`,
  size: 0.8 + Math.random() * 2,
  delay: Math.random() * 16,
  duration: 14 + Math.random() * 22,
  opacity: 0.03 + Math.random() * 0.1,
}))

/** Form field definitions */
const FORM_FIELDS = [
  { id: 'contact-name', label: 'Your Name', type: 'text', autocomplete: 'name' },
  { id: 'contact-vision', label: 'Your Vision', type: 'textarea', autocomplete: 'off' },
  { id: 'contact-type', label: 'Project Type', type: 'text', autocomplete: 'off' },
  { id: 'contact-budget', label: 'Estimated Budget', type: 'text', autocomplete: 'off' },
]

/** Social links */
const SOCIALS = [
  { label: 'Instagram', href: 'https://www.instagram.com/shivansh.js?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/shivansh-patidar/' },
]

/* ══════════════════════════════════════════════════════════════
   ContactPage — Ultra Luxury Cinematic Contact Experience

   FIX C-1:  RAF loop now self-terminates when mouse is idle
              (no more 60fps CPU burn on static state)
   FIX C-9:  Social links now point to real URLs
   FIX L-3:  Main form wrapped in <form> element for a11y
   FIX M-9:  Mobile-responsive layout improvements
   ══════════════════════════════════════════════════════════════ */
function ContactPage({ onBackToHome }) {
  const pageRef = useRef(null)
  const bgRef = useRef(null)
  const contentRef = useRef(null)
  const formRef = useRef(null)
  const ctaBtnRef = useRef(null)

  // FIX C-1: Use separate target + current refs, drive RAF only on movement
  const mouseCurrent = useRef({ x: 0.5, y: 0.5 })
  const mouseTarget  = useRef({ x: 0.5, y: 0.5 })
  const rafRef       = useRef(null)
  const isRunning    = useRef(false)

  const [focusedField, setFocusedField] = useState(null)
  const [fieldValues, setFieldValues] = useState({})

  /* ── GSAP entrance animations ── */
  useEffect(() => {
    const page = pageRef.current
    if (!page) return
    if (matchesQuery(REDUCED_MOTION_QUERY)) {
      gsap.set(page.querySelectorAll('.contact-animate'), {
        opacity: 1,
        y: 0,
        filter: 'none',
      })
      return
    }

    const ctx = gsap.context(() => {
      /* Chapter label */
      gsap.fromTo(
        '.contact-chapter',
        { opacity: 0, y: 18, filter: 'blur(6px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.4, delay: 0.3, ease: 'power2.out' }
      )
      /* Headline lines */
      gsap.fromTo(
        '.contact-headline__line',
        { opacity: 0, y: 55, filter: 'blur(16px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.6, stagger: 0.18, delay: 0.5, ease: 'power3.out' }
      )
      /* Subtitle */
      gsap.fromTo(
        '.contact-subtitle',
        { opacity: 0, y: 22, filter: 'blur(8px)' },
        { opacity: 0.6, y: 0, filter: 'blur(0px)', duration: 1.5, delay: 1.0, ease: 'power2.out' }
      )
      /* Contact details */
      gsap.fromTo(
        '.contact-detail',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 1.2, stagger: 0.12, delay: 1.3, ease: 'power2.out' }
      )
      /* CTA button */
      gsap.fromTo(
        '.contact-cta-wrap',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1.4, delay: 1.6, ease: 'power2.out' }
      )
      /* Form fields */
      gsap.fromTo(
        '.contact-field',
        { opacity: 0, y: 30, filter: 'blur(4px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, stagger: 0.1, delay: 1.8, ease: 'power2.out' }
      )
      /* Bottom elements */
      gsap.fromTo(
        '.contact-bottom-item',
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 1.2, stagger: 0.08, delay: 2.1, ease: 'power2.out' }
      )
      /* Gold accent line */
      gsap.fromTo(
        '.contact-accent-line',
        { width: 0 },
        { width: 'clamp(48px, 6vw, 100px)', duration: 2.0, delay: 1.4, ease: 'power2.inOut' }
      )
    }, page)

    return () => ctx.revert()
  }, [])

  /* ── Mouse parallax tracking — FIX C-1: self-terminating RAF ── */
  useEffect(() => {
    if (matchesQuery(REDUCED_MOTION_QUERY) || matchesQuery(MOBILE_QUERY)) return

    // Lerp factor for smooth trailing
    const LERP = 0.06
    const SETTLE_THRESHOLD = 0.0004

    const animate = () => {
      const cur  = mouseCurrent.current
      const tgt  = mouseTarget.current
      const dx   = tgt.x - cur.x
      const dy   = tgt.y - cur.y

      cur.x += dx * LERP
      cur.y += dy * LERP

      if (bgRef.current) {
        const mx = (cur.x - 0.5) * 2
        const my = (cur.y - 0.5) * 2
        bgRef.current.style.transform = `translate3d(${mx * -8}px, ${my * -6}px, 0) scale(1.08)`
      }

      // Self-terminate when settled — FIX C-1: no more infinite RAF
      if (Math.abs(dx) > SETTLE_THRESHOLD || Math.abs(dy) > SETTLE_THRESHOLD) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        isRunning.current = false
        rafRef.current = null
      }
    }

    const handleMouseMove = (e) => {
      mouseTarget.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      }
      // Only start loop if not already running
      if (!isRunning.current) {
        isRunning.current = true
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      isRunning.current = false
    }
  }, [])

  /* ── WhatsApp Redirection Callbacks ── */
  const handleStartConversation = useCallback(() => {
    const text = 'Hello! I would like to start a conversation about a luxury residence.'
    const encodedText = encodeURIComponent(text)
    window.open(`https://wa.me/916265581678?text=${encodedText}`, '_blank', 'noopener,noreferrer')
  }, [])

  const handleSendInquiry = useCallback(() => {
    const name   = fieldValues['contact-name']   || ''
    const vision = fieldValues['contact-vision'] || ''
    const type   = fieldValues['contact-type']   || ''
    const budget = fieldValues['contact-budget'] || ''

    let text = 'Hello! I would like to inquire about a project.'
    if (name || vision || type || budget) {
      text = `Hello! I would like to inquire about a project.\n\nName: ${name}\nProject Type: ${type}\nEstimated Budget: ${budget}\nVision: ${vision}`
    }

    const encodedText = encodeURIComponent(text)
    window.open(`https://wa.me/916265581678?text=${encodedText}`, '_blank', 'noopener,noreferrer')
  }, [fieldValues])

  /* ── Magnetic CTA button ── */
  const handleBtnMove = useCallback((e) => {
    const btn = ctaBtnRef.current
    if (!btn || matchesQuery(MOBILE_QUERY)) return
    const rect = btn.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) * 0.18
    const y = (e.clientY - rect.top - rect.height / 2) * 0.18
    gsap.to(btn, { x, y, duration: 0.45, ease: 'power3.out', overwrite: true })
  }, [])

  const handleBtnLeave = useCallback(() => {
    const btn = ctaBtnRef.current
    if (!btn) return
    gsap.to(btn, { x: 0, y: 0, duration: 0.65, ease: 'elastic.out(1, 0.45)' })
  }, [])

  /* ── Form field handlers ── */
  const handleFieldFocus = useCallback((id) => setFocusedField(id), [])

  const handleFieldBlur = useCallback((id) => {
    if (!fieldValues[id]) {
      setFocusedField((prev) => (prev === id ? null : prev))
    }
  }, [fieldValues])

  const handleFieldChange = useCallback((id, value) => {
    setFieldValues((prev) => ({ ...prev, [id]: value }))
  }, [])

  /* FIX L-3: Prevent default form submission (we handle via WhatsApp) */
  const handleFormSubmit = useCallback((e) => {
    e.preventDefault()
    handleSendInquiry()
  }, [handleSendInquiry])

  /* ════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════ */
  return (
    <div ref={pageRef} className="standalone-page contact-page">

      {/* ── Background Layer ── */}
      <div className="contact-bg-wrap">
        <img
          ref={bgRef}
          className="contact-bg-image"
          src="/contact-bg.png"
          alt=""
          loading="eager"
          decoding="async"
        />

        {/* Floating dust particles */}
        <div className="contact-particles" aria-hidden="true">
          {DUST_PARTICLES.map((p) => (
            <div
              key={p.id}
              className="contact-particle"
              style={{
                left: p.left,
                top: p.top,
                width: `${p.size}px`,
                height: `${p.size}px`,
                opacity: p.opacity,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="contact-layout">

        {/* ── Center Hero Content ── */}
        <div ref={contentRef} className="contact-center">
          <span className="contact-chapter contact-animate">
            IV — Contact
          </span>

          <h1 className="contact-headline">
            <span className="contact-headline__line contact-animate">
              Crafting Spaces
            </span>
            <span className="contact-headline__line contact-headline__line--accent contact-animate">
              Beyond Architecture
            </span>
          </h1>

          <p className="contact-subtitle contact-animate">
            Private residences, architectural storytelling, and timeless modern living.
          </p>

          <div className="contact-accent-line" aria-hidden="true" />

          <div className="contact-details">
            <a
              href="mailto:Shivanahpatidar@gmail.com"
              className="contact-detail contact-animate"
            >
              Shivanahpatidar@gmail.com
            </a>
            <a
              href="tel:+916265581678"
              className="contact-detail contact-animate"
            >
              +91 6265581678
            </a>
          </div>

          <div
            className="contact-cta-wrap contact-animate"
            onMouseMove={handleBtnMove}
            onMouseLeave={handleBtnLeave}
          >
            <button
              ref={ctaBtnRef}
              className="contact-cta-btn"
              type="button"
              onClick={handleStartConversation}
              aria-label="Start a WhatsApp conversation"
            >
              <span className="contact-cta-btn__text">
                Start a Conversation
              </span>
              <span className="contact-cta-btn__glow" aria-hidden="true" />
              <span className="contact-cta-btn__border" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* ── Minimal Luxury Form — FIX L-3: use <form> element ── */}
        <form
          ref={formRef}
          className="contact-form"
          onSubmit={handleFormSubmit}
          noValidate
          aria-label="Project inquiry form"
        >
          <span className="contact-form__eyebrow contact-animate">
            Tell Us About Your Vision
          </span>

          {FORM_FIELDS.map((field) => {
            const isActive = focusedField === field.id || !!fieldValues[field.id]

            return (
              <div
                key={field.id}
                className={`contact-field contact-animate${isActive ? ' is-active' : ''}`}
              >
                <label
                  htmlFor={field.id}
                  className="contact-field__label"
                >
                  {field.label}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    id={field.id}
                    className="contact-field__input contact-field__textarea"
                    rows={1}
                    autoComplete={field.autocomplete}
                    onFocus={() => handleFieldFocus(field.id)}
                    onBlur={() => handleFieldBlur(field.id)}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    value={fieldValues[field.id] || ''}
                  />
                ) : (
                  <input
                    id={field.id}
                    className="contact-field__input"
                    type={field.type}
                    autoComplete={field.autocomplete}
                    onFocus={() => handleFieldFocus(field.id)}
                    onBlur={() => handleFieldBlur(field.id)}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    value={fieldValues[field.id] || ''}
                  />
                )}
                <div className="contact-field__line" />
                <div className="contact-field__glow" />
              </div>
            )
          })}

          <button
            className="contact-form__submit"
            type="submit"
            aria-label="Send inquiry via WhatsApp"
          >
            <span>Send Inquiry</span>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </form>

        {/* ── Bottom Bar ── */}
        <div className="contact-bottom">
          <div className="contact-bottom__address contact-bottom-item">
            <span>Indore</span>
            <span>Madhya Pradesh</span>
            <span>India</span>
          </div>

          <button
            className="contact-bottom__back contact-bottom-item"
            onClick={onBackToHome}
            type="button"
            aria-label="Return to home page"
          >
            ← Return Home
          </button>

          {/* FIX C-9: Social links now point to real URLs with proper rel */}
          <div className="contact-bottom__socials contact-bottom-item">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                className="contact-social-link"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visit our ${s.label} profile`}
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(ContactPage)
